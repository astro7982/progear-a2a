'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Database } from 'lucide-react'

export type HopState = 'idle' | 'active' | 'success' | 'blocked'
export type NodeId = 'user' | 'sales' | 'inventory' | 'db'

export interface ProvenanceNode {
  state: HopState
  /** What permissions this principal carries AT this hop. Attenuates downstream. */
  scopes: string[]
}

export interface ProvenanceState {
  user: ProvenanceNode
  sales: ProvenanceNode
  inventory: ProvenanceNode
  db: ProvenanceNode
  /** State of the secure handoff between adjacent nodes. */
  edgeUserSales: HopState
  edgeSalesInventory: HopState
  edgeInventoryDb: HopState
}

export const IDLE_PROVENANCE: ProvenanceState = {
  user: { state: 'idle', scopes: [] },
  sales: { state: 'idle', scopes: [] },
  inventory: { state: 'idle', scopes: [] },
  db: { state: 'idle', scopes: [] },
  edgeUserSales: 'idle',
  edgeSalesInventory: 'idle',
  edgeInventoryDb: 'idle',
}

interface NodeMeta {
  id: NodeId
  label: string
  sub: string
  cx: number
  cy: number
  color: string
  kind: 'user' | 'agent' | 'db'
  ownedBy: string
}

interface Props {
  state: ProvenanceState
  userName: string
  highlightedNode: NodeId | null
}

const W = 432
const H = 132

