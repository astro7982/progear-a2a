'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ChevronRight, User, Bot, Database } from 'lucide-react'

interface Props {
  visible: boolean
  humanName: string
  agents: { name: string; action: string }[]
}

export function GovernanceSnapshot({ visible, humanName, agents }: Props) {
  const [expanded, setExpanded] = useState(false)
  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      className="mx-auto max-w-[640px] mt-8"
    >
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white shadow-sm px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-5 w-5 text-[var(--okta)]" />
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">
            Who was involved in answering this?
          </span>
        </div>

        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--human-bg)] flex items-center justify-center">
              <User className="h-4 w-4 text-[var(--human)]" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">{humanName}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Initiated the request, authenticated with MFA
              </div>
            </div>
          </li>
          {agents.map((a, i) => (
            <li key={i} className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: i === 0 ? 'var(--agent-blue-bg)' : 'var(--agent-green-bg)',
                }}
              >
                <Bot
                  className="h-4 w-4"
                  style={{ color: i === 0 ? 'var(--agent-blue)' : 'var(--agent-green)' }}
                />
              </div>
              <div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">{a.name}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{a.action}</div>
              </div>
            </li>
          ))}
          <li className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--db-gray-bg)] flex items-center justify-center">
              <Database className="h-4 w-4 text-[var(--db-gray)]" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">Inventory Database</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Returned the stock data</div>
            </div>
          </li>
        </ul>

        <div className="mt-5 pt-4 border-t border-[var(--border-light)] flex items-center justify-between">
          <div className="text-[12px] text-[var(--text-secondary)]">
            Every action above is recorded in Okta&apos;s audit log and traceable to {humanName}.
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[12px] font-medium text-[var(--okta)] hover:underline flex items-center gap-1"
          >
            {expanded ? 'Hide proof' : 'Show me the proof'}
            <ChevronRight className={`h-3 w-3 transition ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2">
                <div className="text-[11px] text-[var(--text-secondary)] tracking-wide uppercase mb-2">
                  Okta System Log events for this request
                </div>
                <div className="rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-4 py-3 text-[12px] text-[var(--text-secondary)] space-y-1.5">
                  <div>Identity assertion issued for Sales Agent on behalf of {humanName}</div>
                  <div>Access token issued for Inventory Agent, scoped to agent.invoke</div>
                  <div>Full delegation chain preserved: {humanName} → Sales → Inventory</div>
                </div>
                <a
                  href="/engineer"
                  className="inline-block mt-2 text-[11px] text-[var(--okta)] hover:underline"
                >
                  Open full engineer view with JWT details →
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
