'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Layers, User, Bot, Cog } from 'lucide-react'
import type { ChainStepState } from '../DemoStage'

interface Props {
  steps: ChainStepState[]
}

function profileIcon(profile?: string) {
  if (profile === 'user') return <User className="h-4 w-4 text-pink-300" />
  if (profile === 'service') return <Cog className="h-4 w-4 text-amber-300" />
  return <Bot className="h-4 w-4 text-blue-300" />
}

function profileBadge(profile?: string) {
  if (profile === 'user') return 'bg-pink-500/10 text-pink-300 border-pink-500/30'
  if (profile === 'service') return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  return 'bg-blue-500/10 text-blue-300 border-blue-500/30'
}

export function ActChainStack({ steps }: Props) {
  // Show the deepest act chain we've seen (latest token issued)
  const latest = [...steps].reverse().find((s) => s.actChain && s.actChain.length > 0)
  const layers = latest?.actChain ?? []

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="h-4 w-4" /> Act Chain
        </h2>
        <div className="text-xs text-slate-500">
          {layers.length === 0 ? 'Empty' : `${layers.length} layer${layers.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {layers.length === 0 && (
        <div className="text-xs text-slate-500 italic">
          No tokens issued yet. Run a scene to populate the act chain.
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {layers.map((layer, i) => (
            <motion.div
              key={`${layer.sub}-${i}`}
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: i * 0.1,
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                {profileIcon(layer.sub_profile)}
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${profileBadge(layer.sub_profile)}`}
                >
                  {layer.sub_profile ?? '?'}
                </span>
                {i === 0 && (
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-auto">
                    most recent
                  </span>
                )}
                {i === layers.length - 1 && (
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-auto">
                    origin
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-slate-300 break-all">{layer.sub}</div>
              {layer.aud && (
                <div className="text-[10px] text-slate-500 mt-1 truncate">aud: {layer.aud}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
