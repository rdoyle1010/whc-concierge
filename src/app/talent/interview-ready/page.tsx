'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRight, Brain, Briefcase, Building2, CheckCircle2, CircleHelp, FileText,
  MessageSquareText, RefreshCw, ShieldCheck, Sparkles, Star, Target, Users,
} from 'lucide-react'

type StyleName = 'Driver' | 'Connector' | 'Planner' | 'Explorer'

type Fact = { label: string; value: string }
type HardQuestion = { question: string; why?: string; prepare?: string[] }
type StarExample = { title: string; situation: string; task: string; action_prompt: string; result_prompt: string; best_for?: string[] }

type Prep = {
  style?: { primary: StyleName; secondary: StyleName; summary: string }
  company_intelligence?: {
    name?: string
    group_name?: string
    is_group_property?: boolean
    tagline?: string
    about?: string
    website?: string
    culture?: string[]
    highlights?: string[]
    verified_facts?: Fact[]
    research_gaps?: string[]
    why_it_matters?: string[]
  }
  role_intelligence?: {
    seniority?: string
    role_summary?: string
    what_they_are_really_hiring_for?: string[]
    top_priorities?: string[]
    interview_themes?: string[]
  }
  cv_match?: {
    why_you_match?: string[]
    strongest_evidence?: string[]
    underused_evidence?: string[]
    gaps_or_risks?: string[]
    talk_about_this?: string[]
    cv_improvements?: string[]
  }
  hard_questions?: HardQuestion[]
  likely_questions?: string[]
  star_examples?: StarExample[]
  questions_to_ask?: string[]
  commercial_talking_points?: string[]
  plan_30_60_90?: { thirty?: string[]; sixty?: string[]; ninety?: string[] }
  readiness?: {
    overall?: number
    company?: number
    role?: number
    evidence?: number
    difficult_questions?: number
    practice?: number
    message?: string
  }
  source?: { hasCv?: boolean; hasPlatformJob?: boolean; usedAi?: boolean }
}

const styles: Record<StyleName, string> = {
  Driver: 'Decisive, ambitious and commercially focused.',
  Connector: 'People-focused, expressive and relationship-led.',
  Planner: 'Structured, considered and dependable.',
  Explorer: 'Curious, adaptive and creative.',
}

const styleQuestions = [
  {
    question: 'When something important needs moving forward, what feels most natural?',
    options: { Driver: 'Make the call and create momentum.', Connector: 'Bring the right people with me.', Planner: 'Build the clearest route and sequence.', Explorer: 'Look for a smarter or different approach.' },
  },
  {
    question: 'In a pressured team situation, what do people tend to get from you?',
    options: { Driver: 'Direction and pace.', Connector: 'Energy and reassurance.', Planner: 'Calm structure and follow-through.', Explorer: 'Fresh thinking and adaptability.' },
  },
  {
    question: 'Which achievement feels most satisfying?',
    options: { Driver: 'Beating a target or changing performance.', Connector: 'Building trust or developing people.', Planner: 'Making an operation run reliably well.', Explorer: 'Creating something new that worked.' },
  },
  {
    question: 'When you enter a new role, what do you notice first?',
    options: { Driver: 'What needs changing and where the opportunity is.', Connector: 'Who matters and how the team works together.', Planner: 'What is working, what is missing and what the process is.', Explorer: 'What could be done differently or better.' },
  },
  {
    question: 'How do you prefer to make an important decision?',
    options: { Driver: 'Get enough information, decide and move.', Connector: 'Talk it through with the people affected.', Planner: 'Check the facts, risks and practical detail.', Explorer: 'Test possibilities before committing.' },
  },
  {
    question: 'What are you most likely to bring to an interview example?',
    options: { Driver: 'The outcome I delivered.', Connector: 'How I influenced people.', Planner: 'How I organised and executed it.', Explorer: 'How I solved it creatively.' },
  },
]

