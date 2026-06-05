import { OpenFgaClient, CredentialsMethod } from '@openfga/sdk'

let cached: OpenFgaClient | null = null

/**
 * Auth0 FGA client. Lazy-initialized so build-time render doesn't try to
 * contact FGA. Reuses one instance per process to amortize the OAuth token.
 */
export function getFgaClient(): OpenFgaClient {
  if (cached) return cached

  const required = [
    'FGA_API_URL',
    'FGA_STORE_ID',
    'FGA_CLIENT_ID',
    'FGA_CLIENT_SECRET',
    'FGA_API_TOKEN_ISSUER',
    'FGA_API_AUDIENCE',
  ] as const

  for (const k of required) {
    if (!process.env[k]) throw new Error(`Missing env var ${k}`)
  }

  cached = new OpenFgaClient({
    apiUrl: process.env.FGA_API_URL!,
    storeId: process.env.FGA_STORE_ID!,
    authorizationModelId: process.env.FGA_MODEL_ID,
    credentials: {
      method: CredentialsMethod.ClientCredentials,
      config: {
        apiTokenIssuer: process.env.FGA_API_TOKEN_ISSUER!,
        apiAudience: process.env.FGA_API_AUDIENCE!,
        clientId: process.env.FGA_CLIENT_ID!,
        clientSecret: process.env.FGA_CLIENT_SECRET!,
      },
    },
  })
  return cached
}
