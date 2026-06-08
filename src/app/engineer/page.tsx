import { auth, signIn, signOut } from '@/lib/okta/auth'
import { DemoStage } from '@/components/DemoStage'

async function signInAction() {
  'use server'
  await signIn('okta', { redirectTo: '/engineer' })
}

async function signOutAction() {
  'use server'
  await signOut({ redirectTo: '/engineer' })
}

export default async function EngineerView() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100">
      <header className="border-b border-slate-800/60 bg-slate-950/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              ProGear · Engineer view
            </h1>
            <p className="text-xs text-slate-400">
              Token chain visualizer ·{' '}
              <span className="font-mono">bala-secures-ai.oktapreview.com</span> ·{' '}
              <a href="/" className="underline decoration-dotted hover:text-slate-200">
                back to demo
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <span className="text-sm text-slate-300">
                  Signed in as <span className="font-semibold">{session.user.email}</span>
                </span>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800 transition"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <form action={signInAction}>
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
