'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'

export interface Turn {
  id: string
  role: 'user' | 'assistant' | 'agent'
  agent?: string
  text: string
  ts: number
  outcome?: { kind: 'stock' | 'quote' | 'reorder'; label: string; value: string }
}

const SUGGESTIONS = [
  {
    id: 'quick-check',
    title: 'Do we have 200 TR-9 Trail Packs in stock?',
    sub: 'A simple stock check. Two agents, one human at the root.',
  },
  {
    id: 'build-deal',
    title: 'Build me a deal: 200 TR-9 at 15% off, net-60.',
    sub: 'Triggers a finance approval gate. Coming in Phase 2.',
    locked: true,
  },
  {
    id: 'reorder',
    title: 'Run the scheduled 2am reorder.',
    sub: 'No human. Same audit trail. Coming in Phase 3.',
    locked: true,
  },
]

interface Props {
  signedIn: boolean
  turns: Turn[]
  running: boolean
  onAsk: (sceneId: 1 | 2 | 3, prompt: string) => void
}

export function ConversationPanel({ signedIn, turns, running, onAsk }: Props) {
  const empty = turns.length === 0

  return (
    <section className="relative">
      {empty && signedIn && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="font-display text-[42px] sm:text-[52px] leading-[1.05] tracking-tight text-[var(--ink)] max-w-[18ch] mx-auto">
            What can the team look up <em className="italic text-[var(--trust)]">for you</em>?
          </p>
          <p className="text-[14px] text-[var(--ink-muted)] mt-4">
            Pick a question. Watch the work get done. See exactly who acted on your behalf.
          </p>
        </motion.div>
      )}

      {empty && signedIn && (
        <div className="grid gap-3 max-w-[700px] mx-auto">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              disabled={s.locked || running}
              onClick={() => {
                const map = { 'quick-check': 1, 'build-deal': 2, reorder: 3 } as const
                onAsk(map[s.id as keyof typeof map] as 1 | 2 | 3, s.title)
              }}
              className={`group relative text-left rounded-[var(--radius-soft)] border hairline px-5 py-4 transition-all ${
                s.locked
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:border-[var(--accent)]/50 hover:bg-[var(--bg-surface)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 h-7 w-7 rounded-full bg-[var(--bg-surface)] border hairline flex items-center justify-center group-hover:border-[var(--accent)]/50 transition">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-[var(--ink)] leading-snug">{s.title}</div>
                  <div className="text-[12px] text-[var(--ink-quiet)] mt-1">{s.sub}</div>
                </div>
                {!s.locked && (
                  <ArrowRight className="h-4 w-4 text-[var(--ink-quiet)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition mt-1" />
                )}
                {s.locked && (
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-quiet)] mt-1">
                    soon
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {empty && !signedIn && (
        <div className="text-center py-16">
          <p className="font-display text-[32px] text-[var(--ink-muted)]">
            Sign in to begin.
          </p>
        </div>
      )}

      {/* Conversation */}
      {!empty && (
        <div className="space-y-6 max-w-[760px] mx-auto">
          <AnimatePresence>
            {turns.map((t) => (
              <Bubble key={t.id} turn={t} />
            ))}
          </AnimatePresence>
          {running && (
            <div className="flex items-center gap-3 text-[var(--ink-quiet)] text-[13px] pl-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>The team is on it…</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Bubble({ turn }: { turn: Turn }) {
  if (turn.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-[var(--radius-soft)] bg-[var(--bg-elevated)] border hairline px-5 py-3.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-quiet)] mb-1.5">
            Sarah
          </div>
          <div className="text-[15px] text-[var(--ink)] leading-relaxed">{turn.text}</div>
        </div>
      </motion.div>
    )
  }

  if (turn.role === 'agent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-quiet)] mb-1.5">
          {turn.agent}
        </div>
        <div className="text-[14px] text-[var(--ink-muted)] leading-relaxed pl-0.5 italic font-display">
          {turn.text}
        </div>
      </motion.div>
    )
  }

  // assistant — final answer, hero treatment
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-quiet)] mb-2">
        ProGear AI
      </div>
      <div className="font-display text-[26px] sm:text-[30px] leading-[1.2] text-[var(--ink)] tracking-tight">
        {turn.text}
      </div>
      {turn.outcome && (
        <div className="mt-4 inline-flex items-baseline gap-3 rounded-[var(--radius-pill)] bg-[var(--bg-surface)] border hairline px-4 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-quiet)]">
            {turn.outcome.label}
          </span>
          <span className="text-[14px] text-[var(--ink)] tabular font-medium">
            {turn.outcome.value}
          </span>
        </div>
      )}
    </motion.div>
  )
}
