'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import MatchBreakdown from '@/components/MatchBreakdown'
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, Heart, MapPin, Sparkles, Star, X } from 'lucide-react'

const tierClass = (tier: string) => tier === 'Platinum' ? 'badge-platinum' : tier === 'Gold' ? 'badge-gold' : tier === 'Silver' ? 'badge-silver' : 'badge-bronze'

function salaryText(job:any){
  if(job?.salary_display_text)return job.salary_display_text
  if(job?.salary_min&&job?.salary_max)return `£${Math.round(job.salary_min/1000)}k–£${Math.round(job.salary_max/1000)}k`
  if(job?.salary_min)return `From £${Math.round(job.salary_min/1000)}k`
  return 'Competitive salary'
}

export default function SwipeMatchPage() {
  const supabase = useMemo(() => createClient(), [])
  const [jobs, setJobs] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedDraft, setSavedDraft] = useState(false)
  const [error, setError] = useState('')
  const [profileIncomplete, setProfileIncomplete] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!active) return
      if (!user) {
        window.location.href = `/login?role=talent&next=${encodeURIComponent('/roles/match')}`
        return
      }
      setUserId(user.id)

      const { data: candidateProfile } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (!active) return
      if (!candidateProfile || !candidateProfile.role_level) {
        setProfileIncomplete(true)
        setLoading(false)
        return
      }

      const [jobsResult, swipesResult, applicationsResult] = await Promise.all([
        fetch('/api/jobs/match').then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) })).catch(() => ({ ok: false, body: {} })),
        fetch('/api/swipe').then(r => r.ok ? r.json() : { passed_job_ids: [] }).catch(() => ({ passed_job_ids: [] })),
        supabase.from('applications').select('job_id,role_id').eq('candidate_id', candidateProfile.id),
      ])

      if (!active) return
      if (!jobsResult.ok) {
        setError(jobsResult.body?.error || 'We could not load your matches just now. Please refresh the page.')
        setLoading(false)
        return
      }

      const passed = new Set(swipesResult.passed_job_ids || [])
      const alreadySaved = new Set((applicationsResult.data || []).flatMap((app:any) => [app.job_id, app.role_id]).filter(Boolean))

      const normalized = (jobsResult.body?.rows || [])
        .filter((job:any) => !passed.has(job.id) && !alreadySaved.has(job.id))
        .map((job: any) => {
          const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
          const normalizedJob = {
            ...job,
            title: job.job_title,
            description: job.job_description,
            required_product_houses: job.required_brands,
            employer_profiles: {
              ...employer,
              company_name: employer?.property_name || employer?.company_name,
            },
          }
          const result = calculateMatchScore(candidateProfile, normalizedJob)
          return {
            ...normalizedJob,
            matchScore: result.score,
            matchLabel: result.label,
            matchColour: result.colour,
            matchBg: result.bgColour,
            matchingSkills: result.matchingSkills || [],
            matchExplanation: result.matchExplanation || '',
            matchBreakdown: result.breakdown,
            hardStop: result.hardStop,
            hardStopReason: result.hardStopReason,
          }
        })
        .filter((job:any) => !job.hardStop)
        .sort((a:any,b:any) => b.matchScore - a.matchScore)

      setJobs(normalized)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [supabase])

  const job = jobs[idx]

  const nextRole = useCallback(() => {
    setIdx(current => current + 1)
    setExpanded(false)
    setSavedDraft(false)
    setError('')
  }, [])

  async function passRole() {
    if (!job || saving || !userId) return
    setSaving(true)
    const res = await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: job.id, targetType: 'job', action: 'left' }),
    }).catch(() => null)
    setSaving(false)
    if (!res?.ok) {
      setError('We could not save that choice. Please try again.')
      return
    }
    nextRole()
  }

  async function saveInterest() {
    if (!job || saving || !userId) return
    if (job.matchScore < 45) {
      setError('This role is below the minimum match level for an application. You can still review the role, but you cannot apply unless your profile becomes a stronger match.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/applications/draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    }).catch(() => null)
    const result = res ? await res.json().catch(() => ({})) : {}
    setSaving(false)
    if (!res?.ok) {
      if (res?.status === 409 && result.applicationId) {
        window.location.href = '/talent/applications'
        return
      }
      setError(result.error || 'Could not save this role. Please try again.')
      return
    }
    setSavedDraft(true)
  }

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div>

  if (profileIncomplete) return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-lg dashboard-card text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f6f8] flex items-center justify-center mx-auto mb-5"><Sparkles size={22} className="text-[#10283b]" /></div>
        <p className="dashboard-eyebrow">Matching needs your profile</p>
        <h1 className="text-[28px] font-semibold text-ink mb-3">Finish your profile to unlock meaningful matches.</h1>
        <p className="text-[14px] leading-6 text-muted mb-7">We use your role level, experience, treatments, qualifications, brands, systems, location and preferences to rank roles. We will not show made-up match scores.</p>
        <Link href="/talent/profile" className="btn-primary inline-flex items-center gap-2">Complete profile <ArrowRight size={14}/></Link>
      </div>
    </div>
  )

  if (idx >= jobs.length) return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-white border border-border rounded-2xl flex items-center justify-center mx-auto mb-5"><Sparkles size={24} className="text-[#10283b]" /></div>
        <h1 className="text-[28px] font-semibold text-ink mb-2">{jobs.length ? 'You’ve reviewed all current matches' : 'No eligible roles right now'}</h1>
        <p className="text-[14px] leading-6 text-muted mb-7">All roles that pass mandatory requirements are ranked here, strongest to weakest. Roles under 45% stay visible for comparison but cannot be applied to.</p>
        {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600">{error}</div>}
        <div className="flex justify-center gap-2"><Link href="/talent/applications" className="btn-primary">My Applications</Link><Link href="/jobs" className="btn-secondary">Browse all roles</Link></div>
      </div>
    </div>
  )

  if (savedDraft) return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-white p-8 shadow-xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f6f8]"><FileText size={23} className="text-[#10283b]" /></div>
        <p className="dashboard-eyebrow">Ready to send</p>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-ink mb-3">{job?.title} is now in My Applications.</h1>
        <p className="text-[14px] leading-6 text-muted mb-6">Nothing has been sent to {job?.employer_profiles?.company_name} yet. Review the full role, add your covering letter, then choose Send Application when you are ready.</p>
        <div className="rounded-2xl border border-border bg-parchment p-5 mb-7 text-[12px] leading-5 text-secondary">
          <p className="font-semibold text-ink mb-2">You stay in control</p>
          <p>Matching helps you discover suitable roles. Employers only see you after you explicitly submit an application.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/talent/applications" className="btn-primary flex-1 text-center">Review & add covering letter</Link>
          <button type="button" onClick={nextRole} className="btn-secondary flex-1">Keep matching</button>
        </div>
      </div>
    </div>
  )

  const score = job.matchScore
  const property = job.employer_profiles?.company_name || 'Luxury wellness property'
  const photo = job.employer_profiles?.property_photos?.[0]
  const logo = job.employer_profiles?.logo_url
  const reviewScore = job.employer_profiles?.review_score
  const canApply = score >= 45

  return (
    <div className="min-h-screen bg-surface text-body">
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-[64px] flex items-center justify-between">
          <Link href="/talent/dashboard" className="text-[13px] text-muted hover:text-ink flex items-center gap-1.5"><ArrowLeft size={14} /> Dashboard</Link>
          <div className="text-center"><p className="text-[13px] font-semibold text-ink">Your role matches</p><p className="text-[10px] text-muted">Ranked from your WHC profile</p></div>
          <span className="rounded-full bg-parchment px-3 py-1.5 text-[11px] font-semibold text-secondary">{idx + 1} of {jobs.length}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-9 md:py-12">
        <div className="mb-8 md:flex md:items-end md:justify-between">
          <div>
            <p className="dashboard-eyebrow">Jobs & matches</p>
            <h1 className="dashboard-title !text-[32px] md:!text-[40px]">Roles that genuinely fit your profile.</h1>
            <div className="mb-0 mt-3 inline-flex rounded-xl border border-[#e3e7eb] bg-white p-1 text-[12px] font-semibold"><a href="/talent/jobs" className="rounded-lg px-4 py-2 text-[#5a6a76] hover:text-[#0b2f4d]">Browse list</a><span className="rounded-lg bg-[#0b2f4d] px-4 py-2 text-white">Match deck</span></div>
            <p className="dashboard-intro">We rank live roles using your experience, skills, qualifications, brand knowledge, systems, location and working preferences.</p>
          </div>
          <Link href="/talent/applications" className="mt-4 md:mt-0 text-[12px] font-semibold text-[#10283b] hover:underline">View My Applications →</Link>
        </div>

        <article className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_18px_55px_rgba(16,40,59,.08)] lg:grid lg:grid-cols-[42%_58%]">
          <div className="relative min-h-[300px] lg:min-h-[620px] bg-[#0b2f4d] overflow-hidden">
            {photo ? <img src={photo} alt={property} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[#0b2f4d]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/15" />
            <div className="absolute left-5 top-5 flex gap-2"><span className={tierClass(job.tier || 'Standard')}>{job.tier || 'Standard'}</span></div>
            <div className="absolute bottom-0 inset-x-0 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                {logo && <div className="h-12 w-12 rounded-xl overflow-hidden border border-white/40 bg-white"><img src={logo} alt="" className="h-full w-full object-cover" /></div>}
                <div><p className="text-[11px] uppercase tracking-[.14em] text-white/70">Property</p><p className="text-[18px] font-semibold">{property}</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/80">
                {job.location && <span className="inline-flex items-center gap-1"><MapPin size={12}/>{job.location}</span>}
                {reviewScore && <span className="inline-flex items-center gap-1"><Star size={12} fill="currentColor"/> {reviewScore}{job.employer_profiles?.review_count ? ` (${job.employer_profiles.review_count})` : ''}</span>}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10 flex flex-col">
            <div className="flex items-start justify-between gap-5 mb-6">
              <div>
                <p className="dashboard-eyebrow">Best-fit role</p>
                <h2 className="text-[28px] md:text-[34px] leading-[1.08] font-semibold tracking-[-.035em] text-ink">{job.title}</h2>
                <p className="mt-2 text-[13px] text-muted">{job.contract_type?.replaceAll('_',' ') || job.job_type || 'Role'} · {salaryText(job)}</p>
              </div>
              <div className="shrink-0 text-center rounded-2xl border border-[#e3e7eb] bg-[#f5f6f8] px-4 py-3">
                <div className="text-[30px] font-semibold tracking-[-.04em]" style={{color:job.matchColour}}>{score}%</div>
                <div className="text-[10px] font-semibold uppercase tracking-[.08em]" style={{color:job.matchColour}}>{job.matchLabel}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e3e7eb] bg-[#f5f6f8] p-5 mb-5">
              <p className="text-[10px] uppercase tracking-[.16em] text-[#10283b] font-semibold mb-2">Why this role is showing</p>
              <p className="text-[13px] leading-6 text-secondary">{job.matchExplanation || 'Your profile aligns with several of the requirements for this role.'}</p>
              {job.matchingSkills?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{job.matchingSkills.slice(0,5).map((skill:string)=><span key={skill} className="text-[10px] border border-[#e3e7eb] bg-white text-[#10283b] px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Check size={9}/>{skill}</span>)}</div>}
            </div>

            {!canApply && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800 mb-4">This role is below the 45% application threshold. You can review or pass it, but you cannot apply unless your profile becomes a stronger match.</div>}

            <button type="button" onClick={() => setExpanded(!expanded)} className="w-fit text-[12px] font-semibold text-[#0b2f4d] inline-flex items-center gap-1.5"><ChevronDown size={13} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}/>{expanded ? 'Hide detailed match' : 'See detailed match & role'}</button>
            {expanded && <div className="mt-5 space-y-5 border-t border-border pt-5">{job.matchBreakdown && <MatchBreakdown breakdown={job.matchBreakdown} score={job.matchScore} label={job.matchLabel} colour={job.matchColour}/>}<div><p className="text-[10px] uppercase tracking-[.14em] text-muted font-semibold mb-2">Role overview</p><p className="text-[13px] leading-6 text-secondary whitespace-pre-line line-clamp-[12]">{job.description || 'The property has not added a full role description yet.'}</p></div></div>}

            {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600">{error}</div>}

            <div className="mt-auto pt-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={passRole} disabled={saving} className="btn-secondary !py-3.5 inline-flex items-center justify-center gap-2 disabled:opacity-50"><X size={15}/> Not for me</button>
                <button type="button" onClick={saveInterest} disabled={saving || !canApply} className="btn-primary !py-3.5 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Heart size={15}/>{saving ? 'Saving…' : canApply ? 'Save to My Applications' : 'Below match threshold'}</button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 text-[11px] text-muted">
                <span>Saving is private. The employer sees nothing until you submit.</span>
                <Link href={`/jobs/${job.id}`} className="shrink-0 font-semibold text-secondary hover:text-ink">Full role <ArrowRight size={11} className="inline"/></Link>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
