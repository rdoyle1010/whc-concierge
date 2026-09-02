'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import {
  AlertTriangle, ArrowLeft, ArrowUp, ArrowDown, BookOpen, Check, ExternalLink,
  Eye, FileText, Lock, Plus, Save, Trash2, Undo2,
} from 'lucide-react'
import {
  CONTENT_CATEGORIES,
  LESSON_BODY_HELP,
  contentStats,
  describeVisual,
  emptyLesson,
  emptyModule,
  emptyQuestion,
  normaliseContent,
  validateContent,
  type AcademyContentDoc,
  type ContentModule,
} from '@/lib/academy-course-content'

type Detail = {
  course: { slug: string; title: string; category: string; minutes: number; tagline: string; image_url?: string; code_defined: boolean; is_active: boolean }
  content: AcademyContentDoc | null
  content_source: 'platform' | 'custom'
  content_error: string | null
  platform_stats: { modules: number; lessons: number; words: number; questions: number; minutes: number }
}

const move = <T,>(items: T[], from: number, to: number) => {
  if (to < 0 || to >= items.length) return items
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] text-[#57534e]">
      <span className="font-medium text-[#1c1b1a]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-5 text-[#6e6a66]">{hint}</span> : null}
    </label>
  )
}

function StringList({ label, hint, placeholder, values, onChange }: {
  label: string; hint?: string; placeholder: string; values: string[]; onChange: (next: string[]) => void
}) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#1c1b1a]">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-5 text-[#6e6a66]">{hint}</p> : null}
      <div className="mt-2 space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input value={value} placeholder={placeholder} className="input-field" onChange={event => onChange(values.map((item, i) => (i === index ? event.target.value : item)))} />
            <button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))} className="border border-[#e0dad2] bg-white p-2 text-[#6e6a66] hover:text-red-600" aria-label={`Remove ${label} ${index + 1}`}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...values, ''])} className="btn-secondary mt-2 inline-flex items-center gap-1 text-[12px]"><Plus size={12} /> Add</button>
    </div>
  )
}

