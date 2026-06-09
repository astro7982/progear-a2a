'use client'

import { useState } from 'react'
import { Package, ShoppingCart, Users, BarChart3, Bot, Settings, ChevronRight, TrendingUp, AlertTriangle, Clock, Activity, Trophy, Zap, ShieldCheck } from 'lucide-react'
import { AIChatPanel } from './AIChatPanel'

interface Props {
  user: { name: string; email: string }
  signOutAction: () => Promise<void>
}

const NAV = [
  { icon: BarChart3, label: 'Dashboard', active: true },
  { icon: ShoppingCart, label: 'Orders', active: false, badge: '3' },
  { icon: Package, label: 'Inventory', active: false },
  { icon: Users, label: 'Customers', active: false },
  { icon: Activity, label: 'Activity Log', active: false },
  { icon: Settings, label: 'Settings', active: false },
]

function ProGearMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--brand)] via-[var(--brand-dark)] to-[#a83a05] shadow-[0_4px_12px_rgba(255,107,53,0.4)]" />
      <div className="absolute inset-[1.5px] rounded-[7px] bg-gradient-to-br from-[var(--brand-light)]/30 to-transparent" />
      <div className="relative h-full w-full flex items-center justify-center">
        <svg className="h-1/2 w-1/2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 21V3h7a5 5 0 0 1 0 10H5" />
          <circle cx="17" cy="17" r="3" fill="currentColor" stroke="none" opacity="0.9" />
        </svg>
      </div>
    </div>
  )
}

