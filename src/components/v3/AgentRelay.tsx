'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Database, Check, Loader2, ShieldCheck } from 'lucide-react'

export type ParticipantStatus = 'idle' | 'active' | 'done'
export type GateStatus = 'idle' | 'verifying' | 'passed'

export interface Participant {
  id: string
  name: string
  role: string
  speech?: string
  status: ParticipantStatus
  color: string
  bgColor: string
  glowShadow: string
  icon: 'human' | 'agent' | 'db'
}

export interface IdentityGate {
  id: string
  status: GateStatus
  chainSoFar: string[]
}

interface Props {
  participants: Participant[]
  gates: IdentityGate[]
}

function ParticipantIcon({ type, status }: { type: Participant['icon']; status: ParticipantStatus }) {
  const cls = 'h-6 w-6'
  if (status === 'done') return <Check className={`${cls} text-[var(--success)]`} strokeWidth={2.5} />
  if (status === 'active') return <Loader2 className={`${cls} animate-spin`} />
  if (type === 'human') return <User className={cls} />
  if (type === 'db') return <Database className={cls} />
  return <Bot className={cls} />
}

export function AgentRelay({ participants, gates }: Props) {
  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="flex items-start justify-center min-w-[820px] gap-0">
        {participants.map((p, i) => (
          <div key={p.id} className="flex items-start">
            <ParticipantCard p={p} index={i} />
            {i < participants.length - 1 && gates[i] && (
              <OktaGate gate={gates[i]} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ParticipantCard({ p, index }: { p: Participant; index: number }) {
  const isActive = p.status === 'active'
  const isDone = p.status === 'done'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="flex flex-col items-center w-[140px]"
    >
      <div
        className={`
          relative w-[64px] h-[64px] rounded-xl flex items-center justify-center transition-all duration-300
          ${isActive ? 'pulse-glow scale-110' : 'scale-100'}
        `}
        style={{
          backgroundColor: p.status === 'idle' ? '#f3f4f6' : p.bgColor,
          color: p.status === 'idle' ? '#9ca3af' : p.color,
          boxShadow: isDone ? `0 0 0 2px ${p.color}40` : undefined,
          // @ts-expect-error CSS custom property
          '--glow': p.glowShadow,
        }}
      >
        <ParticipantIcon type={p.icon} status={p.status} />
        {isDone && (
          <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[var(--success)] flex items-center justify-center shadow-sm">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="mt-2.5 text-center">
        <div
          className="text-[13px] font-semibold leading-tight transition-colors"
          style={{ color: p.status === 'idle' ? 'var(--text-muted)' : 'var(--text-primary)' }}
        >
          {p.name}
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{p.role}</div>
      </div>

      <AnimatePresence>
        {p.speech && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 max-w-[135px] text-center"
          >
            <div
              className="text-[11px] leading-snug px-3 py-2 rounded-lg border shadow-sm"
              style={{ backgroundColor: p.bgColor, borderColor: `${p.color}20` }}
            >
              {p.speech}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function OktaGate({ gate }: { gate: IdentityGate }) {
  const isActive = gate.status === 'verifying'
  const isPassed = gate.status === 'passed'
  return (
    <div className="flex flex-col items-center pt-5 px-1 min-w-[90px]">
      {/* Arrow + shield */}
      <div className="flex items-center gap-1">
        <svg width="20" height="2" className="overflow-visible">
          <line
            x1="0" y1="1" x2="20" y2="1"
            stroke={isPassed || isActive ? 'var(--okta)' : '#d1d5db'}
            strokeWidth="2"
            strokeDasharray={gate.status === 'idle' ? '3 3' : '0'}
            style={{ transition: 'all 0.3s' }}
          />
        </svg>
        <motion.div
          animate={{
            scale: isActive ? 1.2 : 1,
            opacity: gate.status === 'idle' ? 0.4 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={`
            h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
            ${isPassed ? 'bg-[var(--okta)] border-[var(--okta)] text-white' : ''}
            ${isActive ? 'bg-blue-50 border-[var(--okta)] text-[var(--okta)]' : ''}
            ${gate.status === 'idle' ? 'bg-gray-100 border-gray-200 text-gray-400' : ''}
          `}
        >
          <ShieldCheck className="h-4 w-4" />
        </motion.div>
        <svg width="20" height="2" className="overflow-visible">
          <line
            x1="0" y1="1" x2="20" y2="1"
            stroke={isPassed ? 'var(--okta)' : '#d1d5db'}
            strokeWidth="2"
            strokeDasharray={isPassed ? '0' : '3 3'}
            style={{ transition: 'all 0.3s' }}
          />
        </svg>
      </div>

      {/* Growing identity chip */}
      <AnimatePresence>
        {(isActive || isPassed) && gate.chainSoFar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-2.5"
          >
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-white border border-[var(--okta)]/20 shadow-sm">
              {gate.chainSoFar.map((name, i) => (
                <div key={i} className="flex items-center">
                  {i > 0 && <span className="text-[8px] text-[var(--text-muted)] mx-0.5">+</span>}
                  <span className="text-[9px] font-semibold text-[var(--okta)] whitespace-nowrap">
                    {name}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-[8px] text-[var(--text-muted)] text-center mt-1 uppercase tracking-wider">
              {isPassed ? 'verified' : 'verifying'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
