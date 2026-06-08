import type { NextAuthConfig } from 'next-auth'
import Okta from 'next-auth/providers/okta'
import { customFetch } from '@auth/core'

const RESOURCE = 'https://progear.com/sales'

/**
 * NextAuth v5 ignores `token.params` for OIDC providers, so the resource
 * indicator (RFC 8707) doesn't make it into the code-for-token request body.
 * The result: the issued access token has aud=`<sales-resource>` (the AS
 * audience) instead of aud=`https://progear.com/sales` (the agent's
 * resourceUrl). Org AS then refuses it as `invalid_subject_token` when
 * the Sales agent tries to exchange it for an id-jag.
 *
 * Fix: intercept fetch via the `customFetch` symbol. When the request goes
 * to the token endpoint with grant_type=authorization_code, append
 * `resource=https://progear.com/sales` to the body before sending.
 */
const oktaFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

  // Only the token-endpoint POST needs mutation.
  if (!/\/oauth2\/[^/]+\/v1\/token$/.test(url)) return fetch(input, init)

  console.log(`[oktaFetch] TOKEN ENDPOINT input=${input?.constructor?.name} body=${init?.body?.constructor?.name} init keys=${init ? Object.keys(init).join(',') : 'undef'}`)
  if (init?.body) {
    if (typeof init.body === 'string') console.log(`[oktaFetch] body STRING: ${init.body.slice(0,200)}`)
    else if (init.body instanceof URLSearchParams) console.log(`[oktaFetch] body URLSearchParams: ${init.body.toString().slice(0,200)}`)
    else console.log(`[oktaFetch] body OTHER: ${typeof init.body}`)
  }

  // oauth4webapi calls customFetch(request: Request). Clone, read body,
  // inject `resource` if the grant is authorization_code, rebuild fetch.
  if (input instanceof Request) {
    const cloned = input.clone()
    const text = await cloned.text()
    const params = new URLSearchParams(text)
    if (params.get('grant_type') === 'authorization_code' && !params.has('resource')) {
      params.set('resource', RESOURCE)
      return fetch(input.url, {
        method: input.method,
        headers: input.headers,
        body: params.toString(),
      })
    }
    return fetch(input, init)
  }

  // Fallback path for when init.body carries the form body directly.
  if (typeof init?.body === 'string') {
    const params = new URLSearchParams(init.body)
    if (params.get('grant_type') === 'authorization_code' && !params.has('resource')) {
      params.set('resource', RESOURCE)
      return fetch(input, { ...init, body: params.toString() })
    }
  }
  return fetch(input, init)
}

/**
 * NextAuth v5 config: Okta OIDC provider pointed at AS-A2A-Sales.
 * Captures Sarah's access_token on callback and stores it in the JWT
 * session so server actions can read it as T1 for the chain.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    {
      ...Okta({
        clientId: process.env.WEBAPP_CLIENT_ID,
        clientSecret: process.env.WEBAPP_CLIENT_SECRET,
        issuer: `${process.env.OKTA_ORG_URL}/oauth2/${process.env.WEBAPP_AUTH_SERVER_ID}`,
        authorization: {
          params: {
            scope: 'openid profile email agent.invoke',
            // RFC 8707: AS uses this to mint a token bound to the agent's
            // resourceUrl (https://progear.com/sales).
            resource: RESOURCE,
          },
        },
      }),
      // The Okta() helper passes options under .options but never sets
      // [customFetch] on the provider object. Set it explicitly here so
      // @auth/core's OAuth code-grant invokes our wrapper.
      [customFetch]: oktaFetch,
    },
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.idToken = token.idToken as string | undefined
      session.expiresAt = token.expiresAt as number | undefined
      return session
    },
  },
}
