'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ConversationPanel, type Turn } from './ConversationPanel'
import { ActivityTimeline, type Activity } from './ActivityTimeline'
import { TrustReceipt, type ChainStep } from './TrustReceipt'
import type { ChainSSEEvent } from '@/lib/scenes/types'
import type { ActLayer } from '@/lib/tokens/decode'

interface OriginIdentity {
  sub: string
  subProfile: 'user' | 'service'
  rawToken: string
}

interface Props {
  signedIn: boolean
  userEmail?: string
}

const ACTIVITY_LABELS: Record<number, { running: string; done: string }> = {
  2: {
    running: 'Sales agent asking the system for a token to query Inventory',
    done: 'Sales agent received an Identity Assertion JWT (id-jag)',
  },
  3: {
    running: 'Sales agent calling Inventory with a scoped access token',
    done: 'Inventory access token issued · scoped to agent.invoke only',
  },
  4: {
    running: 'Inventory agent requesting a token for the Inventory database',
    done: 'Inventory agent received an id-jag for the database',
  },
  5: {
    running: 'Inventory agent calling the database',
    done: 'Database access token issued',
  },
}

export function Stage({ signedIn, userEmail }: Props) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [running, setRunning] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [steps, setSteps] = useState<ChainStep[]>([])
  const [origin, setOrigin] = useState<OriginIdentity | null>(null)
  const [chainComplete, setChainComplete] = useState(false)

  const reset = useCallback(() => {
    setTurns([])
    setActivities([])
    setSteps([])
    setOrigin(null)
    setChainComplete(false)
  }, [])

  const ask = useCallback(
    async (sceneId: 1 | 2 | 3, prompt: string) => {
      if (!signedIn || running) return
      reset()
      setRunning(true)

      const ts = Date.now()
      setTurns([{ id: `q-${ts}`, role: 'user', text: prompt, ts }])

      const res = await fetch(`/api/scene/${sceneId}/run`, { method: 'POST' })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const body = (await res.json()) as { error?: string }
          if (body.error) msg = body.error
        } catch {}
        // eslint-disable-next-line react-hooks/purity
        setTurns((p) => [...p, { id: `err-${Date.now()}`, role: 'agent', agent: 'System', text: msg, ts: Date.now() }])
        setRunning(false)
        return
      }
      if (!res.body) {
        setRunning(false)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const p of parts) {
          if (!p.startsWith('data: ')) continue
          try {
            const ev: ChainSSEEvent = JSON.parse(p.slice(6))
            handleEvent(ev)
          } catch {}
        }
      }
      setRunning(false)
      setChainComplete(true)
    },
    [signedIn, running, reset],
  )

  function handleEvent(ev: ChainSSEEvent) {
    if (ev.type === 'origin') {
      setOrigin({ sub: ev.sub, subProfile: ev.subProfile, rawToken: ev.rawToken })
      return
    }
    if (ev.type === 'agent_message') {
      // eslint-disable-next-line react-hooks/purity
      const ts = Date.now()
      setTurns((p) => [
        ...p,
        { id: `${ev.agent}-${ts}`, role: 'agent', agent: ev.agent, text: ev.text, ts },
      ])
      return
    }
    if (ev.type === 'step_start') {
      const labels = ACTIVITY_LABELS[ev.step]
      setActivities((p) => [
        ...p,
        {
          id: `step-${ev.step}`,
          text: labels?.running ?? ev.label,
          status: 'running',
        },
      ])
      setSteps((p) => [
        ...p,
        { num: ev.step, label: ev.label, status: 'running' },
      ])
      return
    }
    if (ev.type === 'step_success') {
      const labels = ACTIVITY_LABELS[ev.step]
      setActivities((p) =>
        p.map((a) =>
          a.id === `step-${ev.step}` ? { ...a, status: 'done', text: labels?.done ?? a.text } : a,
        ),
      )
      setSteps((p) =>
        p.map((s) =>
          s.num === ev.step
            ? {
                ...s,
                status: 'success',
                rawToken: ev.rawToken,
                actChain: ev.actChain as ActLayer[],
                audience: ev.audience,
              }
            : s,
        ),
      )
      return
    }
    if (ev.type === 'complete') {
      // Promote the result to a hero outcome bubble.
      const r = (ev.result as { stockAvailable?: number; sku?: string; warehouse?: string }) ?? {}
      // eslint-disable-next-line react-hooks/purity
      const ts = Date.now()
      setTurns((p) => [
        ...p,
        {
          id: `final-${ts}`,
          role: 'assistant',
          text: r.stockAvailable
            ? `Yes — ${r.stockAvailable} units in stock at the ${r.warehouse} warehouse. Plenty for the order.`
            : 'Done.',
          ts,
          outcome: r.stockAvailable
            ? { kind: 'stock', label: r.sku ?? 'item', value: `${r.stockAvailable} units` }
            : undefined,
        },
      ])
      return
    }
    if (ev.type === 'error') {
      // eslint-disable-next-line react-hooks/purity
      const ts = Date.now()
      setTurns((p) => [
        ...p,
        { id: `err-${ts}`, role: 'agent', agent: 'System', text: `Error: ${ev.message}`, ts },
      ])
    }
  }

  return (
    <div className="px-6 py-12 sm:py-20">
      <div className="max-w-[1080px] mx-auto">
        <ConversationPanel
          signedIn={signedIn}
          turns={turns}
          running={running}
          onAsk={ask}
        />

        <ActivityTimeline items={activities} />

        <TrustReceipt origin={origin} steps={steps} visible={chainComplete} />

        {chainComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="max-w-[760px] mx-auto mt-8 text-center"
          >
            <button
              onClick={reset}
              className="text-[11px] tracking-[0.18em] uppercase text-[var(--ink-quiet)] hover:text-[var(--ink)] transition"
            >
              ask another question
            </button>
            <span className="text-[var(--ink-quiet)] mx-3">·</span>
            <span className="text-[11px] tracking-[0.18em] uppercase text-[var(--ink-quiet)]">
              {userEmail ? userEmail.split('@')[0] : 'guest'}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
