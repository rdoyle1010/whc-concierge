'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRight, Brain, Briefcase, CheckCircle2, ChevronRight, CircleHelp, MessageSquareText,
  RefreshCw, Sparkles, Star, Target, Users, WalletCards,
} from 'lucide-react'

type StyleName = 'Driver' | 'Connector' | 'Planner' | 'Explorer'

type Prep = {
  style?: { primary: StyleName; secondary: StyleName; summary: string }
  role_summary?: string
  likely_questions?: string[]
  star_examples?: Array<{ title: string; situation: string; task: string; action_prompt: string; result_prompt: string; best_for: string[] }>
  questions_to_ask?: string[]
  confidence_prep?: { weakness?: string[]; salary?: string[]; confidence?: string[] }
  focus_areas?: { leadership?: string[]; commercial?: string[]; guest_experience?: string[]; conflict?: string[] }
  readiness_score?: number
  readiness_message?: string
  source?: { hasCv?: boolean; hasPlatformJob?: boolean }
}

const styles: Record<StyleName, { title: string; copy: string }> = {
  Driver: { title: 'Driver', copy: 'Decisive, ambitious and commercially focused.' },
  Connector: { title: 'Connector', copy: 'People-focused, expressive and relationship-led.' },
  Planner: { title: 'Planner', copy: 'Structured, considered and dependable.' },
  Explorer: { title: 'Explorer', copy: 'Curious, adaptive and creative.' },
}

const styleQuestions = [
  {
    question: 'When something important needs moving forward, what feels most natural?',
    options: {
      Driver: 'Make the call and create momentum.',
      Connector: 'Bring the right people with me.',
      Planner: 'Build the clearest route and sequence.',
      Explorer: 'Look for a smarter or different approach.',
    },
  },
  {
    question: 'In a pressured team situation, what do people tend to get from you?',
    options: {
      Driver: 'Direction and pace.',
      Connector: 'Energy and reassurance.',
      Planner: 'Calm structure and follow-through.',
      Explorer: 'Fresh thinking and adaptability.',
    },
  },
  {
    question: 'Which achievement feels most satisfying?',
    options: {
      Driver: 'Beating a target or changing performance.',
      Connector: 'Building trust or developing people.',
      Planner: 'Making an operation run reliably well.',
      Explorer: 'Creating something new that worked.',
    },
  },
  {
    question: 'When you enter a new role, what do you notice first?',
    options: {
      Driver: 'What needs changing and where the opportunity is.',
      Connector: 'Who matters and how the team works together.',
      Planner: 'What is working, what is missing and what the process is.',
      Explorer: 'What could be done differently or better.',
    },
  },
  {
    question: 'How do you prefer to make an important decision?',
    options: {
      Driver: 'Get enough information, decide and move.',
      Connector: 'Talk it through with the people affected.',
      Planner: 'Check the facts, risks and practical detail.',
      Explorer: 'Test possibilities before committing.',
    },
  },
  {
    question: 'What are you most likely to bring to an interview example?',
    options: {
      Driver: 'The outcome I delivered.',
      Connector: 'How I influenced people.',
      Planner: 'How I organised and executed it.',
      Explorer: 'How I solved it creatively.',
    },
  },
]

