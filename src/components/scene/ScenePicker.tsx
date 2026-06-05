'use client'

import type { SceneId } from '@/lib/scenes/types'
import { Play, Lock } from 'lucide-react'

interface SceneInfo {
  id: SceneId
  label: string
  description: string
  enabled: boolean
  locked?: string
}

interface Props {
  scenes: SceneInfo[]
  active: SceneId
  onPick: (id: SceneId) => void
  onRun: (id: SceneId) => void
  running: boolean
  signedIn: boolean
}

export function ScenePicker({ scenes, active, onPick, onRun, running, signedIn }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Pick a scene
        </h2>
        <div className="text-xs text-slate-500">
          {signedIn ? 'Click Run to execute the chain.' : 'Sign in as Sarah first.'}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenes.map((s) => {
          const isActive = active === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => s.enabled && onPick(s.id)}
              disabled={!s.enabled}
              className={`text-left rounded-lg border p-3 transition ${
                isActive
                  ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70'
              } ${!s.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Scene {s.id} · {s.label}
                </span>
                {!s.enabled && (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                    <Lock className="h-3 w-3" /> {s.locked}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">{s.description}</p>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => onRun(active)}
          disabled={!signedIn || running}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium transition shadow-lg shadow-blue-500/20"
        >
          <Play className="h-4 w-4" />
          {running ? 'Running...' : `Run Scene ${active}`}
        </button>
      </div>
    </div>
  )
}
