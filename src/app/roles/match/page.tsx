'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import Link from 'next/link'
import { MapPin, X, Heart, ArrowLeft, ChevronDown, Sparkles, Check } from 'lucide-react'
import { notify } from '@/lib/notify'
import MatchBreakdown from '@/components/MatchBreakdown'

const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

export default function SwipeMatchPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dir, setDir] = useState<'left'|'right'|null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [userId, setUserId] = useState<string|null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [candidateData, setCandidateData] = useState<any>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data:{ user } } = await supabase.auth.getUser()
      if (user) { setUserId(user.id); setUserEmail(user.email || '') }

      let candidateProfile: any = null
      if (user) {
        const { data: cp } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
        candidateProfile = cp
        setCandidateData(cp)
      }

      const { data: rawData } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name)')
        .eq('is_live', true)
        .order('posted_date', { ascending: false })
        .limit(50)

      const normalized = (rawData || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        description: j.job_description || j.description,
        required_product_houses: j.required_brands || j.required_product_houses,
        employer_profiles: { ...j.employer_profiles, company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name },
      }))

      const scored = normalized.map((job: any) => {
        if (candidateProfile && candidateProfile.role_level) {
          const result = calculateMatchScore(candidateProfile, job)
          return { ...job, matchScore: result.score, matchLabel: result.label, matchColour: result.colour, matchBg: result.bgColour, matchingSkills: result.matchingSkills || [], matchExplanation: result.matchExplanation || '', matchBreakdown: result.breakdown, hardStop: result.hardStop, hardStopReason: result.hardStopReason }
        }
        return { ...job, matchScore: 75, matchLabel: 'Strong Match', matchColour: '#1D4ED8', matchBg: '#DBEAFE', matchingSkills: [], matchExplanation: '', matchBreakdown: null }
      }).filter(Boolean)

      scored.sort((a: any, b: any) => b.matchScore - a.matchScore)
      setJobs(scored)
      setLoading(false)
    }
    load()
  }, [])

  const job = jobs[idx]

  const swipe = useCallback(async (d:'left'|'right') => {
    if (!job || dir) return
    if (d === 'right' && job.hardStop) {
      alert(job.hardStopReason || 'A mandatory requirement is missing from your profile.')
      return
    }
    setDir(d)
    let matched = false
    if (userId) {
      // Swipe + application + mutual-match detection, all server-side
      const res = await fetch('/api/swipe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: job.id, targetType: 'job', action: d, matchScore: job.matchScore }),
      }).catch(() => null)
      const result = res && res.ok ? await res.json().catch(() => null) : null
      if (d === 'right') {
        // /api/swipe now sends both confirmation emails server-side,
        // so no client-side /api/application-email call is needed here.
        if (result?.matched) {
          matched = true
          setDir(null)
          setShowMatch(true)
        }
        if (res && !res.ok) {
          const d2 = await res.json().catch(() => ({} as any))
          alert(d2.error || 'Could not submit application - please try again.')
        }
      }
    }
    // On a mutual match the celebration screen takes over; "Keep browsing" advances the deck
    if (!matched) {
      setTimeout(() => { setDir(null); setIdx(p => p + 1); setExpanded(false) }, 350)
    }
  }, [job, userId, userEmail, candidateData, supabase, dir])

  useEffect(() => {
    const h = (e:KeyboardEvent) => { if (e.key==='ArrowLeft') swipe('left'); if (e.key==='ArrowRight') swipe('right') }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [swipe])

  // Loading skeleton
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-[440px] mx-4"><div className="skeleton h-[200px] mb-4" /><div className="skeleton h-6 w-2/3 mb-2" /><div className="skeleton h-4 w-1/2 mb-4" /><div className="skeleton h-4 w-full mb-2" /><div className="skeleton h-4 w-3/4" /></div>
    </div>
  )

  // Empty state
  if (idx >= jobs.length) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm animate-fade-in-up">
        <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles size={24} className="text-muted" /></div>
        <h2 className="text-[24px] font-medium text-ink mb-2">{jobs.length === 0 ? 'No active roles right now' : 'You\u2019ve reviewed all matches'}</h2>
        <p className="text-[14px] text-muted mb-8">{jobs.length === 0 ? 'Check back soon - new roles are added regularly.' : 'New roles are added daily. Check back soon.'}</p>
        <div className="space-y-2"><Link href="/talent/dashboard" className="btn-primary block text-center">Dashboard</Link><Link href="/" className="btn-ghost block text-center">Home</Link></div>
      </div>
    </div>
  )

  // Match celebration
  if (showMatch) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center animate-match-pop">
        <div className="w-20 h-20 bg-match-perfect-bg rounded-2xl flex items-center justify-center mx-auto mb-6"><Heart size={32} className="text-match-perfect-text" fill="currentColor" /></div>
        <h2 className="text-[28px] font-medium text-ink mb-1">It&apos;s a match!</h2>
        <p className="text-[14px] text-muted mb-8">{job?.employer_profiles?.company_name} &middot; {job?.title} - you both said yes.</p>
        <div className="space-y-2 max-w-[280px] mx-auto"><Link href="/talent/messages" className="btn-primary block text-center">Send a message</Link>
        <button onClick={() => { setShowMatch(false); setDir(null); setIdx(p=>p+1); setExpanded(false) }} className="btn-secondary block w-full text-center">Keep browsing</button></div>
      </div>
    </div>
  )

  const score = job?.matchScore || 75
  const propertyInitial = (job?.employer_profiles?.company_name || 'W').trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border h-[56px] px-6 flex items-center justify-between shrink-0">
        <Link href="/" className="text-muted hover:text-ink text-[13px] flex items-center gap-1.5"><ArrowLeft size={14} />Back</Link>
        <span className="text-[14px] font-semibold text-ink">Your role matches</span>
        <span className="text-[13px] text-muted">{idx+1} / {jobs.length}</span>
      </div>

      <div className="px-6 pt-8 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">Roles selected for your experience</h1>
        <p className="mt-2 text-[13px] text-muted">Review why each role matches. Pass to hide it, or choose Interested to submit your interest.</p>
      </div>
      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className={`swipe-card w-full max-w-[820px] bg-white border border-border rounded-2xl shadow-lg overflow-hidden md:grid md:grid-cols-[300px_1fr] ${dir==='left'?'swipe-left':dir==='right'?'swipe-right':''}`}>
          {/* Branded header (no stock photos - honest, on-brand) */}
          <div className="h-[210px] md:h-full md:min-h-[430px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2f4d 0%, #143f5e 55%, #8a7047 130%)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center border" style={{ background: 'rgba(201, 169, 110, 0.12)', borderColor: 'rgba(201, 169, 110, 0.4)' }}>
                <span className="text-[32px] font-serif font-semibold" style={{ color: '#C9A96E' }}>{propertyInitial}</span>
              </div>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] tracking-[0.2em] uppercase" style={{ color: 'rgba(201, 169, 110, 0.7)' }}>{job?.employer_profiles?.company_name || 'WHC Concierge'}</p>
            <span className={`absolute top-3 left-3 ${tierClass(job?.tier||'Standard')}`}>{job?.tier||'Standard'}</span>
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: job?.matchBg || '#DBEAFE', color: job?.matchColour || '#1D4ED8' }}>{score}%</span>
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm" style={{ color: job?.matchColour || '#1D4ED8' }}>{job?.matchLabel}</span>
            </div>
            {dir==='right' && <div className="absolute inset-0 bg-success/20 flex items-center justify-center"><span className="text-success text-[18px] font-bold border-2 border-success px-5 py-1.5 rounded-lg rotate-[-6deg]">INTERESTED</span></div>}
            {dir==='left' && <div className="absolute inset-0 bg-red-500/15 flex items-center justify-center"><span className="text-red-500 text-[18px] font-bold border-2 border-red-500 px-5 py-1.5 rounded-lg rotate-[6deg]">PASS</span></div>}
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            <p className="eyebrow mb-0.5">{job?.employer_profiles?.company_name}</p>
            <h2 className="text-[20px] font-medium text-ink mb-1">{job?.title}</h2>
            {job?.matchExplanation && (
              <p className="text-[12px] text-accent leading-relaxed mb-2">{job.matchExplanation}</p>
            )}
            <div className="flex flex-wrap gap-3 text-[13px] text-muted mb-3">
              <span className="flex items-center gap-1"><MapPin size={12} />{job?.location}</span>
              <span>{job?.contract_type?.replace('_', ' ') || job?.job_type}</span>
              <span>{job?.salary_min && job?.salary_max ? `£${(job.salary_min/1000).toFixed(0)}k-£${(job.salary_max/1000).toFixed(0)}k` : 'Competitive'}</span>
            </div>

            {/* Matching skills highlighted */}
            {job?.matchingSkills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {job.matchingSkills.slice(0, 3).map((s: string) => (
                  <span key={s} className="text-[10px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2.5 py-0.5 rounded-full flex items-center gap-1"><Check size={8} />{s}</span>
                ))}
              </div>
            )}

            {/* Required brands */}
            {(job?.required_product_houses?.length > 0 || job?.required_brands?.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(job.required_product_houses || job.required_brands || []).slice(0, 4).map((b: string) => (
                  <span key={b} className="text-[10px] border border-border text-muted px-2 py-0.5 rounded-full">{b}</span>
                ))}
              </div>
            )}

            {/* Expand */}
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[12px] text-muted hover:text-ink mt-1">
              <ChevronDown size={13} className={`transition-transform ${expanded?'rotate-180':''}`} />{expanded?'Less':'More details'}
            </button>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-3 animate-fade-in">
                {/* Match breakdown visualisation */}
                {job?.matchBreakdown && (
                  <MatchBreakdown
                    breakdown={job.matchBreakdown}
                    score={job.matchScore}
                    label={job.matchLabel}
                    colour={job.matchColour}
                  />
                )}

                {job?.description && <p className="text-[13px] text-secondary leading-[1.7]">{job.description}</p>}
                {job?.required_qualifications?.length > 0 && (
                  <div><p className="eyebrow mb-1">Required qualifications</p>
                  <div className="flex flex-wrap gap-1.5">{job.required_qualifications.map((q: string) => <span key={q} className="text-[10px] bg-surface text-muted px-2 py-0.5 rounded-full">{q}</span>)}</div></div>
                )}
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <button onClick={()=>swipe('left')} className="btn-secondary inline-flex items-center gap-2"><X size={15} /> Not for me</button>
              <button onClick={()=>swipe('right')} disabled={job?.hardStop} title={job?.hardStopReason} className="btn-primary inline-flex items-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed"><Heart size={15} /> I&apos;m interested</button>
              <Link href={`/jobs/${job.id}`} className="ml-auto text-[12px] font-semibold text-secondary hover:text-ink">View full role</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="bg-white border-t border-border py-3 text-center text-[11px] text-muted shrink-0">You can also use the left and right arrow keys.</div>
    </div>
  )
}
