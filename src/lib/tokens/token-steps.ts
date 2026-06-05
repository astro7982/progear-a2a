import { createClientAssertion, type JWKPrivateKey } from './jwt-utils'

/**
 * Token chain implementation for the ProGear A2A demo.
 *
 * Mirrors Bala's `lib/token-steps.ts` from the O4AA-A2A-TokenInspector,
 * pointed at `bala-secures-ai.oktapreview.com`.
 *
 * Chain shape:
 *   T1: client_credentials @ AS-A2A-Sales (NHI) OR auth_code @ AS-A2A-Sales (HI)
 *   T2: token-exchange @ Org AS  -> id-jag (aud=Inventory AS)
 *   T3: jwt-bearer @ AS-A2A-Inventory -> Inventory access token
 *   T4: token-exchange @ Org AS  -> id-jag (aud=InventoryMCP AS)
 *   T5: jwt-bearer @ AS-A2A-InventoryMCP -> final access token
 *
 * Steps 2-5 authenticate the calling agent with an RS256 client_assertion.
 * Steps 2/4 use RFC 8693 token-exchange. Steps 3/5 use RFC 7523 jwt-bearer.
 */

const TOKEN_EXCHANGE_GRANT = 'urn:ietf:params:oauth:grant-type:token-exchange'
const JWT_BEARER_GRANT = 'urn:ietf:params:oauth:grant-type:jwt-bearer'
const JWT_BEARER_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function parseJWK(envKey: string): JWKPrivateKey {
  const raw = requireEnv(envKey)
  try {
    return JSON.parse(raw) as JWKPrivateKey
  } catch {
    throw new Error(`${envKey} is not valid JSON. Ensure the JWK is a valid JSON object.`)
  }
}

async function postForm(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`)
  }
  return JSON.parse(text) as Record<string, unknown>
}

/**
 * Step 1 (NHI): Service client gets an access token at AS-A2A-Sales via client_credentials.
 * Returns T1 (a service access token whose `cid` is the service client and `aud` includes
 * the Sales agent's resource indicator).
 */
export async function executeStep1NHI(): Promise<string> {
  const orgUrl = requireEnv('OKTA_ORG_URL')
  const authServerId = requireEnv('SALES_AS_ID')
  const clientId = requireEnv('SERVICE_CLIENT_ID')
  const clientSecret = requireEnv('SERVICE_CLIENT_SECRET')

  const tokenEndpoint = `${orgUrl}/oauth2/${authServerId}/v1/token`
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'agent.invoke',
      resource: 'https://progear.com/sales',
    }).toString(),
  })

  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`)
  const data = JSON.parse(text) as Record<string, unknown>
  if (!data.access_token) throw new Error('No access_token in response')
  return data.access_token as string
}

/**
 * Step 2: ProGearSales agent token-exchanges T1 at Org AS for an id-jag (T2)
 * targeting AS-A2A-Inventory.
 */
export async function executeStep2(t1: string): Promise<string> {
  const orgUrl = requireEnv('OKTA_ORG_URL')
  const inventoryAsId = requireEnv('INVENTORY_AS_ID')
  const salesAgentId = requireEnv('SALES_AGENT_ID')
  const salesAgentJwk = parseJWK('SALES_AGENT_PRIVATE_KEY_JWK')

  const tokenEndpoint = `${orgUrl}/oauth2/v1/token`
  const audience = `${orgUrl}/oauth2/${inventoryAsId}`
  const clientAssertion = await createClientAssertion(salesAgentJwk, salesAgentId, tokenEndpoint)

  const data = await postForm(tokenEndpoint, {
    grant_type: TOKEN_EXCHANGE_GRANT,
    subject_token: t1,
    subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    requested_token_type: 'urn:ietf:params:oauth:token-type:id-jag',
    audience,
    resource: 'https://progear.com/inventory',
    scope: 'agent.invoke',
    client_assertion_type: JWT_BEARER_ASSERTION_TYPE,
    client_assertion: clientAssertion,
  })

  if (!data.access_token) throw new Error('No id-jag in response')
  return data.access_token as string
}

