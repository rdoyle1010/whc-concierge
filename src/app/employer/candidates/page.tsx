'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, Star, X, Heart } from 'lucide-react'
import { calculateMatchScore } from '@/lib/matching'

export default function EmployerCandidatesPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) { setLoading(false); return }

      const [profileRes, directoryRes, swipesRes, shortlistRes] = await Promise.all([
        supabase.from('employer_profiles').select('*').eq('user_id', user.id).single(),
        fetch(`/api/employer/candidates${radius === 'all' ? '' : `?radius=${radius}`}`)
          .then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
          .catch(() => ({ ok: false, body: { error: 'Talent directory unavailable' } })),
        fetch('/api/swipe').then(r => r.ok ? r.json() : { passed_ids: [] }).catch(() => ({ passed_ids: [] })),
        fetch('/api/shortlist').then(async r => ({ ok: r.ok, body: r.ok ? await r.json().catch(() => ({})) : {} })).catch(() => ({ ok: false, body: {} })),
      ])

      const prof = profileRes.data
      setProfile(prof)
      if (!directoryRes.ok) setDirectoryError(directoryRes.body.error || 'Talent directory unavailable')
      setOriginGeocoded(directoryRes.body.origin?.geocoded !== false)
      const passedIds = new Set(swipesRes.passed_ids || [])
      const visible = (directoryRes.body.candidates || []).filter((c: any) => !passedIds.has(c.id) || c.id === requestedCandidateId)

      let scored = visible
      if (prof) {
        const now = new Date().toISOString()
        const { data: myJobs } = await supabase.from('job_listings').select('*')
          .eq('employer_id', prof.id).eq('is_live', true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
        const jobs = (myJobs || []).map((j: any) => ({ ...j, title: j.job_title || j.title, required_product_houses: j.required_brands || j.required_product_houses }))
        scored = visible.map((c: any) => {
          let best: any = null
          for (const j of jobs) {
            const r = calculateMatchScore(c, j)
            if (r.hardStop) continue
            if (!best || r.score > best.matchScore) {
              best = {
                matchScore: r.score,
                matchLabel: r.label,
                matchColour: r.colour,
                matchBg: r.bgColour,
                matchExplanation: r.matchExplanation,
                bestJob: j.title,
                bestJobId: j.id,
                roleDistanceMiles: r.distanceMiles,
              }
            }
          }
          return { ...c, ...(best || {}) }
        }).sort((a: any, b: any) => {
          if (!!a.is_featured !== !!b.is_featured) return a.is_featured ? -1 : 1
          return (b.matchScore ?? -1) - (a.matchScore ?? -1)
        })
      }

      if (!active) return
      setCandidates(scored)
      if (requestedCandidateId) {
        const requested = scored.find((candidate: any) => candidate.id === requestedCandidateId)
        if (requested) setViewing(requested)
        else if (directoryRes.ok) setRequestedProfileError('That featured professional is not currently available to this property based on their privacy or travel settings.')
      }
      if (shortlistRes.ok) setShortlistedIds(new Set((shortlistRes.body.shortlisted || []).map((s: any) => s.candidate_id)))
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [radius, requestedCandidateId, urlReady])

  const filtered = candidates.filter(c => {
    if (search && !c.full_name?.toLowerCase().includes(search.toLowerCase()) && !c.headline?.toLowerCase().includes(search.toLowerCase())) return false
    if (specFilter && !(c.services_offered || []).some((s: string) => s.toLowerCase().includes(specFilter.toLowerCase()))) return false
    return true
  })

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
    if (!candidate.bestJobId) {
      alert('Post a live role before expressing role-specific interest in a professional.')
      return
    }
    const key = `${candidate.id}:${candidate.bestJobId}`
    const res = await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: candidate.id, targetType: 'candidate', action: 'right', contextJobId: candidate.bestJobId }),
    }).catch(() => null)
    const result = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) {
      if (res?.status === 403) {
        setCandidates(prev => prev.filter(c => c.id !== candidate.id))
        if (viewing?.id === candidate.id) setViewing(null)
      }
      alert(result.error || 'Could not save your interest - please try again.')
      return
    }
    setInterestedKeys(prev => new Set(prev).add(key))
    if (result.matched) {
      setMatchInfo({ name: result.candidateName || candidate.full_name || 'This professional', job: result.jobTitle || candidate.bestJob })
    }
  }

  function isInterested(candidate: any) {
    return candidate.bestJobId && interestedKeys.has(`${candidate.id}:${candidate.bestJobId}`)
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <div className="mb-7">
        <p className="dashboard-eyebrow">Talent discovery</p>
        <h1 className="dashboard-title">Browse candidates</h1>
        <p className="dashboard-intro">Talent is ranked against your live roles using skills, experience and location. Interest is tied to a specific role; messaging unlocks when both sides say yes.</p>
      </div>

      <div className="dashboard-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or headline..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <input type="text" placeholder="Filter by specialism..." value={specFilter} onChange={e => setSpecFilter(e.target.value)} className="input-field" />
          <select value={radius} onChange={e => setRadius(e.target.value)} className="input-field" aria-label="Search distance">
            <option value="5">Within 5 miles</option><option value="10">Within 10 miles</option><option value="25">Within 25 miles</option><option value="50">Within 50 miles</option><option value="100">Within 100 miles</option><option value="all">All locations</option>
          </select>
        </div>
        {!originGeocoded && radius !== 'all' && <p className="mt-3 text-xs text-amber-700">Add a valid postcode to your Company Profile before using distance search.</p>}
        {directoryError && <p className="mt-3 text-xs text-red-600">{directoryError}</p>}
        {requestedProfileError && <p className="mt-3 text-xs text-amber-700">{requestedProfileError}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className={`dashboard-card relative ${c.is_featured ? 'border-accent ring-1 ring-accent/20' : ''}`}>
              {c.is_featured && <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white">★ Featured</span>}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {c.profile_image_url ? <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-gray-300 text-lg">{c.full_name?.[0]}</span>}
                </div>
                <button type="button" className={`min-w-0 text-left flex-1 ${c.is_featured ? 'pr-20' : ''}`} onClick={() => setViewing(c)}>
                  <h3 className="font-semibold text-ink truncate hover:underline">{c.full_name}</h3>
                  <p className="text-sm text-gray-500 truncate">{c.headline}</p>
                </button>
              </div>

              {typeof c.matchScore === 'number' ? (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: c.matchBg, color: c.matchColour }}>{c.matchScore}% · {c.matchLabel}</span>
                    <span className="text-[10px] text-gray-400 truncate">for {c.bestJob}</span>
                  </div>
                  {c.matchExplanation && <p className="mt-2 text-[11px] leading-5 text-gray-500">{c.matchExplanation}</p>}
                </div>
              ) : <p className="mb-3 text-[11px] text-gray-400">Post a live role to calculate a role-specific match.</p>}

              {c.location && <p className="text-sm text-gray-500 flex items-center gap-1 mb-2"><MapPin size={14} /><span>{c.location}{c.distance_miles != null ? ` · ${c.distance_miles} miles from property` : ''}</span></p>}
              {c.travel_radius_miles && <p className="text-xs text-gray-400 mb-3">Travels up to {c.travel_radius_miles} miles</p>}
              {c.services_offered?.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{c.services_offered.slice(0, 3).map((s: string) => <span key={s} className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{s}</span>)}</div>}
              {c.experience_years && <p className="text-xs text-gray-400 mb-3">{c.experience_years} years experience</p>}

              <button type="button" onClick={() => setViewing(c)} className="w-full mb-2 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#FDF6EC', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.35)' }}>View Full Profile</button>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => handlePass(c.id)} className="py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center gap-1 text-xs"><X size={13} />Pass</button>
                <button type="button" onClick={() => toggleShortlist(c.id, c.bestJobId)} className={`py-2 rounded-lg flex items-center justify-center gap-1 text-xs ${shortlistedIds.has(c.id) ? 'bg-[#FDF6EC] text-accent' : 'bg-gray-50 text-gray-500'}`}><Star size={13} fill={shortlistedIds.has(c.id) ? 'currentColor' : 'none'} />Save</button>
                <button type="button" disabled={!c.bestJobId || isInterested(c)} onClick={() => handleInterest(c)} className="py-2 rounded-lg bg-[#0b2f4d] text-white flex items-center justify-center gap-1 text-xs disabled:opacity-50"><Heart size={13} fill={isInterested(c) ? 'currentColor' : 'none'} />{isInterested(c) ? 'Interested' : 'Interested'}</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400">No candidates found.</div>}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setViewing(null)}>
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div className="flex items-start gap-4 min-w-0 pr-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {viewing.profile_image_url ? <img src={viewing.profile_image_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-xl text-accent">{viewing.full_name?.[0]}</span>}
                </div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold text-ink">{viewing.full_name}</h3>{viewing.is_featured && <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white">★ Featured</span>}</div>{viewing.headline && <p className="text-[13px] text-gray-500 mt-1">{viewing.headline}</p>}</div>
              </div>
              <button type="button" onClick={() => setViewing(null)} className="text-gray-300 hover:text-ink" aria-label="Close candidate profile"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              {viewing.bestJob && <div className="rounded-xl border border-accent/20 bg-[#FDF6EC] p-4"><p className="text-[10px] uppercase tracking-wider text-accent mb-1">Best live-role match</p><p className="font-semibold text-ink">{viewing.bestJob} · {viewing.matchScore}%</p>{viewing.matchExplanation && <p className="text-[12px] text-gray-600 mt-1">{viewing.matchExplanation}</p>}</div>}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50/70 p-4">
                {viewing.role_level && <div><p className="text-[10px] text-gray-400 uppercase mb-1">Role Level</p><p className="text-ink font-medium">{viewing.role_level}</p></div>}
                {viewing.location && <div><p className="text-[10px] text-gray-400 uppercase mb-1">Location</p><p className="text-ink font-medium">{viewing.location}</p></div>}
                {viewing.experience_years && <div><p className="text-[10px] text-gray-400 uppercase mb-1">Experience</p><p className="text-ink font-medium">{viewing.experience_years} years</p></div>}
                <div><p className="text-[10px] text-gray-400 uppercase mb-1">Contact</p><p className="text-ink font-medium">Unlocks after mutual match</p></div>
              </div>
              {viewing.bio && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">About</p><p className="text-ink leading-relaxed whitespace-pre-wrap text-[13px]">{viewing.bio}</p></div>}
              {viewing.services_offered?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Treatments & Services</p><div className="flex flex-wrap gap-1.5">{viewing.services_offered.map((x: string) => <span key={x} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}
              {viewing.qualifications?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Qualifications</p><div className="flex flex-wrap gap-1.5">{viewing.qualifications.map((x: string) => <span key={x} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}
              {viewing.product_houses?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Product Houses</p><div className="flex flex-wrap gap-1.5">{viewing.product_houses.map((x: string) => <span key={x} className="text-[11px] bg-[#FDF6EC] text-accent px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}
              {viewing.systems_experience?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Systems</p><div className="flex flex-wrap gap-1.5">{viewing.systems_experience.map((x: string) => <span key={x} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{x}</span>)}</div></div>}
              <p className="text-[12px] text-gray-500">Personal phone and email stay private. A conversation opens only after both sides show interest in the same role.</p>
            </div>
            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur grid grid-cols-2 gap-2">
              <button type="button" onClick={() => toggleShortlist(viewing.id, viewing.bestJobId)} className="btn-secondary">{shortlistedIds.has(viewing.id) ? 'Saved' : 'Save profile'}</button>
              <button type="button" disabled={!viewing.bestJobId || isInterested(viewing)} onClick={() => handleInterest(viewing)} className="btn-primary disabled:opacity-50">{isInterested(viewing) ? `Interested in ${viewing.bestJob}` : viewing.bestJob ? `Interested for ${viewing.bestJob}` : 'Post a live role first'}</button>
            </div>
          </div>
        </div>
      )}

      {matchInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMatchInfo(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[#FDF6EC]"><Heart size={28} className="text-accent" fill="currentColor" /></div>
            <h3 className="text-[22px] font-semibold text-ink mb-2">It&apos;s a match!</h3>
            <p className="text-[14px] text-gray-500 mb-6">You and {matchInfo.name} both said yes to {matchInfo.job}. Your WHC conversation is now open.</p>
            <div className="space-y-2"><a href="/employer/messages" className="btn-primary block w-full text-center">Start conversation</a><button type="button" onClick={() => setMatchInfo(null)} className="btn-secondary block w-full">Keep browsing</button></div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
