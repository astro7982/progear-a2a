import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface InventoryItemSnapshot {
  id: string
  name: string
  stock: number
  unitPrice: number
  unit: string
  needsReorder?: boolean
}

const BASE_SYSTEM = `You are the ProGear Sales AI assistant. You help Sarah (a sales rep at ProGear, a sporting goods company) with:
- Checking inventory stock levels
- Processing sales orders
- Looking up customer information
- Getting pricing and bulk discounts

ProGear sells basketball equipment (hoops, basketballs, uniforms), training gear, and court equipment.

When Sarah asks about stock or orders, you respond as if you've consulted with specialized agents:
- The Sales Agent handles order processing and quotes
- The Inventory Agent handles stock levels and reorder requests
- When an order requires items not in stock, you mention the distributor order

Keep responses concise (2-3 sentences). Be helpful and specific with numbers.
When processing orders, confirm the details back.`

const FALLBACK_SNAPSHOT = `Current inventory snapshot (use these numbers):
- Pro Basketballs (TR-9 Trail Pack): 247 units in Memphis warehouse
- Standard Basketballs: 89 units
- Basketball Hoops (Regulation): 12 units
- Training Cones (set of 20): 340 sets
- Team Uniforms: 56 sets
- Court Flooring Panels: 8 panels`

function buildLiveSnapshot(items: InventoryItemSnapshot[]): string {
  const lines = items.map((i) => {
    const lowFlag = i.needsReorder ? ' (low — reorder)' : ''
    return `- ${i.name}: ${i.stock} ${i.unit}${i.stock === 1 ? '' : 's'} on hand at $${i.unitPrice}/${i.unit}${lowFlag}`
  })
  return [
    'Current inventory snapshot (LIVE from the Inventory MCP server, use these numbers):',
    ...lines,
    '',
    'These are real, authoritative numbers returned by inventory.check_stock — quote them as-is.',
  ].join('\n')
}

export async function generateResponse(
  userMessage: string,
  inventory?: InventoryItemSnapshot[],
): Promise<{
  text: string
  agentUsed: 'sales' | 'inventory' | 'pricing' | 'customer'
  action: string
}> {
  const snapshot = inventory && inventory.length > 0 ? buildLiveSnapshot(inventory) : FALLBACK_SNAPSHOT
  const system = `${BASE_SYSTEM}\n\n${snapshot}\n\nIf asked to order more than what's in stock, mention that the Inventory Agent will order the remainder from the distributor.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : 'I could not process that request.'

  // Determine which agent was "used" based on the query
  const lower = userMessage.toLowerCase()
  let agentUsed: 'sales' | 'inventory' | 'pricing' | 'customer' = 'sales'
  let action = 'Processing request'

  if (lower.includes('stock') || lower.includes('inventory') || lower.includes('have') || lower.includes('order')) {
    agentUsed = 'inventory'
    action = lower.includes('order') ? 'Processing order' : 'Checking stock levels'
  } else if (lower.includes('price') || lower.includes('cost') || lower.includes('discount') || lower.includes('bulk')) {
    agentUsed = 'pricing'
    action = 'Calculating pricing'
  } else if (lower.includes('customer') || lower.includes('account') || lower.includes('who')) {
    agentUsed = 'customer'
    action = 'Looking up customer'
  }

  return { text, agentUsed, action }
}
