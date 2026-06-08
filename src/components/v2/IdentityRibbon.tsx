'use client'

import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

interface Props {
  user?: { name?: string | null; email?: string | null }
  signedIn: boolean
  onSignIn: () => void
  onSignOut: () => void
}

export function IdentityRibbon({ user, signedIn, onSignIn, onSignOut }: Props) {
  return (
    <header className="border-b hairline relative">
      <div className="max-w-[1280px] mx-auto px-8 py-4 flex items-center justify-between gap-6">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[22px] tracking-tight text-[var(--ink)] leading-none">
            ProGear
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-quiet)] leading-none">
            Sales operations · powered by Okta
          </span>
        </div>

        <div className="flex items-center gap-4">
          {signedIn && user ? (
            <>
              <motion.div
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="hidden sm:flex items-center gap-2 text-[11px] tracking-wide">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--trust)]" />
                  <span className="text-[var(--ink-muted)]">
                    Verified · Sales rep
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center text-[10px] font-semibold text-[#3a1f12]">
                    {(user.name || user.email || 'S').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <div className="text-[13px] text-[var(--ink)]">
                      {user.name ?? user.email}
                    </div>
                    <div className="text-[10px] text-[var(--ink-quiet)]">
                      {user.email}
                    </div>
                  </div>
                </div>
              </motion.div>
              <button
                onClick={onSignOut}
                className="text-[11px] tracking-wide text-[var(--ink-quiet)] hover:text-[var(--ink)] transition border border-transparent hover:border-[var(--line)] rounded-[var(--radius-sharp)] px-2.5 py-1.5"
              >
                sign out
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="px-4 py-2 text-[13px] font-medium rounded-[var(--radius-sharp)] bg-[var(--accent)] text-[#0a1228] hover:brightness-110 transition"
            >
              Sign in as Sarah
            </button>
          )}
        </div>
      </div>
      {/* hairline accent under the ribbon, faintly amber */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent" />
    </header>
  )
}
