'use client'

import { useState } from 'react'
import { Package, ShoppingCart, Users, BarChart3, Bot, Settings, ChevronRight, TrendingUp, AlertTriangle, Clock, Activity, Trophy } from 'lucide-react'
import { AIChatPanel } from './AIChatPanel'

interface Props {
  user: { name: string; email: string }
  signOutAction: () => Promise<void>
}

const NAV = [
  { icon: BarChart3, label: 'Dashboard', active: true },
  { icon: ShoppingCart, label: 'Orders', active: false },
  { icon: Package, label: 'Inventory', active: false },
  { icon: Users, label: 'Customers', active: false },
  { icon: Activity, label: 'Activity Log', active: false },
  { icon: Settings, label: 'Settings', active: false },
]

export function AppShell({ user, signOutAction }: Props) {
  const [aiOpen, setAiOpen] = useState(true)

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside className="w-[220px] bg-[var(--sidebar)] flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[var(--brand)] flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12 a4 4 0 0 1 8 0" />
                <line x1="12" y1="8" x2="12" y2="4" />
              </svg>
            </div>
            <div>
              <div className="text-white text-[14px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>ProGear</div>
              <div className="text-[var(--sidebar-text)] text-[10px]">Sales Console</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3">
          {NAV.map(n => (
            <button
              key={n.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[13px] mb-0.5 transition ${
                n.active
                  ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]'
                  : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}

          <div className="mt-4 mb-2 px-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--sidebar-text)]/60">
              AI Agents
            </div>
          </div>
          <button
            onClick={() => setAiOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[13px] transition ${
              aiOpen
                ? 'bg-[var(--brand)]/10 text-[var(--brand-light)]'
                : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
            }`}
          >
            <Bot className="h-4 w-4" />
            AI Assistant
            {aiOpen && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--success)]" />}
          </button>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#e9b9a3] to-[#c47e5e] flex items-center justify-center text-[10px] font-bold text-[#3a1f12]">
              SS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[12px] font-medium truncate">{user.name}</div>
              <div className="text-[var(--sidebar-text)] text-[10px] truncate">{user.email}</div>
            </div>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="mt-2 text-[10px] text-[var(--sidebar-text)] hover:text-white transition">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with sports texture */}
        <header className="h-14 border-b-4 border-[var(--brand)] bg-gradient-to-r from-[var(--bg-card)] via-[#1e1e3a] to-[var(--bg-card)] flex items-center justify-between px-6 shrink-0 relative overflow-hidden">
          {/* Subtle sports pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg className="w-full h-full" viewBox="0 0 120 40" preserveAspectRatio="none">
              <line x1="60" y1="0" x2="60" y2="40" stroke="#ff6b35" strokeWidth="0.5"/>
              <circle cx="60" cy="20" r="12" fill="none" stroke="#ff6b35" strokeWidth="0.3"/>
              <line x1="0" y1="20" x2="120" y2="20" stroke="#ff6b35" strokeWidth="0.2"/>
            </svg>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <Trophy className="h-4 w-4 text-[var(--brand)]" />
            <h1 className="text-[16px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Sales Dashboard
            </h1>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-[11px] text-[var(--text-muted)]">
              Secured by <span className="font-semibold text-[var(--okta)]">Okta for AI Agents</span>
            </span>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Dashboard content */}
          <main className="flex-1 overflow-y-auto p-6">
            <DashboardContent />
          </main>

          {/* AI Panel (right side) */}
          {aiOpen && (
            <div className="w-[460px] border-l border-[var(--border)] bg-[var(--bg-card)] flex flex-col shrink-0">
              <AIChatPanel userName={user.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  return (
    <div className="max-w-[900px]">
      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Open Orders"
          value="23"
          change="+3 today"
          icon={ShoppingCart}
          color="var(--brand)"
        />
        <MetricCard
          label="Low Stock Items"
          value="4"
          change="2 critical"
          icon={AlertTriangle}
          color="var(--warning)"
        />
        <MetricCard
          label="Revenue (MTD)"
          value="$142K"
          change="+12% vs last month"
          icon={TrendingUp}
          color="var(--success)"
        />
      </div>

      {/* Recent orders */}
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Recent Orders</h2>
          <button className="text-[12px] text-[var(--brand)] hover:underline flex items-center gap-1">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="divide-y divide-[var(--border-light)]">
          <OrderRow customer="Westside High School" product="Basketballs (TR-9)" qty={50} status="Fulfilled" time="2 hours ago" />
          <OrderRow customer="Metro Sports Academy" product="Training Cones (20-pack)" qty={12} status="Processing" time="4 hours ago" />
          <OrderRow customer="State University" product="Regulation Hoops" qty={4} status="Pending" time="Yesterday" />
          <OrderRow customer="Downtown YMCA" product="Team Uniforms" qty={30} status="Fulfilled" time="2 days ago" />
        </div>
      </div>

      {/* Low stock alert */}
      <div className="mt-4 bg-[var(--warning-bg)] border border-[var(--warning)]/30 rounded-[var(--radius)] px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-[var(--warning)] mt-0.5 shrink-0" />
          <div>
            <div className="text-[13px] font-medium text-[var(--text)]">⚠️ Low stock alert</div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Regulation Hoops (8 remaining), Court Flooring Panels (8 remaining). Use AI Assistant to reorder from distributor →
            </div>
          </div>
        </div>
      </div>

      {/* Agent governance badge */}
      <div className="mt-4 bg-[var(--okta)]/10 border border-[var(--okta)]/20 rounded-[var(--radius)] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-[var(--okta)]/20 flex items-center justify-center shrink-0">
            <svg className="h-4 w-4 text-[var(--okta-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-medium text-[var(--okta-light)]">Agent-to-Agent Identity Chain Active</div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Every AI action is traceable to you. Sales Agent → Inventory Agent chain verified by Okta. <a href="/engineer" className="text-[var(--okta-light)] hover:underline">View technical details →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, change, icon: Icon, color }: { label: string; value: string; change: string; icon: typeof ShoppingCart; color: string }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm p-5 hover:border-[var(--brand)]/30 transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
        <div className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div className="text-[24px] font-bold tracking-tight text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>{value}</div>
      <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {change}
      </div>
    </div>
  )
}

function OrderRow({ customer, product, qty, status, time }: { customer: string; product: string; qty: number; status: string; time: string }) {
  const statusColor = status === 'Fulfilled' ? 'var(--success)' : status === 'Processing' ? 'var(--brand)' : 'var(--text-muted)'
  return (
    <div className="px-5 py-3.5 flex items-center gap-4 hover:bg-[var(--bg-elevated)]/50 transition">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[var(--text)] truncate">{customer}</div>
        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">🏀 {product} × {qty}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
        <span className="text-[11px] text-[var(--text-secondary)]">{status}</span>
      </div>
      <span className="text-[11px] text-[var(--text-muted)] w-[80px] text-right">{time}</span>
    </div>
  )
}
