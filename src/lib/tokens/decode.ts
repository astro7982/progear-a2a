import type { DecodedJWT } from '@/types'

/**
 * Decode a JWT WITHOUT signature verification. Safe for client display and
 * for surfacing the act chain. NEVER use the result for authorization.
 */
export function decodeJwt(token: string): DecodedJWT | null {
  try {
    const [headerB64, payloadB64] = token.split('.')
    if (!headerB64 || !payloadB64) return null
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'))
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    return { header, payload }
  } catch {
    return null
  }
}

export interface ActLayer {
  sub: string
  sub_profile?: 'user' | 'service' | 'ai_agent'
  aud?: string
  raw: Record<string, unknown>
}

/**
 * Walk the recursive `act` claim of a decoded JWT payload to produce a flat
 * list of layers, top-most actor first. Includes the outermost `sub` as the
 * topmost layer.
 */
export function extractActChain(payload: Record<string, unknown>): ActLayer[] {
  const layers: ActLayer[] = []
  const top: ActLayer = {
    sub: String(payload.sub ?? ''),
    sub_profile: payload.sub_profile as ActLayer['sub_profile'],
    aud: typeof payload.aud === 'string' ? payload.aud : undefined,
    raw: payload,
  }
  layers.push(top)

  let cursor: unknown = payload.act
  while (cursor && typeof cursor === 'object') {
    const c = cursor as Record<string, unknown>
    layers.push({
      sub: String(c.sub ?? ''),
      sub_profile: c.sub_profile as ActLayer['sub_profile'],
      raw: c,
    })
    cursor = c.act
  }
  return layers
}
