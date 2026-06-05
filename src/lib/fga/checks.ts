import { ConsistencyPreference } from '@openfga/sdk'
import { getFgaClient } from './client'

// Auth0 FGA defaults to MinimizeLatency, which can give stale reads moments
// after a write. The demo flow writes an approval and immediately re-checks,
// so we force HigherConsistency on every read to avoid the eventual-
// consistency window. Trade-off: slightly higher latency, but the demo
// becomes deterministic.
const STRONG = { consistency: ConsistencyPreference.HigherConsistency }

/**
 * High-level authorization helpers used by the Scene 2 server action.
 *
 * The discount-tier policy lives here, in code, so the demo's narrative is
 * legible: tier <=10% needs only creator; tier <=15% needs finance approval;
 * tier <=25% needs CFO approval. FGA stores the relations; this module reads
 * them and applies the threshold.
 */

export interface FinalizeDecision {
  allowed: boolean
  tier: 'auto-creator' | 'finance' | 'cfo'
  reason?: string
  approvedBy?: string[]
}

/**
 * Decide whether a user can finalize a quote at a given discount percentage.
 *
 * Logic:
 *   <=10% AND creator AND member of progear-sales      → allowed (auto)
 *   <=15% AND finance approval present on the quote    → allowed (finance)
 *   <=25% AND cfo approval present on the quote        → allowed (cfo)
 *   member of progear-finance directly                  → allowed up to 15%
 *   member of progear-cfo directly                      → allowed up to 25%
 *   else                                                → denied
 */
export async function canFinalizeQuote(
  userLogin: string,
  quoteId: string,
  discountPct: number,
): Promise<FinalizeDecision> {
  const fga = getFgaClient()
  const userRef = `user:${userLogin}`
  const quoteRef = { type: 'quote', id: quoteId }

  // 1. Tier-by-membership: finance/CFO members can finalize directly without per-quote approval
  const isFinance = await fga.check(
    {
      user: userRef,
      relation: 'member',
      object: 'group:progear-finance',
    },
    STRONG,
  )
  if (isFinance.allowed && discountPct <= 15) {
    return { allowed: true, tier: 'finance' }
  }

  // 2. Sales tier (creator + <=10%)
  const isCreator = await fga.check(
    {
      user: userRef,
      relation: 'creator',
      object: `quote:${quoteId}`,
    },
    STRONG,
  )
  if (isCreator.allowed && discountPct <= 10) {
    return { allowed: true, tier: 'auto-creator' }
  }

  // 3. Per-quote approval check: any user with approver_finance suffices for <=15%
  if (discountPct <= 15) {
    const approvers = await fga.listUsers(
      {
        object: quoteRef,
        relation: 'approver_finance',
        user_filters: [{ type: 'user' }],
      },
      STRONG,
    )
    if (approvers.users.length > 0) {
      return {
        allowed: true,
        tier: 'finance',
        approvedBy: approvers.users.map((u) => u.object?.id ?? '').filter(Boolean),
      }
    }
  }

  // 4. Per-quote CFO approval for >15%
  if (discountPct <= 25) {
    const approvers = await fga.listUsers(
      {
        object: quoteRef,
        relation: 'approver_cfo',
        user_filters: [{ type: 'user' }],
      },
      STRONG,
    )
    if (approvers.users.length > 0) {
      return {
        allowed: true,
        tier: 'cfo',
        approvedBy: approvers.users.map((u) => u.object?.id ?? '').filter(Boolean),
      }
    }
  }

  return {
    allowed: false,
    tier: discountPct <= 15 ? 'finance' : 'cfo',
    reason: `Discount ${discountPct}% requires ${discountPct <= 15 ? 'finance' : 'CFO'} approval; none on file for quote ${quoteId}.`,
  }
}

/**
 * Record that the calling user is the creator of a freshly-minted quote.
 * Called when Scene 2's deal is first composed.
 */
export async function markQuoteCreator(userLogin: string, quoteId: string): Promise<void> {
  const fga = getFgaClient()
  await fga.write({
    writes: [{ user: `user:${userLogin}`, relation: 'creator', object: `quote:${quoteId}` }],
  })
}

/**
 * Grant a finance approval for a quote (Bala clicks Approve).
 */
export async function grantFinanceApproval(approverLogin: string, quoteId: string): Promise<void> {
  const fga = getFgaClient()
  await fga.write({
    writes: [{ user: `user:${approverLogin}`, relation: 'approver_finance', object: `quote:${quoteId}` }],
  })
}

/**
 * Grant a CFO approval for a quote (used for Scene 2 stretch — >15% discounts).
 */
export async function grantCfoApproval(approverLogin: string, quoteId: string): Promise<void> {
  const fga = getFgaClient()
  await fga.write({
    writes: [{ user: `user:${approverLogin}`, relation: 'approver_cfo', object: `quote:${quoteId}` }],
  })
}
