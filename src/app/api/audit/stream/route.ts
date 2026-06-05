import { fetchA2aEvents } from '@/lib/okta/system-log'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * SSE that polls Okta System Log every 2s and emits new A2A events.
 * Open continuously to power the audit timeline panel.
 */
export async function GET() {
  const encoder = new TextEncoder()
  const seen = new Set<string>()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // controller closed; loop will exit on next iteration
        }
      }

      // Initial pull: last 30 minutes
      try {
        const events = await fetchA2aEvents({ limit: 50 })
        // emit oldest-first so the UI builds in order
        for (const e of events.slice().reverse()) {
          if (!seen.has(e.uuid)) {
            seen.add(e.uuid)
            send(e)
          }
        }
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) })
      }

      // Poll loop
      let alive = true
      const poll = async () => {
        while (alive) {
          await new Promise((r) => setTimeout(r, 2000))
          if (!alive) break
          try {
            const sinceIso = new Date(Date.now() - 30 * 1000).toISOString()
            const events = await fetchA2aEvents({ limit: 25, sinceIso })
            for (const e of events.slice().reverse()) {
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
      poll().catch(() => {})

      const cancel = () => {
        alive = false
        try {
          controller.close()
        } catch {}
      }
      // Auto-stop after 10 minutes
      setTimeout(cancel, 10 * 60 * 1000)
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
