'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'
import {
  GraduationCap, CreditCard, FileText, Megaphone, AlertTriangle,
  Briefcase, MessageSquare, Calendar, Settings,
  Users, ArrowRight, CheckCircle2, HelpCircle, RefreshCw,
  Palette,
} from 'lucide-react'

const SECTIONS = [
  { group: 'People & operations', label: 'Verification', desc: 'Approve talent and properties.', href: '/admin/verification', icon: <Users size={17} /> },
  { group: 'People & operations', label: 'Messages', desc: 'Review platform conversations.', href: '/admin/messages', icon: <MessageSquare size={17} /> },
  { group: 'People & operations', label: 'Platform Reviews', desc: 'Read Talent and property feedback about Spa Platform.', href: '/admin/platform-reviews', icon: <MessageSquare size={17} /> },
  { group: 'People & operations', label: 'Complaints', desc: 'Resolve reported issues.', href: '/admin/complaints', icon: <AlertTriangle size={17} /> },
  { group: 'Content & revenue', label: 'Website & Brand', desc: 'Control public content and identity.', href: '/admin/website', icon: <Palette size={17} /> },
  { group: 'Content & revenue', label: 'Academy', desc: 'Courses, learners and certificates.', href: '/admin/academy', icon: <GraduationCap size={17} /> },
  { group: 'Content & revenue', label: 'Blog & Journal', desc: 'Write, illustrate and publish editorial content.', href: '/admin/blog', icon: <FileText size={17} /> },
  { group: 'Content & revenue', label: 'Newsletters & Campaigns', desc: 'Create, preview, test and send newsletters.', href: '/admin/campaigns', icon: <Megaphone size={17} /> },
  { group: 'Content & revenue', label: 'Sponsored Ads', desc: 'Approve paid brand placements.', href: '/admin/advertising', icon: <Megaphone size={17} /> },
  { group: 'Platform', label: 'Job Listings', desc: 'Review live and closed roles.', href: '/admin/jobs', icon: <Briefcase size={17} /> },
  { group: 'Platform', label: 'Residency Listings', desc: 'Review programmes and placements.', href: '/admin/residency', icon: <Calendar size={17} /> },
  { group: 'Platform', label: 'Agency Money', desc: 'Bookings, payouts and disputes.', href: '/admin/agency', icon: <CreditCard size={17} /> },
  { group: 'Platform', label: 'Taxonomy', desc: 'Skills, brands and qualifications.', href: '/admin/taxonomy', icon: <Briefcase size={17} /> },
  { group: 'Platform', label: 'Settings', desc: 'Platform configuration.', href: '/admin/settings', icon: <Settings size={17} /> },
]

type Health = {
  status: 'healthy' | 'attention'
  attention: number
  featured: number
  agency: number
  preferred: number
  academy: { enrolments: number; revenue_pence: number; legacy_records: number }
  agency_money: { collected_pounds: number; refunded_pounds: number; payout_pending_pounds: number; open_disputes: number }
  payment_sources: { stripe: number; manual: number; legacy: number; unknown: number }
  recruitment?: { conversations: number; applications: number; shortlisted: number; interviewed: number; offers: number; accepted: number; hired: number; rejected: number }
  scale?: { users: number; candidates: number; employers: number; live_jobs: number; applications: number; messages: number; notification_poll_seconds: number }
  expired_live_jobs: number
}

export default function AdminDashboard() {
  const [health, setHealth] = useState<Health | null>(null)
  const [healthError, setHealthError] = useState('')
  const [healthLoading, setHealthLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  async function loadHealth() {
    setHealthLoading(true); setHealthError('')
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load platform health.')
      setHealth(data)
    } catch (e: any) { setHealthError(e.message || 'Could not load platform health.') } finally { setHealthLoading(false) }
  }

  useEffect(() => { loadHealth() }, [])

  return <DashboardShell role="admin" userName="Admin">
    <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div><p className="dashboard-eyebrow">Wellness House Collective</p><h1 className="dashboard-title">Administration</h1><p className="dashboard-intro">A focused view of the people, content and commercial work that needs your attention.</p></div><div className="relative flex items-center gap-2 self-start"><button type="button" onClick={loadHealth} className="btn-secondary !p-2.5" aria-label="Refresh platform health"><RefreshCw size={16} className={healthLoading ? 'animate-spin' : ''} /></button><button type="button" onClick={() => setShowHelp(v => !v)} className="btn-secondary !p-2.5" aria-label="About platform health"><HelpCircle size={16} /></button>{showHelp && <div className="absolute right-0 top-12 z-20 w-[320px] rounded-2xl border border-border bg-white p-4 text-[12px] leading-5 text-secondary shadow-xl">This panel checks live WHC platform data. Stripe means a paid entitlement is linked to Stripe. Manual means access was granted outside Stripe. Legacy means an older record needs review.</div>}</div></div>

    <section className="dashboard-panel mb-8 overflow-hidden !p-0"><div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full ${health?.status === 'healthy' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{health?.status === 'healthy' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</span><div><p className="text-[13px] font-semibold text-ink">Platform & payments health</p><p className="text-[11px] text-muted">Live status across payments, entitlements and platform scale.</p></div></div>{!healthLoading && health && <span className={`self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${health.attention === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{health.attention === 0 ? 'All clear' : `${health.attention} need attention`}</span>}</div>
      {healthLoading ? <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-white" />)}</div> : healthError ? <div className="px-5 py-5 text-[13px] text-red-600">{healthError}</div> : health && <><div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 xl:grid-cols-6"><HealthCell label="Stripe linked" value={health.payment_sources.stripe} detail="active entitlements" /><HealthCell label="Featured Talent" value={health.featured} detail="currently featured" /><HealthCell label="Agency" value={health.agency} detail="approved & available" /><HealthCell label="Preferred" value={health.preferred} detail="active employers" /><HealthCell label="Academy" value={health.academy.enrolments} detail={`£${(health.academy.revenue_pence / 100).toFixed(2)} recorded`} /><HealthCell label="Open disputes" value={health.agency_money.open_disputes} detail="Agency bookings" alert={health.agency_money.open_disputes > 0} /></div></>}
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{['People & operations', 'Content & revenue', 'Platform'].map(group => <section key={group} className="dashboard-panel"><p className="dashboard-eyebrow">{group}</p><div>{SECTIONS.filter(section => section.group === group).map(section => <Link key={section.href} href={section.href} className="dashboard-list-row group"><div className="flex items-start gap-3"><span className="text-accent mt-0.5">{section.icon}</span><span><span className="block text-[13px] font-medium text-ink">{section.label}</span><span className="block text-[11px] text-muted mt-0.5">{section.desc}</span></span></div><ArrowRight size={13} className="text-muted group-hover:text-accent" /></Link>)}</div></section>)}</div>
  </DashboardShell>
}

function HealthCell({ label, value, detail, alert = false }: { label: string; value: number; detail: string; alert?: boolean }) { return <div className="bg-white px-5 py-4"><p className="text-[10px] uppercase tracking-[0.13em] text-muted">{label}</p><p className={`mt-1 text-[24px] font-semibold tracking-[-0.03em] ${alert ? 'text-amber-700' : 'text-ink'}`}>{value}</p><p className="mt-1 text-[11px] text-muted">{detail}</p></div> }
