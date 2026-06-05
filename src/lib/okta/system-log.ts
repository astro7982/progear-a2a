/**
 * Server-side helper to query Bala's tenant System Log.
 * Filters to A2A-relevant event types and returns the events with the
 * fields the UI needs (act chain, agent identity, audience, timestamps).
 */

const A2A_EVENT_TYPES = [
  'app.oauth2.token.grant.id_jag',
  'app.oauth2.as.token.grant.access_token',
] as const

export interface AuditEvent {
  uuid: string
  publishedAt: string
  eventType: string
  outcome: string
  actorName: string
  actorId: string
  actorType: string
  audience?: string
  resource?: string
  scopes?: string
  grantType?: string
  resourceConnectionId?: string
  actChain?: string
  tokenType?: 'access_token' | 'id_jag'
  rawHash?: string
}

export interface FetchOptions {
  sinceIso?: string
  limit?: number
}

function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var ${key}`)
  return v
}

export async function fetchA2aEvents(opts: FetchOptions = {}): Promise<AuditEvent[]> {
  const orgUrl = requireEnv('OKTA_ORG_URL')
  const token = requireEnv('OKTA_ADMIN_TOKEN')
  const limit = opts.limit ?? 50
  const sinceIso = opts.sinceIso ?? new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const params = new URLSearchParams({
    limit: String(limit),
    since: sinceIso,
    sortOrder: 'DESCENDING',
    filter: A2A_EVENT_TYPES.map((t) => `eventType eq "${t}"`).join(' or '),
  })

  const res = await fetch(`${orgUrl}/api/v1/logs?${params}`, {
    headers: {
      Authorization: `SSWS ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`System Log query failed: HTTP ${res.status}`)

  const events = (await res.json()) as Array<Record<string, unknown>>

  return events.map(mapEvent)
}

function mapEvent(e: Record<string, unknown>): AuditEvent {
  const debug = (e.debugContext as Record<string, unknown> | undefined)?.debugData as
    | Record<string, unknown>
    | undefined
  const targets = (e.target as Array<Record<string, unknown>>) ?? []
  const actor = (e.actor as Record<string, unknown> | undefined) ?? {}

  let actChain: string | undefined
  let tokenType: 'access_token' | 'id_jag' | undefined
  let rawHash: string | undefined
  for (const t of targets) {
    const detail = t.detailEntry as Record<string, unknown> | undefined
    if (detail?.actor && typeof detail.actor === 'string') {
      actChain = detail.actor
    }
    if (detail?.hash && typeof detail.hash === 'string') {
      rawHash = detail.hash
    }
    const type = String(t.type ?? '')
    if (type === 'access_token' || type === 'id_jag') {
      tokenType = type
    }
  }

  return {
    uuid: String(e.uuid ?? ''),
    publishedAt: String(e.published ?? ''),
    eventType: String(e.eventType ?? ''),
    outcome: String((e.outcome as Record<string, unknown>)?.result ?? ''),
    actorName: String(actor.displayName ?? actor.alternateId ?? '?'),
    actorId: String(actor.id ?? '?'),
    actorType: String(actor.type ?? '?'),
    audience: debug?.authorizationServerAudience as string | undefined,
    resource: debug?.resource as string | undefined,
    scopes: debug?.grantedScopes as string | undefined,
    grantType: debug?.grantType as string | undefined,
    resourceConnectionId: debug?.resourceConnectionId as string | undefined,
    actChain,
    tokenType,
    rawHash,
  }
}
