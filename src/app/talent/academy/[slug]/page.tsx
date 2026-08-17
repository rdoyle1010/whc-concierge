'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { courseBySlug, coursePrice, PASS_MARK, type AcademyCourse } from '@/lib/academy'
import { courseImage, lessonExtras } from '@/lib/academy-extras'
import { getCourseContent } from '@/lib/academy-content'
import {
  ArrowLeft, ArrowRight, Check, Award, RotateCcw, Quote, TrendingUp,
  Lightbulb, BookOpen, Target, GraduationCap, FileText, Users, Eye,
  CircleHelp, Workflow, TriangleAlert, ListChecks
} from 'lucide-react'

type View = 'overview' | number | 'quiz'

function LearningFramework({ title, index }: { title: string; index: number }) {
  const steps = [
    { label: 'Why it matters', icon: CircleHelp },
    { label: 'How to use it', icon: Workflow },
    { label: 'What to watch', icon: TriangleAlert },
    { label: 'Apply it', icon: ListChecks },
  ]
  return (
    <div className="mb-6 rounded-2xl border border-[#ded8cd] bg-[#f8f5ef] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9c7a42]">WHC learning framework</p>
          <p className="mt-1 text-[13px] font-medium text-[#10283b]">Use this module as a working tool, not just something to read.</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10283b] text-[12px] font-semibold text-white">{index + 1}</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon
          return <div key={step.label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
            <Icon size={15} className="mb-2 text-[#9c7a42]" />
            <p className="text-[11px] font-semibold text-[#10283b]">{step.label}</p>
            <p className="mt-1 text-[10px] leading-4 text-[#71808a]">{i === 0 ? `Understand the business or guest reason behind ${title.toLowerCase()}.` : i === 1 ? 'Turn the idea into a repeatable behaviour, process or decision.' : i === 2 ? 'Spot the common mistakes, risks and judgement calls before they become problems.' : 'Use the case study and action prompt to translate learning into your own spa.'}</p>
          </div>
        })}
      </div>
    </div>
  )
}

