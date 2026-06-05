/**
 * Scene 1 — "Quick check"
 *   Sarah asks a simple stock question. Two-layer act chain.
 *   T1: Sarah's user access token from AS-A2A-Sales (set up by NextAuth)
 *   T2: token-exchange at Org AS → id-jag for Inventory AS
 *   T3: jwt-bearer at Inventory AS → access token (act={Sales→Sarah})
 */
import { decodeJwt, extractActChain } from '../tokens/decode'
import { executeStep2, executeStep3 } from '../tokens/token-steps'
import type { ChainSSEEvent } from './types'

export async function* runScene1(
  t1: string,
  pacingMs: number = 800,
): AsyncGenerator<ChainSSEEvent> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  // Origin: decode T1 to surface Sarah's identity
  const t1Decoded = decodeJwt(t1)
  yield {
    type: 'origin',
    sub: String(t1Decoded?.payload.sub ?? ''),
    subProfile: 'user',
    rawToken: t1,
  }

  yield {
    type: 'agent_message',
    agent: 'Sales Agent',
    text: 'Got it, Sarah. Checking stock with the Inventory team.',
  }
  await sleep(pacingMs)

  // Step 2: Sales agent token-exchanges T1 for an id-jag (T2) targeting Inventory AS
  yield {
    type: 'step_start',
    step: 2,
    label: 'Sales agent gets an id-jag for Inventory',
    description:
      'Sales agent presents Sarah\'s access token to the Org AS and receives an Identity Assertion JWT scoped for the Inventory AS.',
  }
  let t2: string
  try {
    t2 = await executeStep2(t1)
  } catch (err) {
    yield { type: 'step_error', step: 2, error: err instanceof Error ? err.message : String(err) }
    return
  }
  const t2Decoded = decodeJwt(t2)
  yield {
    type: 'step_success',
    step: 2,
    label: 'id-jag issued',
    tokenKind: 'id_jag',
    rawToken: t2,
    actChain: t2Decoded ? extractActChain(t2Decoded.payload) : [],
    audience: typeof t2Decoded?.payload.aud === 'string' ? t2Decoded.payload.aud : undefined,
  }
  await sleep(pacingMs)

  // Step 3: Sales agent redeems id-jag at Inventory AS for an access token (T3)
  yield {
    type: 'step_start',
    step: 3,
    label: 'Inventory agent gets an access token',
    description:
      'Sales agent presents the id-jag to AS-A2A-Inventory via jwt-bearer and receives an access token. The act chain now records Sales acting on behalf of Sarah.',
  }
  let t3: string
  try {
    t3 = await executeStep3(t2)
  } catch (err) {
    yield { type: 'step_error', step: 3, error: err instanceof Error ? err.message : String(err) }
    return
  }
  const t3Decoded = decodeJwt(t3)
  yield {
    type: 'step_success',
    step: 3,
    label: 'access token for Inventory',
    tokenKind: 'access_token',
    rawToken: t3,
    actChain: t3Decoded ? extractActChain(t3Decoded.payload) : [],
    audience: typeof t3Decoded?.payload.aud === 'string' ? t3Decoded.payload.aud : undefined,
  }
  await sleep(pacingMs)

  // Mock the actual MCP call result. In Phase 0.4 we'll wire a real MCP.
  yield {
    type: 'agent_message',
    agent: 'Inventory Agent',
    text: '247 units of TR-9 Trail Pack in stock at the Memphis warehouse. Plenty for a 200-unit order.',
  }

  yield {
    type: 'complete',
    finalToken: t3,
    result: { stockAvailable: 247, sku: 'TR-9-TrailPack', warehouse: 'Memphis' },
  }
}
