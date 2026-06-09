'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, ShieldCheck, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  agentUsed?: string
  action?: string
  chainSuccess?: boolean
}

const QUICK_ACTIONS = [
  'Check TR-9 stock levels',
  'Order 50 basketballs for Westside High',
  'Bulk pricing on training cones',
]

interface Props {
  userName: string
}

export function AIChatPanel({ userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showIdentity, setShowIdentity] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json() as {
        text: string
        agentUsed?: string
        action?: string
        chain?: { success: boolean }
        error?: string
      }

      if (data.error) {
        setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'system', text: data.error! }])
      } else {
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.text,
          agentUsed: data.agentUsed,
          action: data.action,
          chainSuccess: data.chain?.success,
        }])
      }
    } catch {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'system', text: 'Network error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }, [loading])

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand)]/10 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-[var(--brand)]" />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>ProGear AI</div>
            <div className="text-[10px] text-[var(--text-muted)]">Sales · Inventory · Pricing</div>
          </div>
        </div>
        <button
          onClick={() => setShowIdentity(i => !i)}
          className="flex items-center gap-1.5 text-[10px] text-[var(--okta-blue)] hover:underline"
        >
          <ShieldCheck className="h-3 w-3" />
          Identity chain
          <ChevronDown className={`h-3 w-3 transition ${showIdentity ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Identity chain indicator (collapsible) */}
      <AnimatePresence>
        {showIdentity && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-[var(--border)]"
          >
            <div className="px-5 py-3 bg-[var(--okta)]/5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--okta-blue)] font-medium mb-2">
                Okta A2A Identity Chain (live)
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ChainBadge label={userName} color="var(--relay-human)" />
                <Arrow />
                <ChainBadge label="Sales Agent" color="var(--relay-agent-1)" />
                <Arrow />
                <ChainBadge label="Inventory Agent" color="var(--relay-agent-2)" />
                <Arrow />
                <ChainBadge label="DB" color="var(--relay-db)" />
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-2">
                Every request carries {userName}&apos;s identity through the full agent chain. Verified by Okta at each hop.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <Bot className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[13px] text-[var(--text-secondary)] mb-1">
              Hi {userName.split(' ')[0]}! I can help with orders, inventory, and pricing.
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Try one of the quick actions below, or type anything.
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {m.role !== 'user' && (
                <div className="h-6 w-6 rounded-full bg-[var(--brand)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3 w-3 text-[var(--brand)]" />
                </div>
              )}
              {m.role === 'user' && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3 w-3 text-[#3a1f12]" />
                </div>
              )}
              <div className={`max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
                {m.role === 'assistant' && m.agentUsed && (
                  <div className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
                    via {m.agentUsed} agent
                  </div>
                )}
                <div className={`rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[13px] leading-relaxed inline-block text-left ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white'
                    : m.role === 'system'
                      ? 'bg-[var(--danger-bg)] border border-[var(--danger)]/30 text-[var(--danger)]'
                      : 'bg-[var(--bg-elevated)] border border-[var(--border)]'
                }`}>
                  {m.text}
                </div>
                {m.role === 'assistant' && m.chainSuccess && (
                  <div className="flex items-center gap-1 mt-1.5 text-[9px] text-[var(--okta-blue)]">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Identity verified · full chain preserved
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand)]" />
            Agents processing...
          </div>
        )}
      </div>

      {/* Quick actions */}
      {messages.length === 0 && (
        <div className="px-5 pb-3 flex gap-2 flex-wrap shrink-0">
          {QUICK_ACTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[11px] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--border)] shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about orders, stock, pricing..."
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[13px] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] disabled:opacity-40 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}

function ChainBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border"
      style={{ color, borderColor: `${color}30`, backgroundColor: `${color}08` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function Arrow() {
  return <span className="text-[var(--text-muted)] text-[10px]">→</span>
}
