/**
 * Update FGA model to order-based quantity thresholds.
 * Seed Mike Manager's group membership.
 *
 * Run: pnpm tsx scripts/update-fga-model.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { OpenFgaClient, CredentialsMethod, ConsistencyPreference } from '@openfga/sdk'

function env(k: string) {
  const v = process.env[k]
  if (!v) throw new Error(`Missing: ${k}`)
  return v
}

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
      type: 'order',
      relations: {
        creator: { this: {} },
        manager_approver: { this: {} },
      },
      metadata: {
        relations: {
          creator: { directly_related_user_types: [{ type: 'user' }] },
          manager_approver: {
            directly_related_user_types: [
              { type: 'user' },
              { type: 'group', relation: 'member' },
            ],
          },
        },
      },
    },
  ],
}

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

  console.log('=== Writing order-based FGA model ===')
  const resp = await fga.writeAuthorizationModel(MODEL as never)
  console.log(`Model ID: ${resp.authorization_model_id}`)

  console.log('\n=== Seeding tuples ===')
  const writes = [
    { user: 'user:sarah.sales@progear.demo', relation: 'member', object: 'group:progear-sales' },
    { user: 'user:mike.manager@progear.demo', relation: 'member', object: 'group:progear-managers' },
  ]
  for (const t of writes) {
    try {
      await fga.write({ writes: [t] }, { authorizationModelId: resp.authorization_model_id })
      console.log(`  + ${t.user} ${t.relation} ${t.object}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('already exists')) console.log(`  = ${t.user} (exists)`)
      else throw e
    }
  }

  console.log('\n=== Sanity checks ===')
  const mike = await fga.check(
    { user: 'user:mike.manager@progear.demo', relation: 'member', object: 'group:progear-managers' },
    { consistency: ConsistencyPreference.HigherConsistency },
  )
  console.log(`  Mike in progear-managers: ${mike.allowed}`)

  const sarah = await fga.check(
    { user: 'user:sarah.sales@progear.demo', relation: 'member', object: 'group:progear-sales' },
    { consistency: ConsistencyPreference.HigherConsistency },
  )
  console.log(`  Sarah in progear-sales: ${sarah.allowed}`)

  console.log(`\n=== Done. Update .env.local: FGA_MODEL_ID=${resp.authorization_model_id} ===`)
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