export default function InterviewReadyPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [jobId, setJobId] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [answers, setAnswers] = useState<StyleName[]>([])
  const [prep, setPrep] = useState<Prep | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'prepare' | 'practice'>('prepare')
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
      const { data: liveJobs } = await supabase
        .from('job_listings')
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

  const selectedJob = useMemo(() => jobs.find(j => j.id === jobId), [jobs, jobId])
  const currentQuestion = prep?.likely_questions?.[questionIndex] || ''
  const assessmentComplete = answers.length === styleQuestions.length

  const selectStyle = (index: number, style: StyleName) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = style
      return next
    })
  }

  const buildPrep = async () => {
    if (!jobId && !targetRole.trim()) {
      setError('Choose one of the live roles or enter the role you are preparing for.')
      return
    }
    if (!assessmentComplete) {
      setError('Complete the short working-style assessment first. It takes six choices.')
      return
    }
    setPreparing(true)
    setError('')
    setPrep(null)
    setFeedback(null)
    try {
      const res = await fetch('/api/interview-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'prepare', jobId, targetRole, companyName, jobDescription, styleAnswers: answers,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not build your interview preparation.')
      setPrep(data)
      setQuestionIndex(0)
      setTab('prepare')
    } catch (e: any) {
      setError(e.message || 'Interview Ready is unavailable.')
    } finally {
      setPreparing(false)
    }
  }

  const reviewAnswer = async () => {
    if (!currentQuestion || practiceAnswer.trim().length < 20) {
      setError('Give your answer in your own words first. A few sentences is enough to start.')
      return
    }
    setCoaching(true)
    setError('')
    try {
      const res = await fetch('/api/interview-ready', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'coach', jobId, targetRole, companyName, jobDescription, styleAnswers: answers,
          question: currentQuestion, answer: practiceAnswer,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not review that answer.')
      setFeedback(data)
    } catch (e: any) {
      setError(e.message || 'Could not review that answer.')
    } finally {
      setCoaching(false)
    }
  }

  const nextQuestion = () => {
    const total = prep?.likely_questions?.length || 0
    if (!total) return
    setQuestionIndex(i => (i + 1) % total)
    setPracticeAnswer('')
    setFeedback(null)
    setError('')
  }

  if (loading) return <DashboardShell role="talent"><div className="skeleton h-72 rounded-md" /></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <div className="mb-8 max-w-4xl">
        <p className="dashboard-eyebrow">Career development</p>
        <h1 className="dashboard-title">Interview Ready</h1>
        <p className="dashboard-intro max-w-3xl">Not an answer machine. A confidence builder. Interview Ready uses your profile, CV, experience and the role itself to help you find stronger evidence in your own career and practise saying it with confidence.</p>
      </div>

      <div className="mb-8 border-l-2 border-[#c9a96e] bg-white/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <Sparkles size={17} className="text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-ink">Your experience stays yours.</p>
            <p className="text-[12px] text-muted mt-1 leading-5">We will never invent an achievement or give you a robotic script to memorise. We help you recognise the evidence you already have, make it clearer and practise it until it sounds like you.</p>
          </div>
        </div>
      </div>

      {!prep ? (
        <div className="grid grid-cols-1 xl:grid-cols-[.9fr_1.1fr] gap-6">
          <section className="dashboard-panel">
            <p className="dashboard-eyebrow">1. Your interview</p>
            <h2 className="dashboard-section-title mb-2">What are you preparing for?</h2>
            <p className="text-[12px] text-muted leading-5 mb-5">Choose a role already on the platform, or prepare for an external opportunity.</p>

            <label className="block text-[11px] font-medium text-ink mb-1.5">Live role on WHC</label>
            <select value={jobId} onChange={e => { setJobId(e.target.value); if (e.target.value) { setTargetRole(''); setCompanyName(''); setJobDescription('') } }} className="input-field text-[13px] mb-5">
              <option value="">Choose a role</option>
              {jobs.map(job => {
                const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
                const company = employer?.property_name || employer?.company_name || 'Property'
                return <option key={job.id} value={job.id}>{job.job_title} · {company}{job.location ? ` · ${job.location}` : ''}</option>
              })}
            </select>

            <div className="flex items-center gap-3 mb-5"><div className="h-px bg-border flex-1" /><span className="text-[9px] uppercase tracking-[.18em] text-muted">or external role</span><div className="h-px bg-border flex-1" /></div>

            <label className="block text-[11px] font-medium text-ink mb-1.5">Target role</label>
            <input disabled={Boolean(jobId)} value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Director of Spa" className="input-field text-[13px] mb-4 disabled:opacity-45" />
            <label className="block text-[11px] font-medium text-ink mb-1.5">Company or property</label>
            <input disabled={Boolean(jobId)} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Optional" className="input-field text-[13px] mb-4 disabled:opacity-45" />
            <label className="block text-[11px] font-medium text-ink mb-1.5">Job description</label>
            <textarea disabled={Boolean(jobId)} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description here so the coaching can be specific." rows={7} className="input-field text-[13px] resize-y disabled:opacity-45" />

            {selectedJob && <div className="mt-5 px-4 py-3 bg-surface text-[12px] text-secondary"><span className="font-medium text-ink">Selected:</span> {selectedJob.job_title}</div>}
          </section>

          <section className="dashboard-panel">
            <p className="dashboard-eyebrow">2. Get to know yourself</p>
            <h2 className="dashboard-section-title mb-2">A language for how you naturally work.</h2>
            <p className="text-[12px] text-muted leading-5 mb-6">This is our own coaching framework, not a personality test and not a hiring judgement. Pick the answer that feels most like you at work.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-7">
              {(Object.keys(styles) as StyleName[]).map(name => (
                <div key={name} className="border border-border bg-white px-3.5 py-3">
                  <p className="text-[12px] font-semibold text-ink">{name}</p>
                  <p className="text-[10.5px] text-muted leading-4 mt-1">{styles[name].copy}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {styleQuestions.map((q, index) => (
                <div key={q.question}>
                  <p className="text-[12px] font-medium text-ink mb-2.5"><span className="text-accent mr-2">{index + 1}.</span>{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(q.options) as StyleName[]).map(name => (
                      <button key={name} type="button" onClick={() => selectStyle(index, name)} className={`text-left border px-3.5 py-3 transition-colors ${answers[index] === name ? 'border-[#c9a96e] bg-[#fbf7ed]' : 'border-border bg-white hover:border-[#c9a96e]/60'}`}>
                        <span className="block text-[10px] uppercase tracking-[.12em] text-accent mb-1">{name}</span>
                        <span className="block text-[11.5px] text-secondary leading-4">{q.options[name]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="mt-5 border-l-2 border-red-500 pl-3 text-[12px] text-red-700">{error}</p>}
            <button type="button" disabled={preparing} onClick={buildPrep} className="btn-primary mt-7 w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50">
              {preparing ? <><RefreshCw size={14} className="animate-spin" />Building your preparation</> : <>Build my Interview Ready plan <ArrowRight size={14} /></>}
            </button>
          </section>
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
            <div className="inline-flex rounded-sm border border-border bg-white p-1 w-fit">
              <button onClick={() => setTab('prepare')} className={`px-4 py-2 text-[12px] ${tab === 'prepare' ? 'bg-[#092b45] text-white' : 'text-secondary'}`}>Preparation</button>
              <button onClick={() => setTab('practice')} className={`px-4 py-2 text-[12px] ${tab === 'practice' ? 'bg-[#092b45] text-white' : 'text-secondary'}`}>Practice interview</button>
            </div>
            <button onClick={() => { setPrep(null); setFeedback(null); setPracticeAnswer(''); setError('') }} className="text-[12px] text-accent inline-flex items-center gap-1.5"><RefreshCw size={13} />Prepare for a different role</button>
          </div>

          {tab === 'prepare' ? (
            <div className="space-y-6">
              <section className="grid grid-cols-1 lg:grid-cols-[.7fr_1.3fr] gap-6">
                <div className="dashboard-panel bg-[#092b45] !border-[#092b45] text-white">
                  <p className="text-[9px] uppercase tracking-[.2em] text-white/48 mb-3">Interview readiness</p>
                  <div className="flex items-end gap-2 mb-3"><span className="font-serif text-[58px] leading-none text-white">{prep.readiness_score ?? 0}</span><span className="text-[18px] text-[#d8bf8a] mb-1">%</span></div>
                  <p className="text-[12px] text-white/68 leading-5">{prep.readiness_message}</p>
                  <div className="mt-5 pt-4 border-t border-white/10 text-[10.5px] text-white/45">A preparation score, never a hiring score.</div>
                </div>
                <div className="dashboard-panel">
                  <p className="dashboard-eyebrow">Your working style</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1.5 bg-[#fbf7ed] border border-[#e5d5af] text-[11px] font-semibold text-[#80642f]">{prep.style?.primary}</span>
                    <span className="px-3 py-1.5 bg-surface border border-border text-[11px] text-secondary">with {prep.style?.secondary}</span>
                  </div>
                  <h2 className="dashboard-section-title mb-2">A language for how you naturally work.</h2>
                  <p className="text-[12.5px] text-secondary leading-6">{prep.style?.summary}</p>
                  <div className="mt-5 pt-4 border-t border-border">
                    <p className="text-[10px] uppercase tracking-[.15em] text-muted mb-1.5">What this interview is likely to test</p>
                    <p className="text-[12px] text-secondary leading-5">{prep.role_summary}</p>
                  </div>
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="flex items-center gap-2 mb-4"><CircleHelp size={17} className="text-accent" /><h2 className="dashboard-section-title">Likely questions for this exact role</h2></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                  {(prep.likely_questions || []).map((q, i) => <div key={q} className="dashboard-list-row !px-0"><span className="flex gap-3 text-[12.5px] text-ink leading-5"><span className="text-accent font-medium">{String(i + 1).padStart(2, '0')}</span>{q}</span></div>)}
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="flex items-center gap-2 mb-2"><WalletCards size={17} className="text-accent" /><h2 className="dashboard-section-title">STAR evidence from your own experience</h2></div>
                <p className="text-[12px] text-muted mb-5">These are evidence starters, not scripts. Fill the missing result in with what genuinely happened.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(prep.star_examples || []).map((s, i) => (
                    <article key={`${s.title}-${i}`} className="border border-border bg-white p-5">
                      <p className="text-[10px] uppercase tracking-[.14em] text-accent mb-1">Evidence {i + 1}</p>
                      <h3 className="font-serif text-[23px] text-ink mb-3">{s.title}</h3>
                      <div className="space-y-3 text-[11.5px] leading-5">
                        <p><strong className="text-ink">Situation:</strong> <span className="text-secondary">{s.situation}</span></p>
                        <p><strong className="text-ink">Task:</strong> <span className="text-secondary">{s.task}</span></p>
                        <p><strong className="text-ink">Your action:</strong> <span className="text-secondary">{s.action_prompt}</span></p>
                        <p><strong className="text-ink">Your result:</strong> <span className="text-secondary">{s.result_prompt}</span></p>
                      </div>
                      {s.best_for?.length ? <div className="mt-4 flex flex-wrap gap-1.5">{s.best_for.map(x => <span key={x} className="text-[9.5px] px-2 py-1 bg-surface text-muted">{x}</span>)}</div> : null}
                    </article>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="dashboard-panel">
                  <div className="flex items-center gap-2 mb-4"><MessageSquareText size={17} className="text-accent" /><h2 className="dashboard-section-title">Questions to ask the employer</h2></div>
                  <div>{(prep.questions_to_ask || []).map(q => <div key={q} className="dashboard-list-row !px-0"><span className="text-[12px] text-secondary leading-5">{q}</span><ChevronRight size={13} className="text-accent shrink-0" /></div>)}</div>
                </section>
                <section className="dashboard-panel">
                  <div className="flex items-center gap-2 mb-4"><Brain size={17} className="text-accent" /><h2 className="dashboard-section-title">Weakness, salary & confidence</h2></div>
                  {[['Weakness', prep.confidence_prep?.weakness], ['Salary', prep.confidence_prep?.salary], ['Confidence', prep.confidence_prep?.confidence]].map(([title, list]: any) => (
                    <div key={title} className="mb-4 last:mb-0"><p className="text-[10px] uppercase tracking-[.14em] text-accent mb-2">{title}</p><ul className="space-y-2">{(list || []).map((x: string) => <li key={x} className="text-[11.5px] text-secondary leading-5 flex gap-2"><span className="text-accent">•</span>{x}</li>)}</ul></div>
                  ))}
                </section>
              </div>

              <section className="dashboard-panel">
                <div className="flex items-center gap-2 mb-5"><Target size={17} className="text-accent" /><h2 className="dashboard-section-title">Leadership, commercial & guest-experience preparation</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    ['Leadership', prep.focus_areas?.leadership, Users],
                    ['Commercial', prep.focus_areas?.commercial, Briefcase],
                    ['Guest experience', prep.focus_areas?.guest_experience, Star],
                    ['Conflict', prep.focus_areas?.conflict, MessageSquareText],
                  ].map(([title, list, Icon]: any) => <div key={title} className="border border-border p-4"><Icon size={15} className="text-accent mb-3" /><p className="text-[11px] font-semibold text-ink mb-2">{title}</p><ul className="space-y-2">{(list || []).map((x: string) => <li key={x} className="text-[10.8px] leading-4.5 text-secondary">{x}</li>)}</ul></div>)}
                </div>
              </section>

              <button onClick={() => setTab('practice')} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5">Start practice interview <ArrowRight size={14} /></button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-6">
              <section className="dashboard-panel">
                <p className="dashboard-eyebrow">Practice interview</p>
                <div className="flex items-center justify-between gap-4 mb-5"><h2 className="dashboard-section-title">Question {questionIndex + 1} of {prep.likely_questions?.length || 0}</h2><span className="text-[10px] text-muted">One question at a time</span></div>
                <div className="bg-[#092b45] text-white p-6 mb-5"><p className="font-serif text-[27px] leading-9 text-white">{currentQuestion}</p></div>
                <label className="block text-[11px] font-medium text-ink mb-2">Answer in your own words</label>
                <textarea rows={9} value={practiceAnswer} onChange={e => setPracticeAnswer(e.target.value)} placeholder="Speak it out loud first if you can, then type the version you want coaching on..." className="input-field text-[13px] resize-y" />
                {error && <p className="mt-4 border-l-2 border-red-500 pl-3 text-[12px] text-red-700">{error}</p>}
                <div className="flex flex-wrap gap-3 mt-5">
                  <button disabled={coaching} onClick={reviewAnswer} className="btn-primary flex items-center gap-2 px-5 py-3 disabled:opacity-50">{coaching ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}Review my answer</button>
                  <button onClick={nextQuestion} className="btn-secondary flex items-center gap-2 px-5 py-3">Next question <ArrowRight size={14} /></button>
                </div>
              </section>

              <aside className="dashboard-panel h-fit">
                <p className="dashboard-eyebrow">Your coach</p>
                {!feedback ? (
                  <div className="py-8 text-center"><Brain size={26} className="mx-auto text-accent mb-3" /><h2 className="font-serif text-[24px] text-ink mb-2">Make it sound like you.</h2><p className="text-[11.5px] text-muted leading-5 max-w-sm mx-auto">We will show what is strong, what is missing and what to add. We will not replace your answer with one written for you.</p></div>
                ) : (
                  <div>
                    <div className="flex items-end gap-2 mb-5"><span className="font-serif text-[48px] leading-none text-ink">{feedback.score}</span><span className="text-[12px] text-muted mb-1">/100 for this answer</span></div>
                    <div className="space-y-4">
                      <div className="border-l-2 border-emerald-500 pl-3"><p className="text-[10px] uppercase tracking-[.14em] text-emerald-700 mb-1">Strong</p><p className="text-[12px] text-secondary leading-5">{feedback.strong}</p></div>
                      <div className="border-l-2 border-amber-500 pl-3"><p className="text-[10px] uppercase tracking-[.14em] text-amber-700 mb-1">Improve</p><p className="text-[12px] text-secondary leading-5">{feedback.improve}</p></div>
                      <div className="border-l-2 border-[#c9a96e] pl-3"><p className="text-[10px] uppercase tracking-[.14em] text-accent mb-1">Try again</p><p className="text-[12px] text-secondary leading-5">{feedback.try_again}</p></div>
                    </div>
                    {feedback.follow_up && <div className="mt-5 p-4 bg-surface"><p className="text-[10px] uppercase tracking-[.14em] text-muted mb-1">Find stronger evidence</p><p className="text-[11.5px] text-secondary leading-5">{feedback.follow_up}</p></div>}
                    <button onClick={() => setFeedback(null)} className="mt-5 text-[12px] text-accent inline-flex items-center gap-1.5"><RefreshCw size={13} />Try this question again</button>
                  </div>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
