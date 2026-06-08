/**
 * Three-way comparison to isolate the failure mode.
 *   A. Direct flow with resource at /token (proven working)
 *   B. Direct flow WITHOUT resource at /token (replicates NextAuth pre-fix)
 *   C. Live deployed app's flow (replicates current production)
 *
 * For each, capture T1 audience claim + try executeStep2 + report which fail.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createHash, randomBytes } from 'crypto'
import { executeStep2 } from '../src/lib/tokens/token-steps'
import { decodeJwt } from '../src/lib/tokens/decode'

function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

const ORG = process.env.OKTA_ORG_URL!
const SALES_AS = process.env.SALES_AS_ID!
const APP_ID = process.env.WEBAPP_CLIENT_ID!
const APP_SECRET = process.env.WEBAPP_CLIENT_SECRET!
const SARAH = process.env.DEMO_SARAH_LOGIN!
const SARAH_PWD = process.env.DEMO_SARAH_PASSWORD!

async function getSessionToken() {
  const r = await fetch(`${ORG}/api/v1/authn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: SARAH, password: SARAH_PWD }),
  })
  const d = (await r.json()) as { sessionToken: string }
  return d.sessionToken
}

async function getCode(sessionToken: string, sendResourceAtAuth: boolean) {
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: APP_ID,
    redirect_uri: 'http://localhost:3000/api/auth/callback/okta',
    scope: 'openid profile email agent.invoke',
    state: 'x',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    sessionToken,
  })
  if (sendResourceAtAuth) params.set('resource', 'https://progear.com/sales')
  const r = await fetch(`${ORG}/oauth2/${SALES_AS}/v1/authorize?${params}`, { redirect: 'manual' })
  const loc = r.headers.get('location') || ''
  const code = new URL(loc, 'http://x').searchParams.get('code')
  if (!code) {
    const err = new URL(loc, 'http://x').searchParams.get('error_description') || loc
    throw new Error(`authorize failed: ${err}`)
  }
  return { code, verifier }
}

async function exchangeCode(code: string, verifier: string, sendResourceAtToken: boolean) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'http://localhost:3000/api/auth/callback/okta',
    code_verifier: verifier,
  })
  if (sendResourceAtToken) body.set('resource', 'https://progear.com/sales')
  const r = await fetch(`${ORG}/oauth2/${SALES_AS}/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64')}`,
    },
    body: body.toString(),
  })
  const d = (await r.json()) as { access_token?: string; error?: string; error_description?: string }
  if (!d.access_token) throw new Error(`token: ${d.error_description || d.error}`)
  return d.access_token
}

async function tryStep2(t1: string, label: string) {
  const decoded = decodeJwt(t1)
  console.log(`  T1 aud: ${decoded?.payload.aud}`)
  console.log(`  T1 cid: ${decoded?.payload.cid}`)
  console.log(`  T1 scp: ${JSON.stringify(decoded?.payload.scp)}`)
  try {
    const t2 = await executeStep2(t1)
    const t2d = decodeJwt(t2)
    console.log(`  ✓ Step 2 SUCCESS — id-jag aud=${t2d?.payload.aud}, sub=${t2d?.payload.sub}`)
    return true
  } catch (err) {
    console.log(`  ✗ Step 2 FAIL — ${(err as Error).message.slice(0, 200)}`)
    return false
  }
}

async function main() {
  console.log('========== A. resource at BOTH /authorize and /token ==========')
  const stA = await getSessionToken()
  const { code: cA, verifier: vA } = await getCode(stA, true)
  const t1A = await exchangeCode(cA, vA, true)
  await tryStep2(t1A, 'A')

  console.log('\n========== B. resource at /authorize ONLY (replicates NextAuth pre-fix) ==========')
  const stB = await getSessionToken()
  const { code: cB, verifier: vB } = await getCode(stB, true)
  const t1B = await exchangeCode(cB, vB, false)
  await tryStep2(t1B, 'B')

  console.log('\n========== C. Live deployed app: hit /api/auth/providers + simulate ==========')
  const liveBase = 'https://progear-a2a.vercel.app'
  const providers = await fetch(`${liveBase}/api/auth/providers`).then((r) => r.json())
  console.log(`  Live providers:`, providers)
  // Drive a full sign-in via the live app: get csrf + post signin → follow to authorize
  const csrf = await fetch(`${liveBase}/api/auth/csrf`).then((r) => r.json())
  console.log(`  csrfToken: ${(csrf as { csrfToken: string }).csrfToken.slice(0, 16)}...`)
  // Look at the live signin redirect URL — does it include resource?
  const signinRes = await fetch(`${liveBase}/api/auth/signin/okta`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `csrfToken=${(csrf as { csrfToken: string }).csrfToken}&callbackUrl=${liveBase}/`,
  })
  const liveLoc = signinRes.headers.get('location') || ''
  console.log(`  Live /signin redirect URL:`)
  const u = new URL(liveLoc)
  console.log(`    host: ${u.host}${u.pathname}`)
  for (const [k, v] of u.searchParams.entries()) {
    if (k === 'state' || k.includes('challenge')) continue
    console.log(`    ${k}: ${v.slice(0, 80)}`)
  }
}

main().catch((err) => {
  console.error('TOP FAIL:', err.message || err)
  process.exit(1)
})
