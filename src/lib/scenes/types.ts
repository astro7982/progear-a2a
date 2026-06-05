import type { ActLayer } from '../tokens/decode'

export type SceneId = 1 | 2 | 3 | 4

export interface SceneStep {
  num: number
  label: string
  description: string
  agentName?: string
  agentId?: string
}

export type ChainSSEEvent =
  | { type: 'origin'; sub: string; subProfile: 'user' | 'service'; rawToken: string }
  | { type: 'step_start'; step: number; label: string; description: string }
  | {
      type: 'step_success'
      step: number
      label: string
      tokenKind: 'access_token' | 'id_jag'
      rawToken: string
      actChain: ActLayer[]
      audience?: string
    }
  | { type: 'step_error'; step: number; error: string }
  | { type: 'agent_message'; agent: string; text: string }
  | {
      type: 'awaiting_approval'
      quoteId: string
      requestor: string
      requestedDiscountPct: number
    }
  | { type: 'approval_granted'; approver: string; approverTier: string }
  | { type: 'complete'; finalToken?: string; result?: unknown }
  | { type: 'error'; message: string }

export interface SceneRunOptions {
  live?: boolean
  pacingMs?: number
}