export function AppShell({ user, signOutAction }: Props) {
  const [aiOpen, setAiOpen] = useState(true)
  const firstName = user.name.split(' ')[0] || 'there'

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside className="w-[230px] bg-[var(--sidebar)] flex flex-col shrink-0 relative border-r border-white/[0.04]">
        {/* Subtle court line texture */}
        <div className="absolute inset-0 sports-texture opacity-50 pointer-events-none" />

        <div className="relative p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <ProGearMark />
            <div>
              <div className="text-white text-[15px] font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>ProGear</div>
              <div className="text-[var(--brand-light)] text-[9px] font-semibold uppercase tracking-[0.2em] mt-1">Sales Console</div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 py-3 px-3">
          {NAV.map(n => (
            <button
              key={n.label}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[13px] mb-1 relative transition ${
                n.active
                  ? 'bg-gradient-to-r from-[var(--brand)]/[0.18] to-[var(--brand)]/[0.04] text-white border border-[var(--brand)]/30'
                  : 'text-[var(--sidebar-text)] hover:bg-white/[0.04] hover:text-white border border-transparent'
              }`}
            >
              {n.active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--brand)] shadow-[0_0_8px_rgba(255,107,53,0.6)]" />}
              <n.icon className={`h-4 w-4 ${n.active ? 'text-[var(--brand)]' : 'group-hover:text-[var(--brand-light)]'} transition-colors`} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge && (
                <span className="px-1.5 py-px text-[9px] font-bold rounded-full bg-[var(--brand)] text-white shadow-[0_2px_6px_rgba(255,107,53,0.5)]">{n.badge}</span>
              )}
            </button>
          ))}

          <div className="mt-5 mb-2 px-3 flex items-center gap-2">
            <div className="text-[9px] uppercase tracking-[0.18em] text-[var(--sidebar-text)]/50 font-semibold">
              AI Agents
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <button
            onClick={() => setAiOpen(o => !o)}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[13px] transition ${
              aiOpen
                ? 'bg-gradient-to-r from-[var(--brand)]/[0.18] to-[var(--brand)]/[0.04] text-white border border-[var(--brand)]/30'
                : 'text-[var(--sidebar-text)] hover:bg-white/[0.04] hover:text-white border border-transparent'
            }`}
          >
            <Bot className={`h-4 w-4 ${aiOpen ? 'text-[var(--brand)]' : 'group-hover:text-[var(--brand-light)]'}`} />
            <span className="flex-1 text-left">AI Assistant</span>
            {aiOpen && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-[var(--success)] ping-slow" />
                <span className="relative h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
              </span>
            )}
          </button>
        </nav>

        {/* User */}
        <div className="relative p-4 border-t border-white/[0.06] bg-gradient-to-b from-transparent to-black/30">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center text-[10px] font-bold text-[#3a1f12] ring-2 ring-[var(--brand)]/30">
                SS
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[var(--success)] border-2 border-[var(--sidebar)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[12px] font-semibold truncate">{user.name}</div>
              <div className="text-[var(--sidebar-text)] text-[10px] truncate">{user.email || 'Sales Manager'}</div>
            </div>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="mt-2.5 w-full text-[10px] text-[var(--sidebar-text)] hover:text-[var(--brand-light)] transition py-1 rounded text-center border border-white/[0.04] hover:border-[var(--brand)]/30 bg-white/[0.02]">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with sports texture */}
        <header className="h-[60px] border-b-[3px] border-[var(--brand)] bg-gradient-to-r from-[var(--bg-card)] via-[#1e1e3a] to-[var(--bg-card)] flex items-center justify-between px-6 shrink-0 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          {/* Subtle court pattern overlay */}
          <div className="absolute inset-0 opacity-[0.05]">
            <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
              <line x1="100" y1="0" x2="100" y2="60" stroke="#ff6b35" strokeWidth="0.5"/>
              <circle cx="100" cy="30" r="14" fill="none" stroke="#ff6b35" strokeWidth="0.4"/>
              <line x1="0" y1="30" x2="200" y2="30" stroke="#ff6b35" strokeWidth="0.25"/>
              <rect x="20" y="10" width="40" height="40" fill="none" stroke="#ff6b35" strokeWidth="0.3"/>
              <rect x="140" y="10" width="40" height="40" fill="none" stroke="#ff6b35" strokeWidth="0.3"/>
            </svg>
          </div>
          <div className="absolute -top-10 left-1/3 w-[300px] h-[100px] rounded-full bg-[var(--brand)] opacity-[0.08] blur-[60px]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="h-9 w-9 rounded-[var(--radius-sm)] bg-[var(--brand)]/15 border border-[var(--brand)]/30 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-[var(--brand)]" />
            </div>
            <div>
              <h1 className="text-[16px] font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                Sales Dashboard
              </h1>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.16em] mt-0.5">Live operations · Mon, June 9</div>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--okta)]/10 border border-[var(--okta)]/30">
              <ShieldCheck className="h-3 w-3 text-[var(--okta-light)]" />
              <span className="text-[10px] text-[var(--okta-light)] font-semibold uppercase tracking-[0.14em]">
                Okta for AI Agents
              </span>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Dashboard content */}
          <main className="flex-1 overflow-y-auto p-6 relative">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-[var(--brand)] opacity-[0.04] blur-[120px] pointer-events-none" />
            <div className="relative">
              <DashboardContent firstName={firstName} />
            </div>
          </main>

          {/* AI Panel (right side) */}
          {aiOpen && (
            <div className="w-[480px] border-l border-[var(--border)] bg-gradient-to-b from-[var(--bg-card)] via-[#171732] to-[var(--bg-card)] flex flex-col shrink-0 relative">
              <div className="absolute inset-0 sports-texture opacity-30 pointer-events-none" />
              <AIChatPanel userName={user.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardContent({ firstName }: { firstName: string }) {
  return (
    <div className="max-w-[960px] fade-up">
      {/* Welcome banner */}
      <div className="relative mb-6 overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-r from-[var(--bg-card)] via-[#1f1f3d] to-[var(--bg-card)] border border-[var(--border)] p-5 shadow-[var(--shadow-md)]">
        <div className="absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full bg-[var(--brand)] opacity-[0.12] blur-[80px]" />
        <div className="absolute -bottom-12 -left-12 w-[200px] h-[200px] rounded-full bg-[#0ea5e9] opacity-[0.08] blur-[80px]" />
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 text-[var(--brand-light)]" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--brand-light)] font-semibold">Good morning</span>
            </div>
            <h2 className="text-[26px] font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Welcome back, {firstName}.
            </h2>
            <p className="text-[var(--text-secondary)] text-[13px] mt-1">
              <span className="text-[var(--brand-light)] font-semibold">3 orders</span> need your attention today
              · <span className="text-[var(--text)]">$142K</span> closed this month · keep equipping champions.
            </p>
          </div>
          {/* Activity sparkline */}
          <div className="flex items-end gap-1 h-[72px] shrink-0">
            <div className="text-right mr-3">
              <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)] font-semibold">7-Day Activity</div>
              <div className="text-[20px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>+18%</div>
              <div className="text-[10px] text-[var(--success)] flex items-center gap-1 justify-end">
                <TrendingUp className="h-2.5 w-2.5" /> vs last week
              </div>
            </div>
            <Sparkline />
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4 mb-6 stagger">
        <MetricCard
          label="Open Orders"
          value="23"
          change="+3 today"
          changePositive
          icon={ShoppingCart}
          color="var(--brand)"
          gradientFrom="rgba(255,107,53,0.18)"
          gradientTo="rgba(255,107,53,0.02)"
        />
        <MetricCard
          label="Low Stock Items"
          value="4"
          change="2 critical"
          icon={AlertTriangle}
          color="var(--warning)"
          gradientFrom="rgba(245,158,11,0.18)"
          gradientTo="rgba(245,158,11,0.02)"
        />
        <MetricCard
          label="Revenue (MTD)"
          value="$142K"
          change="+12% vs last month"
          changePositive
          icon={TrendingUp}
          color="var(--success)"
          gradientFrom="rgba(34,197,94,0.18)"
          gradientTo="rgba(34,197,94,0.02)"
        />
      </div>

      {/* Recent orders */}
      <div className="card-premium rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-[var(--bg-elevated)]/60 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand)]/15 border border-[var(--brand)]/25 flex items-center justify-center">
              <ShoppingCart className="h-3.5 w-3.5 text-[var(--brand)]" />
            </div>
            <h2 className="text-[14px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Recent Orders</h2>
          </div>
          <button className="text-[11px] text-[var(--brand)] hover:text-[var(--brand-light)] hover:underline flex items-center gap-1 font-semibold">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="divide-y divide-[var(--border-light)]">
          <OrderRow customer="Westside High School" product="Basketballs (TR-9)" qty={50} status="Fulfilled" time="2 hours ago" sport="basketball" />
          <OrderRow customer="Metro Sports Academy" product="Training Cones (20-pack)" qty={12} status="Processing" time="4 hours ago" sport="cone" />
          <OrderRow customer="State University" product="Regulation Hoops" qty={4} status="Pending" time="Yesterday" sport="hoop" />
          <OrderRow customer="Downtown YMCA" product="Team Uniforms" qty={30} status="Fulfilled" time="2 days ago" sport="jersey" />
          <OrderRow customer="Coastal FC" product="Field Soccer Balls" qty={24} status="Processing" time="2 days ago" sport="soccer" />
        </div>
      </div>

      {/* Low stock alert */}
      <div className="mt-4 relative overflow-hidden rounded-[var(--radius)] border border-[var(--warning)]/30 bg-gradient-to-r from-[var(--warning)]/[0.08] via-[var(--warning)]/[0.04] to-transparent px-5 py-4">
        <div className="absolute -top-8 -left-8 w-[120px] h-[120px] rounded-full bg-[var(--warning)] opacity-10 blur-[40px]" />
        <div className="relative flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--warning)]/15 border border-[var(--warning)]/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-[var(--text)]">Low stock alert</div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">
              <span className="text-[var(--warning)] font-medium">Regulation Hoops</span> (8 remaining),
              <span className="text-[var(--warning)] font-medium"> Court Flooring Panels</span> (8 remaining).
              Use AI Assistant to reorder from distributor →
            </div>
          </div>
        </div>
      </div>

      {/* Agent governance badge */}
      <div className="mt-4 relative overflow-hidden rounded-[var(--radius)] border border-[var(--okta)]/25 bg-gradient-to-r from-[var(--okta)]/[0.10] via-[var(--okta)]/[0.05] to-transparent px-5 py-4">
        <div className="absolute -top-8 -right-8 w-[160px] h-[160px] rounded-full bg-[var(--okta-light)] opacity-10 blur-[60px]" />
        <div className="relative flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--okta)]/20 border border-[var(--okta)]/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-[var(--okta-light)]" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-[var(--okta-light)] flex items-center gap-2">
              Agent-to-Agent Identity Chain Active
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-[var(--okta-light)] ping-slow" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[var(--okta-light)]" />
              </span>
            </div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">
              Every AI action is traceable to you. Sales Agent → Inventory Agent chain verified by Okta.
              {' '}<a href="/engineer" className="text-[var(--okta-light)] hover:underline font-medium">View technical details →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Sparkline() {
  const points = [12, 18, 15, 22, 19, 28, 24, 32, 30, 38, 35, 42]
  const max = Math.max(...points)
  return (
    <div className="flex items-end gap-[3px] h-full">
      {points.map((p, i) => {
        const heightPct = (p / max) * 100
        const isLast = i === points.length - 1
        return (
          <div
            key={i}
            className={`w-[6px] rounded-t-sm ${isLast ? 'bg-[var(--brand)] shadow-[0_0_8px_rgba(255,107,53,0.6)]' : 'bg-gradient-to-t from-[var(--brand)]/30 to-[var(--brand)]/70'}`}
            style={{ height: `${heightPct}%` }}
          />
        )
      })}
    </div>
  )
}

function MetricCard({
  label,
  value,
  change,
  changePositive,
  icon: Icon,
  color,
  gradientFrom,
  gradientTo,
}: {
  label: string
  value: string
  change: string
  changePositive?: boolean
  icon: typeof ShoppingCart
  color: string
  gradientFrom: string
  gradientTo: string
}) {
  return (
    <div
      className="group fade-up relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 cursor-pointer hover:-translate-y-1 hover:border-[var(--border-glow)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all"
      style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, transparent 50%), var(--bg-card)` }}
    >
      {/* Gradient header strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      {/* Glow */}
      <div
        className="absolute -top-12 -right-12 w-[140px] h-[140px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-[40px]"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)] font-semibold">{label}</span>
        <div
          className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center border"
          style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div className="relative text-[30px] font-bold tracking-tight text-[var(--text)] leading-none" style={{ fontFamily: 'var(--font-display)' }}>{value}</div>
      <div className={`relative text-[11px] mt-2 flex items-center gap-1.5 ${changePositive ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
        {changePositive ? <TrendingUp className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        <span className="font-medium">{change}</span>
      </div>
    </div>
  )
}

function SportIcon({ sport, className = 'h-4 w-4' }: { sport: string; className?: string }) {
  switch (sport) {
    case 'basketball':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3v18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
        </svg>
      )
    case 'hoop':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <ellipse cx="12" cy="9" rx="7" ry="2" />
          <path d="M5 9v3l3 8h8l3-8V9" />
        </svg>
      )
    case 'cone':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3 6 19h12L12 3z" />
          <path d="M8 11h8M7 15h10" />
        </svg>
      )
    case 'jersey':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M8 4 4 7v3l3-1v10h10V9l3 1V7l-4-3-3 2H11L8 4z" />
        </svg>
      )
    case 'soccer':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6 8 9l1.5 5h5L16 9 12 6zM3 13l5-1M21 13l-5-1M9.5 14 7 19M14.5 14l2.5 5M12 6V3" />
        </svg>
      )
    default:
      return null
  }
}

function OrderRow({ customer, product, qty, status, time, sport }: { customer: string; product: string; qty: number; status: string; time: string; sport: string }) {
  const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
    Fulfilled: { color: 'var(--success)', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
    Processing: { color: 'var(--brand)', bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.3)' },
    Pending: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  }
  const cfg = statusConfig[status] || statusConfig.Pending

  return (
    <div className="px-5 py-3.5 flex items-center gap-4 hover:bg-[var(--bg-elevated)]/50 transition group cursor-pointer">
      {/* Sport thumbnail */}
      <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand-dark)]/5 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand-light)] group-hover:scale-110 group-hover:border-[var(--brand)]/40 transition shrink-0">
        <SportIcon sport={sport} className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text)] truncate">{customer}</div>
        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
          {product} · <span className="text-[var(--text-muted)]">qty {qty}</span>
        </div>
      </div>
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] border"
        style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
        {status}
      </div>
      <span className="text-[10px] text-[var(--text-muted)] w-[80px] text-right uppercase tracking-[0.1em]">{time}</span>
    </div>
  )
}
