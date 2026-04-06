'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, FileText, TrendingUp, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react'

type JobRow = {
  id: string; title: string; tier: string; daysLive: number; totalApps: number
  shortlisted: number; avgScore: number; status: string
}

const STATUS_LABELS: Record<string, string> = {
  total: 'Total Applicants', pending: 'Submitted', reviewed: 'Reviewed',
  shortlisted: 'Shortlisted', interview: 'Interviewed', offered: 'Offered', accepted: 'Hired',
}
const FUNNEL_ORDER = ['total', 'pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'accepted']
const FUNNEL_COLOURS = ['#1a1a1a', '#D97706', '#2563EB', '#16A34A', '#7C3AED', '#C9A96E', '#059669']

export default function EmployerAnalyticsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ activeListings: 0, totalAppsMonth: 0, totalAppsLastMonth: 0, avgMatch: 0, avgDaysToFirst: 0 })
  const [jobRows, setJobRows] = useState<JobRow[]>([])
  const [funnel, setFunnel] = useState<Record<string, number>>({})
  const [topSkills, setTopSkills] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<string>('totalApps')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      if (!prof) { setLoading(false); return }
      setProfile(prof)

      // Load jobs
      const { data: jobs } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('posted_date', { ascending: false })
      if (!jobs || jobs.length === 0) { setLoading(false); return }

      const jobIds = jobs.map(j => j.id)
      const activeJobs = jobs.filter(j => j.is_live)

      // Load all applications for this employer's jobs
      const { data: allApps } = await supabase
        .from('applications')
        .select('*, candidate_profiles(services_offered, treatment_skills)')
        .in('job_id', jobIds)

      const apps = allApps || []
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const thisMonthApps = apps.filter(a => new Date(a.created_at) >= thisMonthStart)
      const lastMonthApps = apps.filter(a => {
        const d = new Date(a.created_at)
        return d >= lastMonthStart && d < thisMonthStart
      })

      // Avg match score
      const scores = apps.filter(a => a.match_score).map(a => a.match_score)
      const avgMatch = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

      // Avg time to first application per job
      const ttfas: number[] = []
      for (const job of jobs) {
        const jobApps = apps.filter(a => a.job_id === job.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        if (jobApps.length > 0 && job.posted_date) {
          const days = Math.max(0, Math.round((new Date(jobApps[0].created_at).getTime() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24)))
          ttfas.push(days)
        }
      }
      const avgDaysToFirst = ttfas.length > 0 ? Math.round(ttfas.reduce((a, b) => a + b, 0) / ttfas.length) : 0

      setStats({
        activeListings: activeJobs.length,
        totalAppsMonth: thisMonthApps.length,
        totalAppsLastMonth: lastMonthApps.length,
        avgMatch,
        avgDaysToFirst,
      })

      // Per-job breakdown
      const rows: JobRow[] = jobs.map(job => {
        const jobApps = apps.filter(a => a.job_id === job.id)
        const jobScores = jobApps.filter(a => a.match_score).map(a => a.match_score)
        const postedDate = job.posted_date ? new Date(job.posted_date) : new Date(job.created_at)
        const daysLive = Math.max(0, Math.round((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)))
        const jobStatus = !job.is_live ? (job.status === 'filled' ? 'filled' : 'expired') : 'live'

        return {
          id: job.id,
          title: job.job_title || job.title || 'Untitled',
          tier: job.tier || 'Standard',
          daysLive,
          totalApps: jobApps.length,
          shortlisted: jobApps.filter(a => a.status === 'shortlisted' || a.status === 'accepted').length,
          avgScore: jobScores.length > 0 ? Math.round(jobScores.reduce((a, b) => a + b, 0) / jobScores.length) : 0,
          status: jobStatus,
        }
      })
      setJobRows(rows)

      // Funnel
      const funnelCounts: Record<string, number> = { total: apps.length }
      for (const app of apps) funnelCounts[app.status] = (funnelCounts[app.status] || 0) + 1
      setFunnel(funnelCounts)

      // Top skills across applicants
      const skillCounts: Record<string, number> = {}
      for (const app of apps) {
        const skills = app.candidate_profiles?.services_offered || app.candidate_profiles?.treatment_skills || []
        for (const s of skills) skillCounts[s] = (skillCounts[s] || 0) + 1
      }
      const sorted = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s]) => s)
      setTopSkills(sorted)

      setLoading(false)
    }
    load()
  }, [])

  // Sorting
  const sortedRows = [...jobRows].sort((a, b) => {
    const av = (a as any)[sortCol]; const bv = (b as any)[sortCol]
    if (typeof av === 'number') return sortAsc ? av - bv : bv - av
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(false) }
  }

  const pctChange = stats.totalAppsLastMonth > 0
    ? Math.round(((stats.totalAppsMonth - stats.totalAppsLastMonth) / stats.totalAppsLastMonth) * 100)
    : stats.totalAppsMonth > 0 ? 100 : 0

  if (loading) return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-40 bg-surface rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-surface rounded-xl" />)}</div>
        <div className="h-64 bg-surface rounded-xl" />
      </div>
    </DashboardShell>
  )

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-[24px] font-medium text-ink mb-6">Analytics</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="dashboard-card">
          <div className="text-muted mb-2"><Briefcase size={16} /></div>
          <p className="text-[28px] font-semibold text-ink">{stats.activeListings}</p>
          <p className="text-[11px] text-muted">Active listings</p>
        </div>
        <div className="dashboard-card">
          <div className="text-muted mb-2"><FileText size={16} /></div>
          <p className="text-[28px] font-semibold text-ink">{stats.totalAppsMonth}</p>
          <div className="flex items-center gap-1">
            <p className="text-[11px] text-muted">Applications this month</p>
            {pctChange !== 0 && (
              <span className={`text-[10px] font-medium flex items-center gap-0.5 ${pctChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {pctChange > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{Math.abs(pctChange)}%
              </span>
            )}
          </div>
        </div>
        <div className="dashboard-card">
          <div className="text-muted mb-2"><TrendingUp size={16} /></div>
          <p className="text-[28px] font-semibold" style={{ color: '#C9A96E' }}>{stats.avgMatch}%</p>
          <p className="text-[11px] text-muted">Avg match score</p>
        </div>
        <div className="dashboard-card">
          <div className="text-muted mb-2"><Clock size={16} /></div>
          <p className="text-[28px] font-semibold text-ink">{stats.avgDaysToFirst}<span className="text-[14px] text-muted font-normal">d</span></p>
          <p className="text-[11px] text-muted">Avg time to first application</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Application Funnel */}
        <div className="dashboard-card lg:col-span-2">
          <p className="text-[14px] font-medium text-ink mb-4">Application Funnel</p>
          <div className="space-y-2.5">
            {FUNNEL_ORDER.map((key, i) => {
              const count = funnel[key] || 0
              const maxCount = funnel.total || 1
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[12px] text-muted w-28 shrink-0 text-right">{STATUS_LABELS[key]}</span>
                  <div className="flex-1 h-7 bg-surface rounded-lg overflow-hidden relative">
                    <div className="h-full rounded-lg transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: FUNNEL_COLOURS[i] }} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink">{count}</span>
                  </div>
                  <span className="text-[11px] text-muted w-10 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Skills */}
        <div className="dashboard-card">
          <p className="text-[14px] font-medium text-ink mb-4">Top Applicant Skills</p>
          {topSkills.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-8">No applicant data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topSkills.map((skill, i) => (
                <div key={skill} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ backgroundColor: '#FDF6EC', color: '#C9A96E' }}>{i + 1}</span>
                  <span className="text-[13px] text-ink">{skill}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-Job Breakdown */}
      {jobRows.length > 0 && (
        <div className="dashboard-card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[14px] font-medium text-ink">Job Performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  {[
                    { key: 'title', label: 'Role' },
                    { key: 'tier', label: 'Tier' },
                    { key: 'status', label: 'Status' },
                    { key: 'daysLive', label: 'Days Live' },
                    { key: 'totalApps', label: 'Applications' },
                    { key: 'shortlisted', label: 'Shortlisted' },
                    { key: 'avgScore', label: 'Avg Score' },
                  ].map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}
                      className="text-left px-5 py-2.5 text-[11px] font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-ink transition-colors select-none">
                      {col.label} {sortCol === col.key && (sortAsc ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedRows.map(row => (
                  <tr key={row.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 text-[13px] font-medium text-ink max-w-[200px] truncate">{row.title}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.tier === 'Platinum' ? 'bg-ink text-white' : row.tier === 'Gold' ? 'bg-[#FDF6EC] text-accent' : row.tier === 'Silver' ? 'bg-neutral-100 text-neutral-600' : 'bg-surface text-muted'}`}>{row.tier}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${row.status === 'live' ? 'bg-emerald-50 text-emerald-700' : row.status === 'filled' ? 'bg-blue-50 text-blue-700' : 'bg-neutral-100 text-neutral-500'}`}>{row.status}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">{row.daysLive}</td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink">{row.totalApps}</td>
                    <td className="px-5 py-3 text-[13px] text-ink">{row.shortlisted}</td>
                    <td className="px-5 py-3">
                      {row.avgScore > 0 ? (
                        <span className="text-[13px] font-medium" style={{ color: row.avgScore >= 80 ? '#16A34A' : row.avgScore >= 60 ? '#C9A96E' : '#6B7280' }}>{row.avgScore}%</span>
                      ) : <span className="text-[11px] text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
