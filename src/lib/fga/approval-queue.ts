/**
 * In-memory approval queue keyed by orderId.
 *
 * Demo-only: lives in module scope so chat route and the /api/approval
 * endpoints share the same view. Cleared on server restart, which is
 * fine for demo flow.
 */

export type ApprovalStatus = 'pending' | 'approved'

export interface PendingApproval {
  orderId: string
  product: string
  quantity: number
  requestedBy: string
  requestedAt: number
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: number
}

const queue = new Map<string, PendingApproval>()

export function addPending(item: Omit<PendingApproval, 'status' | 'requestedAt'>): PendingApproval {
  const entry: PendingApproval = {
    ...item,
    status: 'pending',
    requestedAt: Date.now(),
  }
  queue.set(item.orderId, entry)
  return entry
}

export function listAll(): PendingApproval[] {
  return Array.from(queue.values()).sort((a, b) => b.requestedAt - a.requestedAt)
}

export function listPending(): PendingApproval[] {
  return listAll().filter((a) => a.status === 'pending')
}

export function markApproved(orderId: string, approverLogin: string): PendingApproval | null {
  const existing = queue.get(orderId)
  if (!existing) return null
  const updated: PendingApproval = {
    ...existing,
    status: 'approved',
    approvedBy: approverLogin,
    approvedAt: Date.now(),
  }
  queue.set(orderId, updated)
  return updated
}

export function getApproval(orderId: string): PendingApproval | null {
  return queue.get(orderId) ?? null
}
