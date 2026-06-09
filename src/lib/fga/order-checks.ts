import { ConsistencyPreference } from '@openfga/sdk'
import { getFgaClient } from './client'

const STRONG = { consistency: ConsistencyPreference.HigherConsistency }

/**
 * Quantity threshold above which a manager must approve before the order
 * can be placed. Sales reps can self-approve up to and including this value.
 */
export const MANAGER_APPROVAL_THRESHOLD = 50

export interface OrderDecision {
  allowed: boolean
  tier: 'auto-creator' | 'manager'
  reason?: string
  approvedBy?: string[]
}

/**
 * Decide whether a user can place an order at a given quantity.
 *
 *   qty <= 50  AND user is creator (member of progear-sales)  → allowed (auto)
 *   qty >  50  AND a manager_approver tuple exists on the order → allowed (manager)
 *   else                                                       → denied
 */
export async function canPlaceOrder(
  userLogin: string,
  orderId: string,
  quantity: number,
): Promise<OrderDecision> {
  const fga = getFgaClient()
  const userRef = `user:${userLogin}`
  const orderRef = { type: 'order', id: orderId }

  if (quantity <= MANAGER_APPROVAL_THRESHOLD) {
    const isCreator = await fga.check(
      { user: userRef, relation: 'creator', object: `order:${orderId}` },
      STRONG,
    )
    if (isCreator.allowed) {
      return { allowed: true, tier: 'auto-creator' }
    }
    return {
      allowed: false,
      tier: 'auto-creator',
      reason: `User ${userLogin} is not the creator of order ${orderId}.`,
    }
  }

  // qty > threshold: any user with manager_approver suffices.
  const approvers = await fga.listUsers(
    {
      object: orderRef,
      relation: 'manager_approver',
      user_filters: [{ type: 'user' }],
    },
    STRONG,
  )
  if (approvers.users.length > 0) {
    return {
      allowed: true,
      tier: 'manager',
      approvedBy: approvers.users.map((u) => u.object?.id ?? '').filter(Boolean),
    }
  }

  return {
    allowed: false,
    tier: 'manager',
    reason: `Order quantity ${quantity} exceeds ${MANAGER_APPROVAL_THRESHOLD}-unit threshold; no manager approval on file for order ${orderId}.`,
  }
}

/**
 * Record that the calling user is the creator of a freshly-minted order.
 */
export async function markOrderCreator(userLogin: string, orderId: string): Promise<void> {
  const fga = getFgaClient()
  await fga.write({
    writes: [{ user: `user:${userLogin}`, relation: 'creator', object: `order:${orderId}` }],
  })
}

/**
 * Grant a manager approval for an order (Mike clicks Approve).
 */
export async function grantManagerApproval(
  approverLogin: string,
  orderId: string,
): Promise<void> {
  const fga = getFgaClient()
  await fga.write({
    writes: [
      { user: `user:${approverLogin}`, relation: 'manager_approver', object: `order:${orderId}` },
    ],
  })
}
