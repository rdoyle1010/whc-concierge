'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import Link from 'next/link'
import { MapPin, X, Heart, ArrowLeft, ChevronDown, Sparkles } from 'lucide-react'

const photos = [
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80&auto=format&fit=crop',
]

const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'
const matchClass = (s: number) => s >= 90 ? 'match-perfect' : s >= 75 ? 'match-strong' : s >= 60 ? 'match-good' : 'match-partial'

export default function SwipeMatchPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dir, setDir] = useState<'left'|'right'|null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [userId, setUserId] = useState<string|null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data:{ user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      // Load candidate profile for real matching (may be null)
      let candidateProfile: any = null
      if (user) {
        const { data: cp } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
        candidateProfile = cp
      }

      // Always load real jobs from database — no sample fallback
      // Use .or() to catch is_live=true OR is_live is null (for older rows)
      const { data: rawData, error: queryError } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name)')
        .or('is_live.eq.true,is_live.is.null')
        .order('created_at', { ascending: false })
        .limit(50)

      if (queryError) console.error('Job query error:', queryError.message)

      // Normalize DB column names for display
      const normalized = (rawData || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        description: j.job_description || j.description,
        required_product_houses: j.required_brands || j.required_product_houses,
        employer_profiles: {
          ...j.employer_profiles,
          company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name,
        },
      }))

      // Score each job against the candidate profile
      const scored = normalized.map((job: any) => {
        if (candidateProfile && candidateProfile.role_level) {
          const result = calculateMatchScore(candidateProfile, job)
          if (result.hardStop) return null // exclude hard-stopped
          return { ...job, matchScore: result.score, matchLabel: result.label }
        }
        // No profile or profile incomplete — show with generic 75% score
        return { ...job, matchScore: 75, matchLabel: 'Strong Match' }
      }).filter(Boolean)

      // Sort by match score descending
      scored.sort((a: any, b: any) => b.matchScore - a.matchScore)

      setJobs(scored)
      setLoading(false)
    }
    load()
  }, [])

  const job = jobs[idx]

  const swipe = useCallback(async (d:'left'|'right') => {
    if (!job || dir) return; setDir(d)
    if (userId) await supabase.from('swipes').insert({ user_id: userId, target_id: job.id, direction: d, target_type: 'job' })
    setTimeout(() => { setDir(null); setIdx(p => p + 1); setExpanded(false) }, 350)
  }, [job, userId, supabase, dir])

  useEffect(() => {
    const h = (e:KeyboardEvent) => { if (e.key==='ArrowLeft') swipe('left'); if (e.key==='ArrowRight') swipe('right') }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [swipe])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-ink border-t-transparent rounded-full" /></div>

  if (idx >= jobs.length) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm animate-fade-in-up">
        <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles size={24} className="text-muted" /></div>
        <h2 className="text-[24px] font-medium text-ink mb-2">{jobs.length === 0 ? 'No active roles right now' : 'You\u2019re all caught up'}</h2>
        <p className="text-[14px] text-muted mb-8">{jobs.length === 0 ? 'Check back soon — new roles are added regularly.' : 'You\u2019ve seen all available roles. New ones are added daily.'}</p>
        <div className="space-y-2"><Link href="/talent/dashboard" className="btn-primary block text-center">Dashboard</Link><Link href="/" className="btn-ghost block text-center">Home</Link></div>
      </div>
    </div>
  )

  if (showMatch) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center animate-match-pop">
        <div className="w-20 h-20 bg-match-perfect-bg rounded-2xl flex items-center justify-center mx-auto mb-6"><Heart size={32} className="text-match-perfect-text" fill="currentColor" /></div>
        <h2 className="text-[28px] font-medium text-ink mb-1">It&apos;s a match</h2>
        <p className="text-[14px] text-muted mb-8">{job?.employer_profiles?.company_name} &middot; {job?.title}</p>
        <div className="space-y-2 max-w-[280px] mx-auto"><Link href="/messages" className="btn-primary block text-center">Send a message</Link><button onClick={() => { setShowMatch(false); setDir(null); setIdx(p=>p+1); setExpanded(false) }} className="btn-secondary block w-full text-center">Keep browsing</button></div>
      </div>
    </div>
  )

  const photo = photos[idx % photos.length]
  const score = job?.matchScore || 75

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border h-[56px] px-6 flex items-center justify-between shrink-0">
        <Link href="/" className="text-muted hover:text-ink text-[13px] flex items-center gap-1.5"><ArrowLeft size={14} />Back</Link>
        <span className="text-[14px] font-medium text-ink">WHC Concierge</span>
        <span className="text-[13px] text-muted">{idx+1} / {jobs.length}</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className={`swipe-card w-full max-w-[440px] bg-white border border-border rounded-xl shadow-sm overflow-hidden ${dir==='left'?'swipe-left':dir==='right'?'swipe-right':''}`}>
          {/* Image */}
          <div className="h-[200px] relative overflow-hidden bg-surface">
            <img src={photo} alt="" className="w-full h-full object-cover" />
            <span className={`absolute top-3 left-3 ${tierClass(job?.tier||'Standard')}`}>{job?.tier||'Standard'}</span>
            <span className={`absolute top-3 right-3 ${matchClass(score)}`}>{score}% {job?.matchLabel}</span>
            {dir==='right' && <div className="absolute inset-0 bg-emerald-500/15 flex items-center justify-center"><span className="text-emerald-600 text-[18px] font-bold border-2 border-emerald-500 px-5 py-1.5 rounded-lg rotate-[-6deg]">INTERESTED</span></div>}
            {dir==='left' && <div className="absolute inset-0 bg-red-500/15 flex items-center justify-center"><span className="text-red-500 text-[18px] font-bold border-2 border-red-500 px-5 py-1.5 rounded-lg rotate-[6deg]">PASS</span></div>}
          </div>

          {/* Body */}
          <div className="p-5">
            <p className="eyebrow mb-0.5">{job?.employer_profiles?.company_name}</p>
            <h2 className="text-[20px] font-medium text-ink mb-2">{job?.title}</h2>
            <div className="flex flex-wrap gap-3 text-[13px] text-muted mb-3">
              <span className="flex items-center gap-1"><MapPin size={12} />{job?.location}</span>
              <span>{job?.job_type}</span>
              <span>{job?.salary_min && job?.salary_max ? `£${(job.salary_min/1000).toFixed(0)}k–£${(job.salary_max/1000).toFixed(0)}k` : 'Competitive'}</span>
            </div>
            {job?.specialism && <span className="text-[10px] border border-border text-muted px-2 py-0.5 rounded-full">{job.specialism}</span>}

            {/* Expand */}
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[12px] text-muted hover:text-ink mt-3">
              <ChevronDown size={13} className={`transition-transform ${expanded?'rotate-180':''}`} />{expanded?'Less':'More details'}
            </button>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-3 animate-fade-in">
                {job?.description && <p className="text-[13px] text-secondary leading-[1.7]">{job.description}</p>}
                {job?.requirements?.length>0 && <div><p className="eyebrow mb-1">Requirements</p><ul className="space-y-1">{job.requirements.map((r:string,i:number)=><li key={i} className="text-[12px] text-secondary flex items-start gap-1.5"><span className="w-1 h-1 bg-ink rounded-full mt-1.5 shrink-0"/>{r}</li>)}</ul></div>}
                {job?.benefits?.length>0 && <div className="flex flex-wrap gap-1.5">{job.benefits.map((b:string,i:number)=><span key={i} className="text-[10px] bg-surface text-muted px-2 py-0.5 rounded-full">{b}</span>)}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="bg-white border-t border-border py-5 shrink-0">
        <div className="flex items-center justify-center gap-8">
          <button onClick={()=>swipe('left')} className="w-[52px] h-[52px] border border-border rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors group">
            <X size={22} className="text-muted group-hover:text-red-500" />
          </button>
          <button onClick={()=>swipe('right')} className="w-[60px] h-[60px] bg-ink rounded-full flex items-center justify-center hover:bg-black/80 transition-colors shadow-sm">
            <Heart size={24} className="text-white" />
          </button>
        </div>
        <p className="text-center text-[11px] text-muted mt-3">Arrow keys or buttons to swipe</p>
      </div>
    </div>
  )
}
