import Link from 'next/link'
import { auth, signIn } from '@/lib/okta/auth'
import { StandaloneChat } from './StandaloneChat'

async function signInAction() {
  'use server'
  await signIn('okta', { redirectTo: '/chat' })
}

export default async function ChatWindow() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="h-full bg-gradient-to-b from-[var(--bg-card)] via-[#171732] to-[var(--bg-card)] flex items-center justify-center p-6">
        <div className="max-w-[360px] w-full text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-[var(--brand)] via-[var(--brand-dark)] to-[#a83a05] shadow-[0_4px_16px_rgba(255,107,53,0.4)] mb-4">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-[20px] font-bold tracking-tight mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            Sign in to continue
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)] mb-5">
            Pop-out chat is gated by Okta. Sign in to attribute every action back to you.
          </p>
          <form action={signInAction}>
            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white text-[13px] font-semibold hover:shadow-[0_8px_24px_rgba(255,107,53,0.4)] hover:-translate-y-0.5 transition-all"
            >
              Sign in with Okta
            </button>
          </form>
          <Link
            href="/"
            className="mt-4 inline-block text-[11px] text-[var(--text-muted)] hover:text-[var(--brand-light)] transition"
          >
            Back to console
          </Link>
        </div>
      </main>
    )
  }

  return (
    <StandaloneChat
      userName={session.user.name ?? 'Sarah Sales'}
    />
  )
}
