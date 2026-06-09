'use client'

import Link from 'next/link'
import { ArrowLeft, X } from 'lucide-react'
import { AIChatPanel } from '@/components/app/AIChatPanel'

interface Props {
  userName: string
}

export function StandaloneChat({ userName }: Props) {
  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.close()
    }
  }

  return (
    <main className="h-full flex flex-col bg-gradient-to-b from-[var(--bg-card)] via-[#171732] to-[var(--bg-card)] relative overflow-hidden">
      <div className="absolute inset-0 sports-texture opacity-30 pointer-events-none" />

      {/* Window chrome bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-card)]/70 backdrop-blur shrink-0">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--brand-light)] transition"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
          Back to console
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)] font-semibold">
            Pop-out window
          </span>
          <button
            onClick={handleClose}
            title="Close window and dock back"
            className="group h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center border border-transparent text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]/40 hover:bg-[var(--danger)]/[0.08] transition"
          >
            <X className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Full-height chat */}
      <div className="relative z-10 flex-1 min-h-0">
        <AIChatPanel userName={userName} />
      </div>
    </main>
  )
}
