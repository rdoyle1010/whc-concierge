'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Users, FileText, MessageSquare, ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'

export default function EmployerDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ jobs: 0, applications: 0, messages: 0, matches: 0 })
  const [listings, setListings] = useState<any[]>([])
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (prof) {
        const [jobs, msgs, matches] = await Promise.all([
          supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('created_at', { ascending: false }),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('employer_id', prof.id),
        ])
        // Normalize column names for display
        const normalizedJobs = (jobs.data || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description, status: j.is_live === false ? 'closed' : (j.status || 'active') }))
        setListings(normalizedJobs)
        const jobIds = normalizedJobs.map((j:any) => j.id)
        let appCount = 0
        if (jobIds.length > 0) {
          const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).in('job_id', jobIds)
          appCount = count || 0
          const { data: apps } = await supabase.from('applications').select('*, job_listings(job_title, title), candidate_profiles(full_name, headline)').in('job_id', jobIds).order('created_at', { ascending: false }).limit(5)
          setRecentApps((apps || []).map((a: any) => ({ ...a, job_listings: { ...a.job_listings, title: a.job_listings?.job_title || a.job_listings?.title } })))
        }
        setStats({ jobs: normalizedJobs.filter((j:any) => j.status === 'active' || j.is_live === true).length, applications: appCount, messages: msgs.count||0, matches: matches.count||0 })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <DashboardShell role="employer"><div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-ink border-t-transparent rounded-full" /></div></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.company_name}>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">{profile?.company_name || 'Dashboard'}</h1>
        <p className="text-[13px] text-muted mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active listings', value: stats.jobs, icon: <Briefcase size={16}/>, href: '/employer/jobs' },
          { label: 'Applications', value: stats.applications, icon: <FileText size={16}/>, href: '/employer/applications' },
          { label: 'Candidates matched', value: stats.matches, icon: <Users size={16}/>, href: '/employer/candidates' },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16}/>, href: '/employer/messages' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="dashboard-card hover:border-ink/20 transition-colors">
            <div className="text-muted mb-2">{s.icon}</div>
            <p className="text-[22px] font-semibold text-ink">{s.value}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link href="/employer/post-role" className="btn-primary flex items-center justify-center gap-2 py-3"><Plus size={14}/>Post a new role</Link>
        <Link href="/agency" className="btn-secondary flex items-center justify-center gap-2 py-3">Find agency cover</Link>
        <Link href="/employer/candidates" className="btn-secondary flex items-center justify-center gap-2 py-3">Browse candidates</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active listings */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Active listings</p>
            <Link href="/employer/jobs" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12}/></Link>
          </div>
          <div className="space-y-2">
            {listings.filter(j => j.status === 'active').slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <div className="flex items-center gap-2"><p className="text-[13px] font-medium text-ink">{job.title}</p><span className={job.tier==='Platinum'?'badge-platinum':job.tier==='Gold'?'badge-gold':job.tier==='Silver'?'badge-silver':'badge-bronze'}>{job.tier||'Standard'}</span></div>
                  <p className="text-[11px] text-muted">{job.location} &middot; {job.job_type}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${job.status==='active'?'bg-emerald-50 text-emerald-700':'bg-surface text-muted'}`}>{job.status}</span>
              </div>
            ))}
            {listings.filter(j => j.status === 'active').length === 0 && <p className="text-[13px] text-muted text-center py-6">No active listings.</p>}
          </div>
        </div>

        {/* Recent applications */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Recent applications</p>
            <Link href="/employer/applications" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12}/></Link>
          </div>
          <div className="space-y-2">
            {recentApps.map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div><p className="text-[13px] font-medium text-ink">{app.candidate_profiles?.full_name||'Candidate'}</p><p className="text-[11px] text-muted">Applied for: {app.job_listings?.title}</p></div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${app.status==='pending'?'bg-amber-50 text-amber-700':app.status==='shortlisted'?'bg-emerald-50 text-emerald-700':'bg-surface text-muted'}`}>{app.status}</span>
              </div>
            ))}
            {recentApps.length === 0 && <p className="text-[13px] text-muted text-center py-6">No applications yet.</p>}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
