'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { courseBySlug, coursePrice, PASS_MARK, type AcademyCourse } from '@/lib/academy'
import { courseImage, lessonExtras } from '@/lib/academy-extras'
import { courseMeta } from '@/lib/academy-meta'
import { LessonVisualBlock, KnowledgeCheckBlock } from '@/components/LessonVisual'
import { getCourseContent } from '@/lib/academy-content'
import type { CourseContent } from '@/lib/academy-types'
import {
  ArrowLeft, ArrowRight, Check, Award, RotateCcw, Quote, TrendingUp,
  Lightbulb, BookOpen, Target, GraduationCap, FileText, Users, Download
} from 'lucide-react'

type View = 'overview' | number | 'quiz'

const MODULE_VISUALS = [
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1400&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1400&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1400&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1400&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=82&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1400&q=82&auto=format&fit=crop',
]

function LearningFramework({ title }: { title: string }) {
  const steps = [
    ['Why it matters', 'Understand the guest, people or commercial reason behind the topic.'],
    ['How to use it', 'Turn the idea into a repeatable behaviour, process or management decision.'],
    ['What to consider', 'Look for risk, trade-offs, capacity, cost, standards and unintended consequences.'],
    ['Apply it', 'Use the scenario or management lab to translate the lesson into your own spa.'],
  ]
  return (
    <div className="mb-6 rounded-2xl border border-[#dddddd] bg-[#f1f1f1] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1c1c1c]">WHC learning framework</p>
          <p className="mt-1 text-[14px] font-semibold text-[#1c1c1c]">Do more than read {title.toLowerCase()}.</p>
          <p className="mt-1 text-[12px] leading-5 text-[#555555]">Work through the reason, the method, the judgement calls and the practical application.</p>
        </div>
        <Target size={20} className="mt-1 shrink-0 text-[#1c1c1c]" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(([heading, copy], index) => (
          <div key={heading} className="rounded-xl border border-[#dddddd] bg-white p-3.5">
            <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1c1c1c] text-[10px] font-semibold text-white">{index + 1}</div>
            <p className="text-[11px] font-semibold text-[#1c1c1c]">{heading}</p>
            <p className="mt-1 text-[10px] leading-4 text-[#6b6b6b]">{copy}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ManagedLessonContent({ content }: { content: string }) {
  const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  const headings = ['Why this matters', 'How to use it', 'Things to consider', 'Management lab', 'Put it into practice']
  return (
    <div className="mb-6 space-y-4">
      {paragraphs.map((paragraph, index) => {
        const isLab = /lab|project|exercise|case|scenario/i.test(paragraph)
        return (
          <section key={index} className={`rounded-xl border p-5 ${isLab ? 'border-[#555555]/40 bg-[#f1f1f1]' : 'border-[#dddddd] bg-white'}`}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${isLab ? 'bg-[#1c1c1c] text-white' : 'bg-[#1c1c1c] text-white'}`}>{index + 1}</span>
              <h3 className="text-[15px] font-semibold text-[#1c1c1c]">{isLab ? 'Management lab' : headings[Math.min(index, headings.length - 1)]}</h3>
            </div>
            <p className="text-[13px] leading-7 text-[#555555] whitespace-pre-line">{paragraph}</p>
          </section>
        )
      })}
    </div>
  )
}

export default function CoursePlayerPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const fallbackCourse = courseBySlug(slug)
  const [course, setCourse] = useState<(AcademyCourse & { image_url?: string; managed?: boolean; rich?: CourseContent | null }) | null>(fallbackCourse || null)
  // Course content comes from code unless an admin has taken editorial control
  // of this course AND her version passes validation - in which case the
  // catalogue serves her content, including the rich layer below. A partial or
  // broken admin version never reaches here: the catalogue falls back to the
  // platform version, so this page can never render an empty course.
  const rich = course?.rich || getCourseContent(slug)

  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [view, setView] = useState<View>('overview')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uploads, setUploads] = useState<{ id: string; title: string; description: string | null; file_name: string | null }[]>([])

  useEffect(() => {
    if (!enrolled || !slug) return
    fetch(`/api/academy/uploads?course=${encodeURIComponent(String(slug))}`)
      .then(res => res.ok ? res.json() : { resources: [] })
      .then(json => setUploads(json.resources || []))
      .catch(() => {})
  }, [enrolled, slug])

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
      } catch { /* treated as not enrolled */ }
      setLoading(false)
    }
    load()
  }, [slug])

  if (!course && loading) {
    return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div></DashboardShell>
  }

  if (!course) {
    return <DashboardShell role="talent"><p className="text-muted">Course not found. <Link href="/talent/academy" className="underline">Back to the Academy</Link></p></DashboardShell>
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

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div></DashboardShell>

  if (!enrolled) {
    return (
      <DashboardShell role="talent">
        <div className="max-w-2xl dashboard-card text-center py-12">
          <p className="text-[15px] text-ink font-medium mb-2">You&apos;re not enrolled on this course yet</p>
          <p className="text-[13px] text-secondary mb-4">{course.title} - £{(coursePrice(course) / 100).toFixed(0)} with certificate and profile badge on completion.</p>
          <Link href="/talent/academy" className="btn-primary inline-block text-[13px]">Enrol from the Academy</Link>
        </div>
      </DashboardShell>
    )
  }

  const navItem = (label: string, active: boolean, complete: boolean, onClick: () => void, sub?: string) => (
    <button key={label} type="button" onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${active ? 'bg-ink text-white' : 'hover:bg-surface text-ink'}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 ${complete ? 'bg-green-600 text-white' : active ? 'bg-white/20 text-white' : 'bg-gray-100 text-secondary'}`}>
        {complete ? <Check size={11} /> : ''}
      </span>
      <span className="min-w-0">
        <span className={`block text-[12px] font-medium leading-snug ${active ? 'text-white' : 'text-ink'}`}>{label}</span>
        {sub && <span className={`block text-[10px] mt-0.5 ${active ? 'text-white/60' : 'text-muted'}`}>{sub}</span>}
      </span>
    </button>
  )

  return (
    <DashboardShell role="talent">
      <Link href="/talent/academy" className="text-[13px] text-muted hover:text-ink flex items-center gap-1 mb-4"><ArrowLeft size={14} /> Academy</Link>

      <div className="relative rounded-2xl overflow-hidden mb-5 h-44 md:h-52">
        <img src={course.image_url || courseImage(slug)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/80 font-semibold mb-1.5">WHC Academy · {course.category}</p>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">{course.title}</h1>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">{courseMeta(String(slug)).level}</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">{courseMeta(String(slug)).cpdHours} CPD hour{courseMeta(String(slug)).cpdHours === 1 ? '' : 's'}</span>
        {courseMeta(String(slug)).skills.map(skill => <span key={skill} className="rounded-full bg-[#f1f1f1] px-2.5 py-1 text-[10px] font-medium text-[#1c1c1c]">{skill}</span>)}
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[12px] text-secondary shrink-0">{completedAt ? 'Complete - certified' : `${done}/${total} modules · assessment ${allLessonsDone ? 'unlocked' : 'locked'}`}</p>
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
        <aside className="bg-white border border-border rounded-xl p-3 lg:sticky lg:top-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold px-3 pt-1 pb-2">Syllabus</p>
          <div className="space-y-0.5">
            {navItem('Course overview', view === 'overview', false, () => { setView('overview') })}
            {course.lessons.map((l, i) => navItem(`${i + 1}. ${l.title}`, view === i, Boolean(progress[i]), () => { setView(i); setResult(null) }))}
            {navItem('Final assessment', view === 'quiz', Boolean(completedAt), () => { if (allLessonsDone) { setView('quiz'); setResult(null); setAnswers({}) } }, allLessonsDone ? `${course.quiz.length} questions · ${PASS_MARK}% to pass` : 'Complete all modules to unlock')}
          </div>
        </aside>

        <div className="min-w-0">
          {view === 'overview' && (<>
            <div className="dashboard-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-2 inline-flex items-center gap-1.5"><BookOpen size={13} /> Course overview</p>
              <h2 className="font-serif text-[22px] font-bold text-ink mb-3">{course.title}</h2>
              {rich ? (
                <>
                  <p className="text-[14px] text-gray-700 leading-[1.8] mb-5">{rich.aims || course.tagline}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-secondary font-semibold mb-1.5 inline-flex items-center gap-1.5"><Users size={12} /> Who this course is for</p>
                      <p className="text-[13px] text-gray-700 leading-[1.7]">{rich.audience || 'Spa and wellness professionals working to a luxury standard.'}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-secondary font-semibold mb-1.5 inline-flex items-center gap-1.5"><FileText size={12} /> Assessment</p>
                      <p className="text-[13px] text-gray-700 leading-[1.7]">{course.quiz.length}-question assessment. {PASS_MARK}% required to pass. Unlimited retakes. Passing issues your certificate with a unique verification code and places the badge on your professional profile.</p>
                    </div>
                  </div>
                  {rich.outcomes.length > 0 && (<>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-secondary font-semibold mb-2 inline-flex items-center gap-1.5"><GraduationCap size={12} /> On completion you will be able to</p>
                    <ul className="space-y-1.5 mb-6">
                      {rich.outcomes.map((o, i) => (
                        <li key={i} className="text-[13px] text-gray-700 flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" />{o}</li>
                      ))}
                    </ul>
                  </>)}
                </>
              ) : (
                <>
                  <p className="text-[14px] text-gray-700 leading-[1.8] mb-5">{course.tagline}. This programme is designed to be used as a working management course rather than a reading exercise.</p>
                  <div className="grid gap-3 md:grid-cols-3 mb-6">
                    <div className="rounded-xl bg-surface p-4"><Target size={15} className="mb-2 text-[#1c1c1c]" /><p className="text-[11px] font-semibold text-ink">Understand the reason</p><p className="mt-1 text-[11px] leading-5 text-gray-600">Each module connects the topic to guest experience, people, profit or operational risk.</p></div>
                    <div className="rounded-xl bg-surface p-4"><Lightbulb size={15} className="mb-2 text-[#1c1c1c]" /><p className="text-[11px] font-semibold text-ink">Make the judgement</p><p className="mt-1 text-[11px] leading-5 text-gray-600">Consider trade-offs, unintended consequences and the numbers behind the decision.</p></div>
                    <div className="rounded-xl bg-surface p-4"><FileText size={15} className="mb-2 text-[#1c1c1c]" /><p className="text-[11px] font-semibold text-ink">Apply the learning</p><p className="mt-1 text-[11px] leading-5 text-gray-600">Use the management labs and final assessment to turn theory into a plan you could use at work.</p></div>
                  </div>
                </>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setView(course.lessons.findIndex((_, i) => !progress[i]) === -1 ? 0 : course.lessons.findIndex((_, i) => !progress[i]))}
                  className="btn-primary text-[13px] inline-flex items-center gap-2">
                  {done === 0 ? 'Begin Module 1' : allLessonsDone ? 'Review the modules' : `Continue - Module ${course.lessons.findIndex((_, i) => !progress[i]) + 1}`} <ArrowRight size={14} />
                </button>
                {rich && <a href={`/api/academy/manual?course=${encodeURIComponent(String(slug))}`} className="btn-secondary text-[13px] inline-flex items-center gap-1.5"><BookOpen size={14} /> Course Manual (PDF)</a>}
              </div>
            </div>

            {uploads.length > 0 && (
              <div className="dashboard-card mt-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5 inline-flex items-center gap-1.5"><Download size={13} /> Resources &amp; tools</p>
                <p className="text-[13px] text-gray-600 mb-4">Working files for this course - download them and use them with your own figures. Everything here also lives permanently in <Link href="/talent/toolkit" className="underline">My Toolkit</Link>.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {uploads.map(upload => (
                    <div key={upload.id} className="flex flex-col rounded-xl border border-border p-4">
                      <p className="text-[13px] font-semibold text-ink">{upload.title}</p>
                      {upload.description && <p className="mt-0.5 mb-2 text-[11.5px] leading-5 text-muted">{upload.description}</p>}
                      <a href={`/api/academy/uploads?course=${encodeURIComponent(String(slug))}&id=${encodeURIComponent(upload.id)}`} className="btn-secondary mt-auto inline-flex w-fit items-center gap-1.5 text-[12px]"><Download size={12} /> Download{upload.file_name ? ` (${String(upload.file_name).split('.').pop()?.toUpperCase()})` : ''}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>)}

          {typeof view === 'number' && (() => {
            const i = view
            const lesson = course.lessons[i]
            const richLesson = rich?.lessons[i]
            const extra = lessonExtras(slug, i)
            return (
              <div className="dashboard-card">
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5">Module {i + 1} of {total}</p>
                <h2 className="font-serif text-[22px] font-bold text-ink mb-4">{lesson.title}</h2>

                <div className="relative mb-6 h-48 overflow-hidden rounded-2xl md:h-56">
                  <img src={MODULE_VISUALS[i % MODULE_VISUALS.length]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c]/80 via-[#1c1c1c]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#dddddd]">Think like a spa professional</p>
                    <p className="mt-1 max-w-2xl text-[13px] leading-5 text-white/90">Connect the principle to what a guest, therapist, manager or owner would actually experience.</p>
                  </div>
                </div>

                <LearningFramework title={lesson.title} />

                {richLesson?.whyThisMatters && (
                  <div className="bg-[#1c1c1c] rounded-xl p-4 mb-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#dddddd] font-semibold mb-1.5">Why this matters</p>
                    <p className="text-[13.5px] text-white/90 leading-[1.75]">{richLesson.whyThisMatters}</p>
                  </div>
                )}

                {richLesson && richLesson.objectives.length > 0 && (
                  <div className="border-l-2 border-accent bg-surface rounded-r-xl p-4 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-secondary font-semibold mb-2 inline-flex items-center gap-1.5"><Target size={12} /> Learning objectives</p>
                    <ul className="space-y-1">
                      {richLesson.objectives.map((o, oi) => (
                        <li key={oi} className="text-[13px] text-gray-700 flex items-start gap-2"><span className="text-accent mt-0.5">•</span>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {richLesson && richLesson.sections.length > 0 ? (
                  <div className="space-y-5 mb-6">
                    {richLesson.sections.map((s, si) => (
                      <section key={si} className="rounded-xl border border-[#dddddd] bg-white p-5">
                        <h3 className="font-serif text-[16px] font-semibold text-ink mb-2">{s.heading}</h3>
                        <p className="text-[14px] text-gray-700 leading-[1.85] whitespace-pre-line">{s.body}</p>
                      </section>
                    ))}
                  </div>
                ) : (
                  <ManagedLessonContent content={lesson.content} />
                )}

                {richLesson?.visuals && richLesson.visuals.length > 0 && (
                  <div className="mb-6">{richLesson.visuals.map((visual, vi) => <LessonVisualBlock key={vi} visual={visual} />)}</div>
                )}

                {richLesson?.scenario && (
                  <div className="rounded-xl border border-[#dddddd] bg-[#f1f1f1] p-5 mb-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#1c1c1c] font-semibold mb-1.5">Scenario - think it through</p>
                    <p className="text-[13px] text-gray-700 leading-[1.8] whitespace-pre-line">{richLesson.scenario}</p>
                  </div>
                )}

                {richLesson?.activity && (
                  <div className="rounded-xl border border-[#dddddd] bg-[#f1f1f1] p-5 mb-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#2e5b45] font-semibold mb-1.5">Practical activity - do this</p>
                    <p className="text-[13px] text-gray-700 leading-[1.8] whitespace-pre-line">{richLesson.activity}</p>
                  </div>
                )}

                {richLesson?.knowledgeCheck && richLesson.knowledgeCheck.length > 0 && <KnowledgeCheckBlock checks={richLesson.knowledgeCheck} />}

                {richLesson && richLesson.keyTerms.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-secondary font-semibold mb-2">Key terms</p>
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

                {richLesson?.caseStudy?.scenario && (
                  <div className="bg-ink rounded-xl p-5 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-2">Case study · {richLesson.caseStudy.title}</p>
                    <p className="text-[13px] text-white/85 leading-[1.8] mb-3">{richLesson.caseStudy.scenario}</p>
                    <p className="text-[12px] text-white/60 uppercase tracking-wide font-semibold mb-1">The professional response</p>
                    <p className="text-[13px] text-white/85 leading-[1.8]">{richLesson.caseStudy.insight}</p>
                  </div>
                )}

                {richLesson?.nextStep && (
                  <div className="rounded-xl border border-border bg-white p-4 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-secondary font-semibold mb-1.5">Your next step at work</p>
                    <p className="text-[13px] text-gray-700 leading-[1.7]">{richLesson.nextStep}</p>
                  </div>
                )}

                {extra && (
                  <div className="space-y-3 mb-6">
                    <div className="bg-[#f1f1f1] border border-accent/20 rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent mb-1.5 inline-flex items-center gap-1.5"><Quote size={12} /> Through the guest&apos;s eyes</p>
                      <p className="text-[13px] text-gray-700 italic leading-[1.7]">{extra.guestView}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary mb-1.5 inline-flex items-center gap-1.5"><TrendingUp size={12} /> Why this matters for your career</p>
                      <p className="text-[13px] text-gray-700 leading-[1.7]">{extra.helpsYou}</p>
                    </div>
                    <div className="border border-border rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary mb-2 inline-flex items-center gap-1.5"><Lightbulb size={12} className="text-amber-500" /> Things to consider</p>
                      <ul className="space-y-1.5">
                        {extra.tips.map((t, ti) => (
                          <li key={ti} className="text-[13px] text-gray-700 flex items-start gap-2"><Check size={13} className="text-green-600 mt-0.5 shrink-0" />{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {!richLesson && (
                  <div className="mb-6 rounded-2xl border border-[#dddddd] bg-[#f1f1f1] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1c1c1c]">Put this into practice</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#555555]">Use your current or most recent spa as the example. What is happening now? What would you change? What could go wrong? Which number or guest outcome would tell you whether your decision worked? Write one action, one owner and one measure before moving on.</p>
                  </div>
                )}

                {richLesson?.summary && (
                  <div className="border border-accent/30 bg-accent/5 rounded-xl p-4 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-accent font-semibold mb-1.5">Module summary</p>
                    <p className="text-[13px] text-gray-700 leading-[1.7]">{richLesson.summary}</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                  <button type="button" onClick={() => setView(i === 0 ? 'overview' : i - 1)} className="btn-secondary text-[12px] inline-flex items-center gap-1.5"><ArrowLeft size={13} /> {i === 0 ? 'Overview' : `Module ${i}`}</button>
                  <button
                    type="button"
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
                    <p className="text-[13px] text-secondary mb-6">{result.correct} of {result.total} correct. Your certificate is ready and the badge is live on your profile.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Link href={`/talent/academy/certificate/${slug}`} className="btn-primary text-[13px]">View certificate</Link>
                      <Link href="/talent/academy" className="btn-secondary text-[13px]">Back to Academy</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <RotateCcw size={36} className="mx-auto text-amber-500 mb-3" />
                    <p className="font-serif text-xl font-bold text-ink mb-1">{result.score}% - not quite</p>
                    <p className="text-[13px] text-secondary mb-6">{result.correct} of {result.total} correct; you need {PASS_MARK}%. Revisit the modules and try again - there is no limit on retakes.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button type="button" onClick={() => { setResult(null); setAnswers({}) }} className="btn-primary text-[13px]">Retake now</button>
                      <button type="button" onClick={() => setView(0)} className="btn-secondary text-[13px]">Back to Module 1</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="dashboard-card">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5">Final assessment</p>
                  <h2 className="font-serif text-[20px] font-bold text-ink mb-1">{course.title}</h2>
                  <p className="text-[12px] text-secondary">{course.quiz.length} questions · {PASS_MARK}% to pass · unlimited retakes · marked instantly</p>
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
                  <button type="button" onClick={submitQuiz} disabled={busy} className="btn-primary text-[13px] disabled:opacity-50">{busy ? 'Marking...' : 'Submit for marking'}</button>
                  <button type="button" onClick={() => setView(total - 1)} className="btn-secondary text-[13px]">Back to the modules</button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