export function ProvenanceTree({ state, userName, highlightedNode }: Props) {
  const initials = userName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const nodes: NodeMeta[] = [
    {
      id: 'user',
      label: userName.split(' ')[0],
      sub: 'Sales rep',
      cx: 36,
      cy: 96,
      color: 'var(--relay-human)',
      kind: 'user',
      ownedBy: userName,
    },
    {
      id: 'sales',
      label: 'Sales',
      sub: 'Registered agent',
      cx: 156,
      cy: 70,
      color: 'var(--relay-agent-1)',
      kind: 'agent',
      ownedBy: 'ProGear AI Team',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      sub: 'Registered agent',
      cx: 276,
      cy: 44,
      color: 'var(--relay-agent-2)',
      kind: 'agent',
      ownedBy: 'ProGear AI Team',
    },
    {
      id: 'db',
      label: 'Records',
      sub: 'Inventory DB',
      cx: 396,
      cy: 24,
      color: 'var(--relay-db)',
      kind: 'db',
      ownedBy: 'ProGear Cloud',
    },
  ]

  const edges = [
    { from: nodes[0], to: nodes[1], state: state.edgeUserSales, label: 'Secure handoff' },
    { from: nodes[1], to: nodes[2], state: state.edgeSalesInventory, label: 'Secure handoff' },
    { from: nodes[2], to: nodes[3], state: state.edgeInventoryDb, label: 'The gate' },
  ]

  const nodeStateById: Record<NodeId, ProvenanceNode> = {
    user: state.user,
    sales: state.sales,
    inventory: state.inventory,
    db: state.db,
  }

  const blocked = state.edgeInventoryDb === 'blocked'

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/30 px-4 pt-2.5 pb-3 shrink-0 relative">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] font-medium">
          Identity Provenance
        </div>
        <div className="text-[9px] text-[var(--text-muted)] flex items-center gap-1.5">
          <span className="opacity-70">{userName.split(' ')[0]} is on every step</span>
          {blocked && (
            <span className="ml-1 px-1.5 py-px rounded text-[8px] font-semibold tracking-wider"
              style={{ color: 'var(--warning)', background: 'var(--warning-bg)', border: '1px solid var(--warning)40' }}>
              GATE
            </span>
          )}
        </div>
      </div>

      <div className="relative" style={{ height: H }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Edge connectors */}
          {edges.map((e, i) => (
            <Edge key={i} from={e.from} to={e.to} state={e.state} />
          ))}
          {/* Edge shields */}
          {edges.map((e, i) => (
            <EdgeShield key={`s-${i}`} from={e.from} to={e.to} state={e.state} />
          ))}
        </svg>

        {/* HTML node layer (so we can use real avatars + tooltips) */}
        <div className="absolute inset-0">
          {nodes.map((n) => (
            <Node
              key={n.id}
              meta={n}
              node={nodeStateById[n.id]}
              userInitials={initials}
              highlighted={highlightedNode === n.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Edge({ from, to, state }: { from: NodeMeta; to: NodeMeta; state: HopState }) {
  const path = curvedPath(from.cx, from.cy, to.cx, to.cy)
  const colorActive =
    state === 'blocked'
      ? 'var(--warning)'
      : state === 'success'
        ? 'var(--success)'
        : state === 'active'
          ? 'var(--okta-blue)'
          : 'var(--border)'
  const isLive = state !== 'idle'

  return (
    <g>
      {/* Base line */}
      <path d={path} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
      {/* Active overlay */}
      {isLive && (
        <motion.path
          d={path}
          fill="none"
          stroke={colorActive}
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}
    </g>
  )
}

function EdgeShield({ from, to, state }: { from: NodeMeta; to: NodeMeta; state: HopState }) {
  if (state === 'idle') return null
  const mx = (from.cx + to.cx) / 2
  const my = (from.cy + to.cy) / 2 - 6
  const blocked = state === 'blocked'
  const success = state === 'success'
  const color = blocked ? 'var(--warning)' : success ? 'var(--success)' : 'var(--okta-blue)'

  return (
    <g transform={`translate(${mx}, ${my})`}>
      <motion.circle
        r={blocked ? 7 : 6}
        fill={blocked ? 'var(--warning-bg)' : success ? 'var(--success-bg)' : '#0ea5e914'}
        stroke={color}
        strokeWidth={1}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          opacity: blocked ? [1, 0.55, 1] : 1,
        }}
        transition={{
          scale: { duration: 0.3 },
          opacity: { duration: 1.6, repeat: blocked ? Infinity : 0 },
        }}
      />
      {/* shield glyph */}
      <g transform="translate(-3.5, -4)" pointerEvents="none">
        {blocked ? (
          <ShieldAlertGlyph color={color} />
        ) : (
          <ShieldCheckGlyph color={color} />
        )}
      </g>
    </g>
  )
}

function ShieldCheckGlyph({ color }: { color: string }) {
  return (
    <svg width="7" height="8" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function ShieldAlertGlyph({ color }: { color: string }) {
  return (
    <svg width="7" height="8" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}

function Node({
  meta,
  node,
  userInitials,
  highlighted,
}: {
  meta: NodeMeta
  node: ProvenanceNode
  userInitials: string
  highlighted: boolean
}) {
  const [hover, setHover] = useState(false)
  const active = node.state === 'active'
  const success = node.state === 'success'
  const blocked = node.state === 'blocked'
  const live = node.state !== 'idle'

  const ringColor = blocked
    ? 'var(--warning)'
    : success
      ? 'var(--success)'
      : active
        ? meta.color
        : 'var(--border)'

  const fillColor = live ? `${meta.color}25` : 'var(--bg-elevated)'

  return (
    <div
      className="absolute"
      style={{
        left: `calc(${(meta.cx / W) * 100}% - 14px)`,
        top: meta.cy - 14,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.div
        animate={{
          scale: active ? [1, 1.08, 1] : 1,
          boxShadow:
            highlighted
              ? `0 0 0 2px var(--brand), 0 0 14px 0 var(--brand)80`
              : active
                ? `0 0 0 0 ${ringColor}80, 0 0 10px 0 ${ringColor}60`
                : success
                  ? `0 0 0 1px ${ringColor}40, 0 0 6px 0 ${ringColor}30`
                  : `0 0 0 0 transparent`,
        }}
        transition={{
          scale: { duration: 0.9, repeat: active ? Infinity : 0, ease: 'easeInOut' },
          boxShadow: { duration: 0.4 },
        }}
        className="relative h-7 w-7 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          backgroundColor: fillColor,
          color: live ? meta.color : 'var(--text-muted)',
          border: `1px solid ${ringColor}`,
        }}
      >
        {meta.kind === 'user' ? (
          <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center text-[7px] font-bold text-[#3a1f12]">
            {userInitials}
          </div>
        ) : meta.kind === 'db' ? (
          <Database className="h-3 w-3" />
        ) : (
          <Bot className="h-3 w-3" />
        )}
        {active && (
          <motion.span
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${meta.color}` }}
          />
        )}
      </motion.div>

      {/* Label below */}
      <div className="absolute top-[30px] left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
        <div className="text-[9px] font-semibold leading-tight" style={{ color: live ? 'var(--text)' : 'var(--text-muted)' }}>
          {meta.label}
        </div>
        <ScopePills scopes={node.scopes} color={meta.color} />
      </div>

      {/* Hover popover with hop identity */}
      <AnimatePresence>
        {hover && live && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 left-1/2 -translate-x-1/2 -top-2 -translate-y-full w-[200px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[#0a0a14] shadow-lg p-2.5 pointer-events-none"
          >
            <div className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: meta.color }}>
              {meta.kind === 'user' ? 'Originator' : meta.kind === 'db' ? 'Resource' : 'Registered agent'}
            </div>
            <div className="text-[11px] font-medium text-[var(--text)] leading-tight mb-0.5">{meta.ownedBy}</div>
            <div className="text-[9px] text-[var(--text-muted)] mb-2">{meta.sub}</div>
            <div className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Permissions at this hop
            </div>
            {node.scopes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {node.scopes.map(s => (
                  <span
                    key={s}
                    className="text-[9px] font-mono px-1.5 py-px rounded"
                    style={{ color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[9px] italic text-[var(--text-muted)]">none granted</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScopePills({ scopes, color }: { scopes: string[]; color: string }) {
  if (scopes.length === 0) return null
  // Show up to 2 pills + count chip
  const visible = scopes.slice(0, 2)
  const extra = scopes.length - visible.length
  return (
    <div className="flex items-center justify-center gap-0.5 mt-0.5">
      {visible.map((s, i) => (
        <motion.span
          key={s}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.05, duration: 0.2 }}
          className="text-[7px] font-mono px-1 py-px rounded leading-none"
          style={{
            color,
            background: `${color}12`,
            border: `1px solid ${color}30`,
          }}
        >
          {shortScope(s)}
        </motion.span>
      ))}
      {extra > 0 && (
        <span
          className="text-[7px] px-1 py-px rounded leading-none font-mono"
          style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

function shortScope(s: string): string {
  // collapse "inventory.read" -> "inv.read"
  return s.replace(/^inventory\./, 'inv.').replace(/^pricing\./, 'pri.').replace(/^customer\./, 'cust.')
}

function curvedPath(x1: number, y1: number, x2: number, y2: number): string {
  // Smooth curve with control points biased toward x-progression
  const cx1 = x1 + (x2 - x1) * 0.5
  const cy1 = y1
  const cx2 = x1 + (x2 - x1) * 0.5
  const cy2 = y2
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
}
