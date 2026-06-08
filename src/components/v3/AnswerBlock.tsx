'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  text: string
  visible: boolean
}

export function AnswerBlock({ text, visible }: Props) {
  if (!visible) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-[640px] mt-10"
    >
      <div className="flex items-start gap-4 rounded-[var(--radius)] bg-[var(--success-bg)] border border-[var(--success)]/20 px-6 py-5">
        <CheckCircle2 className="h-6 w-6 text-[var(--success)] shrink-0 mt-0.5" />
        <div>
          <div className="text-[18px] font-semibold text-[var(--text-primary)] leading-snug">
            {text}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
