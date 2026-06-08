'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

export interface Activity {
  id: string
  text: string
  status: 'running' | 'done'
  detail?: string
}

interface Props {
  items: Activity[]
}

export function ActivityTimeline({ items }: Props) {
  if (items.length === 0) return null
  return (
    <div className="max-w-[760px] mx-auto mt-8">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-quiet)] mb-3">
        live activity
      </div>
      <ul className="space-y-1.5 border-l hairline pl-5 relative">
        <AnimatePresence>
          {items.map((it) => (
            <motion.li
              key={it.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative flex items-baseline gap-3 text-[13px]"
            >
              <span
                className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full flex items-center justify-center"
                style={{
                  background: it.status === 'done' ? 'var(--success)' : 'var(--accent)',
                  boxShadow:
                    it.status === 'running' ? '0 0 0 4px var(--accent-glow)' : 'none',
                }}
              >
                {it.status === 'done' ? (
                  <Check className="h-1.5 w-1.5 text-[#0a1228]" strokeWidth={4} />
                ) : (
                  <Loader2 className="h-2 w-2 text-[#0a1228] animate-spin" />
                )}
              </span>
              <span className="text-[var(--ink-muted)]">{it.text}</span>
              {it.detail && (
                <span className="text-[var(--ink-quiet)] text-[11px] italic">
                  {it.detail}
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
