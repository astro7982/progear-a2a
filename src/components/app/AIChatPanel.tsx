'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, ShieldCheck, ShieldAlert, MessageSquare, ScrollText, Code2 } from 'lucide-react'
import type { ActLayer } from '@/lib/tokens/decode'
import { CompactRelay, IDLE_RELAY, type RelayState } from './CompactRelay'
import { GovernanceLog, type GovEvent } from './GovernanceLog'
import { EngineeringPanel } from './EngineeringPanel'

interface PendingApproval {
  orderId: string
  quantity: number
  product: string
  reason: string
  approver: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  agentUsed?: string
  action?: string
  chainSuccess?: boolean
  pendingApproval?: PendingApproval
}

interface ChatChain {
  success: boolean
  actChain?: ActLayer[]
  t3Audience?: string
  t3Header?: Record<string, unknown>
  t3Payload?: Record<string, unknown>
  t3TokenPreview?: string
}

interface ChatResponse {
  text: string
  agentUsed?: 'sales' | 'inventory' | 'pricing' | 'customer'
  action?: string
  chain?: ChatChain
  user?: string
  pendingApproval?: PendingApproval | null
  error?: string
}

const QUICK_ACTIONS = [
  'Check TR-9 stock levels',
  'Order 50 basketballs for Westside High',
  'Order 75 basketballs for State University',
]

type Tab = 'chat' | 'governance' | 'engineering'

interface Props {
  userName: string
}

