import type { SceneId } from '@/lib/scenes/types'

const COPY: Record<SceneId, { title: string; body: string; bullets: string[] }> = {
  1: {
    title: 'Why Quick Check matters',
    body:
      'Watch what happens when an AI agent acts on Sarah\'s behalf. Every API call carries her identity, every audit log entry resolves to her name.',
    bullets: [
      'Sales agent never gets Sarah\'s credentials, only a scoped delegation.',
      'Inventory agent receives a token whose act chain proves who initiated.',
      'When Sarah leaves the company, every action she ever caused is audit-traceable.',
    ],
  },
  2: {
    title: 'Why Build a Deal matters',
    body:
      'Sarah\'s discount is above her authority. The chain stalls; FGA blocks; finance approves on stage; chain resumes. Two humans now in the audit trail.',
    bullets: [
      'ID-JAG tells you WHO is acting.',
      'FGA tells you what they\'re ALLOWED to do per object.',
      'Together they\'re the complete identity + authorization story for agentic workflows.',
    ],
  },
  3: {
    title: 'Why 2am Reorder matters',
    body:
      'Same chain, no human at origin. The act chain bottoms out at a workload principal, not a person. Unattended doesn\'t mean ungoverned.',
    bullets: [
      'Service client identity is first-class in the audit trail.',
      'Every hop still attributable; no shared service accounts.',
      'Same governance frame as the human-driven path.',
    ],
  },
  4: {
    title: 'Why Without Okta matters',
    body:
      'Same scenario, replayed without Okta in the path. Watch the act chain dissolve, watch Sarah\'s name disappear from the audit. Same outcome, no governance.',
    bullets: [
      'Generic service token: identity collapses to "service-account-7."',
      'No discount approval gate, no FGA enforcement, no human in audit.',
      'Same agents, same outcome. Side-by-side, this is the contrast that closes deals.',
    ],
  },
}

export function WhyDoesThisMatter({ sceneId }: { sceneId: SceneId }) {
  const c = COPY[sceneId]
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-4 h-full">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400 mb-2">
        {c.title}
      </h2>
      <p className="text-sm text-slate-300 mb-3">{c.body}</p>
      <ul className="space-y-2">
        {c.bullets.map((b, i) => (
          <li key={i} className="text-xs text-slate-400 flex gap-2">
            <span className="text-blue-500">▸</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
