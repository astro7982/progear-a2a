import type { NextRequest } from 'next/server'
import { auth } from '@/lib/okta/auth'
import { runScene1 } from '@/lib/scenes/scene-1'
import type { ChainSSEEvent } from '@/lib/scenes/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const sceneId = Number(id)

  const session = await auth()
  if (!session?.accessToken && sceneId !== 3) {
    return Response.json(
      { error: 'Not signed in. Click "Login as Sarah" first.' },
      { status: 401 },
    )
  }

  const url = new URL(req.url)
  const pacingMs = url.searchParams.get('live') === 'true' ? 0 : 800
  const t1 = session?.accessToken ?? ''

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ChainSSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))
      }
      try {
        if (sceneId === 1) {
          for await (const ev of runScene1(t1, pacingMs)) send(ev)
        } else {
          send({ type: 'error', message: `Scene ${sceneId} not implemented yet` })
        }
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) })
      } finally {
        controller.close()
      }
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
