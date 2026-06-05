/**
 * Provision the FGA store: write the authorization model + seed group memberships.
 * Idempotent — re-running creates a new model version but tuples are noop on re-write.
 *
 * Run: pnpm tsx scripts/setup-fga.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { OpenFgaClient, CredentialsMethod } from '@openfga/sdk'

function env(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env: ${key}`)
  return v
}

/**
 * The authorization model expressed as a TypeScript object that the SDK accepts.
 * Equivalent DSL:
 *
 *   model
 *     schema 1.1
 *   type user
 *   type group
 *     relations
 *       define member: [user]
 *   type quote
 *     relations
 *       define creator: [user]
 *       define approver_finance: [user, group#member]
 *       define approver_cfo: [user, group#member]
 *
 * The agent code layers the discount-tier semantics on top:
 *   <=10%  → creator alone is sufficient (sales-tier authority)
 *   <=15%  → requires approver_finance OR approver_cfo on the quote
 *   <=25%  → requires approver_cfo on the quote
 */
const MODEL = {
  schema_version: '1.1',
  type_definitions: [
    { type: 'user' },
    {
      type: 'group',
      relations: { member: { this: {} } },
      metadata: {
        relations: {
          member: { directly_related_user_types: [{ type: 'user' }] },
        },
      },
    },
    {
      type: 'quote',
      relations: {
        creator: { this: {} },
        approver_finance: { this: {} },
        approver_cfo: { this: {} },
      },
      metadata: {
        relations: {
          creator: { directly_related_user_types: [{ type: 'user' }] },
          approver_finance: {
            directly_related_user_types: [
              { type: 'user' },
              { type: 'group', relation: 'member' },
            ],
          },
          approver_cfo: {
            directly_related_user_types: [
              { type: 'user' },
              { type: 'group', relation: 'member' },
            ],
          },
        },
      },
    },
  ],
} as const

async function main() {
  const fga = new OpenFgaClient({
    apiUrl: env('FGA_API_URL'),
    storeId: env('FGA_STORE_ID'),
    credentials: {
      method: CredentialsMethod.ClientCredentials,
      config: {
        apiTokenIssuer: env('FGA_API_TOKEN_ISSUER'),
        apiAudience: env('FGA_API_AUDIENCE'),
        clientId: env('FGA_CLIENT_ID'),
        clientSecret: env('FGA_CLIENT_SECRET'),
      },
    },
  })

  console.log('=== Writing authorization model ===')
  const modelResp = await fga.writeAuthorizationModel(MODEL as never)
  console.log(`Model id: ${modelResp.authorization_model_id}`)
  console.log()

  console.log('=== Seeding group memberships ===')
  const sarah = env('DEMO_SARAH_LOGIN')
  const bala = env('DEMO_BALA_LOGIN')

  const writes = [
    { user: `user:${sarah}`, relation: 'member', object: 'group:progear-sales' },
    { user: `user:${bala}`, relation: 'member', object: 'group:progear-finance' },
  ]

  for (const t of writes) {
    try {
      await fga.write({ writes: [t] }, { authorizationModelId: modelResp.authorization_model_id })
      console.log(`  + ${t.user} ${t.relation} ${t.object}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('already exists') || msg.includes('write_failed_due_to_invalid_input')) {
        console.log(`  = ${t.user} ${t.relation} ${t.object}  (already present)`)
      } else {
        throw err
      }
    }
  }

  console.log()
  console.log('=== Sanity checks ===')

  const sarahIsSales = await fga.check(
    { user: `user:${sarah}`, relation: 'member', object: 'group:progear-sales' },
    { authorizationModelId: modelResp.authorization_model_id },
  )
  console.log(`  Sarah  member of progear-sales:   ${sarahIsSales.allowed}`)

  const balaIsFinance = await fga.check(
    { user: `user:${bala}`, relation: 'member', object: 'group:progear-finance' },
    { authorizationModelId: modelResp.authorization_model_id },
  )
  console.log(`  Bala   member of progear-finance: ${balaIsFinance.allowed}`)

  console.log()
  console.log('Model + seed tuples written. Add the following to .env.local:')
  console.log(`  FGA_MODEL_ID=${modelResp.authorization_model_id}`)
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
