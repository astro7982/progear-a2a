'use client'

import { useEffect, useRef, useState } from 'react'
import { ScenePicker } from './scene/ScenePicker'
import { ChatPanel } from './chat/ChatPanel'
import { DelegationTree } from './tree/DelegationTree'
import { ActChainStack } from './stack/ActChainStack'
import { AuditTimeline } from './audit/AuditTimeline'
import { WhyDoesThisMatter } from './scene/WhyDoesThisMatter'
import type { ChainSSEEvent } from '@/lib/scenes/types'
import type { AuditEvent } from '@/lib/okta/system-log'
import type { ActLayer } from '@/lib/tokens/decode'
import type { SceneId } from '@/lib/scenes/types'

export interface AgentMessage {
  agent: string
  text: string
  ts: number
}

export interface ChainStepState {
  num: number
  label: string
  description: string
  status: 'idle' | 'running' | 'success' | 'error'
  rawToken?: string
  actChain?: ActLayer[]
  audience?: string
  error?: string
}

export interface OriginIdentity {
  sub: string
  subProfile: 'user' | 'service'
  rawToken: string
}

interface DemoStageProps {
  signedIn: boolean
  userEmail?: string
}

const SCENES: { id: SceneId; label: string; description: string; enabled: boolean; locked?: string }[] = [
  {
    id: 1,
    label: 'Quick Check',
    description: 'Sarah asks for stock; Sales agent calls Inventory MCP. Two-layer act chain.',
    enabled: true,
  },
  {
    id: 2,
    label: 'Build a Deal',
    description: 'Sarah asks for 15% off. FGA gates the discount; Bala approves; chain resumes.',
    enabled: false,
    locked: 'coming next',
  },
  {
    id: 3,
    label: '2am Reorder',
    description: 'No human at origin. Service client triggers; same chain, sub_profile=service.',
    enabled: false,
    locked: 'phase 3',
  },
  {
    id: 4,
    label: 'Without Okta',
    description: 'Side-by-side replay. Watch the act chain dissolve when Okta is removed.',
    enabled: false,
    locked: 'phase 4',
  },
]

export function DemoStage({ signedIn, userEmail }: DemoStageProps) {
  const [activeScene, setActiveScene] = useState<SceneId>(1)
  const [running, setRunning] = useState(false)
  const [origin, setOrigin] = useState<OriginIdentity | null>(null)
  const [steps, setSteps] = useState<ChainStepState[]>([])
  const [chatLog, setChatLog] = useState<AgentMessage[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [highlightUuid, setHighlightUuid] = useState<string | null>(null)
  const auditEsRef = useRef<EventSource | null>(null)

  // Audit timeline: open SSE on mount, keep alive
  useEffect(() => {
    const es = new EventSource('/api/audit/stream')
    auditEsRef.current = es
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as AuditEvent | { type: string; message?: string }
        if ('uuid' in data && data.uuid) {
          setAuditEvents((prev) => {
            if (prev.some((e) => e.uuid === data.uuid)) return prev
            return [data as AuditEvent, ...prev].slice(0, 60)
          })
        }
      } catch {}
    }
    es.onerror = () => {}
    return () => {
      es.close()
      auditEsRef.current = null
    }
  }, [])

  async function runScene(sceneId: SceneId) {
    if (!signedIn) return
    setRunning(true)
    setOrigin(null)
    setSteps([])
    setChatLog([])

    const res = await fetch(`/api/scene/${sceneId}/run`, { method: 'POST' })
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
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue
        try {
          const ev: ChainSSEEvent = JSON.parse(part.slice(6))
          handleEvent(ev)
        } catch {}
      }
    }
    setRunning(false)
  }

  function handleEvent(ev: ChainSSEEvent) {
    if (ev.type === 'origin') {
      setOrigin({ sub: ev.sub, subProfile: ev.subProfile, rawToken: ev.rawToken })
    } else if (ev.type === 'step_start') {
      setSteps((prev) => [
        ...prev,
        { num: ev.step, label: ev.label, description: ev.description, status: 'running' },
      ])
    } else if (ev.type === 'step_success') {
      setSteps((prev) =>
        prev.map((s) =>
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
    } else if (ev.type === 'step_error') {
      setSteps((prev) =>
        prev.map((s) => (s.num === ev.step ? { ...s, status: 'error', error: ev.error } : s)),
      )
    } else if (ev.type === 'agent_message') {
      setChatLog((prev) => [...prev, { agent: ev.agent, text: ev.text, ts: Date.now() }])
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
      <ScenePicker
        scenes={SCENES}
        active={activeScene}
        onPick={setActiveScene}
        onRun={runScene}
        running={running}
        signedIn={signedIn}
      />

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-4">
          <ChatPanel
            userEmail={userEmail}
            origin={origin}
            messages={chatLog}
            running={running}
            signedIn={signedIn}
          />
        </section>

        <section className="col-span-12 lg:col-span-5">
          <DelegationTree origin={origin} steps={steps} />
        </section>

        <section className="col-span-12 lg:col-span-3">
          <ActChainStack steps={steps} />
        </section>

        <section className="col-span-12 lg:col-span-4">
          <WhyDoesThisMatter sceneId={activeScene} />
        </section>

        <section className="col-span-12 lg:col-span-8">
          <AuditTimeline
            events={auditEvents}
            highlightUuid={highlightUuid}
            onHover={setHighlightUuid}
          />
        </section>
      </div>
    </div>
  )
}
