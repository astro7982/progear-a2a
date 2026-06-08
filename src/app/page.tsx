import Link from 'next/link'
import { auth, signIn, signOut } from '@/lib/okta/auth'
import { DemoStageV3 } from '@/components/v3/DemoStage'

async function signInAction() {
  'use server'
  await signIn('okta', { redirectTo: '/' })
}

async function signOutAction() {
  'use server'
  await signOut({ redirectTo: '/' })
}

export default async function Home() {
  const session = await auth()
  const signedIn = !!session?.user

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[18px] font-bold text-[var(--text-primary)] tracking-tight">
              ProGear
            </span>
            <span className="text-[11px] text-[var(--text-muted)] tracking-wide uppercase hidden sm:inline">
              Agent-to-Agent Demo
            </span>
          </div>
          <div className="flex items-center gap-4">
            {signedIn ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[var(--human-bg)] flex items-center justify-center text-[10px] font-bold text-[var(--human)]">
                    SS
                  </div>
                  <span className="text-[13px] text-[var(--text-primary)] font-medium hidden sm:inline">
                    {session.user?.name ?? session.user?.email}
                  </span>
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <form action={signInAction}>
                <button
                  type="submit"
                  className="px-4 py-2 text-[13px] font-semibold rounded-full bg-[var(--okta)] text-white hover:brightness-110 transition"
                >
                  Sign in as Sarah
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      {/* Demo */}
      <DemoStageV3 signedIn={signedIn} userName={session?.user?.name ?? 'Sarah Sales'} />

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-16">
        <div className="max-w-[1100px] mx-auto px-6 py-6 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>
            Powered by <span className="font-semibold text-[var(--okta)]">Okta for AI Agents</span> · live on bala-secures-ai.oktapreview.com
          </span>
          <Link href="/engineer" className="hover:text-[var(--text-primary)] transition">
            Engineer view →
          </Link>
        </div>
      </footer>
    </main>
  )
}