function BulletList({ items, empty }: { items?: string[]; empty?: string }) {
  const values = (items || []).filter(Boolean)
  if (!values.length) return empty ? <p className="text-[12px] text-muted leading-5">{empty}</p> : null
  return <div className="space-y-2.5">{values.map((item, i) => <div key={`${item}-${i}`} className="flex gap-2.5 text-[12px] text-secondary leading-5"><CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" /><span>{item}</span></div>)}</div>
}

function ReadinessBar({ label, value }: { label: string; value?: number }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0))
  return <div>
    <div className="flex items-center justify-between text-[11px] mb-1.5"><span className="text-secondary">{label}</span><span className="font-medium text-ink">{score}%</span></div>
    <div className="h-1.5 bg-[#e3e7eb] overflow-hidden"><div className="h-full bg-[#10283b]" style={{ width: `${score}%` }} /></div>
  </div>
}

export default function InterviewReadyPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // Arriving from a role page ("Prepare answers in Interview Ready")
  // preselects that role, closing the job -> match -> preparation loop.
  const [jobId, setJobId] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('job') || ''
  })
  const [targetRole, setTargetRole] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [answers, setAnswers] = useState<StyleName[]>([])
  const [prep, setPrep] = useState<Prep | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'dossier' | 'practice'>('dossier')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [practiceAnswer, setPracticeAnswer] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [coaching, setCoaching] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: prof } = await supabase.from('candidate_profiles').select('id,full_name,headline,cv_url').eq('user_id', user.id).maybeSingle()
      setProfile(prof)
      const now = new Date().toISOString()
      const { data: liveJobs } = await supabase.from('job_listings')
        .select('id,job_title,location,employer_profiles(company_name,property_name)')
        .eq('is_live', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('posted_date', { ascending: false })
        .limit(100)
      setJobs(liveJobs || [])
      setLoading(false)
    }
    load()
  }, [])

  const selectedJob = useMemo(() => jobs.find(job => job.id === jobId), [jobs, jobId])
  const currentQuestion = prep?.likely_questions?.[questionIndex] || ''
  const assessmentComplete = answers.filter(Boolean).length === styleQuestions.length

  const selectStyle = (index: number, style: StyleName) => setAnswers(prev => { const next = [...prev]; next[index] = style; return next })

  const buildPrep = async () => {
    if (!jobId && !targetRole.trim()) { setError('Choose one of the live roles or enter the role you are preparing for.'); return }
    if (!assessmentComplete) { setError('Complete the short working-style assessment first. It takes six choices.'); return }
    setPreparing(true); setError(''); setPrep(null); setFeedback(null)
    try {
      const res = await fetch('/api/interview-ready', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'prepare', jobId, targetRole, companyName, jobDescription, styleAnswers: answers }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Interview Ready could not build your preparation. Please try again.')
      setPrep(data); setQuestionIndex(0); setTab('dossier')
    } catch (e: any) { setError(e.message || 'Interview Ready is unavailable.') } finally { setPreparing(false) }
  }

  const reviewAnswer = async () => {
    if (!currentQuestion || practiceAnswer.trim().length < 20) { setError('Give your answer in your own words first. A few sentences is enough to start.'); return }
    setCoaching(true); setError('')
    try {
      const res = await fetch('/api/interview-ready', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'coach', jobId, targetRole, companyName, jobDescription, styleAnswers: answers, question: currentQuestion, answer: practiceAnswer }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not review that answer.')
      setFeedback(data)
    } catch (e: any) { setError(e.message || 'Could not review that answer.') } finally { setCoaching(false) }
  }

  const nextQuestion = () => {
    const total = prep?.likely_questions?.length || 0
    if (!total) return
    setQuestionIndex(i => (i + 1) % total); setPracticeAnswer(''); setFeedback(null); setError('')
  }

  if (loading) return <DashboardShell role="talent"><div className="skeleton h-72 rounded-md" /></DashboardShell>

  return <DashboardShell role="talent" userName={profile?.full_name}>
    <div className="mb-8 max-w-4xl">
      <p className="dashboard-eyebrow">Career development</p>
      <h1 className="dashboard-title">Interview Ready</h1>
      <p className="dashboard-intro max-w-3xl">Know yourself. Know the role. Know the business. Interview Ready brings together your CV, WHC profile and the exact opportunity so you understand what matters and can practise with confidence.</p>
    </div>

    <div className="mb-8 border-l-2 border-accent bg-white/70 px-5 py-4">
      <div className="flex items-start gap-3"><Sparkles size={17} className="text-accent shrink-0 mt-0.5" /><div><p className="text-[13px] font-medium text-ink">Not an answer machine. A confidence builder.</p><p className="text-[12px] text-muted mt-1 leading-5">We never invent an achievement, brand, salary or result. We help you understand the employer, identify the evidence you already have and strengthen how you communicate it.</p></div></div>
    </div>

    {!prep ? <div className="grid grid-cols-1 xl:grid-cols-[.9fr_1.1fr] gap-6">
      <section className="dashboard-panel">
        <p className="dashboard-eyebrow">1. The opportunity</p>
        <h2 className="dashboard-section-title mb-2">What are you preparing for?</h2>
        <p className="text-[12px] text-muted leading-5 mb-5">Choose a live WHC role and we use its full job description and property profile. For an external role, paste as much detail as you have.</p>
        <label className="block text-[11px] font-medium text-ink mb-1.5">Live role on WHC</label>
        <select value={jobId} onChange={e => { setJobId(e.target.value); if (e.target.value) { setTargetRole(''); setCompanyName(''); setJobDescription('') } }} className="input-field text-[13px] mb-5">
          <option value="">Choose a role</option>
          {jobs.map(job => { const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles; const company = employer?.property_name || employer?.company_name || 'Property'; return <option key={job.id} value={job.id}>{job.job_title} · {company}{job.location ? ` · ${job.location}` : ''}</option> })}
        </select>
        <div className="flex items-center gap-3 mb-5"><div className="h-px bg-border flex-1" /><span className="text-[9px] uppercase tracking-[.18em] text-muted">or external role</span><div className="h-px bg-border flex-1" /></div>
        <label className="block text-[11px] font-medium text-ink mb-1.5">Target role</label>
        <input disabled={Boolean(jobId)} value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Director of Spa" className="input-field text-[13px] mb-4 disabled:opacity-45" />
        <label className="block text-[11px] font-medium text-ink mb-1.5">Company or property</label>
        <input disabled={Boolean(jobId)} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Rosewood London" className="input-field text-[13px] mb-4 disabled:opacity-45" />
        <label className="block text-[11px] font-medium text-ink mb-1.5">Job description</label>
        <textarea disabled={Boolean(jobId)} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the complete job description here." rows={8} className="input-field text-[13px] resize-y disabled:opacity-45" />
        {selectedJob && <div className="mt-5 px-4 py-3 bg-surface text-[12px] text-secondary"><span className="font-medium text-ink">Selected:</span> {selectedJob.job_title}</div>}
        <div className="mt-5 flex items-start gap-2 text-[11px] text-muted leading-5"><ShieldCheck size={14} className="text-accent shrink-0 mt-0.5" /><span>Property facts are shown only when supplied or verified in the WHC property profile. Missing facts are identified rather than guessed.</span></div>
      </section>

      <section className="dashboard-panel">
        <p className="dashboard-eyebrow">2. Get to know yourself</p>
        <h2 className="dashboard-section-title mb-2">A language for how you naturally work.</h2>
        <p className="text-[12px] text-muted leading-5 mb-6">Our own coaching framework, not a personality test or hiring judgement. Pick what feels most like you at work.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-7">{(Object.keys(styles) as StyleName[]).map(name => <div key={name} className="border border-border bg-white px-3.5 py-3"><p className="text-[12px] font-semibold text-ink">{name}</p><p className="text-[10.5px] text-muted leading-4 mt-1">{styles[name]}</p></div>)}</div>
        <div className="space-y-6">{styleQuestions.map((q, index) => <div key={q.question}><p className="text-[12px] font-medium text-ink mb-2.5"><span className="text-accent mr-2">{index + 1}.</span>{q.question}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(Object.keys(q.options) as StyleName[]).map(name => <button key={name} type="button" onClick={() => selectStyle(index, name)} className={`text-left border px-3.5 py-3 transition-colors ${answers[index] === name ? 'border-accent bg-[#f5f6f8]' : 'border-border bg-white hover:border-accent/60'}`}><span className="block text-[10px] uppercase tracking-[.12em] text-accent mb-1">{name}</span><span className="block text-[11.5px] text-secondary leading-4">{q.options[name]}</span></button>)}</div></div>)}</div>
        {error && <p className="mt-5 border-l-2 border-red-500 pl-3 text-[12px] text-red-700">{error}</p>}
        <button type="button" disabled={preparing} onClick={buildPrep} className="btn-primary mt-7 w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50">{preparing ? <><RefreshCw size={14} className="animate-spin" />Building your personalised dossier</> : <>Build my Interview Ready dossier <ArrowRight size={14} /></>}</button>
      </section>
    </div> : <>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
        <div className="inline-flex border border-border bg-white p-1 w-fit"><button onClick={() => setTab('dossier')} className={`px-4 py-2 text-[12px] ${tab === 'dossier' ? 'bg-[#0b2f4d] text-white' : 'text-secondary'}`}>My dossier</button><button onClick={() => setTab('practice')} className={`px-4 py-2 text-[12px] ${tab === 'practice' ? 'bg-[#0b2f4d] text-white' : 'text-secondary'}`}>Practice interview</button></div>
        <button onClick={() => { setPrep(null); setError(''); setFeedback(null) }} className="btn-secondary text-[12px]">Prepare for another role</button>
      </div>

      {tab === 'dossier' ? <div className="space-y-6">
        <section className="dashboard-panel bg-[#0b2f4d] !border-[#0b2f4d] text-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-7 items-start">
            <div><p className="text-[9px] uppercase tracking-[.2em] text-white/60 mb-2">Your preparation</p><h2 className="text-[30px] !text-white mb-3">{prep.company_intelligence?.name || selectedJob?.job_title || targetRole}</h2><p className="text-[13px] leading-6 text-white/70 max-w-3xl">{prep.role_intelligence?.role_summary}</p>{prep.style && <p className="text-[12px] text-white/55 mt-4">Working style: <span className="text-white">{prep.style.primary}</span> with {prep.style.secondary} · {prep.style.summary}</p>}</div>
            <div className="bg-white/[0.06] border border-white/10 p-5"><p className="text-[9px] uppercase tracking-[.18em] text-white/45 mb-2">Interview Readiness</p><p className="text-[46px] leading-none text-white font-serif">{prep.readiness?.overall ?? 0}%</p><p className="text-[11px] leading-5 text-white/55 mt-3">Preparation score, not a hiring prediction.</p></div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="dashboard-panel"><div className="flex items-center gap-2 mb-4"><Building2 size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Know the business</p><h2 className="dashboard-section-title">The spa, hotel & brand</h2></div></div>
            {prep.company_intelligence?.tagline && <p className="text-[13px] text-secondary italic mb-4">“{prep.company_intelligence.tagline}”</p>}
            {prep.company_intelligence?.about && <p className="text-[12px] text-secondary leading-5 mb-5">{prep.company_intelligence.about}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">{(prep.company_intelligence?.verified_facts || []).map((fact, i) => <div key={`${fact.label}-${i}`} className="border border-border bg-white px-3.5 py-3"><p className="text-[9px] uppercase tracking-[.14em] text-muted">{fact.label}</p><p className="text-[12px] font-medium text-ink mt-1">{fact.value}</p></div>)}</div>
            <p className="text-[11px] font-medium text-ink mb-2">Why this matters in interview</p><BulletList items={prep.company_intelligence?.why_it_matters} empty="Use the verified property facts above to think about the guest, service and commercial expectations." />
            {!!prep.company_intelligence?.research_gaps?.length && <div className="mt-5 bg-[#f5f6f8] p-4"><p className="text-[10px] uppercase tracking-[.14em] text-muted mb-2">Not yet verified</p>{prep.company_intelligence.research_gaps.map((gap, i) => <p key={i} className="text-[11px] text-muted leading-5">• {gap}</p>)}</div>}
          </section>

          <section className="dashboard-panel"><div className="flex items-center gap-2 mb-4"><Briefcase size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Understand the role</p><h2 className="dashboard-section-title">What they are really hiring for</h2></div></div>
            {prep.role_intelligence?.seniority && <span className="inline-block text-[10px] uppercase tracking-[.14em] text-accent border border-accent/40 px-2.5 py-1 mb-4">{prep.role_intelligence.seniority}</span>}
            <BulletList items={prep.role_intelligence?.what_they_are_really_hiring_for} />
            <div className="mt-6 pt-5 border-t border-border"><p className="text-[11px] font-medium text-ink mb-3">Top priorities to recognise in the job description</p><BulletList items={prep.role_intelligence?.top_priorities} /></div>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="dashboard-panel"><div className="flex items-center gap-2 mb-4"><Target size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Your CV + this job</p><h2 className="dashboard-section-title">Why you match</h2></div></div><BulletList items={prep.cv_match?.why_you_match} empty="Interview Ready could not find enough explicit overlap yet. That does not mean you cannot do the role; it means your evidence needs to be clearer." />
            {!!prep.cv_match?.strongest_evidence?.length && <div className="mt-6 pt-5 border-t border-border"><p className="text-[11px] font-medium text-ink mb-3">Strongest evidence already visible</p><div className="flex flex-wrap gap-2">{prep.cv_match.strongest_evidence.map((item, i) => <span key={i} className="text-[11px] bg-[#f5f6f8] text-secondary px-2.5 py-1.5">{item}</span>)}</div></div>}
            <div className="mt-6 pt-5 border-t border-border"><p className="text-[11px] font-medium text-ink mb-3">Talk about this</p><BulletList items={prep.cv_match?.talk_about_this} /></div>
          </section>

          <section className="dashboard-panel"><div className="flex items-center gap-2 mb-4"><FileText size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Strengthen the evidence</p><h2 className="dashboard-section-title">What your CV may be underselling</h2></div></div><BulletList items={prep.cv_match?.underused_evidence} empty={prep.source?.hasCv ? 'No obvious undersold evidence was identified.' : 'Upload a CV to unlock deeper evidence coaching.'} />
            {!!prep.cv_match?.cv_improvements?.length && <div className="mt-6 pt-5 border-t border-border"><p className="text-[11px] font-medium text-ink mb-3">Worth strengthening before interview</p><BulletList items={prep.cv_match.cv_improvements} /></div>}
            {!!prep.cv_match?.gaps_or_risks?.length && <div className="mt-6 border-l-2 border-amber-500 bg-amber-50/40 p-4"><p className="text-[11px] font-medium text-amber-900 mb-2">Areas they may challenge</p>{prep.cv_match.gaps_or_risks.map((item, i) => <p key={i} className="text-[11px] text-amber-800 leading-5">• {item}</p>)}</div>}
          </section>
        </div>

        <section className="dashboard-panel"><div className="flex items-center gap-2 mb-5"><CircleHelp size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Be ready for the difficult bit</p><h2 className="dashboard-section-title">Questions they may challenge you with</h2></div></div>
          {(prep.hard_questions || []).length ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{prep.hard_questions!.map((item, i) => <div key={i} className="border border-border bg-white p-5"><p className="text-[13px] font-medium text-ink leading-5">{item.question}</p>{item.why && <p className="text-[11px] text-muted leading-5 mt-2">Why they may ask: {item.why}</p>}<div className="mt-4"><p className="text-[10px] uppercase tracking-[.14em] text-accent mb-2">Build your own answer from</p><BulletList items={item.prepare} /></div></div>)}</div> : <p className="text-[12px] text-muted">No major evidence gaps were identified, but still practise the likely questions below.</p>}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="dashboard-panel"><div className="flex items-center gap-2 mb-4"><Brain size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Likely interview</p><h2 className="dashboard-section-title">Questions for this exact role</h2></div></div><div className="space-y-3">{(prep.likely_questions || []).map((q, i) => <div key={i} className="flex gap-3 border-b border-border pb-3 last:border-0"><span className="font-serif text-accent text-lg leading-5">{String(i + 1).padStart(2, '0')}</span><p className="text-[12px] text-secondary leading-5">{q}</p></div>)}</div></section>
          <section className="dashboard-panel"><div className="flex items-center gap-2 mb-4"><Users size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Turn the interview around</p><h2 className="dashboard-section-title">Questions to ask them</h2></div></div><BulletList items={prep.questions_to_ask} /></section>
        </div>

        {!!prep.commercial_talking_points?.length && <section className="dashboard-panel"><div className="flex items-center gap-2 mb-4"><Briefcase size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Talk like an operator</p><h2 className="dashboard-section-title">Commercial talking points</h2></div></div><p className="text-[12px] text-muted leading-5 mb-4">Interviewers at every level respect a candidate who understands how a spa makes money. These are pitched at the seniority of this role.</p><BulletList items={prep.commercial_talking_points} /></section>}

        {!!(prep.plan_30_60_90?.thirty?.length || prep.plan_30_60_90?.sixty?.length || prep.plan_30_60_90?.ninety?.length) && <section className="dashboard-panel"><div className="flex items-center gap-2 mb-5"><Target size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Think beyond day one</p><h2 className="dashboard-section-title">Your 30 / 60 / 90-day thinking</h2></div></div><p className="text-[12px] text-muted leading-5 mb-5">Not a script to recite - a structure that shows you think past the start date. Adapt it with what you learn in the interview itself.</p><div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{([['First 30 days', prep.plan_30_60_90?.thirty], ['Days 30-60', prep.plan_30_60_90?.sixty], ['Days 60-90', prep.plan_30_60_90?.ninety]] as Array<[string, string[] | undefined]>).map(([label, items]) => <div key={label} className="border border-border bg-white p-5"><p className="text-[10px] uppercase tracking-[.14em] text-accent font-semibold mb-3">{label}</p><BulletList items={items} /></div>)}</div></section>}

        {!!prep.star_examples?.length && <section className="dashboard-panel"><div className="flex items-center gap-2 mb-5"><Star size={17} className="text-accent" /><div><p className="dashboard-eyebrow">Your evidence bank</p><h2 className="dashboard-section-title">STAR examples from your own experience</h2></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{prep.star_examples.map((item, i) => <div key={i} className="border border-border bg-white p-5"><p className="text-[13px] font-medium text-ink mb-3">{item.title}</p><p className="text-[11px] text-secondary leading-5"><b>Situation:</b> {item.situation}</p><p className="text-[11px] text-secondary leading-5 mt-1"><b>Task:</b> {item.task}</p><p className="text-[11px] text-secondary leading-5 mt-1"><b>Action:</b> {item.action_prompt}</p><p className="text-[11px] text-secondary leading-5 mt-1"><b>Result:</b> {item.result_prompt}</p></div>)}</div></section>}

        <section className="dashboard-panel"><p className="dashboard-eyebrow">Interview Readiness</p><div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-7 items-start"><div><p className="text-[52px] leading-none font-serif text-accent">{prep.readiness?.overall ?? 0}%</p><p className="text-[11px] text-muted leading-5 mt-3">Preparation completeness only. It is not a prediction of whether you will be hired.</p></div><div className="space-y-4"><ReadinessBar label="Know the company" value={prep.readiness?.company} /><ReadinessBar label="Understand the role" value={prep.readiness?.role} /><ReadinessBar label="Evidence prepared" value={prep.readiness?.evidence} /><ReadinessBar label="Difficult questions" value={prep.readiness?.difficult_questions} /><ReadinessBar label="Practice" value={prep.readiness?.practice} />{prep.readiness?.message && <p className="text-[12px] text-secondary leading-5 pt-2">{prep.readiness.message}</p>}</div></div><button onClick={() => setTab('practice')} className="btn-primary mt-6 inline-flex items-center gap-2">Start practice interview <ArrowRight size={14} /></button></section>
      </div> : <section className="dashboard-panel max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-6"><div><p className="dashboard-eyebrow">Practice interview</p><h2 className="dashboard-section-title">One question at a time.</h2></div><span className="text-[11px] text-muted">Question {questionIndex + 1} of {prep.likely_questions?.length || 0}</span></div>
        <div className="bg-[#0b2f4d] text-white p-6 mb-5"><MessageSquareText size={18} className="text-white/70 mb-3" /><p className="font-serif text-[24px] leading-8">{currentQuestion}</p></div>
        <p className="text-[12px] text-muted leading-5 mb-3">Answer naturally as if you were in the interview. Do not try to sound perfect. The coach will show you what is strong and what evidence is missing.</p>
        <textarea value={practiceAnswer} onChange={e => setPracticeAnswer(e.target.value)} rows={8} placeholder="Type your answer in your own words..." className="input-field text-[13px] resize-y" />
        {error && <p className="mt-4 border-l-2 border-red-500 pl-3 text-[12px] text-red-700">{error}</p>}
        {!feedback ? <button disabled={coaching} onClick={reviewAnswer} className="btn-primary mt-5 inline-flex items-center gap-2 disabled:opacity-50">{coaching ? <><RefreshCw size={14} className="animate-spin" />Reviewing your answer</> : <>Coach my answer <ArrowRight size={14} /></>}</button> : <div className="mt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-4 items-start"><div className="border border-border bg-white p-4 text-center"><p className="text-[9px] uppercase tracking-[.14em] text-muted">Answer score</p><p className="font-serif text-[34px] text-accent mt-1">{feedback.score || 0}%</p></div><div className="space-y-3"><div className="border-l-2 border-green-500 pl-4"><p className="text-[10px] uppercase tracking-[.14em] text-green-700">Strong</p><p className="text-[12px] text-secondary leading-5 mt-1">{feedback.strong}</p></div><div className="border-l-2 border-amber-500 pl-4"><p className="text-[10px] uppercase tracking-[.14em] text-amber-700">Improve</p><p className="text-[12px] text-secondary leading-5 mt-1">{feedback.improve}</p></div>{feedback.missing && <div className="border-l-2 border-slate-400 pl-4"><p className="text-[10px] uppercase tracking-[.14em] text-slate-600">Missing evidence</p><p className="text-[12px] text-secondary leading-5 mt-1">{feedback.missing}</p></div>}<div className="border-l-2 border-accent pl-4"><p className="text-[10px] uppercase tracking-[.14em] text-accent">Try again</p><p className="text-[12px] text-secondary leading-5 mt-1">{feedback.try_again}</p></div>{feedback.follow_up && <div className="bg-surface p-4"><p className="text-[10px] uppercase tracking-[.14em] text-muted">Think about</p><p className="text-[12px] text-secondary leading-5 mt-1">{feedback.follow_up}</p></div>}</div></div>
          <div className="flex flex-wrap gap-3 pt-2"><button onClick={() => setFeedback(null)} className="btn-secondary">Try this question again</button><button onClick={nextQuestion} className="btn-primary inline-flex items-center gap-2">Next question <ArrowRight size={14} /></button></div>
        </div>}
      </section>}
    </>}
  </DashboardShell>
}
