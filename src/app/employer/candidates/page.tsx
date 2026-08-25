'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Search, MapPin, Star, X, Heart, Briefcase, Users } from 'lucide-react'

export default function EmployerCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [interestedKeys, setInterestedKeys] = useState<Set<string>>(new Set())
  const [matchInfo, setMatchInfo] = useState<{ name: string; job: string } | null>(null)
  const [viewing, setViewing] = useState<any>(null)
  const [radius, setRadius] = useState('25')
  const [originGeocoded, setOriginGeocoded] = useState(true)
  const [directoryError, setDirectoryError] = useState('')
  const [requestedCandidateId, setRequestedCandidateId] = useState<string | null>(null)
  const [requestedProfileError, setRequestedProfileError] = useState('')
  const [urlReady, setUrlReady] = useState(false)
  const [liveRoleCount, setLiveRoleCount] = useState(0)

  function directoryUrl(offset = 0) {
    const params = new URLSearchParams()
    if (radius !== 'all') params.set('radius', radius)
    if (offset > 0) params.set('offset', String(offset))
    if (requestedCandidateId) params.set('candidate', requestedCandidateId)
    const qs = params.toString()
    return `/api/employer/candidates${qs ? `?${qs}` : ''}`
  }

  useEffect(() => {
    const candidateId = new URLSearchParams(window.location.search).get('candidate')
    setRequestedCandidateId(candidateId)
    if (candidateId) setRadius('all')
    setUrlReady(true)
  }, [])

  useEffect(() => {
    if (!urlReady) return
    let active = true

    async function load() {
      setLoading(true)
      setDirectoryError('')
      setRequestedProfileError('')

      const [directoryRes, swipesRes, shortlistRes] = await Promise.all([
        fetch(directoryUrl())
          .then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
          .catch(() => ({ ok: false, body: { error: 'Talent directory unavailable' } })),
        fetch('/api/swipe').then(r => r.ok ? r.json() : { passed_ids: [] }).catch(() => ({ passed_ids: [] })),
        fetch('/api/shortlist').then(async r => ({ ok: r.ok, body: r.ok ? await r.json().catch(() => ({})) : {} })).catch(() => ({ ok: false, body: {} })),
      ])

      if (!active) return
      if (!directoryRes.ok) setDirectoryError(directoryRes.body.error || 'Talent directory unavailable')
      setProfile(directoryRes.body.employer || null)
      setOriginGeocoded(directoryRes.body.origin?.geocoded !== false)
      setLiveRoleCount(Number(directoryRes.body.live_role_count || 0))

      const passedIds = new Set(swipesRes.passed_ids || [])
      const visible = (directoryRes.body.candidates || []).filter((c: any) => !passedIds.has(c.id) || c.id === requestedCandidateId)
      setCandidates(visible)
      setHasMore(Boolean(directoryRes.body.pagination?.has_more))
      setNextOffset(directoryRes.body.pagination?.next_offset ?? null)

      if (requestedCandidateId) {
        const requested = visible.find((candidate: any) => candidate.id === requestedCandidateId)
        if (requested) setViewing(requested)
        else if (directoryRes.ok) setRequestedProfileError('That featured professional is not currently available to this property based on their privacy or travel settings.')
      }

      if (shortlistRes.ok) setShortlistedIds(new Set((shortlistRes.body.shortlisted || []).map((s: any) => s.candidate_id)))
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [radius, requestedCandidateId, urlReady])

  async function loadMore() {
    if (loadingMore || nextOffset == null) return
    setLoadingMore(true)
    setDirectoryError('')
    try {
      const [directoryRes, swipesRes] = await Promise.all([
        fetch(directoryUrl(nextOffset)).then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) })),
        fetch('/api/swipe').then(r => r.ok ? r.json() : { passed_ids: [] }).catch(() => ({ passed_ids: [] })),
      ])
      if (!directoryRes.ok) {
        setDirectoryError(directoryRes.body.error || 'Could not load more talent.')
        return
      }
      const passedIds = new Set(swipesRes.passed_ids || [])
      const incoming = (directoryRes.body.candidates || []).filter((c: any) => !passedIds.has(c.id) || c.id === requestedCandidateId)
      setCandidates(current => {
        const seen = new Set(current.map(c => c.id))
        return [...current, ...incoming.filter((c: any) => !seen.has(c.id))]
      })
      setHasMore(Boolean(directoryRes.body.pagination?.has_more))
      setNextOffset(directoryRes.body.pagination?.next_offset ?? null)
    } catch {
      setDirectoryError('Could not load more talent - please try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  const filtered = useMemo(() => candidates.filter(c => {
    if (search && !c.full_name?.toLowerCase().includes(search.toLowerCase()) && !c.headline?.toLowerCase().includes(search.toLowerCase())) return false
    if (specFilter && !(c.services_offered || []).some((s: string) => s.toLowerCase().includes(specFilter.toLowerCase()))) return false
    return true
  }), [candidates, search, specFilter])

  function resetFilters() {
    setSearch('')
    setSpecFilter('')
    setRadius('all')
  }

  async function toggleShortlist(candidateId: string, jobId?: string | null) {
    const isShortlisted = shortlistedIds.has(candidateId)
    const next = new Set(shortlistedIds)
    if (isShortlisted) {
      const res = await fetch('/api/shortlist')
      if (res.ok) {
        const data = await res.json()
        const entry = (data.shortlisted || []).find((s: any) => s.candidate_id === candidateId)
        if (entry) await fetch('/api/shortlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: entry.id }) })
      }
      next.delete(candidateId)
    } else {
      const res = await fetch('/api/shortlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, jobId: jobId || null }),
      })
      if (!res.ok) { alert('Could not save this professional - please try again.'); return }
      next.add(candidateId)
    }
    setShortlistedIds(next)
  }

  async function handlePass(candidateId: string) {
    const removed = candidates.find(c => c.id === candidateId)
    setCandidates(prev => prev.filter(c => c.id !== candidateId))
    const res = await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: candidateId, targetType: 'candidate', action: 'left' }),
    }).catch(() => null)
    if (!res?.ok && removed) {
      setCandidates(prev => prev.some(c => c.id === candidateId) ? prev : [removed, ...prev])
      alert('Could not record your pass - please try again.')
    }
  }

  async function handleInterest(candidate: any) {
    if (!candidate.bestJobId) return
    const key = `${candidate.id}:${candidate.bestJobId}`
    const res = await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: candidate.id, targetType: 'candidate', action: 'right', contextJobId: candidate.bestJobId }),
    }).catch(() => null)
    const result = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) {
      alert(result.error || 'Could not save your interest - please try again.')
      return
    }
    setInterestedKeys(prev => new Set(prev).add(key))
    if (result.matched) setMatchInfo({ name: result.candidateName || candidate.full_name || 'This professional', job: result.jobTitle || candidate.bestJob })
  }

  function isInterested(candidate: any) {
    return candidate.bestJobId && interestedKeys.has(`${candidate.id}:${candidate.bestJobId}`)
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name || profile?.property_name}>
      <div className="mb-7">
        <p className="dashboard-eyebrow">Talent discovery</p>
        <h1 className="dashboard-title">Browse candidates</h1>
        <p className="dashboard-intro">Discover professionals by location, specialism and experience. When you have a live role, WHC ranks talent against that role and unlocks role-specific interest.</p>
      </div>

      {!loading && liveRoleCount === 0 && (
        <div className="dashboard-card mb-6 border-accent/25 bg-[#FDF8F0]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-white border border-accent/20 flex items-center justify-center flex-shrink-0"><Briefcase size={19} className="text-accent" /></div>
              <div>
                <p className="text-base font-semibold text-ink">Post a live role to unlock intelligent matching.</p>
                <p className="text-sm text-gray-600 mt-1 max-w-2xl">You can browse and save professionals now. Once a role is live, each profile will show a role-specific match score and you can express interest for that position.</p>
              </div>
            </div>
            <a href="/employer/jobs/new" className="btn-primary whitespace-nowrap text-center">Post a role</a>
          </div>
        </div>
      )}

      <div className="dashboard-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search by name or headline..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" /></div>
          <input type="text" placeholder="Filter by specialism..." value={specFilter} onChange={e => setSpecFilter(e.target.value)} className="input-field" />
          <select value={radius} onChange={e => setRadius(e.target.value)} className="input-field" aria-label="Search distance"><option value="5">Within 5 miles</option><option value="10">Within 10 miles</option><option value="25">Within 25 miles</option><option value="50">Within 50 miles</option><option value="100">Within 100 miles</option><option value="all">All locations</option></select>
        </div>
        {!originGeocoded && radius !== 'all' && <p className="mt-3 text-xs text-amber-700">Add a valid postcode to your Company Profile before using distance search.</p>}
        {directoryError && <p className="mt-3 text-xs text-red-600">{directoryError}</p>}
        {requestedProfileError && <p className="mt-3 text-xs text-amber-700">{requestedProfileError}</p>}
      </div>

      {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div> : (
        <>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <div key={c.id} className={`dashboard-card relative ${c.is_featured ? 'border-accent ring-1 ring-accent/20' : ''}`}>
                  {c.is_featured && <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white">★ Featured</span>}
                  <div className="flex items-center space-x-3 mb-3"><div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">{c.profile_image_url ? <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-gray-300 text-lg">{c.full_name?.[0]}</span>}</div><button type="button" className={`min-w-0 text-left flex-1 ${c.is_featured ? 'pr-20' : ''}`} onClick={() => setViewing(c)}><h3 className="font-semibold text-ink truncate hover:underline">{c.full_name}</h3><p className="text-sm text-gray-500 truncate">{c.headline}</p></button></div>
                  {typeof c.matchScore === 'number' ? <div className="mb-3"><div className="flex items-center gap-1.5"><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: c.matchBg, color: c.matchColour }}>{c.matchScore}% · {c.matchLabel}</span><span className="text-[10px] text-gray-400 truncate">for {c.bestJob}</span></div>{c.matchExplanation && <p className="mt-2 text-[11px] leading-5 text-gray-500">{c.matchExplanation}</p>}</div> : <p className="mb-3 text-[11px] text-gray-400">Browse now. Post a live role to calculate a role-specific match.</p>}
                  {c.location && <p className="text-sm text-gray-500 flex items-center gap-1 mb-2"><MapPin size={14} /><span>{c.location}{c.distance_miles != null ? ` · ${c.distance_miles} miles from property` : ''}</span></p>}
                  {c.travel_radius_miles && <p className="text-xs text-gray-400 mb-3">Travels up to {c.travel_radius_miles} miles</p>}
                  {c.services_offered?.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{c.services_offered.slice(0, 3).map((s: string) => <span key={s} className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{s}</span>)}</div>}
                  {c.experience_years && <p className="text-xs text-gray-400 mb-3">{c.experience_years} years experience</p>}
                  <button type="button" onClick={() => setViewing(c)} className="w-full mb-2 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#FDF6EC', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.35)' }}>View Full Profile</button>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                    <button type="button" onClick={() => handlePass(c.id)} className="py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center gap-1 text-xs"><X size={13} />Pass</button>
                    <button type="button" onClick={() => toggleShortlist(c.id, c.bestJobId)} className={`py-2 rounded-lg flex items-center justify-center gap-1 text-xs ${shortlistedIds.has(c.id) ? 'bg-[#FDF6EC] text-accent' : 'bg-gray-50 text-gray-500'}`}><Star size={13} fill={shortlistedIds.has(c.id) ? 'currentColor' : 'none'} />Save</button>
                    <button type="button" disabled={liveRoleCount === 0 || !c.bestJobId || isInterested(c)} onClick={() => handleInterest(c)} title={liveRoleCount === 0 ? 'Post a live role to express role-specific interest' : undefined} className="py-2 rounded-lg bg-[#0b2f4d] text-white flex items-center justify-center gap-1 text-xs disabled:opacity-40"><Heart size={13} fill={isInterested(c) ? 'currentColor' : 'none'} />Interested</button>
                  </div>
                  {liveRoleCount === 0 && <p className="text-[10px] text-center text-gray-400 mt-2">Interested unlocks when you have a live role.</p>}
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="dashboard-card text-center py-14 px-6">
              <div className="w-14 h-14 rounded-full bg-gray-50 mx-auto flex items-center justify-center mb-4"><Users size={24} className="text-gray-400" /></div>
              <h2 className="text-xl font-serif text-ink">New professionals are joining the platform.</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">There are no discoverable professionals in your current search area yet. Post a role now so you are ready to match as new talent joins.</p>
              <div className="flex flex-wrap justify-center gap-3 mt-6"><a href="/employer/jobs/new" className="btn-primary">Post a role</a><button type="button" onClick={resetFilters} className="btn-secondary">Search all locations</button></div>
            </div>
          ) : (
            <div className="dashboard-card text-center py-14 px-6">
              <div className="w-14 h-14 rounded-full bg-gray-50 mx-auto flex items-center justify-center mb-4"><Search size={23} className="text-gray-400" /></div>
              <h2 className="text-xl font-serif text-ink">No talent matches these filters.</h2>
              <p className="text-sm text-gray-500 mt-2">Try widening your search area or clearing the name and specialism filters.</p>
              <button type="button" onClick={resetFilters} className="btn-secondary mt-6">Reset filters & expand search</button>
            </div>
          )}

          {hasMore && filtered.length > 0 && <div className="flex justify-center mt-7"><button type="button" onClick={loadMore} disabled={loadingMore} className="btn-secondary min-w-40 disabled:opacity-50">{loadingMore ? 'Loading more...' : 'Load more talent'}</button></div>}
        </>
      )}

      {viewing && <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setViewing(null)}><div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}><div className="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10"><div className="flex items-start gap-4 min-w-0 pr-4"><div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">{viewing.profile_image_url ? <img src={viewing.profile_image_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-xl text-accent">{viewing.full_name?.[0]}</span>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold text-ink">{viewing.full_name}</h3>{viewing.is_featured && <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white">★ Featured</span>}</div>{viewing.headline && <p className="text-[13px] text-gray-500 mt-1">{viewing.headline}</p>}</div></div><button type="button" onClick={() => setViewing(null)} className="text-gray-300 hover:text-ink" aria-label="Close candidate profile"><X size={20} /></button></div><div className="p-6 space-y-6 text-sm">{viewing.bestJob && <div className="rounded-xl border border-accent/20 bg-[#FDF6EC] p-4"><p className="text-[10px] uppercase tracking-wider text-accent mb-1">Best live-role match</p><p className="font-semibold text-ink">{viewing.bestJob} · {viewing.matchScore}%</p>{viewing.matchExplanation && <p className="text-[12px] text-gray-600 mt-1">{viewing.matchExplanation}</p>}</div>}<div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50/70 p-4">{viewing.role_level && <div><p className="text-[10px] text-gray-400 uppercase mb-1">Role Level</p><p className="text-ink font-medium">{viewing.role_level}</p></div>}{viewing.location && <div><p className="text-[10px] text-gray-400 uppercase mb-1">Location</p><p className="text-ink font-medium">{viewing.location}</p></div>}{viewing.experience_years && <div><p className="text-[10px] text-gray-400 uppercase mb-1">Experience</p><p className="text-ink font-medium">{viewing.experience_years} years</p></div>}<div><p className="text-[10px] text-gray-400 uppercase mb-1">Contact</p><p className="text-ink font-medium">Unlocks after mutual match</p></div></div>{viewing.bio && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">About</p><p className="text-ink leading-relaxed whitespace-pre-wrap text-[13px]">{viewing.bio}</p></div>}{viewing.services_offered?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Treatments & Services</p><div className="flex flex-wrap gap-1.5">{viewing.services_offered.map((x: string) => <span key={x} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}{viewing.qualifications?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Qualifications</p><div className="flex flex-wrap gap-1.5">{viewing.qualifications.map((x: string) => <span key={x} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}<p className="text-[12px] text-gray-500">Personal phone and email stay private. A conversation opens only after both sides show interest in the same role.</p></div><div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur grid grid-cols-2 gap-2"><button type="button" onClick={() => toggleShortlist(viewing.id, viewing.bestJobId)} className="btn-secondary">{shortlistedIds.has(viewing.id) ? 'Saved' : 'Save profile'}</button><button type="button" disabled={liveRoleCount === 0 || !viewing.bestJobId || isInterested(viewing)} onClick={() => handleInterest(viewing)} className="btn-primary disabled:opacity-50">{liveRoleCount === 0 ? 'Post a live role first' : isInterested(viewing) ? `Interested in ${viewing.bestJob}` : viewing.bestJob ? `Interested for ${viewing.bestJob}` : 'No eligible live role'}</button></div></div></div>}

      {matchInfo && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMatchInfo(null)}><div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}><div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[#FDF6EC]"><Heart size={28} className="text-accent" fill="currentColor" /></div><h3 className="text-[22px] font-semibold text-ink mb-2">It&apos;s a match!</h3><p className="text-[14px] text-gray-500 mb-6">You and {matchInfo.name} both said yes to {matchInfo.job}. Your WHC conversation is now open.</p><div className="space-y-2"><a href="/employer/messages" className="btn-primary block w-full text-center">Start conversation</a><button type="button" onClick={() => setMatchInfo(null)} className="btn-secondary block w-full">Keep browsing</button></div></div></div>}
    </DashboardShell>
  )
}
