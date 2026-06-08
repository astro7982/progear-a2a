'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw } from 'lucide-react'
import { AgentRelay, type Participant, type ParticipantStatus, type IdentityGate, type GateStatus } from './AgentRelay'
import { AnswerBlock } from './AnswerBlock'
import { GovernanceSnapshot } from './GovernanceSnapshot'
import type { ChainSSEEvent } from '@/lib/scenes/types'

interface Props {
  signedIn: boolean
  userName?: string
}

function makeParticipants(statuses: ParticipantStatus[], speeches: (string | undefined)[]): Participant[] {
  return [
    {
      id: 'sarah', name: 'Sarah Sales', role: 'Sales rep', icon: 'human',
      color: 'var(--human)', bgColor: 'var(--human-bg)', glowShadow: 'var(--shadow-glow-pink)',
      status: statuses[0], speech: speeches[0],
    },
    {
      id: 'sales-agent', name: 'Sales Agent', role: 'AI agent', icon: 'agent',
      color: 'var(--agent-blue)', bgColor: 'var(--agent-blue-bg)', glowShadow: 'var(--shadow-glow-blue)',
      status: statuses[1], speech: speeches[1],
    },
    {
      id: 'inventory-agent', name: 'Inventory Agent', role: 'AI agent', icon: 'agent',
      color: 'var(--agent-green)', bgColor: 'var(--agent-green-bg)', glowShadow: 'var(--shadow-glow-green)',
      status: statuses[2], speech: speeches[2],
    },
    {
      id: 'db', name: 'Inventory DB', role: 'Data source', icon: 'db',
      color: 'var(--db-gray)', bgColor: 'var(--db-gray-bg)', glowShadow: 'var(--shadow-sm)',
      status: statuses[3], speech: speeches[3],
    },
  ]
}

function makeGates(gateStatuses: GateStatus[], chains: string[][]): IdentityGate[] {
  return [
    { id: 'gate-1', status: gateStatuses[0], chainSoFar: chains[0] },
    { id: 'gate-2', status: gateStatuses[1], chainSoFar: chains[1] },
    { id: 'gate-3', status: gateStatuses[2], chainSoFar: chains[2] },
  ]
}

export function DemoStageV3({ signedIn, userName }: Props) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready')
  const [statuses, setStatuses] = useState<ParticipantStatus[]>(['idle', 'idle', 'idle', 'idle'])
  const [speeches, setSpeeches] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined])
  const [gateStatuses, setGateStatuses] = useState<GateStatus[]>(['idle', 'idle', 'idle'])
  const [chains, setChains] = useState<string[][]>([[], [], []])
  const [answer, setAnswer] = useState('')

  const runDemo = useCallback(async () => {
    if (!signedIn || phase === 'running') return
    setPhase('running')
    setStatuses(['idle', 'idle', 'idle', 'idle'])
    setSpeeches([undefined, undefined, undefined, undefined])
    setGateStatuses(['idle', 'idle', 'idle'])
    setChains([[], [], []])
    setAnswer('')

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

    // Step 1: Sarah asks
    await wait(400)
    setStatuses(['active', 'idle', 'idle', 'idle'])
    setSpeeches(['Do we have 200 TR-9 Trail Packs?', undefined, undefined, undefined])

    // Step 2: Gate 1 fires — Okta verifies Sarah's identity
    await wait(900)
    setGateStatuses(['verifying', 'idle', 'idle'])
    setChains([['Sarah'], [], []])

    // Step 3: Gate 1 passes, Sales Agent receives delegated authority
    await wait(700)
    setStatuses(['done', 'active', 'idle', 'idle'])
    setGateStatuses(['passed', 'idle', 'idle'])
    setChains([['Sarah'], [], []])
    setSpeeches(['Do we have 200 TR-9 Trail Packs?', 'Let me check with Inventory.', undefined, undefined])

    // Step 4: Gate 2 fires — Sales Agent delegates to Inventory Agent
    await wait(900)
    setGateStatuses(['passed', 'verifying', 'idle'])
    setChains([['Sarah'], ['Sarah', 'Sales'], []])

    // Step 5: Gate 2 passes, Inventory Agent receives
    await wait(700)
    setStatuses(['done', 'done', 'active', 'idle'])
    setGateStatuses(['passed', 'passed', 'idle'])
    setChains([['Sarah'], ['Sarah', 'Sales'], []])
    setSpeeches(['Do we have 200 TR-9 Trail Packs?', 'Let me check with Inventory.', 'Checking stock levels...', undefined])

    // Step 6: Gate 3 fires — Inventory Agent queries DB
    await wait(800)
    setGateStatuses(['passed', 'passed', 'verifying'])
    setChains([['Sarah'], ['Sarah', 'Sales'], ['Sarah', 'Sales', 'Inventory']])

    // Step 7: Gate 3 passes, DB responds
    await wait(600)
    setStatuses(['done', 'done', 'done', 'active'])
    setGateStatuses(['passed', 'passed', 'passed'])
    setSpeeches(['Do we have 200 TR-9 Trail Packs?', 'Let me check with Inventory.', 'Checking stock levels...', '247 in stock'])

    // Step 8: All done
    await wait(700)
    setStatuses(['done', 'done', 'done', 'done'])

    // Fire real chain in background for governance data
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

    setAnswer((prev) => prev || '247 in stock at the Memphis warehouse. Plenty for the order.')
    setPhase('done')
  }, [signedIn, phase])

  const reset = useCallback(() => {
    setPhase('ready')
    setStatuses(['idle', 'idle', 'idle', 'idle'])
    setSpeeches([undefined, undefined, undefined, undefined])
    setGateStatuses(['idle', 'idle', 'idle'])
    setChains([[], [], []])
    setAnswer('')
  }, [])

  const participants = makeParticipants(statuses, speeches)
  const gates = makeGates(gateStatuses, chains)

  return (
    <div className="px-6 py-10 sm:py-16">
      <div className="max-w-[960px] mx-auto text-center">
        {phase === 'ready' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[13px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-3">
              Okta for AI Agents
            </p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-[var(--text-primary)] leading-[1.15] tracking-tight max-w-[600px] mx-auto">
              Watch agents work together.{' '}
              <span className="text-[var(--okta)]">Every action traceable to Sarah.</span>
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] mt-4 max-w-[520px] mx-auto leading-relaxed">
              Sarah asks a question. Three agents collaborate to answer it. At every handoff, Okta verifies identity and builds a chain of trust.
            </p>
            <button
              onClick={runDemo}
              disabled={!signedIn}
              className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[var(--okta)] text-white font-semibold text-[15px] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--okta)]/20"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              {signedIn ? 'Run the demo' : 'Sign in to run'}
            </button>
            {!signedIn && (
              <p className="text-[12px] text-[var(--text-muted)] mt-3">
                Sign in as Sarah to start the agent chain.
              </p>
            )}
          </motion.div>
        )}

        {phase !== 'ready' && (
          <>
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1.5">
                Agent-to-Agent Identity Chain · Live
              </div>
              <div className="text-[17px] font-semibold text-[var(--text-primary)]">
                &ldquo;Do we have 200 TR-9 Trail Packs in stock?&rdquo;
              </div>
            </div>

            <AgentRelay participants={participants} gates={gates} />
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
                transition={{ delay: 0.6 }}
                className="mt-10"
              >
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
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
