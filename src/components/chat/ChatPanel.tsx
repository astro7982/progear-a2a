'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, Loader2 } from 'lucide-react'
import type { AgentMessage, OriginIdentity } from '../DemoStage'

interface Props {
  userEmail?: string
  origin: OriginIdentity | null
  messages: AgentMessage[]
  running: boolean
  signedIn: boolean
}

const AGENT_AVATARS: Record<string, { color: string; bg: string }> = {
  'Sales Agent': { color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/30' },
  'Inventory Agent': { color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Pricing Agent': { color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30' },
  'Customer Agent': { color: 'text-violet-300', bg: 'bg-violet-500/10 border-violet-500/30' },
}

export function ChatPanel({ userEmail, origin, messages, running, signedIn }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-4 h-full flex flex-col">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Sarah's Conversation
      </h2>

      {/* User identity card */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold">
            SS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Sarah Sales</div>
            <div className="text-xs text-slate-400 truncate">
              {userEmail || (signedIn ? 'sarah.sales@progear.demo' : 'Not signed in')}
            </div>
          </div>
          {origin && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              MFA verified
            </span>
          )}
        </div>
        {origin && (
          <div className="mt-2 text-xs text-slate-500 font-mono break-all">
            sub: {origin.sub} · sub_profile: {origin.subProfile}
          </div>
        )}
      </div>

      {/* Sarah's prompt */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 mb-2">
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-pink-300 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Sarah</div>
            <div className="text-sm text-slate-200">
              Do we have 200 TR-9 Trail Packs in stock?
            </div>
          </div>
        </div>
      </div>

      {/* Agent reply stream */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        <AnimatePresence>
          {messages.map((m, i) => {
            const palette = AGENT_AVATARS[m.agent] ?? {
              color: 'text-slate-300',
              bg: 'bg-slate-700/30 border-slate-600/50',
            }
            return (
              <motion.div
                key={`${m.ts}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`rounded-lg border p-3 ${palette.bg}`}
              >
                <div className="flex items-start gap-2">
                  <Bot className={`h-4 w-4 mt-0.5 shrink-0 ${palette.color}`} />
                  <div className="flex-1">
                    <div
                      className={`text-[10px] uppercase tracking-wider ${palette.color} mb-1`}
                    >
                      {m.agent}
                    </div>
                    <div className="text-sm text-slate-200">{m.text}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {running && (
          <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Agents working...</span>
          </div>
        )}

        {!signedIn && (
          <div className="text-xs text-slate-500 italic px-3 py-2">
            Sign in as Sarah to start the demo.
          </div>
        )}
      </div>
    </div>
  )
}
