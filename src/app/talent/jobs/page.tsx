'use client'

import { formatSalary } from '@/lib/money'
import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import { Search, MapPin, Briefcase, Bookmark, Check, Star, Building2, ArrowRight, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import MatchBreakdown from '@/components/MatchBreakdown'
import Pagination from '@/components/Pagination'
import { ROLE_LEVELS, CONTRACT_TYPES } from '@/lib/constants'

export default function TalentJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [minMatch] = useState(0)
  const [sortBy, setSortBy] = useState('match')
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [drafts, setDrafts] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [passed, setPassed] = useState<Set<string>>(new Set())
  const [applyError, setApplyError] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 12

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      let cp: any = null
      if (user) {
        const { data } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
        cp = data
        setProfile(data)
        const [{ data: apps }, savedRes, swipeRes] = await Promise.all([
          supabase.from('applications').select('role_id,status').eq('candidate_id', cp?.id || user.id),
          fetch('/api/saved-jobs'),
          fetch('/api/swipe'),
        ])
        if (apps) {
          setApplied(new Set(apps.filter(a => a.status !== 'draft').map(a => a.role_id).filter(Boolean)))
          setDrafts(new Set(apps.filter(a => a.status === 'draft').map(a => a.role_id).filter(Boolean)))
        }
        if (savedRes.ok) {
          const savedData = await savedRes.json()
          setSaved(new Set((savedData.saved || []).map((s: any) => s.job_id)))
        }
        if (swipeRes.ok) {
          const swipeData = await swipeRes.json()
          setPassed(new Set(swipeData.passed_job_ids || []))
        }
      }

      const now = new Date().toISOString()
      let { data: rawData, error: jobsError } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name, logo_url, property_photos, review_score, review_count, star_rating)')
        .eq('is_live', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('posted_date', { ascending: false })

      if (jobsError) {
        const fallback = await supabase
          .from('job_listings')
          .select('*, employer_profiles(company_name, property_name)')
          .eq('is_live', true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('posted_date', { ascending: false })
        rawData = fallback.data
        jobsError = fallback.error
      }
      if (jobsError) console.error('Unable to load talent jobs:', jobsError.message)

      const normalized = (rawData || []).map((j: any) => {
        const title = j.job_title || j.title
        const description = j.job_description || j.description
        const companyName = j.employer_profiles?.property_name || j.employer_profiles?.company_name
        let matchScore: number | null = null
        let matchLabel = 'Complete your profile'
        let matchColour = '#555555'
        let matchBg = '#F3F4F6'
        let matchBreakdown: any = null
        let hardStop = false
        let hardStopReason: string | undefined
        let matchExplanation = ''
        let distanceMiles: number | null = null
        if (cp) {
          const r = calculateMatchScore(cp, j)
          matchScore = r.score
          matchLabel = r.label
          matchColour = r.colour
          matchBg = r.bgColour
          matchBreakdown = r.breakdown
          hardStop = r.hardStop
          hardStopReason = r.hardStopReason
          matchExplanation = r.matchExplanation
          distanceMiles = r.distanceMiles
        }
        return { ...j, title, description, employer_profiles: { ...j.employer_profiles, company_name: companyName }, matchScore, matchLabel, matchColour, matchBg, matchBreakdown, hardStop, hardStopReason, matchExplanation, distanceMiles }
      })

      setJobs(normalized)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = jobs.filter(j => {
    if (passed.has(j.id)) return false
    if (search && !j.title?.toLowerCase().includes(search.toLowerCase()) && !j.employer_profiles?.company_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (roleFilter && j.required_role_level !== roleFilter) return false
    if (contractFilter && j.contract_type !== contractFilter) return false
    if (minMatch && (j.matchScore == null || j.matchScore < minMatch)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'match') return (b.matchScore ?? -1) - (a.matchScore ?? -1)
    if (sortBy === 'newest') return new Date(b.created_at || b.posted_date).getTime() - new Date(a.created_at || a.posted_date).getTime()
    if (sortBy === 'salary_high') return (b.salary_max || 0) - (a.salary_max || 0)
    if (sortBy === 'salary_low') return (a.salary_min || 999999) - (b.salary_min || 999999)
    return 0
  })
  const paginatedSorted = sorted.slice((page - 1) * perPage, page * perPage)

  const toggleSave = async (jobId: string) => {
    const isSaved = saved.has(jobId)
    const next = new Set(saved)
    if (isSaved) {
      next.delete(jobId)
      await fetch('/api/saved-jobs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) })
    } else {
      next.add(jobId)
      await fetch('/api/saved-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) })
    }
    setSaved(next)
  }

  const handlePass = async (jobId: string) => {
    const res = await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: jobId, targetType: 'job', action: 'left' }),
    }).catch(() => null)
    if (!res?.ok) {
      setApplyError('Could not save your pass. Please try again.')
      return
    }
    setApplyError('')
    setPassed(prev => new Set(prev).add(jobId))
  }

  const handleApply = async (jobId: string) => {
    if (!userId) return
    let res: Response
    try {
      res = await fetch('/api/applications/draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
    } catch {
      setApplyError('Could not start your application - please check your connection and try again.')
      return
    }

    const body = await res.json().catch(() => ({} as any))
    if (!res.ok) {
      if (res.status === 409 && body.applicationId) {
        window.location.href = '/talent/applications?review=draft'
        return
      }
      setApplyError(body.error || 'Could not start your application. Please try again.')
      return
    }

    setApplyError('')
    setDrafts(prev => new Set(prev).add(jobId))
    window.location.href = '/talent/applications?review=draft'
  }

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return <DashboardShell role="talent"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-64 rounded-md" />)}</div></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-7">
        <div>
          <p className="dashboard-eyebrow">Jobs & matches</p>
          <h1 className="dashboard-title">Find your next role</h1>
          <div className="mb-0 mt-3 inline-flex rounded-xl border border-[#dddddd] bg-white p-1 text-[12px] font-semibold"><span className="rounded-lg bg-[#1c1c1c] px-4 py-2 text-white">Browse list</span><a href="/roles/match" className="rounded-lg px-4 py-2 text-[#555555] hover:text-[#1c1c1c]">Match deck</a></div>
          <p className="dashboard-intro">Roles are ranked from your skills, experience, location and working preferences. Your match helps you decide, but you stay in control of whether to apply.</p>
        </div>
        <p className="text-[12px] text-muted whitespace-nowrap">{sorted.length} role{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      {applyError && <div className="border-l-2 border-red-500 bg-white/70 text-red-700 text-[13px] px-4 py-3 mb-6">{applyError}</div>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        <div className="md:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search roles or properties..." aria-label="Search roles or properties" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" />
        </div>
        <select aria-label="Filter by role level" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field !py-2 text-[13px]">
          <option value="">All levels</option>
          {ROLE_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select aria-label="Filter by contract type" value={contractFilter} onChange={e => setContractFilter(e.target.value)} className="input-field !py-2 text-[13px]">
          <option value="">All contracts</option>
          {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
        <select aria-label="Sort roles" value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field !py-2 text-[13px]">
          <option value="match">Best match</option>
          <option value="newest">Newest</option>
          <option value="salary_high">Salary: high-low</option>
          <option value="salary_low">Salary: low-high</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20"><Briefcase size={32} className="mx-auto text-muted mb-3" /><p className="text-[14px] text-muted">No roles match your filters.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {paginatedSorted.map(job => {
              const eligible = job.matchScore != null && !job.hardStop
              const needsProfile = job.matchScore == null

              return (
                <article key={job.id} className="card p-0 overflow-hidden">
                  <div className="relative h-36 bg-[#f1f1f1] overflow-hidden">
                    {job.employer_profiles?.property_photos?.[0]
                      ? <img loading="lazy" decoding="async" src={job.employer_profiles.property_photos[0]} alt={job.employer_profiles?.company_name || 'Property'} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center"><Building2 size={30} className="text-muted/50" /></div>}
                    {job.employer_profiles?.logo_url && (
                      <div className="absolute bottom-3 left-5 h-12 w-12 overflow-hidden rounded-md border-2 border-white bg-white shadow-sm">
                        <img loading="lazy" decoding="async" src={job.employer_profiles.logo_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className={tierClass(job.tier || 'Standard')}>{job.tier || 'Standard'}</span>
                      {job.matchScore != null ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: job.matchBg, color: job.matchColour }}>{job.matchScore}% · {job.matchLabel}</span>
                      ) : (
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-muted">Complete profile to match</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <p className="eyebrow mb-0.5">{job.employer_profiles?.company_name}</p>
                      {job.employer_profiles?.review_score ? <span className="inline-flex items-center gap-1 text-[11px] text-secondary"><Star size={11} className="fill-amber-400 text-amber-400" />{job.employer_profiles.review_score}</span> : null}
                    </div>
                    <h3 className="text-[24px] text-ink mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-2 text-[12px] text-muted mb-3">
                      <span className="flex items-center gap-1"><MapPin size={11} />{job.location}{job.distanceMiles != null ? ` · ${job.distanceMiles.toFixed(1)} miles` : ''}</span>
                      <span>{job.contract_type?.replace('_', ' ') || job.job_type}</span>
                      {job.salary_min && job.salary_max && <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>}
                    </div>

                    {job.description && <p className="text-[13px] leading-6 text-secondary line-clamp-3 mb-4">{job.description}</p>}

                    {(job.required_brands || job.required_product_houses || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(job.required_brands || job.required_product_houses).slice(0, 3).map((b: string) => (
                          <span key={b} className="text-[10px] border border-border text-muted px-2 py-0.5 rounded-full">{b}</span>
                        ))}
                      </div>
                    )}

                    <div className={`mb-4 border-l-2 px-3 py-2.5 ${eligible ? 'border-emerald-500 bg-emerald-50/60' : job.hardStop ? 'border-red-500 bg-red-50/60' : 'border-border bg-surface/60'}`}>
                      <div className="flex items-start gap-2">
                        {eligible ? <CheckCircle2 size={14} className="text-emerald-700 mt-0.5 shrink-0" /> : <AlertTriangle size={14} className={`${job.hardStop ? 'text-red-600' : 'text-muted'} mt-0.5 shrink-0`} />}
                        <div>
                          <p className={`text-[11px] font-semibold ${eligible ? 'text-emerald-800' : job.hardStop ? 'text-red-700' : 'text-secondary'}`}>
                            {eligible ? 'You can apply' : job.hardStop ? 'Mandatory requirement missing' : 'Complete your profile'}
                          </p>
                          <p className="text-[11px] leading-5 text-secondary mt-0.5">
                            {eligible
                              ? `Your current match is ${job.matchScore}%. Use the score as guidance, then decide whether this role is right for you.`
                              : job.hardStop
                                ? (job.hardStopReason || 'Your profile does not currently meet one of this role’s mandatory requirements.')
                                : 'Complete your profile so we can calculate your match and show you where you are strongest.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {job.matchExplanation && <p className="text-[12px] text-secondary mb-3">{job.matchExplanation}</p>}
                    {job.matchBreakdown && job.matchScore != null && (
                      <MatchBreakdown breakdown={job.matchBreakdown} score={job.matchScore} label={job.matchLabel} colour={job.matchColour} compact />
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      <a href={`/jobs/${job.id}`} className="btn-secondary inline-flex items-center gap-1">Details <ArrowRight size={12} /></a>
                      <button type="button" onClick={() => handlePass(job.id)} className="btn-secondary inline-flex items-center gap-1" title="Pass and hide this role"><X size={12} />Pass</button>
                      {applied.has(job.id) ? (
                        <div className="btn-secondary min-w-[150px] flex-1 text-center flex items-center justify-center gap-1 opacity-60 cursor-default"><Check size={12} />Application submitted</div>
                      ) : drafts.has(job.id) ? (
                        <button type="button" onClick={() => handleApply(job.id)} className="btn-primary min-w-[150px] flex-1">Continue application</button>
                      ) : eligible ? (
                        <button type="button" onClick={() => handleApply(job.id)} className="btn-primary min-w-[150px] flex-1">Apply now</button>
                      ) : (
                        <button type="button" disabled className="btn-secondary min-w-[150px] flex-1 opacity-55 cursor-not-allowed" title={job.hardStopReason || undefined}>
                          {job.hardStop ? 'Requirement missing' : needsProfile ? 'Complete profile' : 'Not eligible'}
                        </button>
                      )}
                      <button type="button" onClick={() => toggleSave(job.id)} className={`p-2 border rounded-md transition-colors ${saved.has(job.id) ? 'bg-[#f1f1f1] border-accent/30 text-accent' : 'border-border text-muted hover:text-accent hover:border-accent/30'}`} title={saved.has(job.id) ? 'Unsave role' : 'Save role for later'}>
                        <Bookmark size={14} fill={saved.has(job.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          <Pagination page={page} perPage={perPage} total={sorted.length} showPerPage={false} onPageChange={setPage} />
        </>
      )}
    </DashboardShell>
  )
}