export default function AcademyCourseEditorPage() {
  const params = useParams()
  const router = useRouter()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : String(params?.slug || '')

  const [detail, setDetail] = useState<Detail | null>(null)
  const [doc, setDoc] = useState<AcademyContentDoc | null>(null)
  const [source, setSource] = useState<'platform' | 'custom'>('platform')
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [openModule, setOpenModule] = useState<number | null>(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/academy?slug=${encodeURIComponent(slug)}`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not load this course.')
      setDetail(json)
      setDoc(json.content ? normaliseContent(json.content) : null)
      setSource(json.content_source === 'custom' ? 'custom' : 'platform')
      setDirty(false)
    } catch (caught: any) {
      setError(caught.message || 'Could not load this course.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  // Nothing autosaves. Warn before a reload, a closed tab or a click on any
  // other link in the admin throws away unsaved writing.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const guardLinks = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      const link = (event.target as HTMLElement | null)?.closest?.('a')
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (!href.startsWith('/') || link.target === '_blank') return
      if (!window.confirm('You have unsaved changes to this course. Leave without saving?')) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', guardLinks, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', guardLinks, true)
    }
  }, [dirty])

  const update = useCallback((mutate: (current: AcademyContentDoc) => AcademyContentDoc) => {
    setDoc(current => (current ? mutate(current) : current))
    setDirty(true)
    setNotice('')
  }, [])

  const updateModule = useCallback((index: number, mutate: (module: ContentModule) => ContentModule) => {
    update(current => ({ ...current, modules: current.modules.map((module, i) => (i === index ? mutate(module) : module)) }))
  }, [update])

  const stats = useMemo(() => (doc ? contentStats(doc) : null), [doc])
  const problem = useMemo(() => (doc ? validateContent(doc) : null), [doc])

  async function act(payload: Record<string, any>, busyKey: string, doneMessage: string) {
    setError(''); setNotice(''); setBusy(busyKey)
    try {
      const response = await fetch('/api/admin/academy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, ...payload }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not save the change.')
      await load()
      setNotice(doneMessage)
      return json
    } catch (caught: any) {
      setError(caught.message)
      return null
    } finally {
      setBusy('')
    }
  }

  function leave() {
    if (dirty && !window.confirm('You have unsaved changes to this course. Leave without saving?')) return
    router.push('/admin/academy')
  }

  async function save() {
    if (!doc) return
    if (problem) { setError(problem); return }
    const live = source === 'custom'
    const confirmation = live
      ? 'Save and publish this course? Everyone studying it - on the Talent Academy, the public Academy page and the app - sees your version straight away.'
      : 'Save your version? It is stored but stays out of sight until you publish it, so learners keep seeing the platform version for now.'
    if (!window.confirm(confirmation)) return
    await act({ action: 'save_content', content: doc, publish: live }, 'save', live ? 'Saved and live. Talent, the public Academy and the app now show your version.' : 'Saved. Your version is stored but not live yet - publish it when you are ready.')
  }

  if (loading) {
    return <DashboardShell role="admin" userName="Admin"><div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin border-2 border-[#1c1b1a] border-t-transparent" /></div></DashboardShell>
  }

  if (!detail) {
    return (
      <DashboardShell role="admin" userName="Admin">
        <button type="button" onClick={leave} className="mb-4 inline-flex items-center gap-1 text-[13px] text-[#6e6a66] hover:text-[#1c1b1a]"><ArrowLeft size={14} /> Academy</button>
        <div className="dashboard-card"><p className="text-[13px] text-red-600">{error || 'Course not found.'}</p></div>
      </DashboardShell>
    )
  }

  const course = detail.course

  return (
    <DashboardShell role="admin" userName="Admin">
      <button type="button" onClick={leave} className="mb-4 inline-flex items-center gap-1 text-[13px] text-[#6e6a66] hover:text-[#1c1b1a]"><ArrowLeft size={14} /> Academy</button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="dashboard-eyebrow">Course content</p>
          <h1 className="text-[26px] font-semibold leading-tight text-[#1c1b1a]">{doc?.title || course.title}</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#57534e]">{course.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/talent/academy/${course.slug}`} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2 text-[13px]"><Eye size={14} /> Preview as a learner <ExternalLink size={12} /></a>
        </div>
      </div>

      {notice && <div className="mb-4 border border-[#e0dad2] bg-[#f3f0eb] px-4 py-3 text-[13px] text-[#1c1b1a]">{notice}</div>}
      {error && <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}
      {detail.content_error && (
        <div className="mb-4 flex items-start gap-2 border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>Learners are seeing the platform version of this course, because your version is not complete: {detail.content_error}</span>
        </div>
      )}

      {/* Nothing has been taken over yet: offer the copy, explicitly. */}
      {!doc && (
        <div className="dashboard-card">
          <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6a66]"><Lock size={12} /> Platform version</div>
          <h2 className="text-[18px] font-semibold text-[#1c1b1a]">Take editorial control of this course</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#57534e]">
            This course is currently the WHC platform version, and it improves with every release. When you take editorial control, the whole of the current course is copied into your own editable version first - every module, every lesson, the key terms, the knowledge checks and the assessment with its answers. You then edit a complete copy. You never start from an empty page, and you can go back to the platform version at any time without losing your writing.
          </p>
          <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Modules', detail.platform_stats.modules], ['Lessons', detail.platform_stats.lessons], ['Words', detail.platform_stats.words.toLocaleString('en-GB')], ['Assessment questions', detail.platform_stats.questions]].map(([label, value]) => (
              <div key={String(label)} className="border border-[#e0dad2] bg-[#f3f0eb] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6a66]">{label}</p>
                <p className="mt-1 text-[18px] font-semibold text-[#1c1b1a]">{value}</p>
              </div>
            ))}
          </div>
          <button type="button" disabled={busy === 'take'} onClick={() => act({ action: 'take_content_control' }, 'take', 'Copied. This is now your version of the course - edit anything you like, then save.')} className="btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
            <BookOpen size={14} /> {busy === 'take' ? 'Copying the course...' : 'Take editorial control of this course'}
          </button>
        </div>
      )}

      {doc && (
        <>
          {/* The working bar: state, live counts, the problem to fix, and Save. */}
          <div className="mb-5 border border-[#e0dad2] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${source === 'custom' ? 'bg-[#1c1b1a] text-white' : 'bg-[#f3f0eb] text-[#57534e]'}`}>{source === 'custom' ? 'Your version is live' : 'Your version is saved, not live'}</span>
                {dirty && <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Unsaved changes</span>}
                {stats && <span className="text-[11px] text-[#57534e]">{stats.modules} module{stats.modules === 1 ? '' : 's'} · {stats.lessons} lesson{stats.lessons === 1 ? '' : 's'} · {stats.words.toLocaleString('en-GB')} words · {stats.minutes} min · {stats.questions} assessment question{stats.questions === 1 ? '' : 's'}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={save} disabled={busy === 'save' || Boolean(problem)} className="btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"><Save size={14} /> {busy === 'save' ? 'Saving...' : source === 'custom' ? 'Save and publish' : 'Save your version'}</button>
                {source === 'custom' ? (
                  <button type="button" disabled={busy === 'revert'} onClick={() => { if (window.confirm('Put the WHC platform version back in front of learners? Your own version stays saved here, so you can publish it again whenever you like.')) act({ action: 'revert_content' }, 'revert', 'Reverted. Learners see the platform version again, and your version is still saved here.') }} className="btn-secondary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"><Undo2 size={14} /> Revert to the platform version</button>
                ) : (
                  <button type="button" disabled={busy === 'publish' || Boolean(problem)} onClick={() => { if (window.confirm('Publish your version? Everyone studying this course sees it straight away.')) act({ action: 'publish_content' }, 'publish', 'Published. Talent, the public Academy and the app now show your version.') }} className="btn-secondary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"><Check size={14} /> Publish your version</button>
                )}
              </div>
            </div>
            {problem ? (
              <p className="mt-3 flex items-start gap-2 border-t border-[#e0dad2] pt-3 text-[12px] text-red-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {problem}</p>
            ) : (
              <p className="mt-3 border-t border-[#e0dad2] pt-3 text-[12px] text-[#6e6a66]">Nothing saves on its own. Your writing is only stored when you press Save.</p>
            )}
          </div>

          {/* 1. The course itself */}
          <div className="dashboard-card mb-5">
            <h2 className="mb-1 text-[16px] font-semibold text-[#1c1b1a]">The course</h2>
            <p className="mb-4 text-[12px] text-[#6e6a66]">What a learner reads before they begin, and what appears on every Academy card.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Course name"><input value={doc.title} onChange={event => update(current => ({ ...current, title: event.target.value }))} className="input-field mt-1" /></Field>
              <Field label="Category">
                <select value={doc.category} onChange={event => update(current => ({ ...current, category: event.target.value }))} className="input-field mt-1">
                  {CONTENT_CATEGORIES.map(category => <option key={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="Summary line" hint="The one line under the course name on every Academy card."><input value={doc.tagline} maxLength={300} onChange={event => update(current => ({ ...current, tagline: event.target.value }))} className="input-field mt-1" /></Field>
              <Field label="Duration in minutes" hint="Leave module timings blank and this figure is used for the whole course."><input type="number" min={0} max={600} value={doc.minutes || ''} onChange={event => update(current => ({ ...current, minutes: Math.max(0, Math.round(Number(event.target.value) || 0)) }))} className="input-field mt-1" /></Field>
              <Field label="What this course sets out to do" hint="One paragraph, shown at the top of the course overview."><textarea rows={4} value={doc.aims} onChange={event => update(current => ({ ...current, aims: event.target.value }))} className="input-field mt-1 resize-y" /></Field>
              <Field label="Who this course is for"><textarea rows={4} value={doc.audience} onChange={event => update(current => ({ ...current, audience: event.target.value }))} className="input-field mt-1 resize-y" /></Field>
            </div>
            <div className="mt-4 border-t border-[#e0dad2] pt-4">
              <StringList label="On completion you will be able to" hint="Course-level outcomes. These appear as a ticked list on the overview, so write them the way a CV would." placeholder="Run a consultation that surfaces the real treatment brief" values={doc.outcomes} onChange={outcomes => update(current => ({ ...current, outcomes }))} />
            </div>
          </div>

          {/* 2. Modules and their lessons */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1c1b1a]">Modules and lessons</h2>
              <p className="text-[12px] text-[#6e6a66]">A module is one step of the syllabus. Each module holds one or more lessons - the written content the learner reads. Adding, deleting or reordering modules changes what part-way learners still have to complete, so make those changes deliberately.</p>
            </div>
            <button type="button" onClick={() => { update(current => ({ ...current, modules: [...current.modules, emptyModule()] })); setOpenModule(doc.modules.length) }} className="btn-secondary inline-flex items-center gap-1 text-[12px]"><Plus size={12} /> Add module</button>
          </div>

          <div className="mb-8 space-y-3">
            {doc.modules.map((module, index) => {
              const open = openModule === index
              return (
                <div key={index} className="border border-[#e0dad2] bg-white">
                  <div className="flex flex-wrap items-center gap-2 p-4">
                    <button type="button" onClick={() => setOpenModule(open ? null : index)} className="min-w-0 flex-1 text-left">
                      <p className="text-[13px] font-semibold text-[#1c1b1a]">Module {index + 1}. {module.title || <span className="text-red-600">Untitled module</span>}</p>
                      <p className="mt-0.5 text-[11px] text-[#6e6a66]">{module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'} · {module.knowledgeCheck.length} knowledge check{module.knowledgeCheck.length === 1 ? '' : 's'} · {module.keyTerms.length} key term{module.keyTerms.length === 1 ? '' : 's'}</p>
                    </button>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={index === 0} onClick={() => { update(current => ({ ...current, modules: move(current.modules, index, index - 1) })); setOpenModule(index - 1) }} className="border border-[#e0dad2] p-2 text-[#57534e] disabled:opacity-30" aria-label="Move module up"><ArrowUp size={13} /></button>
                      <button type="button" disabled={index === doc.modules.length - 1} onClick={() => { update(current => ({ ...current, modules: move(current.modules, index, index + 1) })); setOpenModule(index + 1) }} className="border border-[#e0dad2] p-2 text-[#57534e] disabled:opacity-30" aria-label="Move module down"><ArrowDown size={13} /></button>
                      <button type="button" onClick={() => { if (window.confirm(`Delete module ${index + 1}${module.title ? ` "${module.title}"` : ''} and every lesson in it? This is not saved until you press Save.`)) { update(current => ({ ...current, modules: current.modules.filter((_, i) => i !== index) })); setOpenModule(null) } }} className="border border-[#e0dad2] p-2 text-[#6e6a66] hover:text-red-600" aria-label="Delete module"><Trash2 size={13} /></button>
                      <button type="button" onClick={() => setOpenModule(open ? null : index)} className="btn-secondary text-[11px]">{open ? 'Close' : 'Open'}</button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-[#e0dad2] bg-[#f3f0eb] p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Module title"><input value={module.title} onChange={event => updateModule(index, current => ({ ...current, title: event.target.value }))} className="input-field mt-1" /></Field>
                        <Field label="Module minutes" hint="Optional. Fill these in for every module and the course duration adds up from them."><input type="number" min={0} max={600} value={module.minutes ?? ''} onChange={event => updateModule(index, current => ({ ...current, minutes: event.target.value === '' ? null : Math.max(0, Math.round(Number(event.target.value) || 0)) }))} className="input-field mt-1" /></Field>
                        <Field label="Why this matters" hint="Shown in the charcoal panel at the top of the module."><textarea rows={3} value={module.whyThisMatters} onChange={event => updateModule(index, current => ({ ...current, whyThisMatters: event.target.value }))} className="input-field mt-1 resize-y" /></Field>
                        <div><StringList label="Learning objectives" hint="By the end of this module the learner will be able to..." placeholder="Explain why the consultation sets the whole treatment" values={module.objectives} onChange={objectives => updateModule(index, current => ({ ...current, objectives }))} /></div>
                      </div>

                      {/* Lessons */}
                      <div className="mt-5 border-t border-[#e0dad2] pt-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-semibold text-[#1c1b1a]">Lessons in this module</p>
                            <p className="text-[11px] leading-5 text-[#6e6a66]">{LESSON_BODY_HELP}</p>
                          </div>
                          <button type="button" onClick={() => updateModule(index, current => ({ ...current, lessons: [...current.lessons, emptyLesson()] }))} className="btn-secondary inline-flex items-center gap-1 text-[12px]"><Plus size={12} /> Add lesson</button>
                        </div>
                        <div className="space-y-3">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="border border-[#e0dad2] bg-white p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-[#6e6a66]">Lesson {lessonIndex + 1}</span>
                                <input value={lesson.title} placeholder="Lesson title" className="input-field flex-1" onChange={event => updateModule(index, current => ({ ...current, lessons: current.lessons.map((item, i) => (i === lessonIndex ? { ...item, title: event.target.value } : item)) }))} />
                                <button type="button" disabled={lessonIndex === 0} onClick={() => updateModule(index, current => ({ ...current, lessons: move(current.lessons, lessonIndex, lessonIndex - 1) }))} className="border border-[#e0dad2] p-2 text-[#57534e] disabled:opacity-30" aria-label="Move lesson up"><ArrowUp size={13} /></button>
                                <button type="button" disabled={lessonIndex === module.lessons.length - 1} onClick={() => updateModule(index, current => ({ ...current, lessons: move(current.lessons, lessonIndex, lessonIndex + 1) }))} className="border border-[#e0dad2] p-2 text-[#57534e] disabled:opacity-30" aria-label="Move lesson down"><ArrowDown size={13} /></button>
                                <button type="button" onClick={() => { if (window.confirm(`Delete lesson ${lessonIndex + 1}${lesson.title ? ` "${lesson.title}"` : ''}?`)) updateModule(index, current => ({ ...current, lessons: current.lessons.filter((_, i) => i !== lessonIndex) })) }} className="border border-[#e0dad2] p-2 text-[#6e6a66] hover:text-red-600" aria-label="Delete lesson"><Trash2 size={13} /></button>
                              </div>
                              <textarea rows={12} value={lesson.body} placeholder="The written content of this lesson." className="input-field resize-y font-normal leading-6" onChange={event => updateModule(index, current => ({ ...current, lessons: current.lessons.map((item, i) => (i === lessonIndex ? { ...item, body: event.target.value } : item)) }))} />
                              <p className="mt-1 text-[11px] text-[#6e6a66]">{lesson.body.trim() ? `${lesson.body.trim().split(/\s+/).length.toLocaleString('en-GB')} words` : 'No content yet - this lesson cannot go live empty.'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Diagrams carried over from the platform version */}
                      {module.visuals.length > 0 && (
                        <div className="mt-5 border-t border-[#e0dad2] pt-4">
                          <p className="text-[13px] font-semibold text-[#1c1b1a]">Diagrams and tables in this module</p>
                          <p className="mt-0.5 text-[11px] leading-5 text-[#6e6a66]">These come from the WHC version of the course and are kept exactly as they are, so nothing is lost when you take control. They cannot be rewritten here yet - you can remove one if it no longer fits what you have written.</p>
                          <div className="mt-2 space-y-2">
                            {module.visuals.map((visual, visualIndex) => (
                              <div key={visualIndex} className="flex items-center gap-2 border border-[#e0dad2] bg-white p-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[12px] font-medium text-[#1c1b1a]">{visual.title || 'Untitled'}</p>
                                  <p className="text-[11px] text-[#6e6a66]">{describeVisual(visual)}</p>
                                </div>
                                <button type="button" onClick={() => { if (window.confirm(`Remove "${visual.title || 'this diagram'}" from module ${index + 1}?`)) updateModule(index, current => ({ ...current, visuals: current.visuals.filter((_, i) => i !== visualIndex) })) }} className="border border-[#e0dad2] p-2 text-[#6e6a66] hover:text-red-600" aria-label="Remove diagram"><Trash2 size={13} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key terms */}
                      <div className="mt-5 border-t border-[#e0dad2] pt-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div><p className="text-[13px] font-semibold text-[#1c1b1a]">Key terms</p><p className="text-[11px] text-[#6e6a66]">The glossary shown under the module content.</p></div>
                          <button type="button" onClick={() => updateModule(index, current => ({ ...current, keyTerms: [...current.keyTerms, { term: '', definition: '' }] }))} className="btn-secondary inline-flex items-center gap-1 text-[12px]"><Plus size={12} /> Add key term</button>
                        </div>
                        <div className="space-y-2">
                          {module.keyTerms.map((term, termIndex) => (
                            <div key={termIndex} className="grid grid-cols-1 gap-2 border border-[#e0dad2] bg-white p-3 md:grid-cols-[220px_1fr_auto]">
                              <input value={term.term} placeholder="Term" className="input-field" onChange={event => updateModule(index, current => ({ ...current, keyTerms: current.keyTerms.map((item, i) => (i === termIndex ? { ...item, term: event.target.value } : item)) }))} />
                              <input value={term.definition} placeholder="What it means" className="input-field" onChange={event => updateModule(index, current => ({ ...current, keyTerms: current.keyTerms.map((item, i) => (i === termIndex ? { ...item, definition: event.target.value } : item)) }))} />
                              <button type="button" onClick={() => updateModule(index, current => ({ ...current, keyTerms: current.keyTerms.filter((_, i) => i !== termIndex) }))} className="border border-[#e0dad2] p-2 text-[#6e6a66] hover:text-red-600" aria-label="Delete key term"><Trash2 size={13} /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Knowledge checks */}
                      <div className="mt-5 border-t border-[#e0dad2] pt-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div><p className="text-[13px] font-semibold text-[#1c1b1a]">Knowledge checks</p><p className="text-[11px] text-[#6e6a66]">Practice questions inside the module. The learner sees the answer and your explanation after choosing, so these are not the final assessment.</p></div>
                          <button type="button" onClick={() => updateModule(index, current => ({ ...current, knowledgeCheck: [...current.knowledgeCheck, { q: '', options: ['', '', '', ''], answer: 0, why: '' }] }))} className="btn-secondary inline-flex items-center gap-1 text-[12px]"><Plus size={12} /> Add knowledge check</button>
                        </div>
                        <div className="space-y-3">
                          {module.knowledgeCheck.map((check, checkIndex) => (
                            <div key={checkIndex} className="border border-[#e0dad2] bg-white p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="shrink-0 text-[11px] font-semibold text-[#6e6a66]">Q{checkIndex + 1}</span>
                                <input value={check.q} placeholder="Question" className="input-field flex-1" onChange={event => updateModule(index, current => ({ ...current, knowledgeCheck: current.knowledgeCheck.map((item, i) => (i === checkIndex ? { ...item, q: event.target.value } : item)) }))} />
                                <button type="button" onClick={() => updateModule(index, current => ({ ...current, knowledgeCheck: current.knowledgeCheck.filter((_, i) => i !== checkIndex) }))} className="border border-[#e0dad2] p-2 text-[#6e6a66] hover:text-red-600" aria-label="Delete knowledge check"><Trash2 size={13} /></button>
                              </div>
                              <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                                {check.options.map((option, optionIndex) => (
                                  <input key={optionIndex} value={option} placeholder={`Answer ${optionIndex + 1}`} className="input-field" onChange={event => updateModule(index, current => ({ ...current, knowledgeCheck: current.knowledgeCheck.map((item, i) => (i === checkIndex ? { ...item, options: item.options.map((o, oi) => (oi === optionIndex ? event.target.value : o)) } : item)) }))} />
                                ))}
                              </div>
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-[200px_1fr]">
                                <Field label="Correct answer">
                                  <select value={check.answer} className="input-field mt-1" onChange={event => updateModule(index, current => ({ ...current, knowledgeCheck: current.knowledgeCheck.map((item, i) => (i === checkIndex ? { ...item, answer: Number(event.target.value) } : item)) }))}>
                                    {check.options.map((_, optionIndex) => <option key={optionIndex} value={optionIndex}>Answer {optionIndex + 1}</option>)}
                                  </select>
                                </Field>
                                <Field label="Why that is the answer"><input value={check.why} className="input-field mt-1" onChange={event => updateModule(index, current => ({ ...current, knowledgeCheck: current.knowledgeCheck.map((item, i) => (i === checkIndex ? { ...item, why: event.target.value } : item)) }))} /></Field>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* The rest of the module shape */}
                      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[#e0dad2] pt-4 md:grid-cols-2">
                        <Field label="Scenario - think it through"><textarea rows={4} value={module.scenario} onChange={event => updateModule(index, current => ({ ...current, scenario: event.target.value }))} className="input-field mt-1 resize-y" /></Field>
                        <Field label="Practical activity - do this"><textarea rows={4} value={module.activity} onChange={event => updateModule(index, current => ({ ...current, activity: event.target.value }))} className="input-field mt-1 resize-y" /></Field>
                        <Field label="Case study title"><input value={module.caseStudy.title} onChange={event => updateModule(index, current => ({ ...current, caseStudy: { ...current.caseStudy, title: event.target.value } }))} className="input-field mt-1" /></Field>
                        <Field label="Case study - what happened"><textarea rows={3} value={module.caseStudy.scenario} onChange={event => updateModule(index, current => ({ ...current, caseStudy: { ...current.caseStudy, scenario: event.target.value } }))} className="input-field mt-1 resize-y" /></Field>
                        <Field label="Case study - the professional response"><textarea rows={3} value={module.caseStudy.insight} onChange={event => updateModule(index, current => ({ ...current, caseStudy: { ...current.caseStudy, insight: event.target.value } }))} className="input-field mt-1 resize-y" /></Field>
                        <Field label="Module summary" hint="The takeaway paragraph at the end of the module."><textarea rows={3} value={module.summary} onChange={event => updateModule(index, current => ({ ...current, summary: event.target.value }))} className="input-field mt-1 resize-y" /></Field>
                        <Field label="Your next step at work"><textarea rows={3} value={module.nextStep} onChange={event => updateModule(index, current => ({ ...current, nextStep: event.target.value }))} className="input-field mt-1 resize-y" /></Field>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 3. The end-of-course assessment */}
          <div className="dashboard-card mb-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-semibold text-[#1c1b1a]">End-of-course assessment</h2>
                <p className="text-[12px] text-[#6e6a66]">Marked on the server, so the answers below never reach a learner&apos;s browser. Passing issues the certificate.</p>
              </div>
              <button type="button" onClick={() => update(current => ({ ...current, assessment: [...current.assessment, emptyQuestion()] }))} className="btn-secondary inline-flex items-center gap-1 text-[12px]"><Plus size={12} /> Add question</button>
            </div>
            <div className="space-y-3">
              {doc.assessment.map((question, index) => (
                <div key={index} className="border border-[#e0dad2] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="shrink-0 text-[11px] font-semibold text-[#6e6a66]">Q{index + 1}</span>
                    <input value={question.q} placeholder="Question" className="input-field flex-1" onChange={event => update(current => ({ ...current, assessment: current.assessment.map((item, i) => (i === index ? { ...item, q: event.target.value } : item)) }))} />
                    <button type="button" disabled={index === 0} onClick={() => update(current => ({ ...current, assessment: move(current.assessment, index, index - 1) }))} className="border border-[#e0dad2] p-2 text-[#57534e] disabled:opacity-30" aria-label="Move question up"><ArrowUp size={13} /></button>
                    <button type="button" disabled={index === doc.assessment.length - 1} onClick={() => update(current => ({ ...current, assessment: move(current.assessment, index, index + 1) }))} className="border border-[#e0dad2] p-2 text-[#57534e] disabled:opacity-30" aria-label="Move question down"><ArrowDown size={13} /></button>
                    <button type="button" onClick={() => { if (window.confirm(`Delete assessment question ${index + 1}?`)) update(current => ({ ...current, assessment: current.assessment.filter((_, i) => i !== index) })) }} className="border border-[#e0dad2] p-2 text-[#6e6a66] hover:text-red-600" aria-label="Delete question"><Trash2 size={13} /></button>
                  </div>
                  <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <input key={optionIndex} value={option} placeholder={`Answer ${optionIndex + 1}`} className="input-field" onChange={event => update(current => ({ ...current, assessment: current.assessment.map((item, i) => (i === index ? { ...item, options: item.options.map((o, oi) => (oi === optionIndex ? event.target.value : o)) } : item)) }))} />
                    ))}
                  </div>
                  <Field label="Correct answer">
                    <select value={question.answer} className="input-field mt-1 md:w-56" onChange={event => update(current => ({ ...current, assessment: current.assessment.map((item, i) => (i === index ? { ...item, answer: Number(event.target.value) } : item)) }))}>
                      {question.options.map((_, optionIndex) => <option key={optionIndex} value={optionIndex}>Answer {optionIndex + 1}</option>)}
                    </select>
                  </Field>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10 flex flex-wrap items-center gap-2 border-t border-[#e0dad2] pt-5">
            <button type="button" onClick={save} disabled={busy === 'save' || Boolean(problem)} className="btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"><Save size={14} /> {busy === 'save' ? 'Saving...' : source === 'custom' ? 'Save and publish' : 'Save your version'}</button>
            <a href={`/talent/academy/${course.slug}`} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2 text-[13px]"><FileText size={14} /> Preview as a learner</a>
            <button type="button" onClick={leave} className="btn-secondary text-[13px]">Back to the Academy</button>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
