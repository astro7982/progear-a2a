'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import type { NodeId } from './ProvenanceTree'

export type GovEventType =
  | 'AUTH'
  | 'ID_JAG_MINTED'
  | 'ACCESS_TOKEN'
  | 'TOOL_CALL'
  | 'FGA_CHECK'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_GRANTED'
  | 'CHAIN_FAILED'

export interface GovEvent {
  id: string
  ts: number
  type: GovEventType
  actor: string
  target: string
  detail: string
  comment?: string
  status: 'success' | 'pending' | 'error' | 'info'
  /** Which provenance-tree node this event maps to. Used for audit pivot. */
  nodeId?: NodeId
}

interface Props {
  events: GovEvent[]
  /** When provided, clicking an event invokes this callback with the event's nodeId. */
  onEventClick?: (nodeId: NodeId | null) => void
  /** Hide the title bar — used when embedded inside another panel that already labels it. */
  embedded?: boolean
}

const TYPE_LABEL: Record<GovEventType, string> = {
  AUTH: 'AUTH',
  ID_JAG_MINTED: 'ID-JAG MINTED',
  ACCESS_TOKEN: 'ACCESS TOKEN',
  TOOL_CALL: 'TOOL CALL',
  FGA_CHECK: 'FGA CHECK',
  APPROVAL_REQUIRED: 'APPROVAL REQUIRED',
  APPROVAL_GRANTED: 'APPROVAL GRANTED',
  CHAIN_FAILED: 'CHAIN FAILED',
}

export function GovernanceLog({ events, onEventClick, embedded }: Props) {
  return (
    <div className="h-full flex flex-col bg-[#0a0a14]">
      {!embedded && (
        <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-2 shrink-0">
          <ScrollText className="h-3 w-3 text-[var(--okta-blue)]" />
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--okta-blue)] font-semibold">
            Okta System Log
          </div>
          <span className="ml-auto text-[9px] text-[var(--text-muted)] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            live
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto chat-scroll px-3 py-3 font-mono text-[11px]">
        {events.length === 0 && (
          <div className="text-[var(--text-muted)] italic text-[10px] py-4 px-1">
            <span className="opacity-50"># </span>
            Awaiting agent activity. Send a message to fire the chain.
          </div>
        )}

        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-2 leading-snug"
            >
              <LogLine event={e} onEventClick={onEventClick} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function LogLine({
  event,
  onEventClick,
}: {
  event: GovEvent
  onEventClick?: (nodeId: NodeId | null) => void
}) {
  const time = new Date(event.ts).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const badgeBg = statusBg(event.status)
  const badgeText = statusText(event.status)
  const valueColor = statusValueColor(event.status)
  const clickable = !!onEventClick && !!event.nodeId

  return (
    <div
      className={`rounded px-1 -mx-1 ${clickable ? 'cursor-pointer hover:bg-white/5 transition' : ''}`}
      onClick={clickable ? () => onEventClick!(event.nodeId ?? null) : undefined}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[var(--text-muted)] text-[10px]">{time}</span>
        <span
          className="text-[9px] px-1.5 py-px rounded font-semibold tracking-wider"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          {TYPE_LABEL[event.type]}
        </span>
        <span className="text-[var(--text-secondary)]">
          actor=<span style={{ color: valueColor }}>{event.actor}</span>
        </span>
        <span className="text-[var(--text-secondary)]">
          target=<span style={{ color: valueColor }}>{event.target}</span>
        </span>
        {clickable && (
          <span className="ml-auto text-[8px] text-[var(--text-muted)] uppercase tracking-wider opacity-60">
            click → tree
          </span>
        )}
      </div>
      <div className="pl-[3.6rem] mt-0.5 text-[var(--text-secondary)] text-[10px]">
        {event.detail}
      </div>
      {event.comment && (
        <div className="pl-[3.6rem] mt-0.5 text-[10px] italic flex items-start gap-1">
          <span className="text-[var(--text-muted)]">←</span>
          <span style={{ color: valueColor }}>{event.comment}</span>
        </div>
      )}
    </div>
  )
}

function statusBg(s: GovEvent['status']): string {
  switch (s) {
    case 'success':
      return '#22c55e22'
    case 'pending':
      return '#f59e0b22'
    case 'error':
      return '#ef444422'
    default:
      return '#0ea5e922'
  }
}

function statusText(s: GovEvent['status']): string {
  switch (s) {
    case 'success':
      return '#4ade80'
    case 'pending':
      return '#fbbf24'
    case 'error':
      return '#f87171'
    default:
      return '#38bdf8'
  }
}

function statusValueColor(s: GovEvent['status']): string {
  switch (s) {
    case 'success':
      return '#4ade80'
    case 'pending':
      return '#fbbf24'
    case 'error':
      return '#f87171'
    default:
      return '#94a3b8'
  }
}
