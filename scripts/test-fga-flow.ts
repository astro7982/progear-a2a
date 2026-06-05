/**
 * End-to-end test of the Scene 2 FGA flow.
 *   1. Sarah creates quote Q-test-1 → marked as creator.
 *   2. Sarah requests 15% discount → check returns DENIED.
 *   3. Bala grants finance approval → tuple written.
 *   4. Sarah retries 15% → check returns ALLOWED (tier=finance).
 *
 * Run: pnpm tsx scripts/test-fga-flow.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  canFinalizeQuote,
  markQuoteCreator,
  grantFinanceApproval,
} from '../src/lib/fga/checks'

async function main() {
  const sarah = process.env.DEMO_SARAH_LOGIN!
  const bala = process.env.DEMO_BALA_LOGIN!
  const quoteId = `Q-test-${Date.now()}`

  console.log(`=== Scene 2 FGA flow test (quote: ${quoteId}) ===\n`)

  // 1. Sarah creates quote
  await markQuoteCreator(sarah, quoteId)
  console.log(`  ✓ Sarah creator of ${quoteId}`)

  // 2. Sarah at 10% (auto)
  const at10 = await canFinalizeQuote(sarah, quoteId, 10)
  console.log(`  10% → allowed=${at10.allowed} tier=${at10.tier}`)
  if (!at10.allowed) throw new Error('10% should be auto-allowed for creator')

  // 3. Sarah at 15% before approval
  const at15before = await canFinalizeQuote(sarah, quoteId, 15)
  console.log(`  15% (before approval) → allowed=${at15before.allowed} reason=${at15before.reason}`)
  if (at15before.allowed) throw new Error('15% should be denied without approval')

  // 4. Bala approves
  await grantFinanceApproval(bala, quoteId)
  console.log(`  ✓ Bala granted finance approval`)

  // 5. Sarah at 15% after approval
  const at15after = await canFinalizeQuote(sarah, quoteId, 15)
  console.log(`  15% (after approval) → allowed=${at15after.allowed} tier=${at15after.tier} approvedBy=${at15after.approvedBy?.join(',')}`)
  if (!at15after.allowed) throw new Error('15% should be allowed after finance approval')

  // 6. Bala (finance member) can directly do 15% on a brand-new quote
  const balaQuote = `Q-test-bala-${Date.now()}`
  const balaAt15 = await canFinalizeQuote(bala, balaQuote, 15)
  console.log(`  Bala 15% direct → allowed=${balaAt15.allowed} tier=${balaAt15.tier}`)
  if (!balaAt15.allowed) throw new Error('Bala (finance member) should be able to finalize 15% directly')

  console.log('\nAll FGA flows pass. Scene 2 gate logic is sound.')
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
