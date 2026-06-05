import { config } from 'dotenv'
config({ path: '.env.local' })

import { getFgaClient } from '../src/lib/fga/client'
import { grantFinanceApproval, markQuoteCreator } from '../src/lib/fga/checks'

async function main() {
  const fga = getFgaClient()
  const sarah = process.env.DEMO_SARAH_LOGIN!
  const bala = process.env.DEMO_BALA_LOGIN!
  const quoteId = `Q-debug-${Date.now()}`

  await markQuoteCreator(sarah, quoteId)
  await grantFinanceApproval(bala, quoteId)

  console.log(`=== Read tuples for quote:${quoteId} ===`)
  const tuples = await fga.read({ object: `quote:${quoteId}` })
  for (const t of tuples.tuples ?? []) {
    console.log(`  ${t.key?.user} -- ${t.key?.relation} -- ${t.key?.object}`)
  }

  console.log()
  console.log('=== Direct check: bala has approver_finance on quote ===')
  const c = await fga.check({
    user: `user:${bala}`,
    relation: 'approver_finance',
    object: `quote:${quoteId}`,
  })
  console.log('  allowed:', c.allowed)

  console.log()
  console.log('=== listUsers raw response ===')
  const lu = await fga.listUsers({
    object: { type: 'quote', id: quoteId },
    relation: 'approver_finance',
    user_filters: [{ type: 'user' }],
  })
  console.log(JSON.stringify(lu, null, 2))
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
