'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText, Activity } from 'lucide-react'
import type { AuditEvent } from '@/lib/okta/system-log'

interface Props {
  events: AuditEvent[]
  highlightUuid: string | null
  onHover: (uuid: string | null) => void
}

const EVENT_LABELS: Record<string, string> = {
  'app.oauth2.token.grant.id_jag': 'id-jag minted',
  'app.oauth2.as.token.grant.access_token': 'access token minted',
}

const EVENT_BADGES: Record<string, string> = {
  'app.oauth2.token.grant.id_jag': 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  'app.oauth2.as.token.grant.access_token': 'bg-blue-500/10 text-blue-300 border-blue-500/30',
}

export function AuditTimeline({ events, highlightUuid, onHover }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ScrollText className="h-4 w-4" /> Audit Timeline
          <span className="text-xs text-slate-500 normal-case font-normal">
            (live from Okta System Log)
          </span>
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span>{events.length} events</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-xs text-slate-500 italic">
          Waiting for events from bala-secures-ai.oktapreview.com...
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence>
            {events.map((e) => (
              <motion.div
                key={e.uuid}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                onMouseEnter={() => onHover(e.uuid)}
                onMouseLeave={() => onHover(null)}
                className={`rounded-lg border bg-slate-900/40 p-3 transition ${
                  highlightUuid === e.uuid ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${EVENT_BADGES[e.eventType] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}
                  >
                    {EVENT_LABELS[e.eventType] ?? e.eventType}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-auto font-mono">
                    {new Date(e.publishedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-200">{e.actorName}</div>
                {e.actChain && (
                  <details className="mt-2 group">
                    <summary className="text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300">
                      View act chain
                    </summary>
                    <pre className="text-[10px] text-slate-400 mt-1 overflow-x-auto bg-slate-950/50 p-2 rounded font-mono">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(e.actChain), null, 2)
                        } catch {
                          return e.actChain
                        }
                      })()}
                    </pre>
                  </details>
                )}
                <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                  {e.audience && (
                    <div className="truncate">
                      aud: <span className="font-mono">{e.audience}</span>
                    </div>
                  )}
                  {e.scopes && (
                    <div>
                      scopes: <span className="font-mono">{e.scopes}</span>
                    </div>
                  )}
                  {e.resourceConnectionId && (
                    <div className="truncate">
                      via connection: <span className="font-mono">{e.resourceConnectionId}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
