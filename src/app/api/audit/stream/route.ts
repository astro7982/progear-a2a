import { fetchA2aEvents } from '@/lib/okta/system-log'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * SSE that polls Okta System Log every 2s and emits new A2A events.
 * Open continuously to power the audit timeline panel.
 *
 * Lifecycle:
 *   - On client disconnect: cancel() fires → alive=false → next poll iteration exits
 *   - Hard ceiling at 10 minutes via setTimeout (Vercel function timeout safety)
 */
export async function GET() {
  const encoder = new TextEncoder()
  const seen = new Set<string>()
  let alive = true
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (!alive) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          alive = false
        }
      }

      // Initial pull: last 30 minutes
      try {
        const events = await fetchA2aEvents({ limit: 50 })
        for (const e of events.slice().reverse()) {
          if (!alive) break
          if (!seen.has(e.uuid)) {
            seen.add(e.uuid)
            send(e)
          }
        }
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) })
      }

      // Poll loop
      const poll = async () => {
        while (alive) {
          await new Promise((r) => setTimeout(r, 2000))
          if (!alive) break
          try {
            const sinceIso = new Date(Date.now() - 30 * 1000).toISOString()
            const events = await fetchA2aEvents({ limit: 25, sinceIso })
            for (const e of events.slice().reverse()) {
              if (!alive) break
              if (!seen.has(e.uuid)) {
                seen.add(e.uuid)
                send(e)
              }
            }
          } catch (err) {
            send({ type: 'error', message: err instanceof Error ? err.message : String(err) })
          }
        }
      }
      poll().catch(() => {
        alive = false
      })

      // Hard ceiling at 10 minutes
      timeoutHandle = setTimeout(() => {
        alive = false
        try {
          controller.close()
        } catch {}
      }, 10 * 60 * 1000)
    },

    // Fires when the client disconnects. Stop the poll loop and clear the
    // safety timeout so we don't leak Okta API calls or function time.
    cancel() {
      alive = false
      if (timeoutHandle) clearTimeout(timeoutHandle)
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
