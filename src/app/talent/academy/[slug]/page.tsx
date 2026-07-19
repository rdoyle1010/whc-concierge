'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { courseBySlug, PASS_MARK } from '@/lib/academy'
import { courseImage, lessonExtras } from '@/lib/academy-extras'
import { ArrowLeft, Check, ChevronDown, Award, RotateCcw, Quote, TrendingUp, Lightbulb } from 'lucide-react'

// The course player: read the lessons (each ticked as you go), then sit the
// final quiz. Graded server-side; 80% earns the certificate and the badge.

export default function CoursePlayerPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const course = courseBySlug(slug)

  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [openLesson, setOpenLesson] = useState(0)
  const [quizMode, setQuizMode] = useState(false)
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
    setProgress(p => ({ ...p, [idx]: true })) // optimistic
    try {
      await fetch('/api/academy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'progress', courseSlug: slug, lesson: idx }),
      })
    } catch { /* progress is best-effort */ }
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

  const lessonsDone = course.lessons.every((_, i) => progress[i])

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div></DashboardShell>

  if (!enrolled) {
    return (
      <DashboardShell role="talent">
        <div className="max-w-2xl dashboard-card text-center py-12">
          <p className="text-[15px] text-ink font-medium mb-2">You&apos;re not enrolled on this course yet</p>
          <p className="text-[13px] text-gray-500 mb-4">{course.title} - £10 with certificate and profile badge on completion.</p>
          <Link href="/talent/academy" className="btn-primary inline-block text-[13px]">Enrol from the Academy</Link>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="talent">
      <div className="max-w-3xl">
        <Link href="/talent/academy" className="text-[13px] text-muted hover:text-ink flex items-center gap-1 mb-4"><ArrowLeft size={14} /> Academy</Link>
        {/* Course hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-44 md:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={courseImage(slug)} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1">{course.title}</h1>
            <p className="text-[13px] text-white/80">{course.tagline}</p>
          </div>
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

        {!quizMode ? (
          <>
            {/* Lessons */}
            <div className="space-y-3 mb-6">
              {course.lessons.map((lesson, i) => {
                const open = openLesson === i
                const done = Boolean(progress[i])
                return (
                  <div key={i} className={`bg-white border rounded-xl ${done ? 'border-green-200' : 'border-border'}`}>
                    <button type="button" onClick={() => setOpenLesson(open ? -1 : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left">
                      <span className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${done ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {done ? <Check size={12} /> : i + 1}
                        </span>
                        <span className="text-[14px] font-medium text-ink">{lesson.title}</span>
                      </span>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="px-5 pb-5">
                        <div className="text-[14px] text-gray-700 leading-[1.8] whitespace-pre-line border-t border-border/60 pt-4 mb-4">{lesson.content}</div>
                        {(() => {
                          const extra = lessonExtras(slug, i)
                          if (!extra) return null
                          return (
                            <div className="space-y-3 mb-4">
                              {/* Through the guest's eyes */}
                              <div className="bg-[#FDF6EC] border border-accent/20 rounded-xl p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent mb-1.5 inline-flex items-center gap-1.5"><Quote size={12} /> Through the guest&apos;s eyes</p>
                                <p className="text-[13px] text-gray-700 italic leading-[1.7]">{extra.guestView}</p>
                              </div>
                              {/* What this does for you */}
                              <div className="bg-surface rounded-xl p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 mb-1.5 inline-flex items-center gap-1.5"><TrendingUp size={12} /> What this does for your career</p>
                                <p className="text-[13px] text-gray-700 leading-[1.7]">{extra.helpsYou}</p>
                              </div>
                              {/* Quick tips */}
                              <div className="border border-border rounded-xl p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 mb-2 inline-flex items-center gap-1.5"><Lightbulb size={12} className="text-amber-500" /> Quick tips</p>
                                <ul className="space-y-1.5">
                                  {extra.tips.map((t, ti) => (
                                    <li key={ti} className="text-[13px] text-gray-700 flex items-start gap-2"><Check size={13} className="text-green-600 mt-0.5 shrink-0" />{t}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )
                        })()}
                        {!done && (
                          <button onClick={() => { markLesson(i); if (i + 1 < course.lessons.length) setOpenLesson(i + 1) }}
                            className="btn-primary text-[12px]">Mark as read {i + 1 < course.lessons.length ? '& continue' : ''}</button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Quiz gate */}
            <div className="dashboard-card text-center py-8">
              <p className="text-[15px] font-serif font-semibold text-ink mb-1">Final quiz</p>
              <p className="text-[12px] text-gray-500 mb-4">{course.quiz.length} questions · {PASS_MARK}% to pass · retake any time</p>
              <button onClick={() => { setQuizMode(true); setResult(null); setAnswers({}) }} disabled={!lessonsDone}
                className="btn-primary text-[13px] disabled:opacity-50">
                {lessonsDone ? (completedAt ? 'Retake the quiz' : 'Start the quiz') : 'Finish all lessons to unlock'}
              </button>
            </div>
          </>
        ) : result ? (
          /* Result */
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
                <p className="text-[13px] text-gray-500 mb-6">{result.correct} of {result.total} correct; you need {PASS_MARK}%. Revisit the lessons and try again - there is no limit on retakes.</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => { setResult(null); setAnswers({}) }} className="btn-primary text-[13px]">Retake now</button>
                  <button onClick={() => { setQuizMode(false); setResult(null) }} className="btn-secondary text-[13px]">Back to lessons</button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Quiz */
          <div className="space-y-4">
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
              <button onClick={submitQuiz} disabled={busy} className="btn-primary text-[13px] disabled:opacity-50">{busy ? 'Marking...' : 'Submit answers'}</button>
              <button onClick={() => setQuizMode(false)} className="btn-secondary text-[13px]">Back to lessons</button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
