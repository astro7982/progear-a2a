'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldAlert, Bot, Database } from 'lucide-react'

export type HopState = 'idle' | 'active' | 'success' | 'blocked'

export interface RelayState {
  user: HopState
  sales: HopState
  inventory: HopState
  db: HopState
  shieldUserToSales: HopState
  shieldSalesToInventory: HopState
  shieldInventoryToDb: HopState
}

export const IDLE_RELAY: RelayState = {
  user: 'idle',
  sales: 'idle',
  inventory: 'idle',
  db: 'idle',
  shieldUserToSales: 'idle',
  shieldSalesToInventory: 'idle',
  shieldInventoryToDb: 'idle',
}

interface Props {
  state: RelayState
  userName: string
}

export function CompactRelay({ state, userName }: Props) {
  const initials = userName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const chips = buildChips(state, userName)

  return (
    <div className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--bg-elevated)]/60 to-transparent px-4 py-2.5 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] font-medium">
          Agent Relay
        </div>
        <AnimatePresence>
          {chips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              className="flex items-center gap-1"
            >
              {chips.map((c, i) => (
                <ChipPill key={c.label} label={c.label} color={c.color} delay={i * 0.05} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-1">
        <Hop
          icon={<UserAvatar initials={initials} />}
          label={userName.split(' ')[0]}
          sub="You"
          state={state.user}
          color="var(--relay-human)"
        />
        <Shield state={state.shieldUserToSales} />
        <Hop
          icon={<Bot className="h-3.5 w-3.5" />}
          label="Sales"
          sub="Agent"
          state={state.sales}
          color="var(--relay-agent-1)"
        />
        <Shield state={state.shieldSalesToInventory} />
        <Hop
          icon={<Bot className="h-3.5 w-3.5" />}
          label="Inventory"
          sub="Agent"
          state={state.inventory}
          color="var(--relay-agent-2)"
        />
        <Shield state={state.shieldInventoryToDb} />
        <Hop
          icon={<Database className="h-3.5 w-3.5" />}
          label="DB"
          sub="Records"
          state={state.db}
          color="var(--relay-db)"
        />
      </div>
    </div>
  )
}

function buildChips(state: RelayState, userName: string): { label: string; color: string }[] {
  const first = userName.split(' ')[0]
  const chips: { label: string; color: string }[] = []
  if (state.user !== 'idle') chips.push({ label: first, color: 'var(--relay-human)' })
  if (state.sales !== 'idle') chips.push({ label: '+ Sales', color: 'var(--relay-agent-1)' })
  if (state.inventory !== 'idle') chips.push({ label: '+ Inventory', color: 'var(--relay-agent-2)' })
  return chips
}

function Hop({
  icon,
  label,
  sub,
  state,
  color,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  state: HopState
  color: string
}) {
  const active = state === 'active'
  const success = state === 'success'
  const blocked = state === 'blocked'

  const glowColor = blocked
    ? 'var(--warning)'
    : success
      ? 'var(--success)'
      : active
        ? color
        : 'transparent'

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[54px]">
      <motion.div
        animate={{
          scale: active ? [1, 1.08, 1] : 1,
          boxShadow: active
            ? `0 0 0 0 ${glowColor}80, 0 0 12px 0 ${glowColor}60`
            : success
              ? `0 0 0 1px ${glowColor}40, 0 0 8px 0 ${glowColor}30`
              : `0 0 0 0 transparent`,
        }}
        transition={{
          scale: { duration: 0.9, repeat: active ? Infinity : 0, ease: 'easeInOut' },
          boxShadow: { duration: 0.4 },
        }}
        className="relative h-7 w-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: state === 'idle' ? 'var(--bg-elevated)' : `${color}25`,
          color: state === 'idle' ? 'var(--text-muted)' : color,
          border: `1px solid ${state === 'idle' ? 'var(--border)' : `${color}50`}`,
        }}
      >
        {icon}
        {active && (
          <motion.span
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${color}` }}
          />
        )}
      </motion.div>
      <div className="text-[9px] font-semibold leading-tight" style={{ color: state === 'idle' ? 'var(--text-muted)' : 'var(--text)' }}>
        {label}
      </div>
      <div className="text-[8px] text-[var(--text-muted)] leading-tight">{sub}</div>
    </div>
  )
}

function Shield({ state }: { state: HopState }) {
  const blocked = state === 'blocked'
  const success = state === 'success'
  const active = state === 'active'

  const color = blocked
    ? 'var(--warning)'
    : success
      ? 'var(--success)'
      : active
        ? 'var(--okta-blue)'
        : 'var(--text-muted)'

  const Icon = blocked ? ShieldAlert : ShieldCheck

  return (
    <div className="flex-1 flex items-center justify-center min-w-[20px] relative">
      <div className="absolute inset-x-1 top-1/2 -translate-y-[7px] h-px" style={{
        background: state === 'idle'
          ? 'var(--border)'
          : `linear-gradient(to right, transparent, ${color}, transparent)`,
      }} />
      <motion.div
        animate={{
          scale: active ? [1, 1.15, 1] : 1,
          opacity: state === 'idle' ? 0.4 : 1,
        }}
        transition={{
          scale: { duration: 1, repeat: active ? Infinity : 0, ease: 'easeInOut' },
          opacity: { duration: 0.3 },
        }}
        className="relative z-10 h-4 w-4 flex items-center justify-center rounded-full"
        style={{
          backgroundColor: state === 'idle' ? 'var(--bg-card)' : `${color}20`,
          border: `1px solid ${state === 'idle' ? 'var(--border)' : color}`,
        }}
      >
        <Icon className="h-2.5 w-2.5" style={{ color }} />
      </motion.div>
    </div>
  )
}

function ChipPill({ label, color, delay }: { label: string; color: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
      style={{
        color,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </motion.span>
  )
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center text-[7px] font-bold text-[#3a1f12]">
      {initials}
    </div>
  )
}
