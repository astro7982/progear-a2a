import { auth, signIn, signOut } from '@/lib/okta/auth'
import { AppShell } from '@/components/app/AppShell'

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

  if (!signedIn) {
    return <LoginPage signInAction={signInAction} />
  }

  return (
    <AppShell
      user={{ name: session.user?.name ?? 'Sarah Sales', email: session.user?.email ?? '' }}
      signOutAction={signOutAction}
    />
  )
}

function LoginPage({ signInAction }: { signInAction: () => Promise<void> }) {
  return (
    <div className="h-full flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] bg-[var(--sidebar)] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 30 L30 55 L5 30Z' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }} />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-[var(--brand)] flex items-center justify-center">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12 a4 4 0 0 1 8 0" />
                <line x1="12" y1="8" x2="12" y2="4" />
              </svg>
            </div>
            <span className="text-white text-xl font-[var(--font-display)] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              ProGear
            </span>
          </div>
          <p className="text-[var(--sidebar-text)] text-sm mt-1">
            Sporting Goods · Operations Console
          </p>
        </div>
        <div>
          <p className="text-white/80 text-[28px] leading-[1.3] font-[var(--font-display)] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            AI-powered sales operations.<br />
            <span className="text-[var(--brand-light)]">Every action accountable.</span>
          </p>
          <p className="text-[var(--sidebar-text)] text-sm mt-4 max-w-[340px] leading-relaxed">
            Agents collaborate on your behalf. Okta for AI Agents ensures every action is
            traceable back to you — even across multiple agent hops.
          </p>
        </div>
        <div className="text-[var(--sidebar-text)] text-[11px]">
          Secured by Okta for AI Agents · bala-secures-ai.oktapreview.com
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-lg bg-[var(--brand)] flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12 a4 4 0 0 1 8 0" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>ProGear</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome back
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-8">
            Sign in to access the ProGear sales console.
          </p>
          <form action={signInAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-[var(--radius)] bg-[var(--sidebar)] text-white font-medium text-[14px] hover:bg-[#252545] transition shadow-md"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              Sign in with Okta (as Sarah Sales)
            </button>
          </form>
          <p className="text-[var(--text-muted)] text-[11px] mt-4 text-center">
            Demo credentials: sarah.sales@progear.demo
          </p>
        </div>
      </div>
    </div>
  )
}
