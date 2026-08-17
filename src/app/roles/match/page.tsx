'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import MatchBreakdown from '@/components/MatchBreakdown'
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, Heart, MapPin, Sparkles, X } from 'lucide-react'

const tierClass = (tier: string) => tier === 'Platinum' ? 'badge-platinum' : tier === 'Gold' ? 'badge-gold' : tier === 'Silver' ? 'badge-silver' : 'badge-bronze'

export default function SwipeMatchPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedDraft, setSavedDraft] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      let candidateProfile: any = null
      if (user) {
        const { data } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
        candidateProfile = data
      }

      const { data: rawData } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name)')
        .eq('is_live', true)
        .order('posted_date', { ascending: false })
        .limit(50)

      const normalized = (rawData || [])
        .filter((job: any) => !job.expires_at || new Date(job.expires_at).getTime() > Date.now())
        .map((job: any) => ({
          ...job,
          title: job.job_title || job.title,
          description: job.job_description || job.description,
          required_product_houses: job.required_brands || job.required_product_houses,
          employer_profiles: {
            ...job.employer_profiles,
            company_name: job.employer_profiles?.property_name || job.employer_profiles?.company_name,
          },
        }))
        .map((job: any) => {
          if (candidateProfile?.role_level) {
            const result = calculateMatchScore(candidateProfile, job)
            return {
              ...job,
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
          }
          return { ...job, matchScore: 75, matchLabel: 'Potential match', matchColour: '#1D4ED8', matchBg: '#DBEAFE', matchingSkills: [], matchExplanation: '', matchBreakdown: null }
        })

      normalized.sort((a: any, b: any) => b.matchScore - a.matchScore)
      setJobs(normalized)
      setLoading(false)
    }
    load()
  }, [])

  const job = jobs[idx]

  const nextRole = useCallback(() => {
    setIdx(current => current + 1)
    setExpanded(false)
    setSavedDraft(false)
    setError('')
  }, [])

  async function passRole() {
    if (!job || saving) return
    if (userId) {
      await fetch('/api/swipe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: job.id, targetType: 'job', action: 'left' }),
      }).catch(() => null)
    }
    nextRole()
  }

  async function saveInterest() {
    if (!job || saving) return
    if (!userId) {
      window.location.href = `/login?role=talent&next=${encodeURIComponent('/roles/match')}`
      return
    }
    if (job.hardStop) {
      setError(job.hardStopReason || 'A mandatory requirement is missing from your profile.')
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

  if (loading) return <div className="min-h-screen bg-[#f3f1ec] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0b2f4d] border-t-transparent rounded-full" /></div>

  if (idx >= jobs.length) return (
    <div className="min-h-screen bg-[#f3f1ec] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-white border border-border rounded-2xl flex items-center justify-center mx-auto mb-5"><Sparkles size={24} className="text-[#9c7a42]" /></div>
        <h1 className="text-[28px] font-semibold text-ink mb-2">{jobs.length ? 'You’ve reviewed all current matches' : 'No active role matches right now'}</h1>
        <p className="text-[14px] leading-6 text-muted mb-7">Roles you save are held in My Applications as Ready to Send until you review them and choose to submit.</p>
        <div className="flex justify-center gap-2"><Link href="/talent/applications" className="btn-primary">My Applications</Link><Link href="/jobs" className="btn-secondary">Browse Roles</Link></div>
      </div>
    </div>
  )

  if (savedDraft) return (
    <div className="min-h-screen bg-[#f3f1ec] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-[#ddd9d1] bg-white p-8 shadow-xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f1e4]"><FileText size={23} className="text-[#9c7a42]" /></div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9c7a42] mb-2">Ready to send</p>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-ink mb-3">We’ve saved {job?.title} to your applications.</h1>
        <p className="text-[14px] leading-6 text-muted mb-6">Nothing has been sent to {job?.employer_profiles?.company_name} yet. Review the role, add or edit your covering letter, then press Send Application when you’re happy.</p>
        <div className="rounded-2xl border border-[#e3ded4] bg-[#faf8f3] p-5 mb-7 text-[12px] leading-5 text-[#65737d]">
          <p className="font-semibold text-ink mb-2">Why we do it this way</p>
          <p>Your match score helps you discover suitable roles, but you stay in control of what is actually sent to an employer.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/talent/applications" className="btn-primary flex-1 text-center">Review & add covering letter</Link>
          <button type="button" onClick={nextRole} className="btn-secondary flex-1">Keep matching</button>
        </div>
      </div>
    </div>
  )

  const score = job?.matchScore || 75
  const propertyInitial = (job?.employer_profiles?.company_name || 'W').trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#f3f1ec] flex flex-col">
      <header className="h-[58px] bg-white border-b border-border px-6 flex items-center justify-between">
        <Link href={userId ? '/talent/dashboard' : '/'} className="text-[13px] text-muted hover:text-ink flex items-center gap-1.5"><ArrowLeft size={14} /> Back</Link>
        <span className="text-[14px] font-semibold text-ink">Your role matches</span>
        <span className="text-[12px] text-muted">{idx + 1} / {jobs.length}</span>
      </header>

      <div className="px-6 pt-8 text-center">
        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-ink">Roles selected for your experience</h1>
        <p className="mt-2 text-[13px] text-muted">Interested saves the role to Ready to Send. It does not contact the employer until you review and submit it.</p>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <article className="w-full max-w-[840px] overflow-hidden rounded-2xl border border-border bg-white shadow-lg md:grid md:grid-cols-[300px_1fr]">
          <div className="relative h-[220px] md:h-full md:min-h-[430px]" style={{ background: 'linear-gradient(135deg,#0b2f4d 0%,#143f5e 60%,#8a7047 140%)' }}>
            <div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 rounded-2xl border border-[#c9a96e]/40 bg-[#c9a96e]/10 flex items-center justify-center"><span className="text-[32px] font-semibold text-[#c9a96e]">{propertyInitial}</span></div></div>
            <span className={`absolute top-3 left-3 ${tierClass(job?.tier || 'Standard')}`}>{job?.tier || 'Standard'}</span>
            <div className="absolute top-3 right-3 flex gap-1.5"><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: job?.matchBg, color: job?.matchColour }}>{score}%</span><span className="text-[10px] px-2 py-1 rounded-full bg-white/90" style={{ color: job?.matchColour }}>{job?.matchLabel}</span></div>
            <p className="absolute bottom-4 inset-x-4 text-center text-[10px] uppercase tracking-[0.2em] text-[#d4b477]">{job?.employer_profiles?.company_name}</p>
          </div>

          <div className="p-6 md:p-8">
            <p className="eyebrow mb-1">{job?.employer_profiles?.company_name}</p>
            <h2 className="text-[22px] font-semibold text-ink mb-1">{job?.title}</h2>
            {job?.matchExplanation && <p className="text-[12px] leading-5 text-[#9c7a42] mb-3">{job.matchExplanation}</p>}
            <div className="flex flex-wrap gap-3 text-[12px] text-muted mb-4"><span className="flex items-center gap-1"><MapPin size={12} />{job?.location || 'Location TBC'}</span><span>{job?.contract_type?.replace('_', ' ') || job?.job_type || 'Role'}</span><span>{job?.salary_min && job?.salary_max ? `£${Math.round(job.salary_min/1000)}k–£${Math.round(job.salary_max/1000)}k` : 'Competitive'}</span></div>

            {job?.matchingSkills?.length > 0 && <div className="flex flex-wrap gap-1.5 mb-4">{job.matchingSkills.slice(0,4).map((skill:string)=><span key={skill} className="text-[10px] border border-[#eadfc9] bg-[#fdf6ec] text-[#9c7a42] px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Check size={9}/>{skill}</span>)}</div>}

            <button type="button" onClick={() => setExpanded(!expanded)} className="text-[12px] text-muted hover:text-ink inline-flex items-center gap-1"><ChevronDown size={13} className={expanded ? 'rotate-180' : ''}/>{expanded ? 'Less details' : 'More details'}</button>
            {expanded && <div className="mt-4 pt-4 border-t border-border space-y-4">{job?.matchBreakdown && <MatchBreakdown breakdown={job.matchBreakdown} score={job.matchScore} label={job.matchLabel} colour={job.matchColour}/>} {job?.description && <p className="text-[13px] leading-6 text-secondary">{job.description}</p>}</div>}

            {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <button type="button" onClick={passRole} className="btn-secondary inline-flex items-center gap-2"><X size={15}/> Not for me</button>
              <button type="button" onClick={saveInterest} disabled={saving || job?.hardStop} className="btn-primary inline-flex items-center gap-2 disabled:opacity-40"><Heart size={15}/>{saving ? 'Saving…' : 'I’m interested'}</button>
              <Link href={`/jobs/${job.id}`} className="ml-auto text-[12px] font-semibold text-secondary hover:text-ink">View full role <ArrowRight size={11} className="inline"/></Link>
            </div>
          </div>
        </article>
      </main>
      <footer className="bg-white border-t border-border py-3 text-center text-[11px] text-muted">Interested = saved privately to Ready to Send. The employer sees nothing until you submit the application.</footer>
    </div>
  )
}
