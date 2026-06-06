/**
 * End-to-end smoke test of the HI chain (Scene 1).
 * 1. Sign in as Sarah via legacy authn → sessionToken
 * 2. Run /authorize → get code
 * 3. Exchange code → T1 (Sarah's access token, with PKCE)
 * 4. executeStep2 → T2 (id-jag)
 * 5. executeStep3 → T3 (Inventory access token)
 *
 * Run: pnpm tsx scripts/test-hi-chain.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createHash, randomBytes } from 'crypto'
import { executeStep2, executeStep3 } from '../src/lib/tokens/token-steps'
import { decodeJwt, extractActChain } from '../src/lib/tokens/decode'

function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function main() {
  const orgUrl = process.env.OKTA_ORG_URL!
  const salesAsId = process.env.SALES_AS_ID!
  const webappId = process.env.WEBAPP_CLIENT_ID!
  const webappSecret = process.env.WEBAPP_CLIENT_SECRET!
  const sarahLogin = process.env.DEMO_SARAH_LOGIN!
  const sarahPwd = process.env.DEMO_SARAH_PASSWORD!

  // 1. legacy authn → sessionToken
  const authnRes = await fetch(`${orgUrl}/api/v1/authn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: sarahLogin, password: sarahPwd }),
  })
  const authn = await authnRes.json() as { sessionToken: string; status: string }
  console.log(`1. authn: ${authn.status}, sessionToken: ${authn.sessionToken?.slice(0, 20)}...`)
  if (!authn.sessionToken) throw new Error('No sessionToken')

  // 2. PKCE pair
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())

  // 3. /authorize → code
  const authzUrl = `${orgUrl}/oauth2/${salesAsId}/v1/authorize?` + new URLSearchParams({
    response_type: 'code',
    client_id: webappId,
    redirect_uri: 'http://localhost:3000/api/auth/callback/okta',
    scope: 'openid profile email agent.invoke',
    resource: 'https://progear.com/sales',
    state: 'test',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    sessionToken: authn.sessionToken,
  })
  const authzRes = await fetch(authzUrl, { redirect: 'manual' })
  const loc = authzRes.headers.get('location') || ''
  console.log(`2. authorize redirect: ${loc.slice(0, 90)}...`)
  const code = new URL(loc, 'http://x').searchParams.get('code')
  if (!code) {
    const err = new URL(loc, 'http://x').searchParams.get('error_description') || loc
    throw new Error(`No code from authorize: ${err}`)
  }
  console.log(`   code: ${code.slice(0, 20)}...`)

  // 4. exchange code → access token (T1)
  const tokenRes = await fetch(`${orgUrl}/oauth2/${salesAsId}/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${webappId}:${webappSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:3000/api/auth/callback/okta',
      code_verifier: verifier,
      resource: 'https://progear.com/sales',
    }).toString(),
  })
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string }
  if (!tokenData.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`)
  const t1 = tokenData.access_token
  console.log(`3. T1 access_token: ${t1.slice(0, 30)}...`)
  const t1Decoded = decodeJwt(t1)
  console.log(`   T1 claims:`, {
    sub: t1Decoded?.payload.sub,
    cid: t1Decoded?.payload.cid,
    iss: t1Decoded?.payload.iss,
    aud: t1Decoded?.payload.aud,
    sub_profile: t1Decoded?.payload.sub_profile,
    scp: t1Decoded?.payload.scp,
  })

  // 5. Step 2: T1 → T2 (id-jag)
  console.log('\n4. executeStep2 (T1 → T2 id-jag at Org AS)...')
  let t2: string
  try {
    t2 = await executeStep2(t1)
    const t2Decoded = decodeJwt(t2)
    console.log(`   ✓ T2 id-jag minted`)
    console.log(`   act chain:`, JSON.stringify(extractActChain(t2Decoded?.payload || {}), null, 2))
  } catch (err) {
    console.error(`   ✗ Step 2 failed:`, err instanceof Error ? err.message : err)
    return
  }

  // 6. Step 3: T2 → T3 (access token at Inventory AS)
  console.log('\n5. executeStep3 (T2 → T3 access token at Inventory AS)...')
  try {
    const t3 = await executeStep3(t2)
    const t3Decoded = decodeJwt(t3)
    console.log(`   ✓ T3 access_token minted`)
    console.log(`   act chain:`, JSON.stringify(extractActChain(t3Decoded?.payload || {}), null, 2))
    console.log(`\n=== END-TO-END HI CHAIN PASSES ===`)
  } catch (err) {
    console.error(`   ✗ Step 3 failed:`, err instanceof Error ? err.message : err)
  }
}

main().catch(err => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
