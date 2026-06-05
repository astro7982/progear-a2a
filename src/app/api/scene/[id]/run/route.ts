import type { NextRequest } from 'next/server'
import { auth } from '@/lib/okta/auth'
import { runScene1 } from '@/lib/scenes/scene-1'
import type { ChainSSEEvent } from '@/lib/scenes/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_SCENES = new Set([1, 2, 3, 4])

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const sceneId = Number(id)

  if (!VALID_SCENES.has(sceneId)) {
    return Response.json({ error: `Unknown scene id: ${id}` }, { status: 400 })
  }

  // Scenes 1, 2, 4 are HI; Scene 3 is NHI (no login required).
  const session = await auth()
  const t1 = session?.accessToken ?? ''

  if (sceneId !== 3) {
    if (!t1) {
      return Response.json(
        { error: 'Not signed in. Click "Login as Sarah" first.' },
        { status: 401 },
      )
    }
    // Reject if the access token is already expired or about to expire within
    // the chain's worst-case duration (~10s).
    const exp = session?.expiresAt
    if (typeof exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000)
      if (exp - nowSec < 10) {
        return Response.json(
          { error: 'Session expired. Sign out and sign back in as Sarah.' },
          { status: 401 },
        )
      }
    }
  }

  if (sceneId !== 1) {
    return Response.json({ error: `Scene ${sceneId} not implemented yet` }, { status: 501 })
  }

  const url = new URL(req.url)
  const pacingMs = url.searchParams.get('live') === 'true' ? 0 : 800

  const encoder = new TextEncoder()

  // Hold the generator outside `start` so cancel() can call generator.return()
  // and short-circuit any pending pacing sleeps + downstream Okta calls.
  let generator: AsyncGenerator<ChainSSEEvent> | null = null
  let alive = true

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ChainSSEEvent) => {
        if (!alive) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))
        } catch {
          alive = false
        }
      }

      try {
        generator = runScene1(t1, pacingMs)
        for await (const ev of generator) {
          if (!alive) break
          send(ev)
        }
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) })
      } finally {
        try {
          controller.close()
        } catch {}
      }
    },

    // Client disconnected. Tell the generator to stop so we don't keep
    // making token-exchange calls against Bala's tenant for nothing.
    cancel() {
      alive = false
      generator?.return(undefined).catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
