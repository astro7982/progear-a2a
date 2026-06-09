/**
 * Lightweight heuristic that pulls an order quantity (and a best-guess
 * product label) out of a free-text user message. Intentionally simple,
 * since the demo only needs to distinguish "ordering > 50 units" from
 * "anything else" — we don't have a real NLU here.
 */

const ORDER_VERBS = /\b(order|buy|purchase|ship|send|deliver|reserve|stock\s+up)\b/i

const QTY_RE = /(\d{1,5})\s*(?:units?|pcs?|pieces?|sets?|hoops?|basketballs?|balls?|cones?|uniforms?|panels?)?/i

export interface OrderIntent {
  isOrder: boolean
  quantity: number | null
  product: string
}

export function parseOrderIntent(message: string): OrderIntent {
  const isOrder = ORDER_VERBS.test(message)
  if (!isOrder) {
    return { isOrder: false, quantity: null, product: '' }
  }

  // Pick the largest numeric run that looks like a quantity. Avoid grabbing
  // part numbers like "TR-9" by anchoring on standalone digits.
  let quantity: number | null = null
  const matches = Array.from(message.matchAll(/\b(\d{1,5})\b/g))
  for (const m of matches) {
    const n = Number(m[1])
    if (!Number.isFinite(n)) continue
    if (quantity === null || n > quantity) quantity = n
  }
  if (quantity === null) {
    const m = QTY_RE.exec(message)
    if (m) quantity = Number(m[1])
  }

  return {
    isOrder: true,
    quantity,
    product: extractProduct(message),
  }
}

function extractProduct(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('basketball hoop') || m.includes('hoop')) return 'Basketball Hoops'
  if (m.includes('uniform')) return 'Team Uniforms'
  if (m.includes('cone')) return 'Training Cones'
  if (m.includes('court') || m.includes('flooring')) return 'Court Flooring Panels'
  if (m.includes('tr-9') || m.includes('pro basketball') || m.includes('trail pack')) {
    return 'Pro Basketballs (TR-9 Trail Pack)'
  }
  if (m.includes('basketball') || m.includes('ball')) return 'Basketballs'
  return 'ProGear Item'
}
