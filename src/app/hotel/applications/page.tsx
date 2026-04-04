'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import { CheckCircle, XCircle, Star, Clock } from 'lucide-react'

export default function HotelApplicationsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?role=employer'); return }
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      if (!prof) { router.push('/login?role=employer'); return }
      setProfile(prof)

      const { data: jobIds } = await supabase.from('job_listings').select('id').eq('employer_id', prof.id)
      if (!jobIds || jobIds.length === 0) { setLoading(false); return }

      const { data: apps } = await supabase
        .from('applications')
        .select('*, candidate_profiles(full_name, headline, role_level, services_offered)')
        .in('job_id', jobIds.map(j => j.id))
        .order('created_at', { ascending: false })

      // Get job titles
      const { data: jobs } = await supabase.from('job_listings').select('id, job_title, title').eq('employer_id', prof.id)
      const jobMap = new Map((jobs || []).map(j => [j.id, j.job_title || j.title]))

      setApplications((apps || []).map(a => ({ ...a, jobTitle: jobMap.get(a.job_id) || jobMap.get(a.job_listing_id) || 'Role' })))
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (appId: string, status: string) => {
    await supabase.from('applications').update({ status }).eq('id', appId)
    setApplications(applications.map(a => a.id === appId ? { ...a, status } : a))
  }

  const statusBadge = (status: string) => {
    if (status === 'pending') return { label: 'New', cls: 'bg-amber-50 text-amber-700' }
    if (status === 'reviewed') return { label: 'Reviewed', cls: 'bg-blue-50 text-blue-700' }
    if (status === 'shortlisted') return { label: 'Shortlisted', cls: 'bg-emerald-50 text-emerald-700' }
    if (status === 'rejected') return { label: 'Rejected', cls: 'bg-red-50 text-red-700' }
    return { label: status, cls: 'bg-neutral-100 text-muted' }
  }

  if (loading) return <DashboardShell role="employer"><div className="skeleton h-64" /></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile?.property_name || profile?.company_name}>
      <h1 className="text-[24px] font-medium text-ink mb-6">Applications</h1>

      {applications.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <Clock size={24} className="mx-auto text-muted mb-2" />
          <p className="text-[14px] text-muted">No applications received yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map(app => {
            const badge = statusBadge(app.status)
            return (
              <div key={app.id} className="dashboard-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-ink">{app.candidate_profiles?.full_name || 'Candidate'}</p>
                    <p className="text-[12px] text-muted">{app.candidate_profiles?.headline || app.candidate_profiles?.role_level || ''}</p>
                    <p className="text-[12px] text-muted mt-1">Applied for: <span className="text-ink">{app.jobTitle}</span> &middot; {new Date(app.created_at).toLocaleDateString()}</p>
                    {app.match_score && <span className="text-[11px] font-medium text-accent mt-1 inline-block">{app.match_score}% match</span>}
                    {app.candidate_profiles?.services_offered?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">{app.candidate_profiles.services_offered.slice(0, 4).map((s: string) => <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    <div className="flex gap-1 ml-2">
                      <button type="button" onClick={() => updateStatus(app.id, 'shortlisted')} title="Shortlist" className={`p-1.5 rounded-lg ${app.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-emerald-50 text-muted hover:text-emerald-600'}`}><Star size={14} /></button>
                      <button type="button" onClick={() => updateStatus(app.id, 'reviewed')} title="Mark reviewed" className={`p-1.5 rounded-lg ${app.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-muted hover:text-blue-600'}`}><CheckCircle size={14} /></button>
                      <button type="button" onClick={() => updateStatus(app.id, 'rejected')} title="Reject" className={`p-1.5 rounded-lg ${app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'hover:bg-red-50 text-muted hover:text-red-500'}`}><XCircle size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
