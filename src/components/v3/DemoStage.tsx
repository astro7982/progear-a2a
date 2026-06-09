'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, RotateCcw, Loader2 } from 'lucide-react'
import { AgentRelay, type Participant, type ParticipantStatus, type IdentityGate, type GateStatus } from './AgentRelay'
import { GovernanceSnapshot } from './GovernanceSnapshot'

interface Props {
  signedIn: boolean
  userName?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  agentUsed?: string
  action?: string
}

const SUGGESTIONS = [
  'Do we have 200 TR-9 Trail Packs in stock?',
  'I need to order 50 basketballs for Westside High.',
  'What hoops do we have available?',
  'Get me bulk pricing on 100 training cones.',
]

function makeParticipants(statuses: ParticipantStatus[], speeches: (string | undefined)[]): Participant[] {
  return [
    { id: 'sarah', name: 'Sarah Sales', role: 'Sales rep', icon: 'human', color: 'var(--human)', bgColor: 'var(--human-bg)', glowShadow: 'var(--shadow-glow-pink)', status: statuses[0], speech: speeches[0] },
    { id: 'sales-agent', name: 'Sales Agent', role: 'AI agent', icon: 'agent', color: 'var(--agent-blue)', bgColor: 'var(--agent-blue-bg)', glowShadow: 'var(--shadow-glow-blue)', status: statuses[1], speech: speeches[1] },
    { id: 'inventory-agent', name: 'Inventory Agent', role: 'AI agent', icon: 'agent', color: 'var(--agent-green)', bgColor: 'var(--agent-green-bg)', glowShadow: 'var(--shadow-glow-green)', status: statuses[2], speech: speeches[2] },
    { id: 'db', name: 'Inventory DB', role: 'Data source', icon: 'db', color: 'var(--db-gray)', bgColor: 'var(--db-gray-bg)', glowShadow: 'var(--shadow-sm)', status: statuses[3], speech: speeches[3] },
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<ParticipantStatus[]>(['idle', 'idle', 'idle', 'idle'])
  const [speeches, setSpeeches] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined])
  const [gateStatuses, setGateStatuses] = useState<GateStatus[]>(['idle', 'idle', 'idle'])
  const [chains, setChains] = useState<string[][]>([[], [], []])
  const [showGovernance, setShowGovernance] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const resetRelay = useCallback(() => {
    setStatuses(['idle', 'idle', 'idle', 'idle'])
    setSpeeches([undefined, undefined, undefined, undefined])
    setGateStatuses(['idle', 'idle', 'idle'])
    setChains([[], [], []])
    setShowGovernance(false)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !signedIn || loading) return
    setInput('')
    resetRelay()

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Animate relay: Sarah asks
    setStatuses(['active', 'idle', 'idle', 'idle'])
    setSpeeches([text.length > 40 ? text.slice(0, 37) + '...' : text, undefined, undefined, undefined])

    // Gate 1 fires
    await new Promise(r => setTimeout(r, 600))
    setGateStatuses(['verifying', 'idle', 'idle'])
    setChains([['Sarah'], [], []])

    await new Promise(r => setTimeout(r, 500))
    setStatuses(['done', 'active', 'idle', 'idle'])
    setGateStatuses(['passed', 'idle', 'idle'])
    setSpeeches(prev => [prev[0], 'Processing request...', undefined, undefined])

    // Gate 2 fires
    await new Promise(r => setTimeout(r, 500))
    setGateStatuses(['passed', 'verifying', 'idle'])
    setChains([['Sarah'], ['Sarah', 'Sales'], []])

    await new Promise(r => setTimeout(r, 400))
    setStatuses(['done', 'done', 'active', 'idle'])
    setGateStatuses(['passed', 'passed', 'idle'])
    setSpeeches(prev => [prev[0], prev[1], 'Querying data...', undefined])

    // Gate 3
    await new Promise(r => setTimeout(r, 400))
    setGateStatuses(['passed', 'passed', 'verifying'])
    setChains([['Sarah'], ['Sarah', 'Sales'], ['Sarah', 'Sales', 'Inventory']])

    // Call the real API (LLM + chain runs in parallel)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json() as {
        text: string
        agentUsed: string
        action: string
        chain: { success: boolean; actChain?: unknown[] }
      }

      // Complete relay
      setGateStatuses(['passed', 'passed', 'passed'])
      setStatuses(['done', 'done', 'done', 'done'])
      setSpeeches(prev => [prev[0], prev[1], prev[2], 'Data returned'])

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.text,
        agentUsed: data.agentUsed,
        action: data.action,
      }
      setMessages(prev => [...prev, assistantMsg])

      if (data.chain?.success) {
        setShowGovernance(true)
      }
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'system',
        text: `Error: ${err instanceof Error ? err.message : 'Request failed'}`,
      }
      setMessages(prev => [...prev, errMsg])
      setStatuses(['done', 'idle', 'idle', 'idle'])
    } finally {
      setLoading(false)
    }
  }, [signedIn, loading, resetRelay])

  const participants = makeParticipants(statuses, speeches)
  const gates = makeGates(gateStatuses, chains)
  const hasMessages = messages.length > 0

  return (
    <div className="px-6 py-8 sm:py-12">
      <div className="max-w-[960px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1">
            Okta for AI Agents · Agent-to-Agent
          </div>
          {!hasMessages && (
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[28px] sm:text-[34px] font-bold text-[var(--text-primary)] leading-tight tracking-tight"
            >
              How can the team help today?
            </motion.h2>
          )}
        </div>

        {/* Relay visualization */}
        {hasMessages && <AgentRelay participants={participants} gates={gates} />}

        {/* Chat */}
        <div className="max-w-[680px] mx-auto mt-4">
          {/* Suggestions (only when empty) */}
          {!hasMessages && signedIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border)] hover:border-[var(--okta)]/40 hover:bg-blue-50/50 transition text-[13px] text-[var(--text-secondary)]"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-[var(--radius-sm)] px-4 py-3 ${
                    m.role === 'user'
                      ? 'bg-[var(--okta)] text-white'
                      : m.role === 'system'
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-white border border-[var(--border)] shadow-sm'
                  }`}>
                    {m.role === 'assistant' && m.agentUsed && (
                      <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1.5">
                        via {m.agentUsed} agent · {m.action}
                      </div>
                    )}
                    <div className="text-[14px] leading-relaxed">{m.text}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Agents working...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {signedIn && (
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about stock, orders, pricing, customers..."
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border)] focus:outline-none focus:border-[var(--okta)] focus:ring-2 focus:ring-[var(--okta)]/10 transition text-[14px] placeholder:text-[var(--text-muted)] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--okta)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

          {!signedIn && (
            <p className="text-center text-[14px] text-[var(--text-muted)] py-8">
              Sign in as Sarah to start chatting with the team.
            </p>
          )}
        </div>

        {/* Governance */}
        <GovernanceSnapshot
          visible={showGovernance}
          humanName={userName || 'Sarah Sales'}
          agents={[
            { name: 'Sales Agent', action: 'Acted on Sarah\'s behalf, delegated to Inventory' },
            { name: 'Inventory Agent', action: 'Acted on both their behalf, queried the database' },
          ]}
        />

        {/* Reset */}
        {hasMessages && !loading && (
          <div className="text-center mt-6">
            <button
              onClick={() => { setMessages([]); resetRelay() }}
              className="inline-flex items-center gap-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              <RotateCcw className="h-3 w-3" />
              Clear conversation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
