'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { AgentRelay, type Participant, type ParticipantStatus } from './AgentRelay'
import { AnswerBlock } from './AnswerBlock'
import { GovernanceSnapshot } from './GovernanceSnapshot'
import type { ChainSSEEvent } from '@/lib/scenes/types'

interface Props {
  signedIn: boolean
  userName?: string
}

const SCRIPTED_STEPS = [
  { delay: 0, participant: 0, speech: 'Do we have 200 TR-9 Trail Packs?' },
  { delay: 900, participant: 1, speech: 'Let me check with Inventory for you.' },
  { delay: 1800, participant: 2, speech: 'Checking stock levels now...' },
  { delay: 2700, participant: 3, speech: '247 in stock' },
]

function makeParticipants(statuses: ParticipantStatus[], speeches: (string | undefined)[]): Participant[] {
  return [
    {
      id: 'sarah',
      name: 'Sarah Sales',
      role: 'Sales rep',
      icon: 'human',
      color: 'var(--human)',
      bgColor: 'var(--human-bg)',
      glowShadow: 'var(--shadow-glow-pink)',
      status: statuses[0],
      speech: speeches[0],
    },
    {
      id: 'sales-agent',
      name: 'Sales Agent',
      role: 'AI agent',
      icon: 'agent',
      color: 'var(--agent-blue)',
      bgColor: 'var(--agent-blue-bg)',
      glowShadow: 'var(--shadow-glow-blue)',
      status: statuses[1],
      speech: speeches[1],
    },
    {
      id: 'inventory-agent',
      name: 'Inventory Agent',
      role: 'AI agent',
      icon: 'agent',
      color: 'var(--agent-green)',
      bgColor: 'var(--agent-green-bg)',
      glowShadow: 'var(--shadow-glow-green)',
      status: statuses[2],
      speech: speeches[2],
    },
    {
      id: 'db',
      name: 'Inventory DB',
      role: 'Data source',
      icon: 'db',
      color: 'var(--db-gray)',
      bgColor: 'var(--db-gray-bg)',
      glowShadow: 'var(--shadow-sm)',
      status: statuses[3],
      speech: speeches[3],
    },
  ]
}

export function DemoStageV3({ signedIn, userName }: Props) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready')
  const [statuses, setStatuses] = useState<ParticipantStatus[]>(['idle', 'idle', 'idle', 'idle'])
  const [speeches, setSpeeches] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined])
  const [answer, setAnswer] = useState('')
  const chainFired = useRef(false)

  const runDemo = useCallback(async () => {
    if (!signedIn || phase === 'running') return
    setPhase('running')
    chainFired.current = false

    // Reset
    setStatuses(['idle', 'idle', 'idle', 'idle'])
    setSpeeches([undefined, undefined, undefined, undefined])
    setAnswer('')

    // Scripted animation (independent of chain latency)
    for (let i = 0; i < SCRIPTED_STEPS.length; i++) {
      const step = SCRIPTED_STEPS[i]
      await new Promise((r) => setTimeout(r, i === 0 ? 400 : 900))
      setStatuses((prev) => {
        const next = [...prev]
        if (i > 0) next[i - 1] = 'done'
        next[step.participant] = 'active'
        return next as ParticipantStatus[]
      })
      setSpeeches((prev) => {
        const next = [...prev]
        next[step.participant] = step.speech
        return next
      })
    }

    // Mark last as done
    await new Promise((r) => setTimeout(r, 800))
    setStatuses(['done', 'done', 'done', 'done'])

    // Fire real chain in background for real data (governance uses it)
    try {
      const res = await fetch('/api/scene/1/run?live=true', { method: 'POST' })
      if (res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          for (const p of parts) {
            if (!p.startsWith('data: ')) continue
            try {
              const ev: ChainSSEEvent = JSON.parse(p.slice(6))
              if (ev.type === 'complete') {
                const r = ev.result as { stockAvailable?: number; warehouse?: string } | undefined
                if (r?.stockAvailable) {
                  setAnswer(`${r.stockAvailable} in stock at the ${r.warehouse} warehouse. Plenty for the order.`)
                }
              }
            } catch {}
          }
        }
      }
    } catch {}

    // If chain didn't give a real answer, use the scripted one
    setAnswer((prev) => prev || '247 in stock at the Memphis warehouse. Plenty for the order.')
    setPhase('done')
  }, [signedIn, phase])

  const reset = useCallback(() => {
    setPhase('ready')
    setStatuses(['idle', 'idle', 'idle', 'idle'])
    setSpeeches([undefined, undefined, undefined, undefined])
    setAnswer('')
  }, [])

  const participants = makeParticipants(statuses, speeches)

  return (
    <div className="px-6 py-12 sm:py-16">
      <div className="max-w-[900px] mx-auto text-center">
        {phase === 'ready' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-[28px] sm:text-[36px] font-bold text-[var(--text-primary)] leading-tight tracking-tight">
              Watch agents work together,<br />
              <span className="text-[var(--okta)]">every action traceable to Sarah.</span>
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] mt-3 max-w-[480px] mx-auto">
              Sarah asks a question. Three agents collaborate to answer it. Okta records who acted on whose behalf, every step of the way.
            </p>
            <button
              onClick={runDemo}
              disabled={!signedIn}
              className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[var(--okta)] text-white font-semibold text-[15px] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              {signedIn ? 'Run the demo' : 'Sign in to run'}
            </button>
          </motion.div>
        )}

        {phase !== 'ready' && (
          <>
            <div className="mb-8">
              <div className="text-[12px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">
                Agent-to-Agent · Live
              </div>
              <div className="text-[18px] font-semibold text-[var(--text-primary)]">
                &ldquo;Do we have 200 TR-9 Trail Packs in stock?&rdquo;
              </div>
            </div>

            <AgentRelay participants={participants} />
            <AnswerBlock text={answer} visible={phase === 'done' && !!answer} />
            <GovernanceSnapshot
              visible={phase === 'done'}
              humanName={userName || 'Sarah Sales'}
              agents={[
                { name: 'Sales Agent', action: 'Acted on Sarah\'s behalf, delegated to Inventory' },
                { name: 'Inventory Agent', action: 'Acted on both their behalf, queried the database' },
              ]}
            />

            {phase === 'done' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10"
              >
                <button
                  onClick={reset}
                  className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition underline decoration-dotted underline-offset-4"
                >
                  Run again
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
