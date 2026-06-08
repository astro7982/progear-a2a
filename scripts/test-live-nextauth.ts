/**
 * Drive a full live OIDC signin through the DEPLOYED app (with cookie jar).
 * Then inspect what audience NextAuth's T1 has.
 *
 * Tells us definitively whether `token.params.resource` propagates through.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { decodeJwt } from '../src/lib/tokens/decode'

const APP_BASE = 'https://progear-a2a.vercel.app'
const ORG = process.env.OKTA_ORG_URL!
const SARAH = process.env.DEMO_SARAH_LOGIN!
const SARAH_PWD = process.env.DEMO_SARAH_PASSWORD!

class CookieJar {
  jar: Map<string, string> = new Map()
  capture(setCookieHeader: string | null) {
    if (!setCookieHeader) return
    // Node fetch concatenates multiple Set-Cookie headers with comma — split carefully.
    const cookies = setCookieHeader.split(/,(?=[^ ]+=)/)
    for (const c of cookies) {
      const [pair] = c.split(';')
      const [name, ...vals] = pair.split('=')
      this.jar.set(name.trim(), vals.join('=').trim())
    }
  }
  header() {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }
}

async function follow(url: string, cookies: CookieJar, opts: RequestInit = {}, maxHops = 10): Promise<Response> {
  let cur = url
  for (let i = 0; i < maxHops; i++) {
    const res = await fetch(cur, {
      ...opts,
      redirect: 'manual',
      headers: { ...(opts.headers || {}), Cookie: cookies.header() },
    })
    cookies.capture(res.headers.get('set-cookie'))
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location') || ''
      cur = new URL(loc, cur).toString()
      // First request only carries body
      opts = { method: 'GET' }
      continue
    }
    return res
  }
  throw new Error('too many redirects')
}

async function main() {
  const cookies = new CookieJar()

  // 1. CSRF token from /api/auth/csrf
  const csrfRes = await follow(`${APP_BASE}/api/auth/csrf`, cookies)
  const csrf = (await csrfRes.json()) as { csrfToken: string }
  console.log(`csrfToken: ${csrf.csrfToken.slice(0, 16)}...`)

  // 2. POST /api/auth/signin/okta — kicks off the OIDC flow
  const signinRes = await fetch(`${APP_BASE}/api/auth/signin/okta`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies.header(),
    },
    body: `csrfToken=${csrf.csrfToken}&callbackUrl=${encodeURIComponent(APP_BASE + '/')}`,
  })
  cookies.capture(signinRes.headers.get('set-cookie'))
  const authzUrl = signinRes.headers.get('location') || ''
  console.log(`/signin redirected to:`)
  const u = new URL(authzUrl)
  console.log(`  ${u.origin}${u.pathname}`)
  console.log(`  resource @ /authorize: ${u.searchParams.get('resource')}`)
  console.log(`  scope:                 ${u.searchParams.get('scope')}`)

  // 3. Pre-authenticate Sarah and convert to sessionToken to bypass interactive
  const authn = (await (
    await fetch(`${ORG}/api/v1/authn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: SARAH, password: SARAH_PWD }),
    })
  ).json()) as { sessionToken: string }

  // 4. Hit /authorize with sessionToken to skip the credential page
  const authzWithSession = new URL(authzUrl)
  authzWithSession.searchParams.set('sessionToken', authn.sessionToken)
  const authzRes = await fetch(authzWithSession.toString(), { redirect: 'manual' })
  const cbUrl = authzRes.headers.get('location') || ''
  console.log(`Okta redirected back to: ${cbUrl.slice(0, 80)}...`)

  // 5. Hit our callback URL — this is where NextAuth does the code exchange to /token
  const cbRes = await fetch(cbUrl, {
    redirect: 'manual',
    headers: { Cookie: cookies.header() },
  })
  cookies.capture(cbRes.headers.get('set-cookie'))
  console.log(`Callback returned: ${cbRes.status}`)
  const finalLoc = cbRes.headers.get('location') || ''
  console.log(`Final location: ${finalLoc}`)

  // 6. Now ask the deployed app for the session token
  const sessionRes = await fetch(`${APP_BASE}/api/auth/session`, {
    headers: { Cookie: cookies.header() },
  })
  const session = (await sessionRes.json()) as { accessToken?: string; user?: unknown }
  console.log(`\nSession state:`)
  console.log(`  user: ${JSON.stringify(session.user)}`)
  console.log(`  accessToken: ${session.accessToken ? session.accessToken.slice(0, 30) + '...' : 'NONE'}`)

  if (session.accessToken) {
    const decoded = decodeJwt(session.accessToken)
    console.log(`\nDeployed-app T1 claims:`)
    console.log(`  aud: ${decoded?.payload.aud}`)
    console.log(`  cid: ${decoded?.payload.cid}`)
    console.log(`  sub: ${decoded?.payload.sub}`)
    console.log(`  scp: ${JSON.stringify(decoded?.payload.scp)}`)
    if (decoded?.payload.aud === 'https://progear.com/sales') {
      console.log('\n✓ NextAuth is sending resource at the token endpoint. Fix is in.')
    } else {
      console.log(`\n✗ NextAuth NOT sending resource at /token. T1 aud is ${decoded?.payload.aud}.`)
    }
  }
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
