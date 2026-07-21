'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { courseBySlug, coursePrice, PASS_MARK } from '@/lib/academy'
import { courseImage, lessonExtras } from '@/lib/academy-extras'
import { getCourseContent } from '@/lib/academy-content'
import {
  ArrowLeft, ArrowRight, Check, Award, RotateCcw, Quote, TrendingUp,
  Lightbulb, BookOpen, Target, GraduationCap, FileText, Users
} from 'lucide-react'

// The WHC Academy course player - built to feel like a serious course of
// study: syllabus navigation, module-by-module progression, learning
// objectives, key terms, case studies and a formal assessment. Rich content
// comes from academy-content/<slug>; quiz + progress logic is unchanged.

type View = 'overview' | number | 'quiz'

export default function CoursePlayerPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const course = courseBySlug(slug)
  const rich = getCourseContent(slug)

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
        const res = await fetch('/api/academy')
        if (res.ok) {
          const j = await res.json()
          const enr = (j.enrollments || []).find((e: any) => e.course_slug === slug && e.paid_at)
          if (enr) {
            setEnrolled(true)
            setProgress(enr.progress || {})
            setCompletedAt(enr.completed_at || null)
          }
        }
      } catch { /* treated as not enrolled */ }
      setLoading(false)
    }
    load()
  }, [slug])

  if (!course) {
    return <DashboardShell role="talent"><p className="text-gray-400">Course not found. <Link href="/talent/academy" className="underline">Back to the Academy</Link></p></DashboardShell>
  }

  async function markLesson(idx: number) {
    if (progress[idx]) return
    setProgress(p => ({ ...p, [idx]: true }))
    try {
      await fetch('/api/academy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'progress', courseSlug: slug, lesson: idx }),
      })
    } catch { /* best-effort */ }
  }

  async function submitQuiz() {
    if (!course) return
    setError('')
    const list = course.quiz.map((_, i) => answers[i])
    if (list.some(a => a === undefined)) { setError('Please answer every question before submitting.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/academy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quiz', courseSlug: slug, answers: list }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not submit - please try again.'); return }
      setResult({ score: j.score, passed: j.passed, correct: j.correct, total: j.total })
      if (j.passed) setCompletedAt(new Date().toISOString())
    } catch {
      setError('Something went wrong - please try again.')
    } finally {
      setBusy(false)
    }
  }

  const total = course.lessons.length
  const done = course.lessons.filter((_, i) => progress[i]).length
  const allLessonsDone = done === total
  const pct = Math.round(((done + (completedAt ? 1 : 0)) / (total + 1)) * 100)

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div></DashboardShell>

  if (!enrolled) {
    return (
      <DashboardShell role="talent">
        <div className="max-w-2xl dashboard-card text-center py-12">
          <p className="text-[15px] text-ink font-medium mb-2">You&apos;re not enrolled on this course yet</p>
          <p className="text-[13px] text-gray-500 mb-4">{course.title} - £{(coursePrice(course) / 100).toFixed(0)} with certificate and profile badge on completion.</p>
          <Link href="/talent/academy" className="btn-primary inline-block text-[13px]">Enrol from the Academy</Link>
        </div>
      </DashboardShell>
    )
  }

  const navItem = (label: string, active: boolean, complete: boolean, onClick: () => void, sub?: string) => (
    <button key={label} type="button" onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${active ? 'bg-ink text-white' : 'hover:bg-surface text-ink'}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 ${complete ? 'bg-green-600 text-white' : active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {complete ? <Check size={11} /> : ''}
      </span>
      <span className="min-w-0">
        <span className={`block text-[12px] font-medium leading-snug ${active ? 'text-white' : 'text-ink'}`}>{label}</span>
        {sub && <span className={`block text-[10px] mt-0.5 ${active ? 'text-white/60' : 'text-gray-400'}`}>{sub}</span>}
      </span>
    </button>
  )

  return (
    <DashboardShell role="talent">
      <Link href="/talent/academy" className="text-[13px] text-muted hover:text-ink flex items-center gap-1 mb-4"><ArrowLeft size={14} /> Academy</Link>

      {/* Course hero */}
      <div className="relative rounded-2xl overflow-hidden mb-5 h-44 md:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={courseImage(slug)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold mb-1.5">WHC Academy · {course.category}</p>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">{course.title}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[12px] text-gray-500 shrink-0">{completedAt ? 'Complete - certified' : `${done}/${total} modules · assessment ${allLessonsDone ? 'unlocked' : 'locked'}`}</p>
      </div>

      {completedAt && (
        <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
          <div className="flex items-center gap-3">
            <Award size={18} className="text-green-700 shrink-0" />
            <p className="text-[13px] text-green-800 font-medium">Certified - this badge is live on your profile.</p>
          </div>
          <Link href={`/talent/academy/certificate/${slug}`} className="btn-primary text-[12px] shrink-0">View certificate</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Syllabus navigation */}
        <aside className="bg-white border border-border rounded-xl p-3 lg:sticky lg:top-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold px-3 pt-1 pb-2">Syllabus</p>
          <div className="space-y-0.5">
            {navItem('Course overview', view === 'overview', false, () => { setView('overview') })}
            {course.lessons.map((l, i) => navItem(`${i + 1}. ${l.title}`, view === i, Boolean(progress[i]), () => { setView(i); setResult(null) }))}
            {navItem('Final assessment', view === 'quiz', Boolean(completedAt), () => { if (allLessonsDone) { setView('quiz'); setResult(null); setAnswers({}) } }, allLessonsDone ? `${course.quiz.length} questions · ${PASS_MARK}% to pass` : 'Complete all modules to unlock')}
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {view === 'overview' && (
            <div className="dashboard-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-2 inline-flex items-center gap-1.5"><BookOpen size={13} /> Course overview</p>
              <h2 className="font-serif text-[22px] font-bold text-ink mb-3">{course.title}</h2>
              {rich ? (
                <>
                  <p className="text-[14px] text-gray-700 leading-[1.8] mb-5">{rich.aims}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-1.5 inline-flex items-center gap-1.5"><Users size={12} /> Who this course is for</p>
                      <p className="text-[13px] text-gray-700 leading-[1.7]">{rich.audience}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-1.5 inline-flex items-center gap-1.5"><FileText size={12} /> Assessment</p>
                      <p className="text-[13px] text-gray-700 leading-[1.7]">{course.quiz.length}-question assessment. {PASS_MARK}% required to pass. Unlimited retakes. Passing issues your certificate with a unique verification code and places the badge on your professional profile.</p>
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-2 inline-flex items-center gap-1.5"><GraduationCap size={12} /> On completion you will be able to</p>
                  <ul className="space-y-1.5 mb-6">
                    {rich.outcomes.map((o, i) => (
                      <li key={i} className="text-[13px] text-gray-700 flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" />{o}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-[14px] text-gray-700 leading-[1.8] mb-6">{course.tagline}. {course.lessons.length} modules followed by a {course.quiz.length}-question assessment at {PASS_MARK}%.</p>
              )}
              <button onClick={() => setView(course.lessons.findIndex((_, i) => !progress[i]) === -1 ? 0 : course.lessons.findIndex((_, i) => !progress[i]))}
                className="btn-primary text-[13px] inline-flex items-center gap-2">
                {done === 0 ? 'Begin Module 1' : allLessonsDone ? 'Review the modules' : `Continue - Module ${course.lessons.findIndex((_, i) => !progress[i]) + 1}`} <ArrowRight size={14} />
              </button>
            </div>
          )}

          {typeof view === 'number' && (() => {
            const i = view
            const lesson = course.lessons[i]
            const richLesson = rich?.lessons[i]
            const extra = lessonExtras(slug, i)
            return (
              <div className="dashboard-card">
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5">Module {i + 1} of {total}</p>
                <h2 className="font-serif text-[22px] font-bold text-ink mb-4">{lesson.title}</h2>

                {/* Learning objectives */}
                {richLesson && (
                  <div className="border-l-2 border-gold bg-surface rounded-r-xl p-4 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-2 inline-flex items-center gap-1.5"><Target size={12} /> Learning objectives</p>
                    <ul className="space-y-1">
                      {richLesson.objectives.map((o, oi) => (
                        <li key={oi} className="text-[13px] text-gray-700 flex items-start gap-2"><span className="text-gold mt-0.5">•</span>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Teaching content */}
                {richLesson ? (
                  <div className="space-y-5 mb-6">
                    {richLesson.sections.map((s, si) => (
                      <section key={si}>
                        <h3 className="font-serif text-[16px] font-semibold text-ink mb-2">{s.heading}</h3>
                        <p className="text-[14px] text-gray-700 leading-[1.85] whitespace-pre-line">{s.body}</p>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="text-[14px] text-gray-700 leading-[1.85] whitespace-pre-line mb-6">{lesson.content}</div>
                )}

                {/* Key terms */}
                {richLesson && richLesson.keyTerms.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-2">Key terms</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {richLesson.keyTerms.map((kt, ki) => (
                        <div key={ki} className="border border-border rounded-lg p-3">
                          <p className="text-[12px] font-semibold text-ink">{kt.term}</p>
                          <p className="text-[12px] text-gray-600 leading-[1.6]">{kt.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case study */}
                {richLesson?.caseStudy && (
                  <div className="bg-ink rounded-xl p-5 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold mb-2">Case study · {richLesson.caseStudy.title}</p>
                    <p className="text-[13px] text-white/85 leading-[1.8] mb-3">{richLesson.caseStudy.scenario}</p>
                    <p className="text-[12px] text-white/60 uppercase tracking-wide font-semibold mb-1">The professional response</p>
                    <p className="text-[13px] text-white/85 leading-[1.8]">{richLesson.caseStudy.insight}</p>
                  </div>
                )}

                {/* Guest's eyes / career / tips */}
                {extra && (
                  <div className="space-y-3 mb-6">
                    <div className="bg-[#FDF6EC] border border-accent/20 rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent mb-1.5 inline-flex items-center gap-1.5"><Quote size={12} /> Through the guest&apos;s eyes</p>
                      <p className="text-[13px] text-gray-700 italic leading-[1.7]">{extra.guestView}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 mb-1.5 inline-flex items-center gap-1.5"><TrendingUp size={12} /> What this does for your career</p>
                      <p className="text-[13px] text-gray-700 leading-[1.7]">{extra.helpsYou}</p>
                    </div>
                    <div className="border border-border rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 mb-2 inline-flex items-center gap-1.5"><Lightbulb size={12} className="text-amber-500" /> Quick tips</p>
                      <ul className="space-y-1.5">
                        {extra.tips.map((t, ti) => (
                          <li key={ti} className="text-[13px] text-gray-700 flex items-start gap-2"><Check size={13} className="text-green-600 mt-0.5 shrink-0" />{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Module summary */}
                {richLesson?.summary && (
                  <div className="border border-gold/30 bg-gold/5 rounded-xl p-4 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gold font-semibold mb-1.5">Module summary</p>
                    <p className="text-[13px] text-gray-700 leading-[1.7]">{richLesson.summary}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                  <button onClick={() => setView(i === 0 ? 'overview' : i - 1)} className="btn-secondary text-[12px] inline-flex items-center gap-1.5"><ArrowLeft size={13} /> {i === 0 ? 'Overview' : `Module ${i}`}</button>
                  <button
                    onClick={() => { markLesson(i); setView(i + 1 < total ? i + 1 : 'quiz'); if (i + 1 >= total) { setResult(null); setAnswers({}) } }}
                    className="btn-primary text-[12px] inline-flex items-center gap-1.5">
                    {progress[i] ? (i + 1 < total ? `Module ${i + 2}` : 'Final assessment') : (i + 1 < total ? 'Complete module & continue' : 'Complete module - to assessment')} <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )
          })()}

          {view === 'quiz' && (
            result ? (
              <div className="dashboard-card text-center py-10">
                {result.passed ? (
                  <>
                    <Award size={40} className="mx-auto text-green-600 mb-3" />
                    <p className="font-serif text-xl font-bold text-ink mb-1">Passed - {result.score}%</p>
                    <p className="text-[13px] text-gray-500 mb-6">{result.correct} of {result.total} correct. Your certificate is ready and the badge is live on your profile.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Link href={`/talent/academy/certificate/${slug}`} className="btn-primary text-[13px]">View certificate</Link>
                      <Link href="/talent/academy" className="btn-secondary text-[13px]">Back to Academy</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <RotateCcw size={36} className="mx-auto text-amber-500 mb-3" />
                    <p className="font-serif text-xl font-bold text-ink mb-1">{result.score}% - not quite</p>
                    <p className="text-[13px] text-gray-500 mb-6">{result.correct} of {result.total} correct; you need {PASS_MARK}%. Revisit the modules and try again - there is no limit on retakes.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setResult(null); setAnswers({}) }} className="btn-primary text-[13px]">Retake now</button>
                      <button onClick={() => setView(0)} className="btn-secondary text-[13px]">Back to Module 1</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="dashboard-card">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5">Final assessment</p>
                  <h2 className="font-serif text-[20px] font-bold text-ink mb-1">{course.title}</h2>
                  <p className="text-[12px] text-gray-500">{course.quiz.length} questions · {PASS_MARK}% to pass · unlimited retakes · marked instantly</p>
                </div>
                {course.quiz.map((q, i) => (
                  <div key={i} className="dashboard-card">
                    <p className="text-[14px] font-medium text-ink mb-3">{i + 1}. {q.q}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${answers[i] === oi ? 'border-ink bg-surface' : 'border-border hover:border-ink/30'}`}>
                          <input type="radio" name={`q${i}`} checked={answers[i] === oi} onChange={() => setAnswers(a => ({ ...a, [i]: oi }))} className="mt-0.5" />
                          <span className="text-[13px] text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {error && <p className="text-[12px] text-red-600">{error}</p>}
                <div className="flex items-center gap-3">
                  <button onClick={submitQuiz} disabled={busy} className="btn-primary text-[13px] disabled:opacity-50">{busy ? 'Marking...' : 'Submit for marking'}</button>
                  <button onClick={() => setView(total - 1)} className="btn-secondary text-[13px]">Back to the modules</button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
