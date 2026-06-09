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

function ProGearLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const inner = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <div className={`relative ${dim}`}>
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--brand)] via-[var(--brand-dark)] to-[#a83a05] shadow-[0_8px_24px_rgba(255,107,53,0.4)]`} />
      <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-[var(--brand-light)]/30 to-transparent" />
      <div className="relative h-full w-full flex items-center justify-center">
        <svg className={`${inner} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Stylized 'P' / arrow / target — equipment-agnostic */}
          <path d="M5 21V3h7a5 5 0 0 1 0 10H5" />
          <circle cx="17" cy="17" r="3" fill="currentColor" stroke="none" opacity="0.9" />
        </svg>
      </div>
    </div>
  )
}

function LoginPage({ signInAction }: { signInAction: () => Promise<void> }) {
  return (
    <div className="h-full flex bg-[var(--bg-deep)]">
      {/* Left panel — full-bleed brand */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-14">
        {/* Layered atmospheric backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c1c] via-[#1a1a35] to-[#2a1505]" />

        {/* Court/field line pattern */}
        <div className="absolute inset-0 sports-texture opacity-60" />

        {/* Diagonal field stripes */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 60px, rgba(255,255,255,0.5) 60px 61px)',
        }} />

        {/* Glowing orb top-right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[var(--brand)] opacity-[0.18] blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-[#0ea5e9] opacity-[0.12] blur-[100px]" />

        {/* Floating equipment icons */}
        <div className="absolute top-[18%] right-[14%] float-slow opacity-20">
          <svg className="h-16 w-16 text-[var(--brand-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3v18M5.5 5.5l13 13M18.5 5.5l-13 13" />
          </svg>
        </div>
        <div className="absolute bottom-[28%] right-[24%] float-slow opacity-15" style={{ animationDelay: '1.5s' }}>
          <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Trophy */}
            <path d="M8 3h8v3a4 4 0 0 1-8 0V3zM5 5h3M16 5h3M10 12v4h4v-4M9 16h6l1 4H8l1-4z" />
          </svg>
        </div>
        <div className="absolute top-[55%] left-[18%] float-slow opacity-10" style={{ animationDelay: '0.7s' }}>
          <svg className="h-20 w-20 text-[var(--brand)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            {/* Tennis racket */}
            <ellipse cx="9" cy="9" rx="6" ry="7" />
            <line x1="13" y1="13" x2="20" y2="20" />
            <path d="M5 6h8M3 9h12M5 12h8" />
          </svg>
        </div>

        {/* Brand header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-3">
            <ProGearLogo size="lg" />
            <div>
              <div className="text-white text-[28px] font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                ProGear
              </div>
              <div className="text-[var(--brand-light)] text-[11px] uppercase tracking-[0.22em] font-semibold mt-1">
                Sporting Goods
              </div>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-[13px] mt-3 max-w-[380px]">
            Operations Console · Equipping Champions Since 2015
          </p>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-[480px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/30 text-[var(--brand-light)] text-[10px] font-semibold uppercase tracking-[0.18em] mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-light)] glow-pulse" />
            Powered by Okta for AI Agents
          </div>
          <h2 className="text-white text-[40px] leading-[1.05] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            AI-powered<br/>
            sales operations.
          </h2>
          <p className="text-[28px] leading-[1.15] font-semibold tracking-tight mt-2 bg-gradient-to-r from-[var(--brand-light)] via-[var(--brand)] to-[#fbbf24] bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-display)' }}>
            Every action accountable.
          </p>
          <p className="text-[var(--text-secondary)] text-[14px] mt-6 leading-relaxed max-w-[440px]">
            Agents collaborate on your behalf across orders, inventory, and pricing. Okta for AI Agents
            ensures every action is traceable back to you, even across multiple agent hops.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-7">
            {['Identity-bound agents', 'Token chain provenance', 'Manager approvals'].map(p => (
              <span key={p} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[var(--text-secondary)] text-[11px] backdrop-blur-sm">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Footer mark */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-[0.18em]">
          <span>Internal Console · v2.4</span>
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-[var(--success)]" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex-1 flex items-center justify-center p-8 relative bg-gradient-to-br from-[var(--bg-deep)] via-[var(--bg)] to-[var(--bg-card)]">
        {/* Subtle grid */}
        <div className="absolute inset-0 sports-texture-fine opacity-50" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--brand)] opacity-[0.06] blur-[100px]" />

        <div className="relative w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <ProGearLogo />
            <span className="text-[20px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>ProGear</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand)]/[0.08] border border-[var(--brand)]/20 text-[var(--brand-light)] text-[10px] font-semibold uppercase tracking-[0.18em] mb-5">
              Sales Console Access
            </div>
            <h1 className="text-[32px] font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Welcome back.
            </h1>
            <p className="text-[var(--text-secondary)] text-[14px] mt-2">
              Sign in to access ProGear&apos;s AI-powered sales operations.
            </p>
          </div>

          <form action={signInAction}>
            <button
              type="submit"
              className="group w-full relative overflow-hidden flex items-center justify-center gap-3 px-5 py-4 rounded-[var(--radius)] bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white font-semibold text-[14px] shadow-[0_10px_30px_rgba(255,107,53,0.35)] hover:shadow-[0_16px_40px_rgba(255,107,53,0.5)] hover:-translate-y-0.5 transition-all"
            >
              {/* Shimmer overlay on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <svg className="h-5 w-5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              <span className="relative z-10">Sign in with Okta</span>
              <svg className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          {/* Sub helper */}
          <div className="mt-6 p-3.5 rounded-[var(--radius)] bg-[var(--bg-card)]/60 border border-[var(--border)] backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[11px]">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center text-[9px] font-bold text-[#3a1f12] shrink-0">
                SS
              </div>
              <div>
                <div className="text-[var(--text)] font-medium">Demo: Sarah Sales</div>
                <div className="text-[var(--text-muted)] text-[10px]">sarah.sales@progear.demo</div>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-[var(--text-muted)] mt-8 uppercase tracking-[0.16em]">
            Secured by Okta · bala-secures-ai.oktapreview.com
          </p>
        </div>
      </div>
    </div>
  )
}