export function AIChatPanel({ userName }: Props) {
  const [tab, setTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [relay, setRelay] = useState<RelayState>(IDLE_RELAY)
  const [govEvents, setGovEvents] = useState<GovEvent[]>([])
  const [latestChain, setLatestChain] = useState<ChatChain | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab === 'chat') {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, tab])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Step 1 — User hop active
    setRelay({
      ...IDLE_RELAY,
      user: 'active',
    })
    pushGov(setGovEvents, {
      type: 'AUTH',
      actor: userName,
      target: 'ProGear Web App',
      detail: 'User session validated, request initiated',
      comment: `${userName.split(' ')[0]}'s identity verified`,
      status: 'info',
    })
    await tinyDelay(180)

    // Step 2 — User → Sales
    setRelay(r => ({ ...r, user: 'success', shieldUserToSales: 'active', sales: 'active' }))
    pushGov(setGovEvents, {
      type: 'ID_JAG_MINTED',
      actor: 'Sales Agent',
      target: 'Inventory AS',
      detail: 'token-exchange @ Org AS → id-jag (T2)',
      comment: 'Agent delegated authority',
      status: 'info',
    })
    await tinyDelay(220)

    // Step 3 — Sales → Inventory
    setRelay(r => ({
      ...r,
      shieldUserToSales: 'success',
      sales: 'success',
      shieldSalesToInventory: 'active',
      inventory: 'active',
    }))
    pushGov(setGovEvents, {
      type: 'ACCESS_TOKEN',
      actor: 'Sales Agent',
      target: 'Inventory Agent',
      detail: 'jwt-bearer @ AS-A2A-Inventory → access token (T3)',
      comment: 'Sarah preserved in act chain',
      status: 'info',
    })
    await tinyDelay(220)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = (await res.json()) as ChatResponse

      if (data.error) {
        setRelay(IDLE_RELAY)
        setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'system', text: data.error! }])
      } else {
        const blocked = !!data.pendingApproval
        const chainOk = !!data.chain?.success

        // Final relay state
        if (blocked) {
          setRelay({
            user: 'success',
            shieldUserToSales: 'success',
            sales: 'success',
            shieldSalesToInventory: 'success',
            inventory: 'success',
            shieldInventoryToDb: 'blocked',
            db: 'idle',
          })
          pushGov(setGovEvents, {
            type: 'FGA_CHECK',
            actor: 'Inventory Agent',
            target: `order:${data.pendingApproval!.orderId}`,
            detail: `qty=${data.pendingApproval!.quantity} exceeds 50-unit self-approval limit`,
            comment: 'FGA returned NOT allowed',
            status: 'pending',
          })
          pushGov(setGovEvents, {
            type: 'APPROVAL_REQUIRED',
            actor: 'Inventory Agent',
            target: data.pendingApproval!.approver,
            detail: `Routed to ${data.pendingApproval!.approver} for human approval`,
            comment: 'Mike has been notified',
            status: 'pending',
          })
        } else if (chainOk) {
          setRelay({
            user: 'success',
            shieldUserToSales: 'success',
            sales: 'success',
            shieldSalesToInventory: 'success',
            inventory: 'success',
            shieldInventoryToDb: 'success',
            db: 'success',
          })
          pushGov(setGovEvents, {
            type: 'TOOL_CALL',
            actor: 'Inventory Agent',
            target: 'inventory.check_stock',
            detail: 'Tool executed against ProGear inventory DB',
            comment: 'Action attributable to Sarah',
            status: 'success',
          })
        } else {
          setRelay(r => ({ ...r, inventory: 'blocked', shieldSalesToInventory: 'blocked' }))
          pushGov(setGovEvents, {
            type: 'CHAIN_FAILED',
            actor: 'Sales Agent',
            target: 'Inventory AS',
            detail: 'Token chain failed before tool call',
            status: 'error',
          })
        }

        if (data.chain) setLatestChain(data.chain)

        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.text,
            agentUsed: data.agentUsed,
            action: data.action,
            chainSuccess: data.chain?.success,
            pendingApproval: data.pendingApproval ?? undefined,
          },
        ])
      }
    } catch {
      setRelay(IDLE_RELAY)
      setMessages(prev => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'system', text: 'Network error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, userName])

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand)]/10 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-[var(--brand)]" />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>ProGear AI</div>
            <div className="text-[10px] text-[var(--text-muted)]">Sales · Inventory · Pricing</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] shrink-0 bg-[var(--bg-card)]">
        <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} icon={<MessageSquare className="h-3 w-3" />} label="Chat" />
        <TabButton
          active={tab === 'governance'}
          onClick={() => setTab('governance')}
          icon={<ScrollText className="h-3 w-3" />}
          label="Governance"
          badge={govEvents.length || undefined}
        />
        <TabButton
          active={tab === 'engineering'}
          onClick={() => setTab('engineering')}
          icon={<Code2 className="h-3 w-3" />}
          label="Engineering"
        />
      </div>

      {/* Always-visible compact relay */}
      <CompactRelay state={relay} userName={userName} />

      {/* Tab body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === 'chat' && (
          <ChatTab
            messages={messages}
            loading={loading}
            input={input}
            setInput={setInput}
            send={send}
            scrollRef={scrollRef}
            userName={userName}
          />
        )}
        {tab === 'governance' && <GovernanceLog events={govEvents} />}
        {tab === 'engineering' && (
          <EngineeringPanel
            actChain={latestChain?.actChain ?? []}
            t3Header={latestChain?.t3Header}
            t3Payload={latestChain?.t3Payload}
            t3TokenPreview={latestChain?.t3TokenPreview}
            t3Audience={latestChain?.t3Audience}
            hasChain={!!latestChain?.success}
          />
        )}
      </div>
    </div>
  )
}

function ChatTab({
  messages,
  loading,
  input,
  setInput,
  send,
  scrollRef,
  userName,
}: {
  messages: Message[]
  loading: boolean
  input: string
  setInput: (v: string) => void
  send: (s: string) => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  userName: string
}) {
  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <Bot className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[13px] text-[var(--text-secondary)] mb-1">
              Hi {userName.split(' ')[0]}! I can help with orders, inventory, and pricing.
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              The agent relay above shows every hop. Try one of the quick actions below.
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
                <div className={`rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[13px] leading-relaxed inline-block text-left whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white'
                    : m.role === 'system'
                      ? 'bg-[var(--danger-bg)] border border-[var(--danger)]/30 text-[var(--danger)]'
                      : 'bg-[var(--bg-elevated)] border border-[var(--border)]'
                }`}>
                  {m.text}
                </div>
                {m.role === 'assistant' && m.pendingApproval && (
                  <ApprovalBanner approval={m.pendingApproval} />
                )}
                {m.role === 'assistant' && m.chainSuccess && !m.pendingApproval && (
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
        <form
          onSubmit={e => {
            e.preventDefault()
            send(input)
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about orders, stock, pricing..."
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[13px] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition disabled:opacity-50 bg-[var(--bg-input)] text-[var(--text)]"
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
    </>
  )
}

function ApprovalBanner({ approval }: { approval: PendingApproval }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="mt-2 rounded-[var(--radius-sm)] border border-[var(--warning)]/40 bg-[var(--warning-bg)] px-3 py-2.5 flex items-start gap-2"
    >
      <ShieldAlert className="h-3.5 w-3.5 text-[var(--warning)] shrink-0 mt-0.5" />
      <div className="text-[11px] leading-relaxed">
        <div className="font-semibold text-[var(--warning)] mb-0.5">Manager approval required</div>
        <div className="text-[var(--text-secondary)]">
          Order {approval.orderId} ({approval.quantity} × {approval.product}) routed to{' '}
          <span className="font-mono text-[var(--text)]">{approval.approver}</span> for review.
        </div>
      </div>
    </motion.div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-medium relative transition ${
        active
          ? 'text-[var(--brand)] bg-[var(--brand)]/5'
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/40'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={`text-[8px] px-1 py-px rounded-full font-mono ${
            active ? 'bg-[var(--brand)] text-white' : 'bg-[var(--text-muted)]/30 text-[var(--text-secondary)]'
          }`}
        >
          {badge}
        </span>
      )}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand)]" />}
    </button>
  )
}

function pushGov(set: React.Dispatch<React.SetStateAction<GovEvent[]>>, e: Omit<GovEvent, 'id' | 'ts'>) {
  set(prev => [
    ...prev,
    {
      ...e,
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
    },
  ])
}

function tinyDelay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
