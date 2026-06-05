export type StepStatus = 'idle' | 'running' | 'success' | 'error' | 'awaiting_approval'

export type SceneId = 1 | 2 | 3 | 4

export interface DecodedJWT {
  header: Record<string, unknown>
  payload: Record<string, unknown>
}

export interface TokenData {
  id: string
  raw: string
  decoded: DecodedJWT | null
}

export interface SceneStep {
  num: number
  label: string
  description: string
  agentName?: string
  agentId?: string
}

export type SSEEvent =
  | { type: 'step_start'; step: number; label: string }
  | { type: 'step_success'; step: number; token?: string; actChain?: unknown }
  | { type: 'step_error'; step: number; error: string }
  | { type: 'awaiting_approval'; quoteId: string; requestedDiscountPct: number }
  | { type: 'approval_granted'; approver: string }
  | { type: 'agent_message'; agent: string; text: string }
  | { type: 'complete'; finalToken?: string; result?: unknown }
  | { type: 'error'; message: string }
