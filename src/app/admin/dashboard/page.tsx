'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Users, Briefcase, Clock, FileText, MessageSquare, CheckCircle, XCircle, ArrowUp, ArrowDown, TrendingUp, DollarSign, UserPlus, Send, Heart } from 'lucide-react'
import { notify } from '@/lib/notify'
import Link from 'next/link'

const TIER_PRICES: Record<string, number> = { Bronze: 150, Silver: 175, Gold: 200, Platinum: 250 }
const TIER_COLOURS: Record<string, string> = { Bronze: '#92400E', Silver: '#6B7280', Gold: '#C9A96E', Platinum: '#1a1a1a' }
const TIER_BG: Record<string, string> = { Bronze: '#FEF3C7', Silver: '#F3F4F6', Gold: '#FDF6EC', Platinum: '#E5E7EB' }

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [lastMonthStats, setLastMonthStats] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [regChart, setRegChart] = useState<{ month: string; talent: number; employer: number }[]>([])
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({})
  const [health, setHealth] = useState({ appsThisMonth: 0, appsLastMonth: 0, avgMatch: 0, completionRate: 0, msgsThisMonth: 0 })
  const [activityFeed, setActivityFeed] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

      // ── Core stats ──
      const [talent, employers, pendingT, pendingE, jobs, apps, msgs] = await Promise.all([
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
      ])

      // ── Last month stats for trend ──
      const [talentLM, employersLM, appsLM] = await Promise.all([
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }).lt('created_at', thisMonthStart),
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }).lt('created_at', thisMonthStart),
        supabase.from('applications').select('id', { count: 'exact', head: true }).lt('created_at', thisMonthStart),
      ])

      const currentStats = {
        talent: talent.count || 0, employers: employers.count || 0,
        pending: (pendingT.count || 0) + (pendingE.count || 0),
        jobs: jobs.count || 0, applications: apps.count || 0, messages: msgs.count || 0,
      }
      setStats(currentStats)
      setLastMonthStats({ talent: talentLM.count || 0, employers: employersLM.count || 0, applications: appsLM.count || 0 })

      // ── Registrations chart (last 6 months) ──
      const [allTalent, allEmployers] = await Promise.all([
        supabase.from('candidate_profiles').select('created_at').order('created_at', { ascending: true }),
        supabase.from('employer_profiles').select('created_at').order('created_at', { ascending: true }),
      ])

      const months: { month: string; talent: number; employer: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
        const tCount = (allTalent.data || []).filter(r => { const rd = new Date(r.created_at); return rd >= d && rd < end }).length
        const eCount = (allEmployers.data || []).filter(r => { const rd = new Date(r.created_at); return rd >= d && rd < end }).length
        months.push({ month: label, talent: tCount, employer: eCount })
      }
      setRegChart(months)

      // ── Revenue by tier ──
      const { data: allJobs } = await supabase.from('job_listings').select('tier')
      const tiers: Record<string, number> = {}
      for (const j of allJobs || []) { const t = j.tier || 'Bronze'; tiers[t] = (tiers[t] || 0) + 1 }
      setTierCounts(tiers)

      // ── Platform health ──
      const [appsThisM, appsLastM, matchScores, completionData, msgsThisM] = await Promise.all([
        supabase.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
        supabase.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lt('created_at', thisMonthStart),
        supabase.from('applications').select('match_score').not('match_score', 'is', null).limit(500),
        supabase.from('candidate_profiles').select('profile_completion_score'),
        supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
      ])

      const scores = (matchScores.data || []).map(a => a.match_score).filter(Boolean)
      const avgMatch = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const completeProfiles = (completionData.data || []).filter(p => (p.profile_completion_score || 0) > 80).length
      const totalProfiles = (completionData.data || []).length
      const completionRate = totalProfiles > 0 ? Math.round((completeProfiles / totalProfiles) * 100) : 0

      setHealth({
        appsThisMonth: appsThisM.count || 0,
        appsLastMonth: appsLastM.count || 0,
        avgMatch,
        completionRate,
        msgsThisMonth: msgsThisM.count || 0,
      })

      // ── Recent registrations (for approval) ──
      const { data: recentTalent } = await supabase.from('candidate_profiles').select('id, user_id, full_name, role_level, approval_status, created_at').order('created_at', { ascending: false }).limit(5)
      const { data: recentEmployers } = await supabase.from('employer_profiles').select('id, user_id, company_name, property_name, approval_status, created_at').order('created_at', { ascending: false }).limit(5)

      const combined = [
        ...(recentTalent || []).map(t => ({ ...t, type: 'talent', name: t.full_name, detail: t.role_level })),
        ...(recentEmployers || []).map(e => ({ ...e, type: 'employer', name: e.property_name || e.company_name, detail: 'Property' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)
      setRecent(combined)

      // ── Activity feed ──
      const [feedApps, feedMsgs, feedSignups] = await Promise.all([
        supabase.from('applications').select('id, created_at, job_id, candidate_id').order('created_at', { ascending: false }).limit(7),
        supabase.from('messages').select('id, created_at, sender_id').order('created_at', { ascending: false }).limit(7),
        supabase.from('candidate_profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(6),
      ])

      const feed = [
        ...(feedApps.data || []).map(a => ({ type: 'application', desc: 'New application submitted', time: a.created_at })),
        ...(feedMsgs.data || []).map(m => ({ type: 'message', desc: 'Message sent', time: m.created_at })),
        ...(feedSignups.data || []).map(s => ({ type: 'signup', desc: `${s.full_name || 'New user'} registered`, time: s.created_at })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20)
      setActivityFeed(feed)

      setLoading(false)
    }
    load()
  }, [])

  const handleApprove = async (type: string, id: string) => {
    const table = type === 'talent' ? 'candidate_profiles' : 'employer_profiles'
    await supabase.from(table).update({ approval_status: 'approved' }).eq('id', id)
    setRecent(recent.map(r => r.id === id ? { ...r, approval_status: 'approved' } : r))
    setStats({ ...stats, pending: Math.max(0, (stats.pending || 0) - 1) })
    const profile = recent.find(r => r.id === id)
    if (profile?.user_id) {
      const dashboard = type === 'talent' ? '/talent/dashboard' : '/employer/dashboard'
      notify(profile.user_id, 'profile_approved', 'Profile approved', 'Your profile has been approved and is now live.', dashboard)
    }
  }

  const handleReject = async (type: string, id: string) => {
    const table = type === 'talent' ? 'candidate_profiles' : 'employer_profiles'
    await supabase.from(table).update({ approval_status: 'rejected' }).eq('id', id)
    setRecent(recent.map(r => r.id === id ? { ...r, approval_status: 'rejected' } : r))
    setStats({ ...stats, pending: Math.max(0, (stats.pending || 0) - 1) })
  }

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const talentGrowth = pctChange(stats.talent || 0, lastMonthStats.talent || 0)
  const employerGrowth = pctChange(stats.employers || 0, lastMonthStats.employers || 0)
  const appGrowth = pctChange(health.appsThisMonth, health.appsLastMonth)
  const maxReg = Math.max(...regChart.map(m => m.talent + m.employer), 1)
  const totalRevenue = Object.entries(tierCounts).reduce((sum, [tier, count]) => sum + count * (TIER_PRICES[tier] || 150), 0)

  const FEED_ICONS: Record<string, React.ReactNode> = {
    application: <FileText size={12} className="text-blue-500" />,
    message: <Send size={12} className="text-emerald-500" />,
    signup: <UserPlus size={12} className="text-accent" />,
  }

  if (loading) return <DashboardShell role="admin" userName="Admin"><div className="animate-pulse space-y-4"><div className="h-8 w-40 bg-surface rounded" /><div className="grid grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="h-24 bg-surface rounded-xl" />)}</div><div className="h-64 bg-surface rounded-xl" /></div></DashboardShell>

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">Admin Dashboard</h1>
        <p className="text-[13px] text-muted mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* ── Stat cards with trends ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total talent', value: stats.talent, icon: <Users size={16} />, href: '/admin/users', trend: talentGrowth },
          { label: 'Total employers', value: stats.employers, icon: <Briefcase size={16} />, href: '/admin/users', trend: employerGrowth },
          { label: 'Pending approvals', value: stats.pending, icon: <Clock size={16} />, href: '/admin/users', highlight: (stats.pending || 0) > 0 },
          { label: 'Active jobs', value: stats.jobs, icon: <FileText size={16} /> },
          { label: 'Applications', value: stats.applications, icon: <FileText size={16} />, trend: pctChange(stats.applications || 0, lastMonthStats.applications || 0) },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16} /> },
        ].map(s => (
          <Link key={s.label} href={s.href || '#'} className={`dashboard-card hover:border-ink/20 transition-all ${s.highlight ? 'border-amber-300 bg-amber-50/30' : ''}`}>
            <div className="text-muted mb-2">{s.icon}</div>
            <div className="flex items-end gap-2">
              <p className="text-[24px] font-semibold text-ink">{s.value}</p>
              {s.trend !== undefined && s.trend !== 0 && (
                <span className={`text-[11px] font-medium flex items-center gap-0.5 mb-1 ${s.trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.trend > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{Math.abs(s.trend)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ── Registrations chart ── */}
        <div className="dashboard-card lg:col-span-2">
          <p className="text-[14px] font-medium text-ink mb-4">Registrations (Last 6 Months)</p>
          <div className="flex items-end gap-3 h-40">
            {regChart.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: 120 }}>
                  <div className="w-[40%] rounded-t transition-all" style={{ height: `${Math.max((m.talent / maxReg) * 100, 4)}%`, backgroundColor: '#2563EB' }} title={`Talent: ${m.talent}`} />
                  <div className="w-[40%] rounded-t transition-all" style={{ height: `${Math.max((m.employer / maxReg) * 100, 4)}%`, backgroundColor: '#C9A96E' }} title={`Employers: ${m.employer}`} />
                </div>
                <span className="text-[10px] text-muted">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <span className="flex items-center gap-1.5 text-[11px] text-muted"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#2563EB' }} />Talent</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#C9A96E' }} />Employers</span>
          </div>
        </div>

        {/* ── Revenue summary ── */}
        <div className="dashboard-card">
          <p className="text-[14px] font-medium text-ink mb-1">Revenue Summary</p>
          <p className="text-[28px] font-semibold mb-4" style={{ color: '#C9A96E' }}>£{totalRevenue.toLocaleString()}</p>
          <div className="space-y-2.5">
            {['Platinum', 'Gold', 'Silver', 'Bronze'].map(tier => {
              const count = tierCounts[tier] || 0
              return (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: TIER_BG[tier], color: TIER_COLOURS[tier] }}>{tier}</span>
                    <span className="text-[12px] text-muted">{count} listing{count !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-[12px] font-medium text-ink">£{(count * (TIER_PRICES[tier] || 150)).toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Platform health ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="dashboard-card">
          <p className="text-[11px] text-muted mb-1">Apps this month</p>
          <div className="flex items-end gap-2">
            <p className="text-[22px] font-semibold text-ink">{health.appsThisMonth}</p>
            {appGrowth !== 0 && <span className={`text-[10px] font-medium mb-0.5 ${appGrowth > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{appGrowth > 0 ? '↑' : '↓'}{Math.abs(appGrowth)}%</span>}
          </div>
        </div>
        <div className="dashboard-card">
          <p className="text-[11px] text-muted mb-1">Avg match score</p>
          <p className="text-[22px] font-semibold" style={{ color: '#C9A96E' }}>{health.avgMatch}%</p>
        </div>
        <div className="dashboard-card">
          <p className="text-[11px] text-muted mb-1">Profile completion &gt;80%</p>
          <p className="text-[22px] font-semibold text-ink">{health.completionRate}%</p>
        </div>
        <div className="dashboard-card">
          <p className="text-[11px] text-muted mb-1">Messages this month</p>
          <p className="text-[22px] font-semibold text-ink">{health.msgsThisMonth}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Pending approvals ── */}
        <div className="dashboard-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Recent registrations</p>
            <Link href="/admin/users" className="text-[12px] text-muted hover:text-ink">View all →</Link>
          </div>
          <div className="space-y-2">
            {recent.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${r.type === 'talent' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {r.type === 'talent' ? 'T' : 'E'}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{r.name}</p>
                    <p className="text-[11px] text-muted">{r.detail} · {timeAgo(r.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.approval_status === 'pending' ? (
                    <>
                      <button type="button" onClick={() => handleApprove(r.type, r.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted hover:text-emerald-600 transition-colors"><CheckCircle size={16} /></button>
                      <button type="button" onClick={() => handleReject(r.type, r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                    </>
                  ) : (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${r.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700' : r.approval_status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{r.approval_status}</span>
                  )}
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-[13px] text-muted text-center py-6">No recent registrations.</p>}
          </div>
        </div>

        {/* ── Activity feed ── */}
        <div className="dashboard-card">
          <p className="text-[14px] font-medium text-ink mb-4">Recent Activity</p>
          {activityFeed.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-8">No recent activity.</p>
          ) : (
            <div className="space-y-0">
              {activityFeed.map((event, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-surface flex items-center justify-center shrink-0">
                    {FEED_ICONS[event.type] || <FileText size={12} className="text-muted" />}
                  </div>
                  <div>
                    <p className="text-[12px] text-ink">{event.desc}</p>
                    <p className="text-[10px] text-muted">{timeAgo(event.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
