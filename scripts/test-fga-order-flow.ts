/**
 * End-to-end test of the order-quantity FGA gate.
 *   1. Sarah creates order O-test-* → marked as creator.
 *   2. canPlaceOrder(qty=10)  → ALLOWED (auto-creator).
 *   3. canPlaceOrder(qty=500) → DENIED (no manager approval).
 *   4. Mike grants manager_approver tuple.
 *   5. canPlaceOrder(qty=500) → ALLOWED (manager).
 *
 * Run: pnpm tsx scripts/test-fga-order-flow.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  canPlaceOrder,
  markOrderCreator,
  grantManagerApproval,
} from '../src/lib/fga/order-checks'

async function main() {
  const sarah = process.env.DEMO_SARAH_LOGIN ?? 'sarah.sales@progear.demo'
  const mike = 'mike.manager@progear.demo'
  const orderId = `O-test-${Date.now()}`

  console.log(`=== Order-gate FGA test (order: ${orderId}) ===\n`)

  // 1. Sarah creates the order
  await markOrderCreator(sarah, orderId)
  console.log(`  ✓ Sarah marked as creator of ${orderId}`)

  // 2. Small order (<= 50): auto-allowed
  const small = await canPlaceOrder(sarah, orderId, 10)
  console.log(`  qty=10  → allowed=${small.allowed} tier=${small.tier}`)
  if (!small.allowed) throw new Error('qty=10 should be auto-allowed for creator')

  // 3. Large order (> 50) without manager approval: denied
  const before = await canPlaceOrder(sarah, orderId, 500)
  console.log(`  qty=500 (before approval) → allowed=${before.allowed} reason=${before.reason}`)
  if (before.allowed) throw new Error('qty=500 should be denied without manager approval')

  // 4. Mike approves
  await grantManagerApproval(mike, orderId)
  console.log(`  ✓ Mike granted manager approval`)

  // 5. Large order after approval: allowed
  const after = await canPlaceOrder(sarah, orderId, 500)
  console.log(
    `  qty=500 (after approval) → allowed=${after.allowed} tier=${after.tier} approvedBy=${after.approvedBy?.join(',')}`,
  )
  if (!after.allowed) throw new Error('qty=500 should be allowed after manager approval')

  console.log('\nAll order-gate flows pass. The Mike-approves-Sarah path is sound.')
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
