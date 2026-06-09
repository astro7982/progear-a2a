'use client'

import { Code2, ExternalLink, KeyRound, GitBranch } from 'lucide-react'
import type { ActLayer } from '@/lib/tokens/decode'

const AGENT_NAMES: Record<string, string> = {
  wlpzamsn8ruzX9RiH1d7: 'Sales Agent',
  wlpzantdeiOQGRrpF1d7: 'Inventory Agent',
  '0oazns4s2moIlRzoG1d7': 'ProGear Web App',
  '0oazakcme19yZ44th1d7': 'Scheduled Reorder Flow',
}

interface Props {
  actChain: ActLayer[]
  t3Header?: Record<string, unknown>
  t3Payload?: Record<string, unknown>
  t3TokenPreview?: string
  t3Audience?: string
  hasChain: boolean
}

export function EngineeringPanel({
  actChain,
  t3Header,
  t3Payload,
  t3TokenPreview,
  t3Audience,
  hasChain,
}: Props) {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-2 shrink-0">
        <Code2 className="h-3 w-3 text-[var(--tech-purple)]" />
        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--tech-purple)] font-semibold">
          Engineering View
        </div>
        <a
          href="/engineer"
          className="ml-auto text-[10px] text-[var(--text-muted)] hover:text-[var(--tech-purple)] transition flex items-center gap-1"
        >
          Full inspector
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-5">
        {!hasChain && (
          <div className="text-[11px] text-[var(--text-muted)] italic">
            Send a message to populate the token chain.
          </div>
        )}

        {hasChain && (
          <>
            <Section title="Token Flow" icon={<GitBranch className="h-3 w-3" />}>
              <SequenceDiagram />
              {t3Audience && (
                <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                  Final audience: <span className="font-mono text-[var(--text-secondary)]">{t3Audience}</span>
                </div>
              )}
            </Section>

            {actChain.length > 0 && (
              <Section title="Act Chain (T3)" icon={<KeyRound className="h-3 w-3" />}>
                <ol className="space-y-1.5">
                  {[...actChain].reverse().map((layer, i) => (
                    <ActChainRow key={i} layer={layer} index={i} total={actChain.length} />
                  ))}
                </ol>
              </Section>
            )}

            {t3Header && (
              <Section title="JWT Header" icon={<Code2 className="h-3 w-3" />}>
                <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 overflow-x-auto leading-relaxed">
                  {JSON.stringify(t3Header, null, 2)}
                </pre>
              </Section>
            )}

            {t3Payload && (
              <Section title="JWT Payload" icon={<Code2 className="h-3 w-3" />}>
                <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 overflow-x-auto leading-relaxed max-h-[280px]">
                  {JSON.stringify(t3Payload, null, 2)}
                </pre>
              </Section>
            )}

            {t3TokenPreview && (
              <Section title="Raw Token (preview)" icon={<KeyRound className="h-3 w-3" />}>
                <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 break-all">
                  {t3TokenPreview}…
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold">
        <span className="text-[var(--tech-purple)]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

function ActChainRow({ layer, index, total }: { layer: ActLayer; index: number; total: number }) {
  const sub = String(layer.sub)
  const profile = layer.sub_profile
  const friendly = profile === 'user' ? sub : (AGENT_NAMES[sub] ?? sub)
  const profileBadge = profileLabel(profile)
  const profileColor = profileTint(profile)

  return (
    <li className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)]/40 px-2.5 py-2">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[10px] font-mono text-[var(--text-muted)] w-5">L{total - index - 1}</span>
        <span className="text-[11px] font-medium text-[var(--text)]">{friendly}</span>
        {profileBadge && (
          <span
            className="text-[8px] uppercase tracking-wider px-1.5 py-px rounded"
            style={{ color: profileColor, backgroundColor: `${profileColor}18`, border: `1px solid ${profileColor}30` }}
          >
            {profileBadge}
          </span>
        )}
      </div>
      <div className="text-[9px] font-mono text-[var(--text-muted)] break-all pl-7">sub={sub}</div>
    </li>
  )
}

function profileLabel(p: ActLayer['sub_profile']): string | null {
  if (!p) return null
  if (p === 'ai_agent') return 'agent'
  if (p === 'web_app') return 'app'
  return p
}

function profileTint(p: ActLayer['sub_profile']): string {
  if (p === 'user') return 'var(--relay-human)'
  if (p === 'ai_agent') return 'var(--relay-agent-1)'
  if (p === 'web_app') return 'var(--tech-purple)'
  return 'var(--text-muted)'
}

function SequenceDiagram() {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)]/60 p-3">
      <svg viewBox="0 0 320 130" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Lifelines */}
        <Lifeline x={40} label="Sarah" color="var(--relay-human)" />
        <Lifeline x={120} label="Sales" color="var(--relay-agent-1)" />
        <Lifeline x={200} label="Inventory" color="var(--relay-agent-2)" />
        <Lifeline x={280} label="Okta AS" color="var(--okta-blue)" />

        {/* Sarah → Sales (T1) */}
        <Arrow x1={40} x2={120} y={50} label="T1: signs in" />
        {/* Sales → Okta (T2 mint) */}
        <Arrow x1={120} x2={280} y={68} label="T2: id-jag" />
        {/* Okta → Sales (back) */}
        <Arrow x1={280} x2={120} y={82} label="" reverse />
        {/* Sales → Inventory (T3) */}
        <Arrow x1={120} x2={200} y={100} label="T3: act chain" />
      </svg>
    </div>
  )
}

function Lifeline({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <g>
      <line x1={x} y1={32} x2={x} y2={120} stroke="var(--border)" strokeDasharray="2 2" />
      <rect x={x - 28} y={14} width={56} height={16} rx={4} fill={`${color}25`} stroke={color} strokeWidth={1} />
      <text x={x} y={25} textAnchor="middle" fontSize={8} fill={color} fontWeight={600}>
        {label}
      </text>
    </g>
  )
}

function Arrow({ x1, x2, y, label, reverse }: { x1: number; x2: number; y: number; label: string; reverse?: boolean }) {
  const fromX = reverse ? x2 : x1
  const toX = reverse ? x1 : x2
  const arrowDir = toX > fromX ? -3 : 3
  return (
    <g>
      <line x1={fromX} y1={y} x2={toX} y2={y} stroke="var(--okta-blue)" strokeWidth={1} />
      <polygon
        points={`${toX},${y} ${toX + arrowDir},${y - 2} ${toX + arrowDir},${y + 2}`}
        fill="var(--okta-blue)"
      />
      {label && (
        <text x={(fromX + toX) / 2} y={y - 3} textAnchor="middle" fontSize={7} fill="var(--text-secondary)">
          {label}
        </text>
      )}
    </g>
  )
}
