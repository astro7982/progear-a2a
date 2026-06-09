import { type NextRequest } from 'next/server'
import { auth } from '@/lib/okta/auth'
import { generateResponse } from '@/lib/ai/chat'
import { executeStep2, executeStep3 } from '@/lib/tokens/token-steps'
import { decodeJwt, extractActChain } from '@/lib/tokens/decode'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { message } = (await req.json()) as { message: string }
  if (!message?.trim()) {
    return Response.json({ error: 'Empty message' }, { status: 400 })
  }

  // 1. Run the real A2A chain in the background (T1 → T2 → T3)
  let chainResult: {
    success: boolean
    actChain?: unknown[]
    t3Audience?: string
  } = { success: false }

  try {
    const t1 = session.accessToken
    const t2 = await executeStep2(t1)
    const t3 = await executeStep3(t2)
    const decoded = decodeJwt(t3)
    chainResult = {
      success: true,
      actChain: decoded ? extractActChain(decoded.payload) : [],
      t3Audience: typeof decoded?.payload.aud === 'string' ? decoded.payload.aud : undefined,
    }
  } catch (err) {
    console.error('[chat] chain failed:', err instanceof Error ? err.message : err)
    chainResult = { success: false }
  }

  // 2. Generate the LLM response
  const { text, agentUsed, action } = await generateResponse(message)

  return Response.json({
    text,
    agentUsed,
    action,
    chain: chainResult,
    user: session.user?.email,
  })
}
