'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, User, Bot, Server, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { ChainStepState, OriginIdentity } from '../DemoStage'

interface Props {
  origin: OriginIdentity | null
  steps: ChainStepState[]
}

interface NodeShape {
  id: string
  kind: 'human' | 'agent' | 'mcp'
  name: string
  meta: string
  state: 'idle' | 'running' | 'success' | 'error'
  description?: string
}

function buildNodes(origin: OriginIdentity | null, steps: ChainStepState[]): NodeShape[] {
  const out: NodeShape[] = []

  // Origin
  if (origin) {
    out.push({
      id: 'origin',
      kind: origin.subProfile === 'user' ? 'human' : 'agent',
      name: origin.subProfile === 'user' ? 'Sarah Sales' : 'Service Client',
      meta: origin.sub,
      state: 'success',
    })
  } else {
    out.push({
      id: 'origin',
      kind: 'human',
      name: 'Sarah Sales',
      meta: 'awaiting login',
      state: 'idle',
    })
  }

  // Sales agent (always present once we start)
  const step2 = steps.find((s) => s.num === 2)
  out.push({
    id: 'sales',
    kind: 'agent',
    name: 'Sales Agent',
    meta: 'wlpzamsn8ruzX9RiH1d7',
    state: step2?.status ?? 'idle',
    description: step2?.label,
  })

  const step3 = steps.find((s) => s.num === 3)
  out.push({
    id: 'inventory',
    kind: 'agent',
    name: 'Inventory Agent',
    meta: 'wlpzantdeiOQGRrpF1d7',
    state: step3?.status ?? 'idle',
    description: step3?.label,
  })

  // Final node always tail. For Phase 1 it's the Inventory MCP.
  const step5 = steps.find((s) => s.num === 5)
  out.push({
    id: 'mcp',
    kind: 'mcp',
    name: 'InventoryMCP',
    meta: 'progear.com/inventoryMCP-resource',
    state: step5?.status ?? (step3?.status === 'success' ? 'success' : 'idle'),
  })

  return out
}

const STATE_STYLES = {
  idle: 'border-slate-700/50 bg-slate-900/30 opacity-60',
  running: 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/20',
  success: 'border-emerald-500/60 bg-emerald-500/10',
  error: 'border-red-500/60 bg-red-500/10',
} as const

function NodeIcon({ kind, state }: { kind: NodeShape['kind']; state: NodeShape['state'] }) {
  if (state === 'running') return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
  if (state === 'error') return <AlertCircle className="h-5 w-5 text-red-400" />
  if (state === 'success') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
  if (kind === 'human') return <User className="h-5 w-5 text-pink-300" />
  if (kind === 'mcp') return <Server className="h-5 w-5 text-violet-300" />
  return <Bot className="h-5 w-5 text-slate-400" />
}

export function DelegationTree({ origin, steps }: Props) {
  const nodes = buildNodes(origin, steps)

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Delegation Path
        </h2>
        <div className="text-xs text-slate-500">
          {steps.length === 0
            ? 'Idle'
            : `${steps.filter((s) => s.status === 'success').length}/${steps.length} hops complete`}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <AnimatePresence>
          {nodes.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="w-full max-w-md"
            >
              <div
                className={`rounded-lg border p-3 transition ${STATE_STYLES[n.state]}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center shrink-0">
                    <NodeIcon kind={n.kind} state={n.state} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{n.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{n.meta}</div>
                    {n.description && (
                      <div className="text-xs text-slate-400 mt-1">{n.description}</div>
                    )}
                  </div>
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
