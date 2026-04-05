'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Users, FileText, MessageSquare, ArrowRight, Plus, Clock } from 'lucide-react'
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

      const { data: jobs } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('created_at', { ascending: false })
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
        const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).in('job_id', jobIds)
        appCount = count || 0

        const { data: apps } = await supabase
          .from('applications')
          .select('*, candidate_profiles(full_name, headline)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentApps((apps || []).map((a: any) => {
          const job = normalizedJobs.find(j => j.id === a.job_id || j.id === a.job_listing_id)
          return { ...a, jobTitle: job?.title || 'Role' }
        }))
      }

      let matchCount = 0
      if (jobIds.length > 0) {
        const { count: mc } = await supabase.from('matches').select('id', { count: 'exact', head: true }).in('job_id', jobIds)
        matchCount = mc || 0
      }

      const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false)

      setStats({ active: activeJobs.length, applications: appCount, matches: matchCount, messages: msgCount || 0 })
      setLoading(false)
    }
    load()
  }, [])

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return <DashboardShell role="employer"><div className="space-y-4"><div className="skeleton h-12 w-1/3" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-24" />)}</div><div className="skeleton h-64" /></div></DashboardShell>
  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.company_name}>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">{profile?.property_name || profile?.company_name || 'Dashboard'}</h1>
        <p className="text-[13px] text-muted mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active listings', value: stats.active, icon: <Briefcase size={16} /> },
          { label: 'Applications', value: stats.applications, icon: <FileText size={16} /> },
          { label: 'Candidates matched', value: stats.matches || '\u2014', icon: <Users size={16} /> },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16} /> },
        ].map(s => (
          <div key={s.label} className="dashboard-card">
            <div className="text-muted mb-2">{s.icon}</div>
            <p className="text-[24px] font-semibold text-ink">{s.value}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link href="/employer/post-role" className="btn-primary flex items-center justify-center gap-2 py-3"><Plus size={14} />Post a new role</Link>
        <Link href="/agency" className="btn-secondary flex items-center justify-center gap-2 py-3">Find agency cover</Link>
        <Link href="/employer/candidates" className="btn-secondary flex items-center justify-center gap-2 py-3">Browse candidates</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Your listings</p>
            <Link href="/employer/jobs" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">Manage <ArrowRight size={12} /></Link>
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase size={24} className="mx-auto text-muted mb-2" />
              <p className="text-[13px] text-muted mb-3">No listings yet</p>
              <Link href="/employer/post-role" className="btn-primary text-[12px]">Post your first role</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-medium text-ink">{job.title}</p>
                      <span className={tierClass(job.tier || 'Standard')}>{job.tier || '\u2014'}</span>
                    </div>
                    <p className="text-[11px] text-muted">{job.location} \u00b7 {job.contract_type?.replace('_', ' ') || job.job_type}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${job.is_live ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-muted'}`}>{job.is_live ? 'Live' : 'Closed'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Recent applications</p>
            <Link href="/employer/applications" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-8">No applications yet.</p>
          ) : (
            <div className="space-y-2">
              {recentApps.map(app => (
                <div key={app.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{app.candidate_profiles?.full_name || 'Candidate'}</p>
                    <p className="text-[11px] text-muted">For: {app.jobTitle} \u00b7 {app.match_score ? `${app.match_score}% match` : ''}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${app.status === 'pending' ? 'bg-amber-50 text-amber-700' : app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-muted'}`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
