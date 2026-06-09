import { type NextRequest } from 'next/server'
import { auth } from '@/lib/okta/auth'
import { generateResponse } from '@/lib/ai/chat'
import { executeStep2, executeStep3 } from '@/lib/tokens/token-steps'
import { decodeJwt, extractActChain } from '@/lib/tokens/decode'
import { parseOrderIntent } from '@/lib/ai/order-intent'
import {
  canPlaceOrder,
  markOrderCreator,
  MANAGER_APPROVAL_THRESHOLD,
} from '@/lib/fga/order-checks'
import { addPending, getApproval } from '@/lib/fga/approval-queue'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PendingApprovalSummary {
  orderId: string
  quantity: number
  product: string
  reason: string
  approver: string
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

  // 1. Run the real A2A chain in the background (T1 → T2 → T3)
  let chainResult: {
    success: boolean
    actChain?: unknown[]
    t3Audience?: string
    t3Header?: Record<string, unknown>
    t3Payload?: Record<string, unknown>
    t3TokenPreview?: string
  } = { success: false }

  try {
    const t1 = session.accessToken
    const t2 = await executeStep2(t1)
    const t3 = await executeStep3(t2)
    const decoded = decodeJwt(t3)
    chainResult = {
      success: true,
      actChain: decoded ? extractActChain(decoded.payload) : [],
      t3Audience: typeof decoded?.payload.aud === 'string' ? decoded.payload.aud : undefined,
      t3Header: decoded?.header,
      t3Payload: decoded?.payload,
      t3TokenPreview: t3.slice(0, 64),
    }
  } catch (err) {
    console.error('[chat] chain failed:', err instanceof Error ? err.message : err)
    chainResult = { success: false }
  }

  // 2. Generate the LLM response
  const { text, agentUsed, action } = await generateResponse(message)

  // 3. Order-gate: if Sarah is asking to place an order > threshold and we
  //    don't already have a manager approval on file, register the order in
  //    FGA, run the policy check, and surface a pending-approval marker so
  //    the UI can prompt for Mike's review.
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
        // Don't double-add if this exact orderId was somehow already queued
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
    user: userLogin,
    pendingApproval,
  })
}
