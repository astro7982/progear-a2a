/**
 * Thin client for the ProGear MCP server (T5 token consumer).
 *
 * The server lives at MCP_BASE_URL (default https://progear-mcp-a2a.onrender.com)
 * and exposes inventory.check_stock / inventory.create_order /
 * inventory.order_from_distributor under POST /tools/:toolName/invoke.
 *
 * Every authenticated response carries the act chain, scope, audience and
 * latency so the frontend can render real provenance + governance data.
 */

export interface McpProductSnapshot {
  id: string
  name: string
  category: string
  stock: number
  reorderThreshold: number
  needsReorder: boolean
  unitPrice: number
  unit: string
}

export interface McpCatalog {
  totalProducts: number
  items: McpProductSnapshot[]
}

export interface McpCallerInfo {
  sub: string
  scope?: string
  actChain: Record<string, unknown>[]
}

export interface McpResponseMetadata {
  tool: string
  scopeRequired: string
  fgaGated: boolean
  audience?: string
  issuer?: string
  requestId: string
  latencyMs: number
  invokedAt: string
}

export interface McpToolResponse<T> {
  ok: boolean
  tool: string
  result?: T
  error?: string
  message?: string
  caller: McpCallerInfo
  metadata: McpResponseMetadata
}

const DEFAULT_BASE = 'https://progear-mcp-a2a.onrender.com'
const DEFAULT_TIMEOUT_MS = 8000

export class McpClientError extends Error {
  status?: number
  detail?: unknown
  constructor(message: string, status?: number, detail?: unknown) {
    super(message)
    this.name = 'McpClientError'
    this.status = status
    this.detail = detail
  }
}

function baseUrl(): string {
  return (process.env.MCP_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '')
}

async function invokeTool<T>(
  toolName: string,
  args: Record<string, unknown>,
  bearer: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<McpToolResponse<T>> {
  const url = `${baseUrl()}/tools/${encodeURIComponent(toolName)}/invoke`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ arguments: args }),
      signal: controller.signal,
    })
    const text = await response.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      throw new McpClientError(`Non-JSON response from ${toolName}: ${text.slice(0, 160)}`, response.status)
    }

    if (!response.ok) {
      const detail = (parsed as { message?: string; error?: string } | null) ?? null
      const msg = detail?.message ?? detail?.error ?? `MCP ${toolName} returned HTTP ${response.status}`
      throw new McpClientError(msg, response.status, parsed)
    }
    return parsed as McpToolResponse<T>
  } catch (err) {
    if (err instanceof McpClientError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new McpClientError(`MCP ${toolName} timed out after ${timeoutMs}ms`)
    }
    throw new McpClientError(err instanceof Error ? err.message : 'Unknown MCP error')
  } finally {
    clearTimeout(timer)
  }
}

export function checkStock(bearer: string, productId?: string): Promise<McpToolResponse<McpCatalog | McpProductSnapshot>> {
  const args = productId ? { productId } : {}
  return invokeTool<McpCatalog | McpProductSnapshot>('inventory.check_stock', args, bearer)
}
