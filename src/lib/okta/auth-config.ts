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
const oktaFetch: typeof fetch = (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url
  const isTokenEndpoint = /\/oauth2\/[^/]+\/v1\/token$/.test(url)
  console.log(`[oktaFetch] called url=${url} isTokenEndpoint=${isTokenEndpoint} method=${init?.method}`)
  try {
    const body = init?.body
    if (isTokenEndpoint && typeof body === 'string') {
      const params = new URLSearchParams(body)
      console.log(`[oktaFetch] body params: grant_type=${params.get('grant_type')}, has resource=${params.has('resource')}`)
      if (params.get('grant_type') === 'authorization_code' && !params.has('resource')) {
        params.set('resource', RESOURCE)
        console.log(`[oktaFetch] INJECTED resource=${RESOURCE}`)
        return fetch(input, { ...init, body: params.toString() })
      }
    } else if (isTokenEndpoint && body instanceof URLSearchParams) {
      console.log(`[oktaFetch] body is URLSearchParams: grant_type=${body.get('grant_type')}`)
      if (body.get('grant_type') === 'authorization_code' && !body.has('resource')) {
        body.set('resource', RESOURCE)
        console.log(`[oktaFetch] INJECTED resource via URLSearchParams=${RESOURCE}`)
      }
    }
  } catch (e) {
    console.log(`[oktaFetch] parse error: ${e}`)
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
