import { listAll } from '@/lib/fga/approval-queue'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return Response.json({ approvals: listAll() })
}
