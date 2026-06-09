import { type NextRequest } from 'next/server'
import { grantManagerApproval } from '@/lib/fga/order-checks'
import { getApproval, markApproved } from '@/lib/fga/approval-queue'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { orderId?: string; approverLogin?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const orderId = body.orderId?.trim()
  const approverLogin = body.approverLogin?.trim()

  if (!orderId) {
    return Response.json({ error: 'Missing orderId' }, { status: 400 })
  }
  if (!approverLogin) {
    return Response.json({ error: 'Missing approverLogin' }, { status: 400 })
  }

  const existing = getApproval(orderId)
  if (!existing) {
    return Response.json({ error: `No approval record for order ${orderId}` }, { status: 404 })
  }
  if (existing.status === 'approved') {
    return Response.json({ approval: existing, alreadyApproved: true })
  }

  try {
    await grantManagerApproval(approverLogin, orderId)
  } catch (err) {
    console.error('[approve] FGA write failed:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Failed to write FGA approval tuple' }, { status: 502 })
  }

  const updated = markApproved(orderId, approverLogin)
  return Response.json({ approval: updated })
}
