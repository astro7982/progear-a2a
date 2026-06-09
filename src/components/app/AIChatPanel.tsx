'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, ShieldCheck, ShieldAlert, MessageSquare, Code2, Clock, ExternalLink, Sparkles, Zap, Maximize2 } from 'lucide-react'
import type { ActLayer } from '@/lib/tokens/decode'
import { ProvenanceTree, IDLE_PROVENANCE, type ProvenanceState, type NodeId } from './ProvenanceTree'
import type { GovEvent } from './GovernanceLog'
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
  { text: 'Check TR-9 stock levels', icon: '📦' },
  { text: 'Order 50 basketballs for Westside High', icon: '🏀' },
  { text: 'Order 500 basketballs for State University', icon: '🏆' },
]

const SCOPES_USER = ['inventory.read', 'inventory.write', 'pricing.read', 'customer.read']
const SCOPES_SALES = ['inventory.read', 'inventory.write', 'pricing.read']
const SCOPES_INVENTORY = ['inventory.read', 'inventory.write']
const SCOPES_DB = ['inventory.read']

type Tab = 'activity' | 'engineering'

interface Props {
  userName: string
  onPopOut?: () => void
}

// Distinctive ProGear bot avatar — gradient orange disc with stylized 'P' mark
function BotAvatar({ size = 'md', glow = false }: { size?: 'sm' | 'md' | 'lg'; glow?: boolean }) {
  const dim = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'
  const inner = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'
  return (
    <div className={`relative ${dim} shrink-0 ${glow ? 'glow-pulse rounded-full' : ''}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--brand)] via-[var(--brand-dark)] to-[#a83a05] shadow-[0_4px_12px_rgba(255,107,53,0.4)]" />
      <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-br from-[var(--brand-light)]/40 to-transparent" />
      <div className="relative h-full w-full flex items-center justify-center">
        <Sparkles className={`${inner} text-white`} strokeWidth={2.5} />
      </div>
    </div>
  )
}

export function AIChatPanel({ userName, onPopOut }: Props) {
  const [tab, setTab] = useState<Tab>('activity')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [provenance, setProvenance] = useState<ProvenanceState>(IDLE_PROVENANCE)
  const [govEvents, setGovEvents] = useState<GovEvent[]>([])
  const [latestChain, setLatestChain] = useState<ChatChain | null>(null)
  const [highlightedNode, setHighlightedNode] = useState<NodeId | null>(null)
  const [stalledOrder, setStalledOrder] = useState<PendingApproval | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab === 'activity') {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, tab])

  const onEventClick = useCallback((nodeId: NodeId | null) => {
    if (!nodeId) return
    setHighlightedNode(nodeId)
    setTab('activity')
    window.setTimeout(() => setHighlightedNode(null), 2400)
  }, [])

  const resumeAfterApproval = useCallback((order: PendingApproval) => {
    setProvenance(p => ({
      ...p,
      edgeInventoryDb: 'success',
      db: { state: 'success', scopes: SCOPES_DB },
    }))
    pushGov(setGovEvents, {
      type: 'APPROVAL_GRANTED',
      actor: order.approver,
      target: `order:${order.orderId}`,
      detail: 'Manager granted approval; gate cleared',
      comment: 'Gate cleared, secure handoff resumed',
      status: 'success',
      nodeId: 'db',
    })
    pushGov(setGovEvents, {
      type: 'TOOL_CALL',
      actor: 'Inventory Agent',
      target: 'inventory.place_order',
      detail: `Order ${order.orderId} placed for ${order.quantity} units`,
      comment: `Action attributable to ${userName.split(' ')[0]}`,
      status: 'success',
      nodeId: 'db',
    })
    setMessages(prev => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text:
          `${order.approver.split('@')[0]} approved order ${order.orderId.slice(-6)}. Placing the order now, ` +
          `${order.quantity} units of ${order.product}.`,
        chainSuccess: true,
      },
    ])
    setStalledOrder(null)
  }, [userName])

  // Poll for approval after the gate stalls. Resumes the tree when Mike approves.
  useEffect(() => {
    if (!stalledOrder) return
    const orderId = stalledOrder.orderId
    let cancelled = false

    const poll = async () => {
      try {
        const r = await fetch('/api/approval/pending', { cache: 'no-store' })
        if (!r.ok) return
        const data = (await r.json()) as { approvals?: { orderId: string; status: string }[] }
        const found = data.approvals?.find(a => a.orderId === orderId)
        if (!cancelled && found && found.status === 'approved') {
          resumeAfterApproval(stalledOrder)
        }
      } catch {
        // ignore
      }
    }

    const id = window.setInterval(poll, 1500)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [stalledOrder, resumeAfterApproval])

  const grantAsMike = useCallback(async (order: PendingApproval) => {
    try {
      await fetch('/api/approval/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, approverLogin: order.approver }),
      })
    } catch {
      // poll loop will pick up server-side success
    }
  }, [])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    setProvenance({
      ...IDLE_PROVENANCE,
      user: { state: 'active', scopes: SCOPES_USER },
    })
    pushGov(setGovEvents, {
      type: 'AUTH',
      actor: userName,
      target: 'ProGear Web App',
      detail: 'User session validated, request initiated',
      comment: `${userName.split(' ')[0]}'s identity verified`,
      status: 'info',
      nodeId: 'user',
    })
    await tinyDelay(200)

    setProvenance(p => ({
      ...p,
      user: { state: 'success', scopes: SCOPES_USER },
      edgeUserSales: 'active',
      sales: { state: 'active', scopes: SCOPES_SALES },
    }))
    pushGov(setGovEvents, {
      type: 'ID_JAG_MINTED',
      actor: 'Sales Agent',
      target: 'Inventory authorization server',
      detail: 'token-exchange @ Org AS → id-jag (T2)',
      comment: 'Sales agent receives delegated authority',
      status: 'info',
      nodeId: 'sales',
    })
    await tinyDelay(280)

    setProvenance(p => ({
      ...p,
      edgeUserSales: 'success',
      sales: { state: 'success', scopes: SCOPES_SALES },
      edgeSalesInventory: 'active',
      inventory: { state: 'active', scopes: SCOPES_INVENTORY },
    }))
    pushGov(setGovEvents, {
      type: 'ACCESS_TOKEN',
      actor: 'Sales Agent',
      target: 'Inventory Agent',
      detail: 'jwt-bearer @ AS-A2A-Inventory → access token (T3)',
      comment: `${userName.split(' ')[0]} preserved in act chain`,
      status: 'info',
      nodeId: 'inventory',
    })
    await tinyDelay(280)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = (await res.json()) as ChatResponse

      if (data.error) {
        setProvenance(IDLE_PROVENANCE)
        setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'system', text: data.error! }])
      } else {
        const blocked = !!data.pendingApproval
        const chainOk = !!data.chain?.success

        if (blocked) {
          setProvenance({
            user: { state: 'success', scopes: SCOPES_USER },
            sales: { state: 'success', scopes: SCOPES_SALES },
            inventory: { state: 'success', scopes: SCOPES_INVENTORY },
            db: { state: 'idle', scopes: [] },
            edgeUserSales: 'success',
            edgeSalesInventory: 'success',
            edgeInventoryDb: 'blocked',
          })
          pushGov(setGovEvents, {
            type: 'FGA_CHECK',
            actor: 'Inventory Agent',
            target: `order:${data.pendingApproval!.orderId}`,
            detail: `qty=${data.pendingApproval!.quantity} exceeds 50-unit self-approval limit`,
            comment: 'Permission rule blocked the action',
            status: 'pending',
            nodeId: 'inventory',
          })
          pushGov(setGovEvents, {
            type: 'APPROVAL_REQUIRED',
            actor: 'Inventory Agent',
            target: data.pendingApproval!.approver,
            detail: `Routed to ${data.pendingApproval!.approver} for human approval`,
            comment: 'Mike has been notified',
            status: 'pending',
            nodeId: 'db',
          })
          setStalledOrder(data.pendingApproval!)
        } else if (chainOk) {
          setProvenance({
            user: { state: 'success', scopes: SCOPES_USER },
            sales: { state: 'success', scopes: SCOPES_SALES },
            inventory: { state: 'success', scopes: SCOPES_INVENTORY },
            db: { state: 'success', scopes: SCOPES_DB },
            edgeUserSales: 'success',
            edgeSalesInventory: 'success',
            edgeInventoryDb: 'success',
          })
          pushGov(setGovEvents, {
            type: 'TOOL_CALL',
            actor: 'Inventory Agent',
            target: 'inventory.check_stock',
            detail: 'Tool executed against ProGear inventory DB',
            comment: `Action attributable to ${userName.split(' ')[0]}`,
            status: 'success',
            nodeId: 'db',
          })
        } else {
          setProvenance(p => ({
            ...p,
            edgeSalesInventory: 'blocked',
            inventory: { state: 'blocked', scopes: [] },
          }))
          pushGov(setGovEvents, {
            type: 'CHAIN_FAILED',
            actor: 'Sales Agent',
            target: 'Inventory authorization server',
            detail: 'Token chain failed before tool call',
            status: 'error',
            nodeId: 'inventory',
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
            chainSuccess: data.chain?.success,
            pendingApproval: data.pendingApproval ?? undefined,
          },
        ])
      }
    } catch {
      setProvenance(IDLE_PROVENANCE)
      setMessages(prev => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'system', text: 'Network error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, userName])

  return (
    <div className="relative flex flex-col h-full">
      {/* Branded gradient header */}
      <div className="relative px-4 py-3 border-b border-[var(--border)] shrink-0 overflow-hidden bg-gradient-to-r from-[var(--brand)]/[0.12] via-[var(--brand-dark)]/[0.06] to-transparent">
        <div className="absolute -top-12 -left-8 w-[180px] h-[120px] rounded-full bg-[var(--brand)] opacity-10 blur-[40px]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BotAvatar size="lg" glow />
            <div>
              <div className="text-[14px] font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                ProGear AI
                <span className="px-1.5 py-px rounded-full bg-[var(--success)]/15 border border-[var(--success)]/30 text-[var(--success)] text-[8px] font-bold uppercase tracking-[0.12em]">Live</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.16em] font-medium">
                Sales · Inventory · Pricing
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[var(--brand-light)] opacity-60" />
            {onPopOut && (
              <button
                onClick={onPopOut}
                title="Pop out to separate window"
                className="group h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center border border-transparent text-[var(--text-muted)] hover:text-[var(--brand-light)] hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/[0.08] hover:shadow-[0_0_12px_rgba(255,107,53,0.4)] transition-all"
              >
                <Maximize2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-[var(--border)] shrink-0 bg-[var(--bg-card)]/80 relative z-10">
        <TabButton active={tab === 'activity'} onClick={() => setTab('activity')} icon={<MessageSquare className="h-3 w-3" />} label="Activity" />
        <TabButton
          active={tab === 'engineering'}
          onClick={() => setTab('engineering')}
          icon={<Code2 className="h-3 w-3" />}
          label="Engineering"
          badge={govEvents.length || undefined}
        />
      </div>

      <ProvenanceTree state={provenance} userName={userName} highlightedNode={highlightedNode} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {tab === 'activity' && (
          <ActivityTab
            messages={messages}
            loading={loading}
            input={input}
            setInput={setInput}
            send={send}
            scrollRef={scrollRef}
            userName={userName}
            stalledOrder={stalledOrder}
            grantAsMike={grantAsMike}
          />
        )}
        {tab === 'engineering' && (
          <EngineeringPanel
            actChain={latestChain?.actChain ?? []}
            t3Header={latestChain?.t3Header}
            t3Payload={latestChain?.t3Payload}
            t3TokenPreview={latestChain?.t3TokenPreview}
            t3Audience={latestChain?.t3Audience}
            hasChain={!!latestChain?.success}
            events={govEvents}
            onEventClick={onEventClick}
          />
        )}
      </div>
    </div>
  )
}

function ActivityTab({
  messages,
  loading,
  input,
  setInput,
  send,
  scrollRef,
  userName,
  stalledOrder,
  grantAsMike,
}: {
  messages: Message[]
  loading: boolean
  input: string
  setInput: (v: string) => void
  send: (s: string) => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  userName: string
  stalledOrder: PendingApproval | null
  grantAsMike: (o: PendingApproval) => void
}) {
  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-8 text-center fade-up">
            <div className="inline-flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 rounded-full bg-[var(--brand)] opacity-20 blur-2xl" />
              <BotAvatar size="lg" glow />
            </div>
            <h3 className="text-[16px] font-bold tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Hey {userName.split(' ')[0]}, ready when you are.
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mb-1 max-w-[280px] mx-auto leading-relaxed">
              Ask me about orders, inventory, or pricing.
            </p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.14em] font-medium">
              Every action stays attributable to you.
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
              {m.role !== 'user' && <BotAvatar size="md" />}
              {m.role === 'user' && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-white/10 shadow-md">
                  <User className="h-3.5 w-3.5 text-[#3a1f12]" />
                </div>
              )}
              <div className={`max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
                {m.role === 'assistant' && m.agentUsed && (
                  <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--brand-light)] font-semibold mb-1 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
                    via {m.agentUsed} agent
                  </div>
                )}
                <div className={`relative rounded-[var(--radius)] px-4 py-3 text-[13px] leading-relaxed inline-block text-left whitespace-pre-wrap shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white shadow-[0_4px_16px_rgba(255,107,53,0.3)]'
                    : m.role === 'system'
                      ? 'bg-[var(--danger-bg)] border border-[var(--danger)]/30 text-[var(--danger)]'
                      : 'bg-[var(--bg-elevated)] border border-[var(--border)]'
                }`}>
                  {m.text}
                </div>
                {m.role === 'assistant' && m.pendingApproval && (
                  <ApprovalBanner approval={m.pendingApproval} onGrantAsMike={grantAsMike} />
                )}
                {m.role === 'assistant' && m.chainSuccess && !m.pendingApproval && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-[var(--okta-light)] uppercase tracking-[0.1em] font-semibold">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {userName.split(' ')[0]} on every step · chain preserved
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && <BouncingLoader />}

        {stalledOrder && !loading && <StallStatus order={stalledOrder} />}
      </div>

      {messages.length === 0 && (
        <div className="px-5 pb-3 flex flex-col gap-2 shrink-0">
          <div className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-semibold mb-0.5 px-1">
            Quick Actions
          </div>
          {QUICK_ACTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q.text)}
              className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)]/40 text-[12px] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/[0.06] hover:text-[var(--text)] transition text-left"
            >
              <span className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[14px] group-hover:scale-110 transition">
                {q.icon}
              </span>
              <span className="flex-1">{q.text}</span>
              <svg className="h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--brand)] group-hover:translate-x-0.5 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-[var(--border)] shrink-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-elevated)]/40 to-[var(--bg-card)]">
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
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[13px] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 transition disabled:opacity-50 bg-[var(--bg-input)] text-[var(--text)]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white hover:shadow-[0_8px_24px_rgba(255,107,53,0.4)] hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </>
  )
}

function BouncingLoader() {
  return (
    <div className="flex items-start gap-2.5 fade-up">
      <BotAvatar size="md" />
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)] bounce-ball" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 rounded-full bg-[var(--brand-light)] bounce-ball" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-full bg-[var(--court-orange)] bounce-ball" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-[0.12em] font-medium">Agents working</span>
        </div>
      </div>
    </div>
  )
}

function ApprovalBanner({
  approval,
  onGrantAsMike,
}: {
  approval: PendingApproval
  onGrantAsMike: (o: PendingApproval) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="mt-2 rounded-[var(--radius-sm)] border border-[var(--warning)]/40 bg-gradient-to-r from-[var(--warning)]/[0.12] to-[var(--warning)]/[0.04] px-3 py-2.5 flex items-start gap-2"
    >
      <div className="h-7 w-7 rounded-full bg-[var(--warning)]/20 border border-[var(--warning)]/40 flex items-center justify-center shrink-0">
        <ShieldAlert className="h-3.5 w-3.5 text-[var(--warning)]" />
      </div>
      <div className="text-[11px] leading-relaxed flex-1 min-w-0">
        <div className="font-semibold text-[var(--warning)] mb-0.5">Manager approval needed</div>
        <div className="text-[var(--text-secondary)]">
          Order <span className="font-mono text-[var(--text)]">{approval.orderId.slice(-6)}</span> ({approval.quantity} × {approval.product}) routed to{' '}
          <span className="font-mono text-[var(--text)]">{approval.approver}</span>.
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <a
            href="/approver/mike"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10 transition"
          >
            Open Mike&apos;s view
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <button
            onClick={() => onGrantAsMike(approval)}
            className="text-[10px] px-2 py-1 rounded bg-[var(--warning)] text-[#1a1209] font-semibold hover:bg-[var(--warning)]/90 hover:shadow-md transition"
          >
            Approve as Mike (demo)
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function StallStatus({ order }: { order: PendingApproval }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2 text-[11px] text-[var(--warning)] px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--warning)]/[0.06] border border-[var(--warning)]/20 w-fit"
    >
      <Clock className="h-3 w-3" />
      <motion.span
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="uppercase tracking-[0.1em] font-medium"
      >
        Awaiting {order.approver.split('@')[0]}&apos;s approval
      </motion.span>
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
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] relative transition ${
        active
          ? 'text-[var(--brand)] bg-[var(--brand)]/[0.06]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/40'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={`text-[8px] px-1.5 py-px rounded-full font-mono font-bold ${
            active ? 'bg-[var(--brand)] text-white shadow-[0_2px_6px_rgba(255,107,53,0.5)]' : 'bg-[var(--text-muted)]/30 text-[var(--text-secondary)]'
          }`}
        >
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent shadow-[0_0_8px_rgba(255,107,53,0.6)]" />
      )}
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
