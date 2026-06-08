'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, ChevronUp, ShieldCheck, ArrowDown, FileSearch } from 'lucide-react'
import type { ActLayer } from '@/lib/tokens/decode'

export interface ChainStep {
  num: number
  label: string
  status: 'idle' | 'running' | 'success' | 'error'
  rawToken?: string
  actChain?: ActLayer[]
  audience?: string
}

interface Props {
  origin?: { sub: string; subProfile: 'user' | 'service' } | null
  steps: ChainStep[]
  visible: boolean
}

interface PrincipalRow {
  name: string
  detail: string
  kind: 'user' | 'agent' | 'service' | 'app'
}

const AGENT_NAMES: Record<string, string> = {
  wlpzamsn8ruzX9RiH1d7: 'Sales Agent',
  wlpzantdeiOQGRrpF1d7: 'Inventory Agent',
  '0oazns4s2moIlRzoG1d7': 'ProGear Web App',
  '0oazakcme19yZ44th1d7': 'Scheduled Reorder Flow',
}

function principalFromLayer(layer: ActLayer): PrincipalRow {
  const sub = String(layer.sub)
  const profile = layer.sub_profile
  if (profile === 'user') {
    return { name: sub, detail: 'Authenticated person', kind: 'user' }
  }
  if (profile === 'ai_agent') {
    return {
      name: AGENT_NAMES[sub] ?? 'AI Agent',
      detail: 'Acted with delegated authority',
      kind: 'agent',
    }
  }
  if (profile === 'web_app') {
    return {
      name: AGENT_NAMES[sub] ?? 'Application',
      detail: 'Sarah signed in here',
      kind: 'app',
    }
  }
  if (profile === 'service') {
    return {
      name: AGENT_NAMES[sub] ?? 'Background flow',
      detail: 'No human at origin',
      kind: 'service',
    }
  }
  return { name: sub, detail: profile ?? '?', kind: 'agent' }
}

export function TrustReceipt({ origin, steps, visible }: Props) {
  const [open, setOpen] = useState(true)
  const [showRaw, setShowRaw] = useState(false)

  // Build the principal chain bottom-up: take the deepest act chain we have.
  const last = [...steps].reverse().find((s) => s.actChain && s.actChain.length > 0)
  const layers = last?.actChain ?? []
  // Reverse so the originator is on top.
  const principals = [...layers].reverse().map(principalFromLayer)

  if (!visible || principals.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2 }}
      className="max-w-[760px] mx-auto mt-12 mb-6"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-[var(--radius-soft)] border hairline bg-[var(--bg-surface)]/50 px-5 py-4 hover:border-[var(--trust)]/40 transition group"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-[var(--trust)]" />
          <span className="text-[13px] text-[var(--ink)]">
            See how this was secured
          </span>
          <span className="text-[11px] text-[var(--ink-quiet)] tracking-wide">
            · Sarah is on every step
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--ink-quiet)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--ink-quiet)]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="rounded-[var(--radius-soft)] border hairline border-t-0 px-7 py-7">
              <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed mb-7 max-w-[58ch]">
                Okta recorded who acted on{' '}
                {origin?.subProfile === 'service' ? 'the flow' : 'Sarah'}&apos;s behalf for this
                request. The chain is preserved end-to-end. Anything the agents did is
                attributable to {origin?.subProfile === 'service' ? 'the flow' : 'Sarah'}, even
                after they leave the company.
              </p>

              <ol className="space-y-3">
                {principals.map((p, i) => (
                  <li key={i} className="relative">
                    <PrincipalCard p={p} index={i} />
                    {i < principals.length - 1 && (
                      <div className="flex items-center gap-2 pl-7 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--ink-quiet)]">
                        <ArrowDown className="h-3 w-3" />
                        <span>acted on behalf of</span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>

              <div className="mt-7 pt-5 border-t hairline flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  onClick={() => setShowRaw((s) => !s)}
                  className="text-[11px] tracking-wide text-[var(--ink-muted)] hover:text-[var(--ink)] transition flex items-center gap-1.5"
                >
                  <FileSearch className="h-3 w-3" />
                  {showRaw ? 'Hide' : 'Show'} the technical proof
                </button>
                <a
                  href="/engineer"
                  className="text-[11px] tracking-wide text-[var(--ink-muted)] hover:text-[var(--ink)] transition"
                >
                  Open engineer view →
                </a>
              </div>

              <AnimatePresence>
                {showRaw && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-5"
                  >
                    <div className="grid gap-2.5">
                      {steps
                        .filter((s) => s.status === 'success' && s.rawToken)
                        .map((s) => (
                          <details
                            key={s.num}
                            className="group rounded-[var(--radius-sharp)] border hairline bg-[var(--bg-deep)] px-4 py-3"
                          >
                            <summary className="cursor-pointer text-[11px] tracking-wide text-[var(--ink-muted)] flex items-center justify-between">
                              <span>
                                Hop {s.num} · {s.label}
                              </span>
                              <span className="text-[10px] text-[var(--ink-quiet)] group-open:hidden">
                                expand
                              </span>
                            </summary>
                            <div className="mt-3 text-[10px] font-mono text-[var(--ink-muted)] break-all leading-relaxed">
                              {s.rawToken?.slice(0, 220)}…
                            </div>
                            {s.audience && (
                              <div className="mt-2 text-[10px] text-[var(--ink-quiet)]">
                                audience: <span className="font-mono">{s.audience}</span>
                              </div>
                            )}
                          </details>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PrincipalCard({ p, index }: { p: PrincipalRow; index: number }) {
  const isUser = p.kind === 'user'
  const isService = p.kind === 'service'
  return (
    <div
      className={`flex items-start gap-4 rounded-[var(--radius-sharp)] px-4 py-3 ${
        index === 0 ? 'border hairline border-[var(--trust)]/30 bg-[var(--bg-elevated)]' : ''
      }`}
    >
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] text-[#3a1f12]'
            : isService
              ? 'bg-[var(--bg-elevated)] border hairline text-[var(--trust)]'
              : 'bg-[var(--accent)]/20 border hairline border-[var(--accent)]/40 text-[var(--accent)]'
        } text-[11px] font-semibold`}
      >
        {p.kind === 'user' ? 'SS' : p.kind === 'service' ? 'F' : '◇'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] text-[var(--ink)]">{p.name}</div>
        <div className="text-[11px] text-[var(--ink-quiet)] mt-0.5">{p.detail}</div>
      </div>
      {index === 0 && (
        <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--trust)] mt-1.5">
          originator
        </span>
      )}
    </div>
  )
}