export default function CoursePlayerPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const fallbackCourse = courseBySlug(slug)
  const [course, setCourse] = useState<(AcademyCourse & { image_url?: string; managed?: boolean }) | null>(fallbackCourse || null)
  const rich = course?.managed ? null : getCourseContent(slug)

  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [view, setView] = useState<View>('overview')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [res, catalogueResponse] = await Promise.all([
          fetch('/api/academy'),
          fetch(`/api/academy/catalog?slug=${encodeURIComponent(slug)}`),
        ])
        if (catalogueResponse.ok) {
          const catalogue = await catalogueResponse.json()
          if (catalogue.course) setCourse(catalogue.course)
        }
        if (res.ok) {
          const j = await res.json()
          const enr = (j.enrollments || []).find((e: any) => e.course_slug === slug && e.paid_at)
          if (enr) {
            setEnrolled(true)
            setProgress(enr.progress || {})
            setCompletedAt(enr.completed_at || null)
          }
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [slug])

  if (!course && loading) return <DashboardShell role="talent"><div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div></DashboardShell>
  if (!course) return <DashboardShell role="talent"><p className="text-gray-400">Course not found. <Link href="/talent/academy" className="underline">Back to the Academy</Link></p></DashboardShell>

  async function markLesson(idx: number) {
    if (progress[idx]) return
    setProgress(p => ({ ...p, [idx]: true }))
    try {
      await fetch('/api/academy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'progress', courseSlug: slug, lesson: idx }) })
    } catch {}
  }

  async function submitQuiz() {
    if (!course) return
    setError('')
    const list = course.quiz.map((_, i) => answers[i])
    if (list.some(a => a === undefined)) { setError('Please answer every question before submitting.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/academy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'quiz', courseSlug: slug, answers: list }) })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not submit - please try again.'); return }
      setResult({ score: j.score, passed: j.passed, correct: j.correct, total: j.total })
      if (j.passed) setCompletedAt(new Date().toISOString())
    } catch { setError('Something went wrong - please try again.') } finally { setBusy(false) }
  }

  const total = course.lessons.length
  const done = course.lessons.filter((_, i) => progress[i]).length
  const allLessonsDone = done === total
  const pct = Math.round(((done + (completedAt ? 1 : 0)) / (total + 1)) * 100)

  if (loading) return <DashboardShell role="talent"><div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div></DashboardShell>

  if (!enrolled) {
    return <DashboardShell role="talent"><div className="dashboard-card max-w-2xl py-12 text-center"><p className="mb-2 text-[15px] font-medium text-ink">You&apos;re not enrolled on this course yet</p><p className="mb-4 text-[13px] text-gray-500">{course.title} - £{(coursePrice(course) / 100).toFixed(0)} with certificate and profile badge on completion.</p><Link href="/talent/academy" className="btn-primary inline-block text-[13px]">Enrol from the Academy</Link></div></DashboardShell>
  }

  const navItem = (label: string, active: boolean, complete: boolean, onClick: () => void, sub?: string) => (
    <button key={label} type="button" onClick={onClick} className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${active ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}>
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${complete ? 'bg-green-600 text-white' : active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{complete ? <Check size={11} /> : ''}</span>
      <span className="min-w-0"><span className={`block text-[12px] font-medium leading-snug ${active ? 'text-white' : 'text-ink'}`}>{label}</span>{sub && <span className={`mt-0.5 block text-[10px] ${active ? 'text-white/60' : 'text-gray-400'}`}>{sub}</span>}</span>
    </button>
  )

  return (
    <DashboardShell role="talent">
      <Link href="/talent/academy" className="mb-4 flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft size={14} /> Academy</Link>

      <div className="relative mb-5 h-52 overflow-hidden rounded-2xl md:h-64">
        <img src={course.image_url || courseImage(slug)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2f4d]/90 via-[#0b2f4d]/45 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e6c98e]">WHC Academy · {course.category}</p>
          <h1 className="max-w-3xl text-2xl font-semibold tracking-[-0.025em] text-white md:text-4xl">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/75">{course.tagline}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="shrink-0 text-[12px] text-gray-500">{completedAt ? 'Complete - certified' : `${done}/${total} modules · assessment ${allLessonsDone ? 'unlocked' : 'locked'}`}</p>
      </div>

      {completedAt && <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4"><div className="flex items-center gap-3"><Award size={18} className="shrink-0 text-green-700" /><p className="text-[13px] font-medium text-green-800">Certified - this badge is live on your profile.</p></div><Link href={`/talent/academy/certificate/${slug}`} className="btn-primary shrink-0 text-[12px]">View certificate</Link></div>}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-xl border border-border bg-white p-3 lg:sticky lg:top-6">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Syllabus</p>
          <div className="space-y-0.5">
            {navItem('Course overview', view === 'overview', false, () => setView('overview'))}
            {course.lessons.map((l, i) => navItem(`${i + 1}. ${l.title}`, view === i, Boolean(progress[i]), () => { setView(i); setResult(null) }))}
            {navItem('Final assessment', view === 'quiz', Boolean(completedAt), () => { if (allLessonsDone) { setView('quiz'); setResult(null); setAnswers({}) } }, allLessonsDone ? `${course.quiz.length} questions · ${PASS_MARK}% to pass` : 'Complete all modules to unlock')}
          </div>
        </aside>

        <div className="min-w-0">
          {view === 'overview' && <div className="dashboard-card">
            <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent"><BookOpen size={13} /> Course overview</p>
            <h2 className="mb-3 text-[24px] font-semibold tracking-[-0.02em] text-ink">{course.title}</h2>
            {rich ? <>
              <p className="mb-6 text-[14px] leading-[1.8] text-gray-700">{rich.aims}</p>
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-surface p-4"><Users size={15} className="mb-2 text-[#9c7a42]" /><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Who this is for</p><p className="text-[12px] leading-5 text-gray-700">{rich.audience}</p></div>
                <div className="rounded-xl bg-surface p-4"><Eye size={15} className="mb-2 text-[#9c7a42]" /><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">How to use it</p><p className="text-[12px] leading-5 text-gray-700">Work through one module at a time. Use the case studies to test judgement, then translate the lesson into a practical action for your own spa or role.</p></div>
                <div className="rounded-xl bg-surface p-4"><FileText size={15} className="mb-2 text-[#9c7a42]" /><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Assessment</p><p className="text-[12px] leading-5 text-gray-700">{course.quiz.length} questions, {PASS_MARK}% pass mark, unlimited retakes and a verified certificate on completion.</p></div>
              </div>
              <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500"><GraduationCap size={12} /> On completion you will be able to</p>
              <ul className="mb-6 grid gap-2 md:grid-cols-2">{rich.outcomes.map((o, i) => <li key={i} className="flex items-start gap-2 rounded-lg border border-border p-3 text-[12px] leading-5 text-gray-700"><Check size={14} className="mt-0.5 shrink-0 text-green-600" />{o}</li>)}</ul>
            </> : <p className="mb-6 text-[14px] leading-[1.8] text-gray-700">{course.tagline}. {course.lessons.length} modules followed by a {course.quiz.length}-question assessment at {PASS_MARK}%.</p>}
            <button type="button" onClick={() => setView(course.lessons.findIndex((_, i) => !progress[i]) === -1 ? 0 : course.lessons.findIndex((_, i) => !progress[i]))} className="btn-primary inline-flex items-center gap-2 text-[13px]">{done === 0 ? 'Begin Module 1' : allLessonsDone ? 'Review the modules' : `Continue - Module ${course.lessons.findIndex((_, i) => !progress[i]) + 1}`} <ArrowRight size={14} /></button>
          </div>}

          {typeof view === 'number' && (() => {
            const i = view
            const lesson = course.lessons[i]
            const richLesson = rich?.lessons[i]
            const extra = lessonExtras(slug, i)
            return <div className="dashboard-card">
              <div className="mb-5 border-b border-border pb-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Module {i + 1} of {total}</p>
                <h2 className="text-[25px] font-semibold tracking-[-0.02em] text-ink">{lesson.title}</h2>
              </div>

              <LearningFramework title={lesson.title} index={i} />

              {richLesson && <div className="mb-6 rounded-r-xl border-l-2 border-gold bg-surface p-4"><p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500"><Target size={12} /> Learning objectives</p><ul className="space-y-1">{richLesson.objectives.map((o, oi) => <li key={oi} className="flex items-start gap-2 text-[13px] text-gray-700"><span className="mt-0.5 text-gold">•</span>{o}</li>)}</ul></div>}

              {richLesson ? <div className="mb-6 space-y-5">{richLesson.sections.map((s, si) => <section key={si} className="rounded-xl border border-[#e6e1d8] bg-white p-5"><div className="mb-2 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10283b] text-[10px] font-semibold text-white">{si + 1}</span><h3 className="text-[16px] font-semibold text-ink">{s.heading}</h3></div><p className="whitespace-pre-line text-[14px] leading-[1.85] text-gray-700">{s.body}</p></section>)}</div> : <div className="mb-6 whitespace-pre-line text-[14px] leading-[1.85] text-gray-700">{lesson.content}</div>}

              {richLesson?.keyTerms?.length > 0 && <div className="mb-6"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Key terms</p><div className="grid gap-2 sm:grid-cols-2">{richLesson.keyTerms.map((kt, ki) => <div key={ki} className="rounded-lg border border-border p-3"><p className="text-[12px] font-semibold text-ink">{kt.term}</p><p className="text-[12px] leading-[1.6] text-gray-600">{kt.definition}</p></div>)}</div></div>}

              {richLesson?.caseStudy && <div className="mb-6 rounded-2xl bg-ink p-5"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Case study · {richLesson.caseStudy.title}</p><p className="mb-3 text-[13px] leading-[1.8] text-white/85">{richLesson.caseStudy.scenario}</p><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">The professional response</p><p className="text-[13px] leading-[1.8] text-white/85">{richLesson.caseStudy.insight}</p></div>}

              {extra && <div className="mb-6 grid gap-3 lg:grid-cols-3">
                <div className="rounded-xl border border-accent/20 bg-[#FDF6EC] p-4"><p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"><Quote size={12} /> Through the guest&apos;s eyes</p><p className="text-[13px] italic leading-[1.7] text-gray-700">{extra.guestView}</p></div>
                <div className="rounded-xl bg-surface p-4"><p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500"><TrendingUp size={12} /> Why this matters</p><p className="text-[13px] leading-[1.7] text-gray-700">{extra.helpsYou}</p></div>
                <div className="rounded-xl border border-border p-4"><p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500"><Lightbulb size={12} className="text-amber-500" /> Things to consider</p><ul className="space-y-1.5">{extra.tips.map((t, ti) => <li key={ti} className="flex items-start gap-2 text-[12px] leading-5 text-gray-700"><Check size={13} className="mt-0.5 shrink-0 text-green-600" />{t}</li>)}</ul></div>
              </div>}

              <div className="mb-6 rounded-2xl border border-[#d9d2c5] bg-[#f7f3ea] p-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9c7a42]">Put this into practice</p>
                <p className="text-[13px] leading-6 text-[#51616d]">Think about your current or most recent spa. Where does this standard already work well? Where does it break down? Write down one behaviour, process or number you would change this week, who would own it, and how you would know the change had worked.</p>
              </div>

              {richLesson?.summary && <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4"><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">Module summary</p><p className="text-[13px] leading-[1.7] text-gray-700">{richLesson.summary}</p></div>}

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><button type="button" onClick={() => setView(i === 0 ? 'overview' : i - 1)} className="btn-secondary inline-flex items-center gap-1.5 text-[12px]"><ArrowLeft size={13} /> {i === 0 ? 'Overview' : `Module ${i}`}</button><button type="button" onClick={() => { markLesson(i); setView(i + 1 < total ? i + 1 : 'quiz'); if (i + 1 >= total) { setResult(null); setAnswers({}) } }} className="btn-primary inline-flex items-center gap-1.5 text-[12px]">{progress[i] ? (i + 1 < total ? `Module ${i + 2}` : 'Final assessment') : (i + 1 < total ? 'Complete module & continue' : 'Complete module - to assessment')} <ArrowRight size={13} /></button></div>
            </div>
          })()}

          {view === 'quiz' && (result ? <div className="dashboard-card py-10 text-center">{result.passed ? <><Award size={40} className="mx-auto mb-3 text-green-600" /><p className="mb-1 text-xl font-bold text-ink">Passed - {result.score}%</p><p className="mb-6 text-[13px] text-gray-500">{result.correct} of {result.total} correct. Your certificate is ready and the badge is live on your profile.</p><div className="flex items-center justify-center gap-3"><Link href={`/talent/academy/certificate/${slug}`} className="btn-primary text-[13px]">View certificate</Link><Link href="/talent/academy" className="btn-secondary text-[13px]">Back to Academy</Link></div></> : <><RotateCcw size={36} className="mx-auto mb-3 text-amber-500" /><p className="mb-1 text-xl font-bold text-ink">{result.score}% - not quite</p><p className="mb-6 text-[13px] text-gray-500">{result.correct} of {result.total} correct; you need {PASS_MARK}%. Revisit the modules and try again - there is no limit on retakes.</p><div className="flex items-center justify-center gap-3"><button type="button" onClick={() => { setResult(null); setAnswers({}) }} className="btn-primary text-[13px]">Retake now</button><button type="button" onClick={() => setView(0)} className="btn-secondary text-[13px]">Back to Module 1</button></div></>}</div> : <div className="space-y-4"><div className="dashboard-card"><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Final assessment</p><h2 className="mb-1 text-[20px] font-bold text-ink">{course.title}</h2><p className="text-[12px] text-gray-500">{course.quiz.length} questions · {PASS_MARK}% to pass · unlimited retakes · marked instantly</p></div>{course.quiz.map((q, i) => <div key={i} className="dashboard-card"><p className="mb-3 text-[14px] font-medium text-ink">{i + 1}. {q.q}</p><div className="space-y-2">{q.options.map((opt, oi) => <label key={oi} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors ${answers[i] === oi ? 'border-ink bg-surface' : 'border-border hover:border-ink/30'}`}><input type="radio" name={`q${i}`} checked={answers[i] === oi} onChange={() => setAnswers(a => ({ ...a, [i]: oi }))} className="mt-0.5" /><span className="text-[13px] text-gray-700">{opt}</span></label>)}</div></div>)}{error && <p className="text-[12px] text-red-600">{error}</p>}<div className="flex items-center gap-3"><button type="button" onClick={submitQuiz} disabled={busy} className="btn-primary text-[13px] disabled:opacity-50">{busy ? 'Marking...' : 'Submit for marking'}</button><button type="button" onClick={() => setView(total - 1)} className="btn-secondary text-[13px]">Back to the modules</button></div></div>)}
        </div>
      </div>
    </DashboardShell>
  )
}