/**
 * Step 3: ProGearSales agent presents id-jag (T2) at AS-A2A-Inventory via jwt-bearer
 * to receive an Inventory access token (T3).
 *
 * Critical Okta constraint: client_assertion.iss MUST equal the client_id embedded
 * in the id-jag (T2). Same agent must redeem the assertion it received.
 */
export async function executeStep3(t2: string): Promise<string> {
  const orgUrl = requireEnv('OKTA_ORG_URL')
  const inventoryAsId = requireEnv('INVENTORY_AS_ID')
  const salesAgentId = requireEnv('SALES_AGENT_ID')
  const salesAgentJwk = parseJWK('SALES_AGENT_PRIVATE_KEY_JWK')

  const tokenEndpoint = `${orgUrl}/oauth2/${inventoryAsId}/v1/token`
  const clientAssertion = await createClientAssertion(salesAgentJwk, salesAgentId, tokenEndpoint)

  const data = await postForm(tokenEndpoint, {
    grant_type: JWT_BEARER_GRANT,
    assertion: t2,
    client_assertion_type: JWT_BEARER_ASSERTION_TYPE,
    client_assertion: clientAssertion,
  })

  if (!data.access_token) throw new Error('No access_token in response')
  return data.access_token as string
}

/**
 * Step 4: ProGearInventory agent token-exchanges T3 at Org AS for an id-jag (T4)
 * targeting AS-A2A-InventoryMCP.
 */
export async function executeStep4(t3: string): Promise<string> {
  const orgUrl = requireEnv('OKTA_ORG_URL')
  const mcpAsId = requireEnv('INVENTORY_MCP_AS_ID')
  const inventoryAgentId = requireEnv('INVENTORY_AGENT_ID')
  const inventoryAgentJwk = parseJWK('INVENTORY_AGENT_PRIVATE_KEY_JWK')

  const tokenEndpoint = `${orgUrl}/oauth2/v1/token`
  const audience = `${orgUrl}/oauth2/${mcpAsId}`
  const clientAssertion = await createClientAssertion(inventoryAgentJwk, inventoryAgentId, tokenEndpoint)

  const data = await postForm(tokenEndpoint, {
    grant_type: TOKEN_EXCHANGE_GRANT,
    subject_token: t3,
    subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    requested_token_type: 'urn:ietf:params:oauth:token-type:id-jag',
    audience,
    // RFC 8707: bind the id-jag to the InventoryMCP resource indicator so
    // AS-A2A-InventoryMCP accepts it on redemption (Step 5).
    resource: 'https://progear.com/inventoryMCP-resource',
    scope: 'agent.invoke',
    client_assertion_type: JWT_BEARER_ASSERTION_TYPE,
    client_assertion: clientAssertion,
  })

  if (!data.access_token) throw new Error('No id-jag in response')
  return data.access_token as string
}

/**
 * Step 5: ProGearInventory agent presents id-jag (T4) at AS-A2A-InventoryMCP via
 * jwt-bearer to receive the FINAL access token (T5).
 */
export async function executeStep5(t4: string): Promise<string> {
  const orgUrl = requireEnv('OKTA_ORG_URL')
  const mcpAsId = requireEnv('INVENTORY_MCP_AS_ID')
  const inventoryAgentId = requireEnv('INVENTORY_AGENT_ID')
  const inventoryAgentJwk = parseJWK('INVENTORY_AGENT_PRIVATE_KEY_JWK')

  const tokenEndpoint = `${orgUrl}/oauth2/${mcpAsId}/v1/token`
  const clientAssertion = await createClientAssertion(inventoryAgentJwk, inventoryAgentId, tokenEndpoint)

  const data = await postForm(tokenEndpoint, {
    grant_type: JWT_BEARER_GRANT,
    assertion: t4,
    client_assertion_type: JWT_BEARER_ASSERTION_TYPE,
    client_assertion: clientAssertion,
  })

  if (!data.access_token) throw new Error('No access_token in response')
  return data.access_token as string
}
