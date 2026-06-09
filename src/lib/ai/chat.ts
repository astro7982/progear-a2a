import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are the ProGear Sales AI assistant. You help Sarah (a sales rep at ProGear, a sporting goods company) with:
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
When giving stock information, use realistic quantities (10-500 range).
When processing orders, confirm the details back.

Current inventory snapshot (use these numbers):
- Pro Basketballs (TR-9 Trail Pack): 247 units in Memphis warehouse
- Standard Basketballs: 89 units
- Basketball Hoops (Regulation): 12 units
- Training Cones (set of 20): 340 sets
- Team Uniforms: 56 sets
- Court Flooring Panels: 8 panels

If asked to order more than what's in stock, mention that the Inventory Agent will order the remainder from the distributor.`

export async function generateResponse(userMessage: string): Promise<{
  text: string
  agentUsed: 'sales' | 'inventory' | 'pricing' | 'customer'
  action: string
}> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
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
