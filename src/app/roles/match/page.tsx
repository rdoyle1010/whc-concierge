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

const samples = [
  { id:'s1', title:'Senior Spa Therapist', location:'London', salary_min:32000, salary_max:38000, tier:'Platinum', job_type:'Full-time', specialism:'Massage', description:'Join our ESPA Life team delivering world-class treatments.', employer_profiles:{ company_name:'Corinthia London' }, requirements:['CIDESCO qualified','3+ years luxury spa'], benefits:['Staff accommodation','Treatment allowance'], matchScore:94, matchLabel:'Perfect Match' },
  { id:'s2', title:'Spa Manager', location:'Scotland', salary_min:45000, salary_max:55000, tier:'Gold', job_type:'Full-time', specialism:'Management', description:'Lead spa operations at a prestigious wellness destination.', employer_profiles:{ company_name:'Gleneagles' }, requirements:['5+ years management'], benefits:['Relocation package','Bonus scheme'], matchScore:87, matchLabel:'Strong Match' },
  { id:'s3', title:'Wellness Practitioner', location:'London', salary_min:35000, salary_max:42000, tier:'Silver', job_type:'Full-time', specialism:'Holistic', description:'Deliver Eastern-inspired wellness rituals.', employer_profiles:{ company_name:'Mandarin Oriental' }, requirements:['Holistic qualifications'], benefits:['Meals on duty','Training budget'], matchScore:78, matchLabel:'Strong Match' },
  { id:'s4', title:'Beauty Therapist', location:'Mayfair', salary_min:28000, salary_max:34000, tier:'Gold', job_type:'Full-time', specialism:'Beauty', description:'Premium facial and body treatments.', employer_profiles:{ company_name:'The Lanesborough' }, requirements:['NVQ Level 3'], benefits:['Staff meals'], matchScore:72, matchLabel:'Good Match' },
  { id:'s5', title:'Yoga Instructor', location:'Cotswolds', salary_min:30000, salary_max:36000, tier:'Platinum', job_type:'Full-time', specialism:'Yoga', description:'Lead daily classes at our countryside retreat.', employer_profiles:{ company_name:'Soho Farmhouse' }, requirements:['200hr+ yoga training'], benefits:['Accommodation included'], matchScore:68, matchLabel:'Good Match' },
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

      // Load candidate profile for real matching
      let candidateProfile: any = null
      if (user) {
        const { data: cp } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
        candidateProfile = cp
      }

      // Query with real column names, then normalize for display
      const { data: rawData } = await supabase.from('job_listings').select('*, employer_profiles(company_name, property_name, logo_url)').eq('is_live', true).order('created_at', { ascending: false }).limit(50)
      // Normalize column names: job_title→title, job_description→description, required_brands→required_product_houses
      const data = (rawData || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        description: j.job_description || j.description,
        required_product_houses: j.required_brands || j.required_product_houses,
        status: j.is_live ? 'active' : j.status,
        employer_profiles: { ...j.employer_profiles, company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name },
      }))

      if (data && data.length > 0) {
        // Calculate real match scores
        const scored = data.map((job: any) => {
          if (candidateProfile) {
            const result = calculateMatchScore(candidateProfile, job)
            return { ...job, matchScore: result.score, matchLabel: result.label }
          }
          // No profile — show without score
          return { ...job, matchScore: 0, matchLabel: '' }
        })
        // Filter out hard-stopped and below threshold, sort by score desc
        const filtered = scored
          .filter((j: any) => j.matchScore >= 45 || !candidateProfile)
          .sort((a: any, b: any) => b.matchScore - a.matchScore)
        setJobs(filtered.length > 0 ? filtered : samples)
      } else {
        setJobs(samples)
      }
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
        <h2 className="text-[24px] font-medium text-ink mb-2">You&apos;re all caught up</h2>
        <p className="text-[14px] text-muted mb-8">New roles are added daily. Check back soon.</p>
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
            <img src={job?.employer_profiles?.logo_url || photo} alt="" className="w-full h-full object-cover" />
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
