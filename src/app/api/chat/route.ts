import { type NextRequest } from 'next/server'
import { auth } from '@/lib/okta/auth'
import { generateResponse, type InventoryItemSnapshot } from '@/lib/ai/chat'
import { executeStep2, executeStep3, executeStep4, executeStep5 } from '@/lib/tokens/token-steps'
import { decodeJwt, extractActChain, type ActLayer } from '@/lib/tokens/decode'
import { parseOrderIntent } from '@/lib/ai/order-intent'
import {
  canPlaceOrder,
  markOrderCreator,
  MANAGER_APPROVAL_THRESHOLD,
} from '@/lib/fga/order-checks'
import { addPending, getApproval } from '@/lib/fga/approval-queue'
import {
  checkStock,
  McpClientError,
  type McpCallerInfo,
  type McpCatalog,
  type McpProductSnapshot,
  type McpResponseMetadata,
} from '@/lib/mcp/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PendingApprovalSummary {
  orderId: string
  quantity: number
  product: string
  reason: string
  approver: string
}

interface ChainResult {
  success: boolean
  actChain?: ActLayer[]
  t3Audience?: string
  t3Header?: Record<string, unknown>
  t3Payload?: Record<string, unknown>
  t3TokenPreview?: string
  t5Audience?: string
  t5Header?: Record<string, unknown>
  t5Payload?: Record<string, unknown>
  t5TokenPreview?: string
}

interface McpResultBlock {
  ok: boolean
  tool: string
  caller: McpCallerInfo
  metadata: McpResponseMetadata
  result?: unknown
  error?: string
  message?: string
}

function isCatalog(value: McpCatalog | McpProductSnapshot | undefined): value is McpCatalog {
  return !!value && Array.isArray((value as McpCatalog).items)
}

function toInventorySnapshot(result: McpCatalog | McpProductSnapshot | undefined): InventoryItemSnapshot[] {
  if (!result) return []
  if (isCatalog(result)) {
    return result.items.map((i) => ({
      id: i.id,
      name: i.name,
      stock: i.stock,
      unitPrice: i.unitPrice,
      unit: i.unit,
      needsReorder: i.needsReorder,
    }))
  }
  return [
    {
      id: result.id,
      name: result.name,
      stock: result.stock,
      unitPrice: result.unitPrice,
      unit: result.unit,
      needsReorder: result.needsReorder,
    },
  ]
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { message } = (await req.json()) as { message: string }
  if (!message?.trim()) {
    return Response.json({ error: 'Empty message' }, { status: 400 })
  }

  // 1. Run the real A2A chain end-to-end (T1 → T2 → T3 → T4 → T5).
  let chainResult: ChainResult = { success: false }
  let mcpBlock: McpResultBlock | null = null
  let liveInventory: InventoryItemSnapshot[] = []

  try {
    const t1 = session.accessToken
    const t2 = await executeStep2(t1)
    const t3 = await executeStep3(t2)
    const t3Decoded = decodeJwt(t3)

    chainResult = {
      success: true,
      actChain: t3Decoded ? extractActChain(t3Decoded.payload) : [],
      t3Audience: typeof t3Decoded?.payload.aud === 'string' ? t3Decoded.payload.aud : undefined,
      t3Header: t3Decoded?.header,
      t3Payload: t3Decoded?.payload,
      t3TokenPreview: t3.slice(0, 64),
    }

    // Steps 4 + 5: get T5 (final access token bound to InventoryMCP audience)
    try {
      const t4 = await executeStep4(t3)
      const t5 = await executeStep5(t4)
      const t5Decoded = decodeJwt(t5)

      chainResult = {
        ...chainResult,
        actChain: t5Decoded ? extractActChain(t5Decoded.payload) : chainResult.actChain,
        t5Audience: typeof t5Decoded?.payload.aud === 'string' ? t5Decoded.payload.aud : undefined,
        t5Header: t5Decoded?.header,
        t5Payload: t5Decoded?.payload,
        t5TokenPreview: t5.slice(0, 64),
      }

      // Call the MCP server with T5 — get the real catalog
      try {
        const stockResp = await checkStock(t5)
        mcpBlock = {
          ok: stockResp.ok,
          tool: stockResp.tool,
          caller: stockResp.caller,
          metadata: stockResp.metadata,
          result: stockResp.result,
          error: stockResp.error,
          message: stockResp.message,
        }
        if (stockResp.ok) {
          liveInventory = toInventorySnapshot(stockResp.result)
        }
      } catch (err) {
        const detail = err instanceof McpClientError ? err.message : err instanceof Error ? err.message : 'unknown_mcp_error'
        console.error('[chat] MCP check_stock failed:', detail)
      }
    } catch (err) {
      console.error('[chat] T4/T5 chain failed:', err instanceof Error ? err.message : err)
    }
  } catch (err) {
    console.error('[chat] T2/T3 chain failed:', err instanceof Error ? err.message : err)
    chainResult = { success: false }
  }

  // 2. Generate the LLM response, augmented with the LIVE inventory when we have it.
  const { text, agentUsed, action } = await generateResponse(message, liveInventory)

  // 3. Order-gate (FGA): if Sarah is asking to place an order > threshold and
  //    we don't already have a manager approval on file, register the order in
  //    FGA, run the policy check, and surface a pending-approval marker so the
  //    UI can prompt for Mike's review.
  let pendingApproval: PendingApprovalSummary | null = null
  let appendedNote = ''
  const userLogin = session.user?.email
  const intent = parseOrderIntent(message)

  if (
    userLogin &&
    intent.isOrder &&
    typeof intent.quantity === 'number' &&
    intent.quantity > MANAGER_APPROVAL_THRESHOLD
  ) {
    const orderId = `O-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    try {
      await markOrderCreator(userLogin, orderId)
      const decision = await canPlaceOrder(userLogin, orderId, intent.quantity)

      if (!decision.allowed) {
        if (!getApproval(orderId)) {
          addPending({
            orderId,
            product: intent.product,
            quantity: intent.quantity,
            requestedBy: userLogin,
          })
        }
        pendingApproval = {
          orderId,
          quantity: intent.quantity,
          product: intent.product,
          reason: decision.reason ?? 'Manager approval required',
          approver: 'mike.manager@progear.demo',
        }
        appendedNote =
          `\n\n**Manager approval required.** This order is for ${intent.quantity} units, ` +
          `which exceeds the ${MANAGER_APPROVAL_THRESHOLD}-unit self-approval limit. ` +
          `I've routed it to Mike Manager for review (order ${orderId}).`
      }
    } catch (err) {
      console.error('[chat] FGA order gate failed:', err instanceof Error ? err.message : err)
    }
  }

  return Response.json({
    text: text + appendedNote,
    agentUsed,
    action,
    chain: chainResult,
    mcp: mcpBlock,
    user: userLogin,
    pendingApproval,
  })
}
