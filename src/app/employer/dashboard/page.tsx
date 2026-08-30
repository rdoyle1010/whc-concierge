'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Users, FileText, MessageSquare, ArrowRight, Plus, Clock, Calendar, MapPin } from 'lucide-react'
import SkeletonTable from '@/components/SkeletonTable'
import Link from 'next/link'

export default function EmployerDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [stats, setStats] = useState({ active: 0, applications: 0, matches: 0, messages: 0 })
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (!prof) { setLoading(false); return }

      const { data: jobs } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('posted_date', { ascending: false })
      const normalizedJobs = (jobs || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        status: j.is_live ? 'active' : 'closed',
      }))
      setListings(normalizedJobs)

      const activeJobs = normalizedJobs.filter(j => j.is_live)
      const jobIds = normalizedJobs.map(j => j.id)

      let appCount = 0
      if (jobIds.length > 0) {
        const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).in('role_id', jobIds).neq('status', 'draft')
        appCount = count || 0

        const { data: apps } = await supabase
          .from('applications')
          .select('*, candidate_profiles(full_name, headline)')
          .in('role_id', jobIds)
          .neq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentApps((apps || []).map((a: any) => {
          const job = normalizedJobs.find(j => j.id === a.role_id)
          return { ...a, jobTitle: job?.title || 'Role' }
        }))
      }

      let matchCount = 0
      if (jobIds.length > 0) {
        // Matches are written with job_listing_id; older rows may carry job_id.
        // Try the current column first and fall back for legacy data.
        const current = await supabase.from('matches').select('id', { count: 'exact', head: true }).in('job_listing_id', jobIds)
        if (!current.error) matchCount = current.count || 0
        else {
          const legacy = await supabase.from('matches').select('id', { count: 'exact', head: true }).in('job_id', jobIds)
          matchCount = legacy.count || 0
        }
      }

      const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false)

      setStats({ active: activeJobs.length, applications: appCount, matches: matchCount, messages: msgCount || 0 })
      setLoading(false)
    }
    load()
  }, [])

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return (
    <DashboardShell role="employer">
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-48 bg-surface rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-border rounded-md p-4">
              <div className="h-3 w-6 bg-surface rounded mb-2" />
              <div className="h-6 w-10 bg-surface rounded mb-1" />
              <div className="h-2.5 w-14 bg-surface rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6"><SkeletonTable rows={4} /></div>
    </DashboardShell>
  )

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.company_name}>
      {(!profile?.approval_status || profile?.approval_status === 'pending') && (
        <div className="border-l-2 border-amber-500 bg-white/65 px-5 py-4 mb-7 flex items-start gap-3">
          <Clock size={17} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-amber-900">Your property is under review</p>
            <p className="text-[12px] text-amber-700 mt-0.5">You can complete your profile and prepare recruitment activity while approval is being checked.</p>
          </div>
        </div>
      )}

      <div className="mb-9">
        <p className="dashboard-eyebrow">Property recruitment</p>
        <h1 className="dashboard-title">{profile?.property_name || profile?.company_name || 'Property dashboard'}</h1>
        <p className="dashboard-intro">Permanent recruitment, urgent agency cover, specialist Residencies and private candidate conversations in one verified property workspace.</p>
      </div>

      <div className="dashboard-metrics mb-8">
        {[
          { label: 'Active listings', value: stats.active, icon: <Briefcase size={16} /> },
          { label: 'Applications', value: stats.applications, icon: <FileText size={16} /> },
          { label: 'Candidates matched', value: stats.matches || '\u2014', icon: <Users size={16} /> },
          { label: 'Unread messages', value: stats.messages, icon: <MessageSquare size={16} /> },
        ].map(s => (
          <div key={s.label} className="dashboard-metric">
            <div className="text-accent mb-3">{s.icon}</div>
            <p className="dashboard-metric-value">{s.value}</p>
            <p className="dashboard-metric-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 mb-8">
        <Link href="/employer/post-role" className="btn-primary flex items-center justify-center gap-2 py-3"><Plus size={14} />Post a role</Link>
        <Link href="/employer/agency" className="btn-secondary flex items-center justify-center gap-2 py-3"><Calendar size={14} />Agency cover</Link>
        <Link href="/employer/residency" className="btn-secondary flex items-center justify-center gap-2 py-3"><MapPin size={14} />Residency</Link>
        <Link href="/employer/candidates" className="btn-secondary flex items-center justify-center gap-2 py-3"><Users size={14} />Browse talent</Link>
      </div>

      {(!profile?.nearest_transport && !profile?.commute_car_required && !profile?.parking_available) && (
        <div className="mb-8 border-l-2 border-accent bg-white/65 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-ink">Help professionals plan the journey</p>
            <p className="text-[12px] text-muted mt-0.5">Add nearest transport, walking time, parking and taxi support to your Company Profile.</p>
          </div>
          <Link href="/employer/profile" className="text-[12px] font-medium text-accent whitespace-nowrap">Add travel details →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="dashboard-card">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="dashboard-eyebrow !mb-1">Recruitment</p>
              <h2 className="dashboard-section-title">Your listings</h2>
            </div>
            <Link href="/employer/jobs" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">Manage <ArrowRight size={12} /></Link>
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-9 border-t border-border">
              <Briefcase size={22} className="mx-auto text-muted mb-2" />
              <p className="text-[13px] text-muted mb-4">No listings yet.</p>
              <Link href="/employer/post-role" className="btn-primary text-[12px]">Post your first role</Link>
            </div>
          ) : (
            <div>
              {listings.slice(0, 5).map(job => (
                <div key={job.id} className="dashboard-list-row">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-medium text-ink">{job.title}</p>
                      <span className={tierClass(job.tier || 'Standard')}>{job.tier || '\u2014'}</span>
                    </div>
                    <p className="text-[11px] text-muted">{job.location} \u00b7 {job.contract_type?.replace('_', ' ') || job.job_type}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[.08em] ${job.is_live ? 'text-emerald-700' : 'text-muted'}`}>{job.is_live ? 'Live' : 'Closed'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="dashboard-eyebrow !mb-1">Talent pipeline</p>
              <h2 className="dashboard-section-title">Recent applications</h2>
            </div>
            <Link href="/employer/applications" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-9 border-t border-border">No applications yet.</p>
          ) : (
            <div>
              {recentApps.map(app => (
                <div key={app.id} className="dashboard-list-row">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{app.candidate_profiles?.full_name || 'Candidate'}</p>
                    <p className="text-[11px] text-muted">For: {app.jobTitle} {app.match_score ? `\u00b7 ${app.match_score}% match` : ''}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[.08em] ${app.status === 'pending' ? 'text-amber-700' : app.status === 'shortlisted' ? 'text-emerald-700' : 'text-muted'}`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  )
}
