'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface ApprovalRecord {
  orderId: string
  product: string
  quantity: number
  requestedBy: string
  requestedAt: number
  status: 'pending' | 'approved'
  approvedBy?: string
  approvedAt?: number
}

const MIKE_LOGIN = 'mike.manager@progear.demo'
const POLL_MS = 2000

export default function MikeApproverPage() {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/approval/pending', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { approvals: ApprovalRecord[] }
      setApprovals(data.approvals)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
    const id = setInterval(fetchApprovals, POLL_MS)
    return () => clearInterval(id)
  }, [fetchApprovals])

  async function approve(orderId: string) {
    setBusyId(orderId)
    try {
      const res = await fetch('/api/approval/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, approverLogin: MIKE_LOGIN }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      await fetchApprovals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setBusyId(null)
    }
  }

  const pending = approvals.filter((a) => a.status === 'pending')
  const approved = approvals.filter((a) => a.status === 'approved')

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100">
      <header className="border-b border-slate-800/60 bg-slate-950/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              ProGear · Manager approvals
            </h1>
            <p className="text-xs text-slate-400">
              Signed in as <span className="font-semibold">Mike Manager</span> ·{' '}
              <span className="font-mono">{MIKE_LOGIN}</span> ·{' '}
              <Link href="/" className="underline decoration-dotted hover:text-slate-200">
                back to demo
              </Link>
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            {loading ? 'Loading…' : `${pending.length} pending · ${approved.length} approved`}
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {error ? (
          <div className="rounded-md border border-red-700/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div>
          <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">
            Pending approvals
          </h2>
          {pending.length === 0 ? (
            <div className="rounded-md border border-slate-800/60 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
              No pending approval requests. Place an order over 50 units in the demo to trigger one.
            </div>
          ) : (
            <ul className="space-y-3">
              {pending.map((a) => (
                <li
                  key={a.orderId}
                  className="rounded-md border border-amber-700/40 bg-amber-950/20 px-4 py-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-semibold">{a.product}</div>
                    <div className="text-sm text-slate-300">
                      <span className="font-mono text-amber-300">{a.quantity}</span> units · requested by{' '}
                      <span className="font-mono">{a.requestedBy}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{a.orderId}</div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === a.orderId}
                    onClick={() => approve(a.orderId)}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white transition shadow-lg shadow-emerald-500/20"
                  >
                    {busyId === a.orderId ? 'Approving…' : 'Approve'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {approved.length > 0 ? (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">
              Recently approved
            </h2>
            <ul className="space-y-3">
              {approved.map((a) => (
                <li
                  key={a.orderId}
                  className="rounded-md border border-emerald-700/40 bg-emerald-950/20 px-4 py-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-semibold">{a.product}</div>
                    <div className="text-sm text-slate-300">
                      <span className="font-mono text-emerald-300">{a.quantity}</span> units · for{' '}
                      <span className="font-mono">{a.requestedBy}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{a.orderId}</div>
                  </div>
                  <span className="px-3 py-1.5 text-xs rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-200">
                    Approved ✓
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  )
}
