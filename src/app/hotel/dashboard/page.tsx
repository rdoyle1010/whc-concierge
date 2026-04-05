'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'
import { Briefcase, FileText, Users, MessageSquare, Plus, Search, Calendar, ArrowRight } from 'lucide-react'

export default function HotelDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [stats, setStats] = useState({ active: 0, applications: 0, matches: 0, messages: 0 })
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?role=employer'); return }

      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      if (!prof) { router.push('/login?role=employer'); return }
      setProfile(prof)

      // Load listings
      const { data: jobs } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('posted_date', { ascending: false })
      const normalizedJobs = (jobs || []).map((j: any) => ({ ...j, title: j.job_title || j.title, status: j.is_live ? 'active' : 'closed' }))
      setListings(normalizedJobs)

      const activeJobs = normalizedJobs.filter(j => j.is_live)
      const jobIds = normalizedJobs.map(j => j.id)

      // Stats
      let appCount = 0
      if (jobIds.length > 0) {
        const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).in('job_id', jobIds)
        appCount = count || 0

        const { data: apps } = await supabase
          .from('applications')
          .select('*, candidate_profiles(full_name, headline)')
          .in('job_id', jobIds)
          .order('posted_date', { ascending: false })
          .limit(8)
        setRecentApps((apps || []).map((a: any) => {
          const job = normalizedJobs.find(j => j.id === a.job_id || j.id === a.job_listing_id)
          return { ...a, jobTitle: job?.title || 'Role' }
        }))
      }

      const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false)

      setStats({ active: activeJobs.length, applications: appCount, matches: 0, messages: msgCount || 0 })
      setLoading(false)
    }
    load()
  }, [])

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return <DashboardShell role="employer"><div className="space-y-4"><div className="skeleton h-12 w-1/3" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-24" />)}</div><div className="skeleton h-64" /></div></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.property_name || profile?.company_name}>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">{profile?.property_name || profile?.company_name || 'Hotel Dashboard'}</h1>
        <p className="text-[13px] text-muted mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Jobs', value: stats.active, icon: <Briefcase size={16} /> },
          { label: 'Total Applications', value: stats.applications, icon: <FileText size={16} /> },
          { label: 'New Matches', value: stats.matches || '—', icon: <Users size={16} /> },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16} /> },
        ].map(s => (
          <div key={s.label} className="dashboard-card">
            <div className="text-muted mb-2">{s.icon}</div>
            <p className="text-[24px] font-semibold text-ink">{s.value}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link href="/hotel/jobs" className="btn-primary flex items-center justify-center gap-2 py-3"><Plus size={14} />Post New Job</Link>
        <Link href="/agency" className="btn-secondary flex items-center justify-center gap-2 py-3"><Search size={14} />Browse Agency Talent</Link>
        <Link href="/residency" className="btn-secondary flex items-center justify-center gap-2 py-3"><Calendar size={14} />Find Residency Talent</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active listings */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Your Listings</p>
            <Link href="/hotel/jobs" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">Manage <ArrowRight size={12} /></Link>
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase size={24} className="mx-auto text-muted mb-2" />
              <p className="text-[13px] text-muted mb-3">No listings yet</p>
              <Link href="/hotel/jobs" className="btn-primary text-[12px]">Post your first role</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-medium text-ink">{job.title}</p>
                      {job.tier && <span className={tierClass(job.tier)}>{job.tier}</span>}
                    </div>
                    <p className="text-[11px] text-muted">{job.location} &middot; {(job.contract_type || job.job_type || '').replace('_', ' ')}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${job.is_live ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-muted'}`}>{job.is_live ? 'Live' : 'Closed'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Recent Applications</p>
            <Link href="/hotel/applications" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-8">No applications yet.</p>
          ) : (
            <div className="space-y-2">
              {recentApps.map(app => (
                <div key={app.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{app.candidate_profiles?.full_name || 'Candidate'}</p>
                    <p className="text-[11px] text-muted">For: {app.jobTitle} &middot; {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${app.status === 'pending' ? 'bg-amber-50 text-amber-700' : app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700' : app.status === 'reviewed' ? 'bg-blue-50 text-blue-700' : 'bg-neutral-100 text-muted'}`}>{app.status === 'pending' ? 'New' : app.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
