'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Star, Clock } from 'lucide-react'
import Pagination from '@/components/Pagination'

export default function EmployerApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (!prof) { setLoading(false); return }

      const { data: jobIds } = await supabase.from('job_listings').select('id').eq('employer_id', prof.id)
      if (!jobIds || jobIds.length === 0) { setLoading(false); return }

      const { data } = await supabase
        .from('applications')
        .select('*, job_listings(job_title, title), candidate_profiles(full_name, headline, email, location, services_offered)')
        .in('job_id', jobIds.map(j => j.id))
        .order('created_at', { ascending: false })

      setApplications(data || [])

      // Load shortlisted IDs
      const slRes = await fetch('/api/shortlist')
      if (slRes.ok) {
        const slData = await slRes.json()
        setShortlistedIds(new Set((slData.shortlisted || []).map((s: any) => s.candidate_id)))
      }

      setLoading(false)
    }
    load()
  }, [])

  const addToShortlist = async (candidateId: string, jobId: string) => {
    if (shortlistedIds.has(candidateId)) return
    await fetch('/api/shortlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId, jobId }) })
    setShortlistedIds(new Set([...shortlistedIds, candidateId]))
  }

  const updateStatus = async (appId: string, status: string) => {
    await supabase.from('applications').update({ status }).eq('id', appId)
    setApplications(applications.map(a => a.id === appId ? { ...a, status } : a))

    // Send decision email for shortlisted/accepted/rejected (fire-and-forget)
    if (status === 'shortlisted' || status === 'accepted' || status === 'rejected') {
      const app = applications.find(a => a.id === appId)
      if (app?.candidate_profiles?.email || app?.candidate_profiles?.full_name) {
        fetch('/api/application-decision-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicantEmail: app.candidate_profiles?.email || '',
            applicantName: app.candidate_profiles?.full_name || '',
            jobTitle: app.job_listings?.job_title || app.job_listings?.title || '',
            propertyName: profile?.property_name || profile?.company_name || '',
            decision: status === 'shortlisted' || status === 'accepted' ? 'approved' : 'rejected',
          }),
        }).catch(() => {})
      }
    }
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Applications</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : applications.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">No applications received yet.</div>
      ) : (
        <div className="space-y-4">
          {applications.slice((page - 1) * perPage, page * perPage).map((app) => (
            <div key={app.id} className="dashboard-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-ink">{app.candidate_profiles?.full_name}</h3>
                  <p className="text-sm text-gray-500">{app.candidate_profiles?.headline}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied for: <span className="text-gold">{app.job_listings?.job_title || app.job_listings?.title}</span>
                    {' '}&middot; {new Date(app.created_at).toLocaleDateString()}
                  </p>
                  {app.candidate_profiles?.services_offered?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.candidate_profiles.services_offered.map((s: string) => (
                        <span key={s} className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  {app.cover_letter && (
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{app.cover_letter}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => { updateStatus(app.id, 'shortlisted'); addToShortlist(app.candidate_profiles?.id || app.candidate_id, app.job_id) }} title="Shortlist"
                    className={`p-2 rounded-lg ${app.status === 'shortlisted' || shortlistedIds.has(app.candidate_profiles?.id || app.candidate_id) ? 'bg-[#FDF6EC] text-accent' : 'hover:bg-green-50 text-gray-400'}`}>
                    <Star size={18} fill={app.status === 'shortlisted' || shortlistedIds.has(app.candidate_profiles?.id || app.candidate_id) ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => updateStatus(app.id, 'accepted')} title="Accept"
                    className={`p-2 rounded-lg ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-emerald-50 text-gray-400'}`}>
                    <CheckCircle size={18} />
                  </button>
                  <button onClick={() => updateStatus(app.id, 'rejected')} title="Reject"
                    className={`p-2 rounded-lg ${app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'hover:bg-red-50 text-gray-400'}`}>
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Pagination page={page} perPage={perPage} total={applications.length} onPageChange={setPage} onPerPageChange={setPerPage} />
        </div>
      )}
    </DashboardShell>
  )
}
