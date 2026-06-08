import { auth, signIn, signOut } from '@/lib/okta/auth'
import { IdentityRibbon } from '@/components/v2/IdentityRibbon'
import { Stage } from '@/components/v2/Stage'

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
    <main className="min-h-screen relative">
      <RibbonBridge
        signedIn={signedIn}
        user={signedIn ? { name: session?.user?.name, email: session?.user?.email } : undefined}
      />
      <Stage signedIn={signedIn} userEmail={session?.user?.email ?? undefined} />
      <Foot />
    </main>
  )
}

/**
 * Bridges the server-side session into the client-side IdentityRibbon while keeping
 * sign-in/sign-out as server actions (NextAuth v5 idiomatic).
 */
function RibbonBridge({
  signedIn,
  user,
}: {
  signedIn: boolean
  user?: { name?: string | null; email?: string | null }
}) {
  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-[var(--bg-base)]/80">
      <header className="border-b hairline relative">
        <div className="max-w-[1280px] mx-auto px-8 py-4 flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[22px] tracking-tight text-[var(--ink)] leading-none">
              ProGear
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-quiet)] leading-none hidden sm:inline">
              Sales operations · powered by Okta
            </span>
          </div>
          <div className="flex items-center gap-4">
            {signedIn && user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-[11px] tracking-wide">
                  <svg className="h-3.5 w-3.5 text-[var(--trust)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="text-[var(--ink-muted)]">Verified · Sales rep</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center text-[10px] font-semibold text-[#3a1f12]">
                    {(user.name || user.email || 'S').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <div className="text-[13px] text-[var(--ink)]">{user.name ?? user.email}</div>
                    <div className="text-[10px] text-[var(--ink-quiet)]">{user.email}</div>
                  </div>
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="text-[11px] tracking-wide text-[var(--ink-quiet)] hover:text-[var(--ink)] transition border border-transparent hover:border-[var(--line)] rounded-[var(--radius-sharp)] px-2.5 py-1.5"
                  >
                    sign out
                  </button>
                </form>
              </>
            ) : (
              <form action={signInAction}>
                <button
                  type="submit"
                  className="px-4 py-2 text-[13px] font-medium rounded-[var(--radius-sharp)] bg-[var(--accent)] text-[#0a1228] hover:brightness-110 transition"
                >
                  Sign in as Sarah
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent" />
      </header>
    </div>
  )
}

function Foot() {
  return (
    <footer className="border-t hairline mt-24">
      <div className="max-w-[1280px] mx-auto px-8 py-8 flex items-center justify-between text-[11px] text-[var(--ink-quiet)] tracking-wide">
        <span>
          Live demo · <span className="font-mono">bala-secures-ai.oktapreview.com</span>
        </span>
        <a href="/engineer" className="hover:text-[var(--ink)] transition">
          engineer view →
        </a>
      </div>
    </footer>
  )
}
