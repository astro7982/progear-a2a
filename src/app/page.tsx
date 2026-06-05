import { auth, signIn, signOut } from '@/lib/okta/auth'
import { DemoStage } from '@/components/DemoStage'

export default async function Home() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100">
      <header className="border-b border-slate-800/60 bg-slate-950/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              ProGear AI <span className="text-blue-400">·</span> Agent-to-Agent
            </h1>
            <p className="text-xs text-slate-400">
              Okta for AI Agents · live demo on{' '}
              <span className="font-mono">bala-secures-ai.oktapreview.com</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <span className="text-sm text-slate-300">
                  Signed in as <span className="font-semibold">{session.user.email}</span>
                </span>
                <form
                  action={async () => {
                    'use server'
                    await signOut({ redirectTo: '/' })
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800 transition"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <form
                action={async () => {
                  'use server'
                  await signIn('okta', { redirectTo: '/' })
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-blue-500 hover:bg-blue-400 text-white transition shadow-lg shadow-blue-500/20"
                >
                  Login as Sarah
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      <DemoStage signedIn={!!session?.user} userEmail={session?.user?.email ?? undefined} />
    </main>
  )
}
