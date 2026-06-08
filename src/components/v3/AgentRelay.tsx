'use client'

import { motion } from 'framer-motion'
import { User, Bot, Database, Check, Loader2 } from 'lucide-react'

export type ParticipantStatus = 'idle' | 'active' | 'done'

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

interface Props {
  participants: Participant[]
}

function Icon({ type, status }: { type: Participant['icon']; status: ParticipantStatus }) {
  const cls = 'h-6 w-6'
  if (status === 'done') return <Check className={`${cls} text-[var(--success)]`} strokeWidth={2.5} />
  if (status === 'active') return <Loader2 className={`${cls} animate-spin`} />
  if (type === 'human') return <User className={cls} />
  if (type === 'db') return <Database className={cls} />
  return <Bot className={cls} />
}

export function AgentRelay({ participants }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-start gap-0 min-w-[700px] justify-center">
        {participants.map((p, i) => (
          <div key={p.id} className="flex items-start">
            <ParticipantCard p={p} index={i} />
            {i < participants.length - 1 && <Arrow active={participants[i + 1].status !== 'idle'} />}
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
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex flex-col items-center w-[160px]"
    >
      <div
        className={`
          relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-300
          ${isActive ? 'pulse-glow scale-105' : ''}
          ${isDone ? 'scale-100' : ''}
        `}
        style={{
          backgroundColor: p.status === 'idle' ? '#f3f4f6' : p.bgColor,
          color: p.status === 'idle' ? '#9ca3af' : p.color,
          boxShadow: isDone ? `0 0 0 2px ${p.color}33` : undefined,
          // @ts-expect-error CSS custom property for pulse animation
          '--glow': p.glowShadow,
        }}
      >
        <Icon type={p.icon} status={p.status} />
        {isDone && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[var(--success)] flex items-center justify-center">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="mt-3 text-center">
        <div
          className="text-[13px] font-semibold leading-tight"
          style={{ color: p.status === 'idle' ? 'var(--text-muted)' : 'var(--text-primary)' }}
        >
          {p.name}
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{p.role}</div>
      </div>

      {p.speech && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 max-w-[150px] text-center"
        >
          <div
            className="text-[12px] leading-relaxed px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: p.bgColor,
              borderColor: `${p.color}22`,
              color: 'var(--text-primary)',
            }}
          >
            &ldquo;{p.speech}&rdquo;
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function Arrow({ active }: { active: boolean }) {
  return (
    <div className="flex items-center pt-9 px-1">
      <svg width="40" height="16" viewBox="0 0 40 16">
        <line
          x1="0"
          y1="8"
          x2="32"
          y2="8"
          stroke={active ? 'var(--agent-blue)' : '#d1d5db'}
          strokeWidth="2"
          strokeDasharray={active ? '0' : '4 3'}
          style={{ transition: 'all 0.4s ease' }}
        />
        <polygon
          points="32,4 40,8 32,12"
          fill={active ? 'var(--agent-blue)' : '#d1d5db'}
          style={{ transition: 'fill 0.4s ease' }}
        />
      </svg>
    </div>
  )
}
