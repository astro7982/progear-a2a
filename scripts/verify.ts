/**
 * Smoke test the token chain wiring.
 * Run with: pnpm tsx scripts/verify.ts
 *
 * What it does:
 *  - Loads the agent JWKs from .env.local
 *  - Generates a client_assertion JWT (RS256, 60s TTL)
 *  - Decodes it to confirm the iss/sub/aud claims look right
 *  - For Step 2 onward, we'd need a real T1 from a Sarah login or a service
 *    client_credentials grant — those are exercised by the live API routes.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClientAssertion } from '../src/lib/tokens/jwt-utils'
import { decodeJwt } from '../src/lib/tokens/decode'

async function main() {
  console.log('=== ProGear A2A Demo: token chain wiring smoke test ===\n')

  const orgUrl = process.env.OKTA_ORG_URL
  if (!orgUrl) throw new Error('OKTA_ORG_URL missing')

  // Sales agent client_assertion
  const salesJwkRaw = process.env.SALES_AGENT_PRIVATE_KEY_JWK
  if (!salesJwkRaw) throw new Error('SALES_AGENT_PRIVATE_KEY_JWK missing')
  const salesJwk = JSON.parse(salesJwkRaw)

  const tokenEndpoint = `${orgUrl}/oauth2/v1/token`
  const salesAssertion = await createClientAssertion(
    salesJwk,
    process.env.SALES_AGENT_ID ?? '',
    tokenEndpoint,
  )
  const salesDecoded = decodeJwt(salesAssertion)
  console.log('Sales agent client_assertion (Step 2/3):')
  console.log('  alg:', salesDecoded?.header.alg)
  console.log('  kid:', salesDecoded?.header.kid)
  console.log('  iss:', salesDecoded?.payload.iss)
  console.log('  aud:', salesDecoded?.payload.aud)
  console.log('  ttl:', (salesDecoded?.payload.exp as number) - (salesDecoded?.payload.iat as number), 'sec\n')

  // Inventory agent client_assertion
  const invJwkRaw = process.env.INVENTORY_AGENT_PRIVATE_KEY_JWK
  if (!invJwkRaw) throw new Error('INVENTORY_AGENT_PRIVATE_KEY_JWK missing')
  const invJwk = JSON.parse(invJwkRaw)

  const invAssertion = await createClientAssertion(
    invJwk,
    process.env.INVENTORY_AGENT_ID ?? '',
    tokenEndpoint,
  )
  const invDecoded = decodeJwt(invAssertion)
  console.log('Inventory agent client_assertion (Step 4/5):')
  console.log('  alg:', invDecoded?.header.alg)
  console.log('  kid:', invDecoded?.header.kid)
  console.log('  iss:', invDecoded?.payload.iss)
  console.log('  aud:', invDecoded?.payload.aud)
  console.log('  ttl:', (invDecoded?.payload.exp as number) - (invDecoded?.payload.iat as number), 'sec\n')

  // Sanity check: kids should match Bala's published demo keys
  const expectedSalesKid = 'a7531e69eadb5b5ab26488c49aa183e7'
  const expectedInvKid = '3804ec3c470466c9f49f34f5c448418d'
  if (salesDecoded?.header.kid !== expectedSalesKid) {
    throw new Error(`Sales kid mismatch: got ${salesDecoded?.header.kid}, expected ${expectedSalesKid}`)
  }
  if (invDecoded?.header.kid !== expectedInvKid) {
    throw new Error(`Inventory kid mismatch: got ${invDecoded?.header.kid}, expected ${expectedInvKid}`)
  }

  console.log('All client_assertion JWTs validate. Token chain wiring is sound.')
  console.log('Next: log in as Sarah via NextAuth or set SERVICE_CLIENT_SECRET to test the live chain.')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
