'use client'

import { useState, useEffect, useRef } from 'react'
import { Package, ShoppingCart, Users, BarChart3, Bot, Settings, ChevronRight, TrendingUp, AlertTriangle, Clock, Activity, Trophy, Zap, ShieldCheck, Search, Filter, Mail, Calendar, DollarSign, KeyRound, Lock, CircleCheck, GitBranch, ServerCog, Award, Maximize2 } from 'lucide-react'
import { AIChatPanel } from './AIChatPanel'

interface Props {
  user: { name: string; email: string }
  signOutAction: () => Promise<void>
}

type Page = 'Dashboard' | 'Orders' | 'Inventory' | 'Customers' | 'Activity Log' | 'Settings'

const NAV: { icon: typeof BarChart3; label: Page; badge?: string }[] = [
  { icon: BarChart3, label: 'Dashboard' },
  { icon: ShoppingCart, label: 'Orders', badge: '3' },
  { icon: Package, label: 'Inventory' },
  { icon: Users, label: 'Customers' },
  { icon: Activity, label: 'Activity Log' },
  { icon: Settings, label: 'Settings' },
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
  const [poppedOut, setPoppedOut] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard')
  const popupRef = useRef<Window | null>(null)
  const firstName = user.name.split(' ')[0] || 'there'

  // Poll the popup window; when it closes, dock the panel back inline.
  useEffect(() => {
    if (!poppedOut) return
    const id = window.setInterval(() => {
      const w = popupRef.current
      if (!w || w.closed) {
        popupRef.current = null
        setPoppedOut(false)
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [poppedOut])

  // If the popup is already open and the user clicks the button again, focus it.
  const handlePopOut = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus()
      return
    }
    const features = 'width=520,height=820,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no'
    const w = window.open('/chat', 'progear-ai-chat', features)
    if (w) {
      popupRef.current = w
      setPoppedOut(true)
    }
  }

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
          {NAV.map(n => {
            const isActive = currentPage === n.label
            return (
              <button
                key={n.label}
                onClick={() => setCurrentPage(n.label)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[13px] mb-1 relative transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--brand)]/[0.18] to-[var(--brand)]/[0.04] text-white border border-[var(--brand)]/30'
                    : 'text-[var(--sidebar-text)] hover:bg-white/[0.04] hover:text-white border border-transparent'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--brand)] shadow-[0_0_8px_rgba(255,107,53,0.6)]" />}
                <n.icon className={`h-4 w-4 ${isActive ? 'text-[var(--brand)]' : 'group-hover:text-[var(--brand-light)]'} transition-colors`} />
                <span className="flex-1 text-left">{n.label}</span>
                {n.badge && (
                  <span className="px-1.5 py-px text-[9px] font-bold rounded-full bg-[var(--brand)] text-white shadow-[0_2px_6px_rgba(255,107,53,0.5)]">{n.badge}</span>
                )}
              </button>
            )
          })}

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
              {currentPage === 'Dashboard' && <DashboardContent firstName={firstName} />}
              {currentPage === 'Orders' && <OrdersPage />}
              {currentPage === 'Inventory' && <InventoryPage />}
              {currentPage === 'Customers' && <CustomersPage />}
              {currentPage === 'Activity Log' && <ActivityLogPage />}
              {currentPage === 'Settings' && <SettingsPage />}
            </div>
          </main>

          {/* AI Panel (right side) — hidden while popped out */}
          {aiOpen && !poppedOut && (
            <div className="w-[480px] border-l border-[var(--border)] bg-gradient-to-b from-[var(--bg-card)] via-[#171732] to-[var(--bg-card)] flex flex-col shrink-0 relative">
              <div className="absolute inset-0 sports-texture opacity-30 pointer-events-none" />
              <AIChatPanel userName={user.name} onPopOut={handlePopOut} />
            </div>
          )}

          {/* Docked banner — visible while popped out so user can re-dock */}
          {aiOpen && poppedOut && (
            <div className="w-[300px] border-l border-[var(--border)] bg-gradient-to-b from-[var(--bg-card)] via-[#171732] to-[var(--bg-card)] flex flex-col shrink-0 relative">
              <div className="absolute inset-0 sports-texture opacity-30 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full p-5 items-center justify-center text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[var(--brand)] via-[var(--brand-dark)] to-[#a83a05] flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,53,0.4)] mb-4">
                  <Maximize2 className="h-6 w-6 text-white" />
                </div>
                <div className="text-[14px] font-bold tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  AI chat is in another window
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mb-5 leading-relaxed">
                  ProGear AI was popped out to a separate window. Close that window or click below to dock it back here.
                </p>
                <button
                  onClick={() => {
                    if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
                    popupRef.current = null
                    setPoppedOut(false)
                  }}
                  className="px-4 py-2 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white text-[12px] font-semibold hover:shadow-[0_8px_24px_rgba(255,107,53,0.4)] hover:-translate-y-0.5 transition-all"
                >
                  Dock back here
                </button>
                <div className="mt-3 text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)] font-medium">
                  Or focus the popup
                </div>
                <button
                  onClick={() => popupRef.current?.focus()}
                  className="mt-2 text-[11px] text-[var(--brand-light)] hover:text-[var(--brand)] underline underline-offset-2"
                >
                  Bring popup to front
                </button>
              </div>
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

/* -------------------------------------------------------------------------- */
/*                                  Orders                                    */
/* -------------------------------------------------------------------------- */

type OrdersFilter = 'All' | 'Open' | 'Fulfilled'

interface OrderRecord {
  id: string
  customer: string
  product: string
  sport: string
  qty: number
  total: number
  status: 'Fulfilled' | 'Processing' | 'Pending'
  date: string
}

const ORDERS: OrderRecord[] = [
  { id: 'PG-10421', customer: 'Westside High School', product: 'Basketballs (TR-9 Indoor)', sport: 'basketball', qty: 50, total: 2475, status: 'Fulfilled', date: 'Jun 9, 2026' },
  { id: 'PG-10420', customer: 'Metro Sports Academy', product: 'Training Cones, 20-pack', sport: 'cone', qty: 12, total: 588, status: 'Processing', date: 'Jun 9, 2026' },
  { id: 'PG-10419', customer: 'State University Athletics', product: 'Regulation Hoops, breakaway', sport: 'hoop', qty: 4, total: 7960, status: 'Pending', date: 'Jun 8, 2026' },
  { id: 'PG-10418', customer: 'Downtown YMCA', product: 'Team Uniforms (full set)', sport: 'jersey', qty: 30, total: 2670, status: 'Fulfilled', date: 'Jun 7, 2026' },
  { id: 'PG-10417', customer: 'Coastal FC', product: 'Field Soccer Balls, size 5', sport: 'soccer', qty: 24, total: 1416, status: 'Processing', date: 'Jun 7, 2026' },
  { id: 'PG-10416', customer: 'Lincoln Middle School', product: 'Court Flooring Panels', sport: 'basketball', qty: 8, total: 4320, status: 'Pending', date: 'Jun 6, 2026' },
  { id: 'PG-10415', customer: 'Riverside Tennis Club', product: 'Pro Tennis Balls, case of 72', sport: 'soccer', qty: 6, total: 432, status: 'Fulfilled', date: 'Jun 5, 2026' },
  { id: 'PG-10414', customer: 'Eastside Elementary', product: 'PE Equipment Bundle', sport: 'cone', qty: 1, total: 1199, status: 'Fulfilled', date: 'Jun 5, 2026' },
  { id: 'PG-10413', customer: 'Mountain Region Schools', product: 'Whistle Sport Pack', sport: 'jersey', qty: 100, total: 1750, status: 'Fulfilled', date: 'Jun 4, 2026' },
  { id: 'PG-10412', customer: 'Bayview Athletic Club', product: 'Resistance Training Kit', sport: 'cone', qty: 15, total: 2985, status: 'Processing', date: 'Jun 3, 2026' },
]

function OrdersPage() {
  const [filter, setFilter] = useState<OrdersFilter>('All')

  const filtered = ORDERS.filter(o => {
    if (filter === 'All') return true
    if (filter === 'Fulfilled') return o.status === 'Fulfilled'
    return o.status !== 'Fulfilled'
  })

  return (
    <div className="max-w-[1100px] fade-up">
      <PageHeader
        icon={ShoppingCart}
        eyebrow="Sales operations"
        title="Orders"
        subtitle={`${ORDERS.length} active orders · $${ORDERS.reduce((s, o) => s + o.total, 0).toLocaleString()} pipeline value`}
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {(['All', 'Open', 'Fulfilled'] as OrdersFilter[]).map(f => {
          const active = filter === f
          const count = f === 'All' ? ORDERS.length : f === 'Fulfilled' ? ORDERS.filter(o => o.status === 'Fulfilled').length : ORDERS.filter(o => o.status !== 'Fulfilled').length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold transition flex items-center gap-2 border ${
                active
                  ? 'bg-gradient-to-r from-[var(--brand)]/20 to-[var(--brand)]/5 border-[var(--brand)]/40 text-white shadow-[0_4px_16px_rgba(255,107,53,0.2)]'
                  : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/30 hover:text-white'
              }`}
            >
              {f}
              <span className={`px-1.5 py-px rounded-full text-[9px] font-bold ${active ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Orders table */}
      <div className="card-premium rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)]">
        <div className="grid grid-cols-[110px_1.4fr_1.6fr_60px_90px_120px_100px] gap-3 px-5 py-3 bg-gradient-to-r from-[var(--bg-elevated)]/60 to-transparent border-b border-[var(--border)] text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--text-muted)]">
          <div>Order #</div>
          <div>Customer</div>
          <div>Products</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Total</div>
          <div>Status</div>
          <div className="text-right">Date</div>
        </div>
        <div className="divide-y divide-[var(--border-light)]">
          {filtered.map(o => (
            <OrdersRow key={o.id} order={o} />
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[12px] text-[var(--text-muted)]">No orders match this filter.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrdersRow({ order }: { order: OrderRecord }) {
  const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
    Fulfilled: { color: 'var(--success)', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
    Processing: { color: 'var(--brand)', bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.3)' },
    Pending: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  }
  const cfg = statusConfig[order.status]

  return (
    <div className="grid grid-cols-[110px_1.4fr_1.6fr_60px_90px_120px_100px] gap-3 px-5 py-3.5 items-center hover:bg-[var(--bg-elevated)]/50 transition group cursor-pointer">
      <div className="text-[11px] font-mono font-semibold text-[var(--brand-light)]">{order.id}</div>
      <div className="text-[12px] font-semibold text-[var(--text)] truncate">{order.customer}</div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand-light)] shrink-0 group-hover:scale-110 transition">
          <SportIcon sport={order.sport} className="h-3.5 w-3.5" />
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] truncate">{order.product}</div>
      </div>
      <div className="text-right text-[12px] font-semibold text-[var(--text)]">{order.qty}</div>
      <div className="text-right text-[12px] font-bold text-[var(--text)] tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>${order.total.toLocaleString()}</div>
      <div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] border"
          style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
          {order.status}
        </span>
      </div>
      <div className="text-right text-[10px] text-[var(--text-muted)] uppercase tracking-[0.08em]">{order.date}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Inventory                                   */
/* -------------------------------------------------------------------------- */

type InvCategory = 'All' | 'Balls' | 'Equipment' | 'Apparel' | 'Accessories'

interface ProductRecord {
  name: string
  sku: string
  stock: number
  reorder: number
  price: number
  category: Exclude<InvCategory, 'All'>
  sport: string
}

const PRODUCTS: ProductRecord[] = [
  { name: 'Indoor Basketball TR-9', sku: 'PG-BB-TR9', stock: 184, reorder: 50, price: 49.50, category: 'Balls', sport: 'basketball' },
  { name: 'Field Soccer Ball, Size 5', sku: 'PG-SC-S5P', stock: 92, reorder: 40, price: 59.00, category: 'Balls', sport: 'soccer' },
  { name: 'Pro Tennis Balls, Case 72', sku: 'PG-TN-C72', stock: 47, reorder: 20, price: 72.00, category: 'Balls', sport: 'soccer' },
  { name: 'Regulation Breakaway Hoop', sku: 'PG-EQ-HP1', stock: 8, reorder: 10, price: 1990.00, category: 'Equipment', sport: 'hoop' },
  { name: 'Court Flooring Panel, 4x4', sku: 'PG-EQ-CF4', stock: 8, reorder: 24, price: 540.00, category: 'Equipment', sport: 'basketball' },
  { name: 'Training Cone Set, 20-pack', sku: 'PG-EQ-TC20', stock: 76, reorder: 30, price: 49.00, category: 'Equipment', sport: 'cone' },
  { name: 'Mesh Team Jersey', sku: 'PG-AP-MJ1', stock: 412, reorder: 100, price: 38.00, category: 'Apparel', sport: 'jersey' },
  { name: 'Performance Compression Shorts', sku: 'PG-AP-CS2', stock: 268, reorder: 80, price: 28.00, category: 'Apparel', sport: 'jersey' },
  { name: 'Coach Whistle Sport Pack', sku: 'PG-AC-WS1', stock: 540, reorder: 100, price: 17.50, category: 'Accessories', sport: 'jersey' },
  { name: 'Resistance Training Kit', sku: 'PG-AC-RT3', stock: 31, reorder: 25, price: 199.00, category: 'Accessories', sport: 'cone' },
]

function InventoryPage() {
  const [category, setCategory] = useState<InvCategory>('All')
  const [search, setSearch] = useState('')

  const filtered = PRODUCTS.filter(p => {
    const catMatch = category === 'All' || p.category === category
    const q = search.trim().toLowerCase()
    const searchMatch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    return catMatch && searchMatch
  })

  const lowStockCount = PRODUCTS.filter(p => p.stock <= p.reorder).length

  return (
    <div className="max-w-[1100px] fade-up">
      <PageHeader
        icon={Package}
        eyebrow="Catalog & stock"
        title="Inventory"
        subtitle={`${PRODUCTS.length} active SKUs · ${lowStockCount} below reorder point`}
      />

      {/* Search + category tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[260px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SKU or product name..."
            className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-card)] border border-[var(--border)] text-[12px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)]/40 focus:ring-2 focus:ring-[var(--brand)]/15 transition"
          />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {(['All', 'Balls', 'Equipment', 'Apparel', 'Accessories'] as InvCategory[]).map(c => {
            const active = category === c
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-semibold transition border ${
                  active
                    ? 'bg-gradient-to-r from-[var(--brand)]/20 to-[var(--brand)]/5 border-[var(--brand)]/40 text-white'
                    : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/30 hover:text-white'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(p => (
          <ProductCard key={p.sku} product={p} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-[12px] text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
            No products match your filters.
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: ProductRecord }) {
  const isLow = product.stock <= product.reorder
  const stockPct = Math.min(100, (product.stock / Math.max(product.reorder * 3, 1)) * 100)

  return (
    <div className="group relative card-premium rounded-[var(--radius-lg)] border border-[var(--border)] p-4 hover:border-[var(--brand)]/30 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition cursor-pointer overflow-hidden">
      {isLow && (
        <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-[var(--radius-sm)] bg-[var(--warning)]/15 border-l border-b border-[var(--warning)]/30 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--warning)]">
          Low stock
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-[var(--radius)] bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand-dark)]/5 border border-[var(--brand)]/25 flex items-center justify-center text-[var(--brand-light)] shrink-0 group-hover:scale-105 transition">
          <SportIcon sport={product.sport} className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[var(--text)] leading-tight truncate">{product.name}</div>
          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">{product.sku}</div>
          <div className="mt-1.5">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-[0.12em] bg-[var(--okta)]/10 border border-[var(--okta)]/25 text-[var(--okta-light)]">
              {product.category}
            </span>
          </div>
        </div>
      </div>

      {/* Stock bar */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[var(--text-muted)]">Stock</span>
          <span className={`text-[16px] font-bold tabular-nums ${isLow ? 'text-[var(--warning)]' : 'text-[var(--text)]'}`} style={{ fontFamily: 'var(--font-display)' }}>
            {product.stock}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${stockPct}%`,
              background: isLow
                ? 'linear-gradient(90deg, var(--warning), #f97316)'
                : 'linear-gradient(90deg, var(--success), #4ade80)',
            }}
          />
        </div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1">Reorder at {product.reorder}</div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)]">
        <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-semibold">Unit price</span>
        <span className="text-[14px] font-bold text-[var(--brand-light)] tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
          ${product.price.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Customers                                   */
/* -------------------------------------------------------------------------- */

type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze'

interface CustomerRecord {
  name: string
  type: string
  tier: Tier
  email: string
  lastOrder: string
  totalSpend: number
  orderCount: number
}

const CUSTOMERS: CustomerRecord[] = [
  { name: 'Westside High School', type: 'Public school district', tier: 'Platinum', email: 'athletics@westsidehs.edu', lastOrder: 'Jun 9, 2026', totalSpend: 86420, orderCount: 28 },
  { name: 'State University Athletics', type: 'Division I university', tier: 'Platinum', email: 'procurement@stateu.edu', lastOrder: 'Jun 8, 2026', totalSpend: 142800, orderCount: 41 },
  { name: 'Metro Sports Academy', type: 'Private sports academy', tier: 'Gold', email: 'orders@metrosports.com', lastOrder: 'Jun 9, 2026', totalSpend: 54300, orderCount: 22 },
  { name: 'Downtown YMCA', type: 'Community center', tier: 'Gold', email: 'gear@downtownymca.org', lastOrder: 'Jun 7, 2026', totalSpend: 38950, orderCount: 19 },
  { name: 'Coastal FC', type: 'Youth soccer club', tier: 'Silver', email: 'eq@coastalfc.com', lastOrder: 'Jun 7, 2026', totalSpend: 19400, orderCount: 12 },
  { name: 'Lincoln Middle School', type: 'Public middle school', tier: 'Bronze', email: 'pe@lincolnms.edu', lastOrder: 'Jun 6, 2026', totalSpend: 8240, orderCount: 6 },
]

const TIER_CONFIG: Record<Tier, { color: string; bg: string; border: string }> = {
  Platinum: { color: '#e5e7eb', bg: 'rgba(229,231,235,0.12)', border: 'rgba(229,231,235,0.3)' },
  Gold: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)' },
  Silver: { color: '#a3a3a3', bg: 'rgba(163,163,163,0.12)', border: 'rgba(163,163,163,0.3)' },
  Bronze: { color: '#d97706', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)' },
}

function CustomersPage() {
  return (
    <div className="max-w-[1100px] fade-up">
      <PageHeader
        icon={Users}
        eyebrow="Account book"
        title="Customers"
        subtitle={`${CUSTOMERS.length} active accounts · $${CUSTOMERS.reduce((s, c) => s + c.totalSpend, 0).toLocaleString()} lifetime value`}
      />

      <div className="grid grid-cols-2 gap-4">
        {CUSTOMERS.map(c => (
          <CustomerCard key={c.name} customer={c} />
        ))}
      </div>
    </div>
  )
}

function CustomerCard({ customer }: { customer: CustomerRecord }) {
  const tier = TIER_CONFIG[customer.tier]
  const initials = customer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="group relative card-premium rounded-[var(--radius-lg)] border border-[var(--border)] p-5 hover:border-[var(--brand)]/30 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition cursor-pointer overflow-hidden">
      <div className="absolute -top-12 -right-12 w-[160px] h-[160px] rounded-full opacity-0 group-hover:opacity-100 blur-[60px] transition-opacity" style={{ backgroundColor: tier.color }} />

      <div className="relative flex items-start gap-3 mb-4">
        <div className="h-12 w-12 rounded-[var(--radius)] bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand-dark)]/5 border border-[var(--brand)]/30 flex items-center justify-center text-[var(--brand-light)] font-bold text-[14px] shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-[var(--text)] leading-tight truncate">{customer.name}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{customer.type}</div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] border shrink-0"
          style={{ color: tier.color, backgroundColor: tier.bg, borderColor: tier.border }}
        >
          <Award className="h-2.5 w-2.5" />
          {customer.tier}
        </span>
      </div>

      <div className="relative space-y-2 mb-4">
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <Mail className="h-3 w-3 text-[var(--text-muted)]" />
          <span className="truncate">{customer.email}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
          Last order <span className="text-[var(--text)] font-semibold">{customer.lastOrder}</span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border-light)]">
        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold mb-1">Total spend</div>
          <div className="text-[18px] font-bold text-[var(--text)] tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
            ${customer.totalSpend.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold mb-1">Orders</div>
          <div className="text-[18px] font-bold text-[var(--brand-light)] tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
            {customer.orderCount}
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Activity Log                                  */
/* -------------------------------------------------------------------------- */

type LogEventType = 'ORDER' | 'STOCK CHECK' | 'APPROVAL' | 'AUTH' | 'AGENT' | 'TOOL CALL'

interface LogEntry {
  ts: string
  type: LogEventType
  actor: string
  description: string
  context?: string
}

const LOG_ENTRIES: LogEntry[] = [
  { ts: '14:32:11', type: 'AUTH', actor: 'sarah.sales@progear', description: 'OIDC sign-in successful', context: 'oktaforai.oktapreview.com' },
  { ts: '14:32:14', type: 'AGENT', actor: 'sales-agent', description: 'ID-JAG token minted for delegation chain', context: 'audience: inventory-agent' },
  { ts: '14:33:02', type: 'ORDER', actor: 'sarah.sales', description: 'Quote requested: 50x Basketballs TR-9 for Westside HS', context: 'PG-10421' },
  { ts: '14:33:05', type: 'STOCK CHECK', actor: 'inventory-agent', description: 'Verified stock: 184 units available', context: 'SKU PG-BB-TR9' },
  { ts: '14:33:07', type: 'TOOL CALL', actor: 'inventory-agent', description: 'mcp.tool.create_quote invoked', context: 'amount: $2,475.00' },
  { ts: '14:33:09', type: 'APPROVAL', actor: 'okta-fga', description: 'FGA check passed: under_threshold($5K)', context: 'auto-approved' },
  { ts: '14:34:18', type: 'ORDER', actor: 'sarah.sales', description: 'Order requested: 4x Regulation Hoops for State University', context: 'PG-10419' },
  { ts: '14:34:21', type: 'STOCK CHECK', actor: 'inventory-agent', description: 'Low stock detected: 8 units', context: 'reorder threshold: 10' },
  { ts: '14:34:23', type: 'APPROVAL', actor: 'okta-fga', description: 'Approval required: amount $7,960 exceeds $5K threshold', context: 'escalated to manager' },
  { ts: '14:35:02', type: 'APPROVAL', actor: 'm.rivera@progear', description: 'Manager approved order PG-10419', context: 'CIBA push acknowledged' },
  { ts: '14:35:04', type: 'TOOL CALL', actor: 'inventory-agent', description: 'mcp.tool.commit_order invoked', context: 'status: pending' },
  { ts: '14:36:40', type: 'AUTH', actor: 'okta-system-log', description: 'Audit trail synced to SIEM', context: '12 events flushed' },
]

const TYPE_COLORS: Record<LogEventType, { fg: string; bg: string; border: string }> = {
  ORDER: { fg: '#ff8c5a', bg: 'rgba(255,107,53,0.15)', border: 'rgba(255,107,53,0.35)' },
  'STOCK CHECK': { fg: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' },
  APPROVAL: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  AUTH: { fg: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  AGENT: { fg: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  'TOOL CALL': { fg: '#e9b9a3', bg: 'rgba(233,185,163,0.10)', border: 'rgba(233,185,163,0.25)' },
}

function ActivityLogPage() {
  return (
    <div className="max-w-[1000px] fade-up">
      <PageHeader
        icon={Activity}
        eyebrow="Live audit trail"
        title="Activity Log"
        subtitle="Every agent action traceable to a human via Okta for AI Agents"
      />

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#070710] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#0d0d20] to-[#0a0a18] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/60" />
            </div>
            <span className="ml-3 text-[10px] uppercase tracking-[0.16em] font-mono text-[var(--text-muted)]">okta-system-log · live</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--success)] font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-[var(--success)] ping-slow" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            </span>
            streaming
          </div>
        </div>

        {/* Log content */}
        <div className="px-4 py-4 font-mono text-[11.5px] space-y-1.5 max-h-[640px] overflow-y-auto">
          {LOG_ENTRIES.map((e, i) => {
            const c = TYPE_COLORS[e.type]
            return (
              <div key={i} className="flex items-start gap-3 py-1.5 px-2 rounded hover:bg-white/[0.02] transition">
                <span className="text-[var(--text-muted)] tabular-nums shrink-0 select-none">{e.ts}</span>
                <span
                  className="inline-flex items-center justify-center px-2 py-px rounded text-[9px] font-bold uppercase tracking-[0.14em] border shrink-0 min-w-[88px]"
                  style={{ color: c.fg, backgroundColor: c.bg, borderColor: c.border }}
                >
                  {e.type}
                </span>
                <span className="text-[var(--brand-light)] shrink-0 font-semibold">{e.actor}</span>
                <span className="text-[var(--text)] flex-1">{e.description}</span>
                {e.context && (
                  <span className="text-[var(--text-muted)] shrink-0 italic">
                    <span className="text-[var(--okta-light)]/60">{'<-'}</span> {e.context}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Terminal footer */}
        <div className="px-4 py-2 bg-gradient-to-r from-[#0d0d20] to-[#0a0a18] border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
          <span>{LOG_ENTRIES.length} events · last 5 minutes</span>
          <span className="text-[var(--okta-light)]">audit retention: 90d</span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Settings                                   */
/* -------------------------------------------------------------------------- */

function SettingsPage() {
  return (
    <div className="max-w-[860px] fade-up">
      <PageHeader
        icon={Settings}
        eyebrow="Account & security"
        title="Settings"
        subtitle="Manage your profile, security, AI agent delegation, and Okta connection"
      />

      <div className="space-y-4">
        {/* Profile */}
        <SettingsSection icon={Users} title="Profile" description="Your contact and role info inside ProGear">
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-6">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-semibold">Name</div>
            <div className="text-[13px] text-[var(--text)] font-semibold">Sarah Sales</div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-semibold">Email</div>
            <div className="text-[13px] text-[var(--text)]">sarah.sales@progear.demo</div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-semibold">Role</div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] bg-[var(--brand)]/15 border border-[var(--brand)]/30 text-[var(--brand-light)]">Sales Manager</span>
              <span className="text-[11px] text-[var(--text-secondary)]">· Pacific NW region</span>
            </div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-semibold">Manager</div>
            <div className="text-[13px] text-[var(--text)]">Marcus Rivera, VP Sales</div>
          </div>
        </SettingsSection>

        {/* Security */}
        <SettingsSection icon={Lock} title="Security" description="MFA, sessions, and recent sign-ins">
          <div className="space-y-3">
            <SettingRow
              label="Multi-factor authentication"
              valueIcon={CircleCheck}
              valueIconColor="var(--success)"
              value="Okta Verify enrolled"
              note="Push + biometric"
            />
            <SettingRow
              label="Last sign-in"
              valueIcon={Clock}
              valueIconColor="var(--text-muted)"
              value="Today at 9:14 AM"
              note="Chrome on macOS · Seattle, WA"
            />
            <SettingRow
              label="Active sessions"
              valueIcon={KeyRound}
              valueIconColor="var(--okta-light)"
              value="2 devices"
              note="Web · iOS app"
            />
          </div>
        </SettingsSection>

        {/* AI Agent */}
        <SettingsSection icon={Bot} title="AI Agent" description="Delegation chain authorized by Okta">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-[var(--success)] ping-slow" />
              <span className="relative h-2 w-2 rounded-full bg-[var(--success)]" />
            </span>
            <span className="text-[12px] text-[var(--success)] font-semibold">Agent active · ID-JAG chain verified</span>
          </div>

          {/* Delegation chain visual */}
          <div className="rounded-[var(--radius)] border border-[var(--border-light)] bg-[var(--bg-elevated)]/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold mb-3">Delegation chain</div>
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              <DelegationNode label="You" sub="sarah.sales" color="var(--brand)" icon={Users} />
              <ChainArrow />
              <DelegationNode label="Sales Agent" sub="sales-agent.progear" color="var(--okta-light)" icon={Bot} />
              <ChainArrow />
              <DelegationNode label="Inventory Agent" sub="inventory-agent.progear" color="var(--okta-light)" icon={ServerCog} />
              <ChainArrow />
              <DelegationNode label="MCP Tools" sub="quote, stock, order" color="var(--success)" icon={GitBranch} />
            </div>
          </div>
        </SettingsSection>

        {/* Okta Connection */}
        <SettingsSection icon={ShieldCheck} title="Okta Connection" description="Identity provider and authorization status">
          <div className="space-y-3">
            <SettingRow
              label="Tenant URL"
              value="oktaforai.oktapreview.com"
              valueClass="font-mono text-[12px]"
              note="Okta Preview · Workforce"
            />
            <SettingRow
              label="Connection status"
              valueIcon={CircleCheck}
              valueIconColor="var(--success)"
              value="Connected"
              note="ID-JAG, FGA, audit log all green"
              statusDot="var(--success)"
            />
            <SettingRow
              label="Workload Principal"
              value="ai-agent-sales-001"
              valueClass="font-mono text-[12px] text-[var(--okta-light)]"
              note="Bound to sarah.sales@progear.demo"
            />
            <SettingRow
              label="FGA store"
              value="progear-prod"
              valueClass="font-mono text-[12px]"
              note="42 type definitions · 1.2M tuples"
            />
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({ icon: Icon, title, description, children }: { icon: typeof Settings; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="card-premium rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--bg-elevated)]/60 to-transparent flex items-center gap-3">
        <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--brand)]/15 border border-[var(--brand)]/30 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[var(--brand)]" />
        </div>
        <div>
          <div className="text-[14px] font-bold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>{title}</div>
          <div className="text-[11px] text-[var(--text-muted)]">{description}</div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function SettingRow({
  label,
  value,
  valueClass,
  valueIcon: ValueIcon,
  valueIconColor,
  note,
  statusDot,
}: {
  label: string
  value: string
  valueClass?: string
  valueIcon?: typeof CircleCheck
  valueIconColor?: string
  note?: string
  statusDot?: string
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-semibold pt-0.5">{label}</div>
      <div>
        <div className={`flex items-center gap-2 text-[13px] text-[var(--text)] font-semibold ${valueClass || ''}`}>
          {statusDot && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full ping-slow" style={{ backgroundColor: statusDot }} />
              <span className="relative h-2 w-2 rounded-full" style={{ backgroundColor: statusDot }} />
            </span>
          )}
          {ValueIcon && <ValueIcon className="h-3.5 w-3.5" style={{ color: valueIconColor }} />}
          <span>{value}</span>
        </div>
        {note && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{note}</div>}
      </div>
    </div>
  )
}

function DelegationNode({ label, sub, color, icon: Icon }: { label: string; sub: string; color: string; icon: typeof Users }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border" style={{ backgroundColor: `${color}10`, borderColor: `${color}40` }}>
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <div className="leading-tight">
        <div className="text-[11px] font-semibold text-[var(--text)]">{label}</div>
        <div className="text-[9px] font-mono text-[var(--text-muted)]">{sub}</div>
      </div>
    </div>
  )
}

function ChainArrow() {
  return (
    <div className="flex items-center text-[var(--text-muted)]">
      <ChevronRight className="h-3 w-3" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Page Header                                   */
/* -------------------------------------------------------------------------- */

function PageHeader({ icon: Icon, eyebrow, title, subtitle }: { icon: typeof BarChart3; eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1.5">
        <Filter className="h-3 w-3 text-[var(--brand-light)]" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--brand-light)]">{eyebrow}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-[var(--radius)] bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand-dark)]/5 border border-[var(--brand)]/30 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h2 className="text-[26px] font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
