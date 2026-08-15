'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Star, FileText, X } from 'lucide-react'
import Pagination from '@/components/Pagination'
import ReviewForm from '@/components/ReviewForm'

export default function EmployerApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<any>(null)
  const [reviewing, setReviewing] = useState<{ userId: string; name: string } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (!prof) { setLoading(false); return }

      const { data: jobIds } = await supabase.from('job_listings').select('id').eq('employer_id', prof.id)
      if (!jobIds || jobIds.length === 0) { setLoading(false); return }

      // Slim embed (job title only); the full candidate profile is fetched in a
      // second query with select(*), so schema drift in candidate_profiles can
      // never break this page.
      const { data, error } = await supabase
        .from('applications')
        .select('*, job_listings(job_title)')
        .in('role_id', jobIds.map(j => j.id))
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Applications load failed:', error.message)
        setLoadError('We could not load your applications just now. Please refresh the page - if it keeps happening, contact us.')
      }

      let apps = data || []
      const candidateIds = Array.from(new Set(apps.map((a: any) => a.candidate_id).filter(Boolean)))
      if (candidateIds.length > 0) {
        const { data: cands } = await supabase
          .from('candidate_profiles')
          .select('*')
          .in('id', candidateIds)
        const candMap = new Map((cands || []).map((c: any) => [c.id, c]))
        apps = apps.map((a: any) => ({ ...a, candidate_profiles: candMap.get(a.candidate_id) || null }))
      }
      setApplications(apps)

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
    if (!candidateId || shortlistedIds.has(candidateId)) return
    try {
      const res = await fetch('/api/shortlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId, jobId }) })
      if (!res.ok) { alert('Could not add this candidate to your shortlist - please try again.'); return }
      setShortlistedIds(prev => new Set(Array.from(prev).concat(candidateId)))
    } catch {
      alert('Could not add this candidate to your shortlist - please try again.')
    }
  }

  const updateStatus = async (appId: string, status: string) => {
    const current = applications.find(a => a.id === appId)
    if (updatingId === appId || current?.status === status) return
    setUpdatingId(appId)
    try {
      const { error } = await supabase.from('applications').update({ status }).eq('id', appId)
      if (error) { alert('Could not update this application - please try again.'); return }
      setApplications(applications.map(a => a.id === appId ? { ...a, status } : a))

      // Send decision email for shortlisted/accepted/rejected. The route looks
      // the address up server-side from the candidate's auth user id.
      if (status === 'shortlisted' || status === 'accepted' || status === 'rejected') {
        fetch('/api/application-decision-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: appId,
            decision: status === 'shortlisted' || status === 'accepted' ? 'approved' : 'rejected',
          }),
        }).catch(() => {})
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Applications</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <div className="dashboard-card text-center py-12"><p className="text-[13px] text-red-600">{loadError}</p></div>
      ) : applications.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">No applications received yet.</div>
      ) : (
        <div className="space-y-4">
          {applications.slice((page - 1) * perPage, page * perPage).map((app) => {
            const cand = app.candidate_profiles
            return (
              <div key={app.id} className="dashboard-card">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {cand?.profile_image_url
                        ? <img src={cand.profile_image_url} alt="" className="w-full h-full object-cover" />
                        : <span className="font-serif font-bold text-lg" style={{ color: '#C9A96E' }}>{cand?.full_name?.[0] || '?'}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-lg font-semibold text-ink">{cand?.full_name || 'Candidate'}</h3>
                        {typeof app.match_score === 'number' && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FDF6EC', color: '#C9A96E' }}>{app.match_score}% match</span>
                        )}
                        {cand?.review_score ? (
                          <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium"><Star size={11} fill="currentColor" />{Number(cand.review_score).toFixed(1)}{cand.review_count ? ` (${cand.review_count})` : ''}</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-500">{cand?.headline}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Applied for: <span className="text-gold">{app.job_listings?.job_title}</span>
                        {' '}&middot; {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {cand?.location ? <> &middot; {cand.location}</> : null}
                        {cand?.experience_years ? <> &middot; {cand.experience_years} yrs experience</> : null}
                      </p>
                      {cand?.services_offered?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cand.services_offered.slice(0, 8).map((s: string) => (
                            <span key={s} className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                          {cand.services_offered.length > 8 && <span className="text-xs text-gray-400">+{cand.services_offered.length - 8} more</span>}
                        </div>
                      )}
                      {(app.cover_note || app.cover_letter) && (
                        <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{app.cover_note || app.cover_letter}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <button type="button" onClick={() => setViewing(cand)} className="text-[12px] font-medium hover:underline" style={{ color: '#C9A96E' }}>View full profile</button>
                        {cand?.cv_url && (
                          <a href={cand.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-600 hover:underline"><FileText size={12} /> CV</a>
                        )}
                        {cand?.user_id && (
                          <a href={`/employer/messages?to=${cand.user_id}`} className="text-[12px] font-medium text-gray-600 hover:underline">Message</a>
                        )}
                        {app.status === 'accepted' && cand?.user_id && (
                          <button type="button" onClick={() => setReviewing({ userId: cand.user_id, name: cand.full_name || 'this candidate' })}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-500 hover:underline">
                            <Star size={12} /> Leave a review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button type="button" onClick={() => { updateStatus(app.id, 'shortlisted'); addToShortlist(cand?.id || app.candidate_id, app.role_id) }} title="Shortlist" disabled={updatingId === app.id}
                      className={`p-2 rounded-lg disabled:opacity-50 ${app.status === 'shortlisted' || shortlistedIds.has(cand?.id || app.candidate_id) ? 'bg-[#FDF6EC] text-accent' : 'hover:bg-green-50 text-gray-400'}`}>
                      <Star size={18} fill={app.status === 'shortlisted' || shortlistedIds.has(cand?.id || app.candidate_id) ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => updateStatus(app.id, 'accepted')} title="Accept" disabled={updatingId === app.id}
                      className={`p-2 rounded-lg disabled:opacity-50 ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-emerald-50 text-gray-400'}`}>
                      <CheckCircle size={18} />
                    </button>
                    <button type="button" onClick={() => updateStatus(app.id, 'rejected')} title="Reject" disabled={updatingId === app.id}
                      className={`p-2 rounded-lg disabled:opacity-50 ${app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'hover:bg-red-50 text-gray-400'}`}>
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          <Pagination page={page} perPage={perPage} total={applications.length} onPageChange={setPage} onPerPageChange={setPerPage} />
        </div>
      )}

      {/* Review modal - only offered on accepted placements */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-ink">Review {reviewing.name}</h2>
              <button type="button" onClick={() => setReviewing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <ReviewForm reviewedId={reviewing.userId} reviewedName={reviewing.name} type="candidate" />
          </div>
        </div>
      )}

      {/* Candidate full profile drawer */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setViewing(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {viewing.profile_image_url
                    ? <img src={viewing.profile_image_url} alt="" className="w-full h-full object-cover" />
                    : <span className="font-serif font-bold text-lg" style={{ color: '#C9A96E' }}>{viewing.full_name?.[0]}</span>}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">{viewing.full_name}</h3>
                  <p className="text-[12px] text-gray-500">{viewing.headline}</p>
                  {viewing.review_score ? (
                    <p className="flex items-center gap-1 text-[11px] text-amber-500 font-medium mt-0.5"><Star size={11} fill="currentColor" />{Number(viewing.review_score).toFixed(1)}{viewing.review_count ? ` from ${viewing.review_count} review${viewing.review_count === 1 ? '' : 's'}` : ''}</p>
                  ) : null}
                </div>
              </div>
              <button type="button" onClick={() => setViewing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {viewing.role_level && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Role Level</p><p className="text-ink">{viewing.role_level}</p></div>}
                {viewing.location && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Location</p><p className="text-ink">{viewing.location}</p></div>}
                {viewing.experience_years && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Experience</p><p className="text-ink">{viewing.experience_years} years</p></div>}
                {viewing.phone && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Phone</p><p className="text-ink">{viewing.phone}</p></div>}
              </div>
              {viewing.bio && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">About</p><p className="text-ink leading-relaxed whitespace-pre-wrap text-[13px]">{viewing.bio}</p></div>}
              {viewing.services_offered?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Treatments & Services</p><div className="flex flex-wrap gap-1.5">{viewing.services_offered.map((x: string) => <span key={x} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}
              {viewing.qualifications?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Qualifications</p><div className="flex flex-wrap gap-1.5">{viewing.qualifications.map((x: string) => <span key={x} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}
              {viewing.product_houses?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Product Houses</p><div className="flex flex-wrap gap-1.5">{viewing.product_houses.map((x: string) => <span key={x} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#FDF6EC', color: '#C9A96E' }}>{x}</span>)}</div></div>}
              {viewing.systems_experience?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Systems</p><div className="flex flex-wrap gap-1.5">{viewing.systems_experience.map((x: string) => <span key={x} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Documents</p>
                {viewing.cv_url
                  ? <a href={viewing.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline" style={{ color: '#C9A96E' }}><FileText size={13} /> View CV</a>
                  : <p className="text-gray-400 text-[12px]">No CV uploaded yet</p>}
                {viewing.certificates_urls?.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {viewing.certificates_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] font-medium hover:underline" style={{ color: '#C9A96E' }}><FileText size={13} /> Certificate {i + 1}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white flex gap-2">
              {viewing.user_id && <a href={`/employer/messages?to=${viewing.user_id}`} className="btn-primary flex-1 text-center">Message</a>}
              <button type="button" onClick={() => setViewing(null)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
