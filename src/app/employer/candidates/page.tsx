'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, Star, X, MessageSquare } from 'lucide-react'
import { calculateMatchScore } from '@/lib/matching'

export default function EmployerCandidatesPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [matchInfo, setMatchInfo] = useState<{ name: string; job: string } | null>(null)
  const [viewing, setViewing] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)

      // Fetch candidates, blocked list and my past passes in parallel
      // (blocks + swipes come from service-role routes - the tables are RLS-locked)
      const [candidateRes, blocksRes, swipesRes] = await Promise.all([
        supabase.from('candidate_profiles').select('*').order('created_at', { ascending: false }),
        fetch('/api/profile/blocks').then(r => r.ok ? r.json() : { blocked_candidate_ids: [] }).catch(() => ({ blocked_candidate_ids: [] })),
        fetch('/api/swipe').then(r => r.ok ? r.json() : { passed_ids: [] }).catch(() => ({ passed_ids: [] })),
      ])

      const blockedIds = new Set(blocksRes.blocked_candidate_ids || [])
      const passedIds = new Set(swipesRes.passed_ids || [])
      const visible = (candidateRes.data || []).filter((c: any) => !blockedIds.has(c.id) && !passedIds.has(c.id))

      // Score every candidate against this employer's live roles - best fit first
      let scored = visible
      if (prof) {
        const { data: myJobs } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).eq('is_live', true)
        const jobs = (myJobs || []).map((j: any) => ({ ...j, title: j.job_title || j.title, required_product_houses: j.required_brands || j.required_product_houses }))
        if (jobs.length > 0) {
          scored = visible.map((c: any) => {
            let best: any = null
            for (const j of jobs) {
              const r = calculateMatchScore(c, j)
              const score = r.hardStop ? 0 : r.score
              if (!best || score > best.matchScore) best = { matchScore: score, matchLabel: r.hardStop ? 'Not suitable' : r.label, matchColour: r.hardStop ? '#9CA3AF' : r.colour, matchBg: r.hardStop ? '#F3F4F6' : r.bgColour, bestJob: j.title }
            }
            return { ...c, ...best }
          }).sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0))
        }
      }
      setCandidates(scored)

      // Load shortlisted candidates
      const slRes = await fetch('/api/shortlist')
      if (slRes.ok) {
        const slData = await slRes.json()
        setShortlistedIds(new Set((slData.shortlisted || []).map((s: any) => s.candidate_id)))
      }

      setLoading(false)
    }
    load()
  }, [])

  const filtered = candidates.filter((c) => {
    if (search && !c.full_name?.toLowerCase().includes(search.toLowerCase()) &&
        !c.headline?.toLowerCase().includes(search.toLowerCase())) return false
    if (specFilter && !(c.services_offered || []).some((s: string) => s.toLowerCase().includes(specFilter.toLowerCase()))) return false
    return true
  })

  const toggleShortlist = async (candidateId: string) => {
    const isShortlisted = shortlistedIds.has(candidateId)
    const next = new Set(shortlistedIds)
    if (isShortlisted) {
      // Need to find the shortlist ID to delete - for simplicity, use the POST/DELETE by candidateId approach
      // We'll refetch after toggle
      next.delete(candidateId)
      const slRes = await fetch('/api/shortlist')
      if (slRes.ok) {
        const slData = await slRes.json()
        const entry = (slData.shortlisted || []).find((s: any) => s.candidate_id === candidateId)
        if (entry) await fetch('/api/shortlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: entry.id }) })
      }
    } else {
      const res = await fetch('/api/shortlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId }) })
      const j = res.ok ? await res.json().catch(() => ({})) : null
      if (!j) { alert('Could not shortlist - please try again.'); return }
      next.add(candidateId)
      // Shortlisting can complete a mutual match server-side - celebrate it
      if (j.matched) {
        setMatchInfo({ name: j.candidateName || 'This candidate', job: j.jobTitle || 'your role' })
      }
    }
    setShortlistedIds(next)
  }

  const handleSwipe = async (candidateId: string, direction: 'left' | 'right') => {
    const removed = candidates.find(c => c.id === candidateId)
    if (direction === 'left') setCandidates(prev => prev.filter(c => c.id !== candidateId))
    // Swipe + mutual-match detection, all server-side
    const res = await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: candidateId, targetType: 'candidate', action: direction }),
    }).catch(() => null)
    if (direction === 'left' && !(res && res.ok)) {
      // Roll back the optimistic removal so the card isn't silently lost
      if (removed) setCandidates(prev => prev.some(c => c.id === candidateId) ? prev : [removed, ...prev])
      alert('Could not record your pass - please try again.')
      return
    }
    const result = res && res.ok ? await res.json().catch(() => null) : null
    if (direction === 'right') {
      if (result?.matched) {
        setMatchInfo({ name: result.candidateName || 'This candidate', job: result.jobTitle || 'your role' })
      }
    }
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Browse Candidates</h1>

      <div className="dashboard-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or headline..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <input type="text" placeholder="Filter by specialism..." value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)} className="input-field" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="dashboard-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {c.profile_image_url ? (
                    <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif font-bold text-gray-300 text-lg">{c.full_name?.[0]}</span>
                  )}
                </div>
                <div className="min-w-0 cursor-pointer flex-1" onClick={() => setViewing(c)}>
                  <h3 className="font-semibold text-ink truncate hover:underline">{c.full_name}</h3>
                  <p className="text-sm text-gray-500 truncate">{c.headline}</p>
                </div>
              </div>

              {typeof c.matchScore === 'number' && (
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: c.matchBg, color: c.matchColour }}>{c.matchScore}% - {c.matchLabel}</span>
                  {c.bestJob && <span className="text-[10px] text-gray-400 truncate">for {c.bestJob}</span>}
                </div>
              )}

              {c.location && (
                <p className="text-sm text-gray-500 flex items-center space-x-1 mb-2">
                  <MapPin size={14} /><span>{c.location}</span>
                </p>
              )}

              {c.services_offered?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.services_offered.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {c.services_offered.length > 3 && <span className="text-xs text-gray-400">+{c.services_offered.length - 3}</span>}
                </div>
              )}

              {c.experience_years && <p className="text-xs text-gray-400 mb-3">{c.experience_years} years experience</p>}

              <button onClick={() => setViewing(c)} className="w-full mb-2 py-2 rounded-lg text-[12px] font-medium transition-colors" style={{ background: '#FDF6EC', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.35)' }}>
                View Full Profile
              </button>
              <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                <button onClick={() => handleSwipe(c.id, 'left')}
                  className="flex-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center space-x-1 text-sm">
                  <X size={14} /><span>Pass</span>
                </button>
                <button onClick={() => toggleShortlist(c.id)}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors ${shortlistedIds.has(c.id) ? 'bg-[#FDF6EC] text-accent' : 'bg-gold/10 hover:bg-gold/20 text-gold'}`}>
                  <Star size={14} fill={shortlistedIds.has(c.id) ? 'currentColor' : 'none'} /><span>{shortlistedIds.has(c.id) ? 'Shortlisted' : 'Shortlist'}</span>
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No candidates found.</div>
          )}
        </div>
      )}

      {/* Candidate full profile */}
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
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
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
                  ? <a href={viewing.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline" style={{ color: '#C9A96E' }}>View CV</a>
                  : <p className="text-gray-400 text-[12px]">No CV uploaded yet</p>}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white flex gap-2">
              <button onClick={() => { toggleShortlist(viewing.id); }} className="btn-primary flex-1">{shortlistedIds.has(viewing.id) ? 'Shortlisted' : 'Shortlist'}</button>
              {viewing.user_id && <a href={`/employer/messages?to=${viewing.user_id}`} className="btn-secondary flex-1 text-center">Message</a>}
            </div>
          </div>
        </div>
      )}

      {/* Mutual match celebration */}
      {matchInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMatchInfo(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#FDF6EC' }}>
              <Star size={28} style={{ color: '#C9A96E' }} fill="currentColor" />
            </div>
            <h3 className="text-[22px] font-semibold text-ink mb-2">It&apos;s a match!</h3>
            <p className="text-[14px] text-gray-500 mb-6">{matchInfo.name} already applied for {matchInfo.job}. They&apos;re waiting to hear from you.</p>
            <div className="space-y-2">
              <a href="/employer/applications" className="btn-primary block w-full text-center">View application</a>
              <button onClick={() => setMatchInfo(null)} className="btn-secondary block w-full">Keep browsing</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
