import type { NextAuthConfig } from 'next-auth'
import Okta from 'next-auth/providers/okta'

/**
 * NextAuth v5 config: Okta OIDC provider pointed at AS-A2A-Sales (Bala's
 * Custom Authorization Server). Captures Sarah's access_token on callback
 * and stores it in the JWT session so server actions can read it as T1
 * for the chain.
 *
 * The redirect URI registered with Bala's tenant is
 *   /api/auth/callback/okta
 * (NextAuth's default callback path for the "okta" provider).
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Okta({
      clientId: process.env.WEBAPP_CLIENT_ID,
      clientSecret: process.env.WEBAPP_CLIENT_SECRET,
      issuer: `${process.env.OKTA_ORG_URL}/oauth2/${process.env.WEBAPP_AUTH_SERVER_ID}`,
      authorization: {
        params: {
          scope: 'openid profile email agent.invoke',
          // RFC 8707: required for the AS to mint a token with this audience.
          // The AS-A2A-Sales policy allows resource indicator
          // https://progear.com/sales (Sales agent's resourceUrl).
          resource: 'https://progear.com/sales',
        },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      // First sign-in: account has the fresh tokens
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
