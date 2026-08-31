'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Award, BookOpen, ChevronDown, ChevronUp, GraduationCap, Image as ImageIcon, Plus, Save, Trash2, Upload, UserPlus, X } from 'lucide-react'

const CATEGORIES = ['Guest Experience', 'Standards', 'Treatments', 'Commercial', 'Brands', 'Specialist Care']

function blankCourse() {
  return {
    slug: '', title: '', tagline: '', category: 'Guest Experience', minutes: 30, price: 1000,
    image_url: '', is_core: false, is_active: true, is_custom: true,
    lessons: [{ title: '', content: '' }],
    quiz: [{ q: '', options: ['', '', '', ''] }],
    answer_key: [0],
  }
}

export default function AdminAcademyPage() {
  const [rows, setRows] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [grantCandidate, setGrantCandidate] = useState('')
  const [grantCourse, setGrantCourse] = useState('')
  const [editing, setEditing] = useState<any | null>(null)
  const [originalSlug, setOriginalSlug] = useState('')
  const [openCourse, setOpenCourse] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/academy')
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not load the Academy.')
      setRows(json.enrollments || [])
      setCourses(json.courses || [])
      setCandidates(json.candidates || [])
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function act(payload: Record<string, any>, busyKey: string, doneMessage: string, closeEditor = false) {
    setError(''); setNotice(''); setBusyId(busyKey)
    try {
      const response = await fetch('/api/admin/academy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not save the change.')
      setNotice(doneMessage)
      if (closeEditor) setEditing(null)
      await load()
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setBusyId(null)
    }
  }

  async function uploadCourseImage(file: File) {
    if (!editing) return
    setUploadingImage(true); setError(''); setNotice('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('bucket', 'site-images')
      const safeSlug = (editing.slug || editing.title || 'course').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
      body.append('path', `academy/${safeSlug}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`)
      const response = await fetch('/api/upload', { method: 'POST', body })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error || 'Course image upload failed.')
      setEditing((course: any) => ({ ...course, image_url: json.url }))
      setNotice('Course image uploaded. Save the course to publish the change.')
    } catch (caught: any) {
      setError(caught.message || 'Course image upload failed.')
    } finally {
      setUploadingImage(false)
    }
  }

  function editCourse(course: any) {
    setOriginalSlug(course.slug)
    setEditing(JSON.parse(JSON.stringify({ ...course, answer_key: course.answer_key || course.quiz.map(() => 0) })))
    setError(''); setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addLesson() {
    setEditing((course: any) => ({ ...course, lessons: [...course.lessons, { title: '', content: '' }] }))
  }

  function updateLesson(index: number, field: string, value: string) {
    setEditing((course: any) => ({ ...course, lessons: course.lessons.map((lesson: any, i: number) => i === index ? { ...lesson, [field]: value } : lesson) }))
  }

  function removeLesson(index: number) {
    setEditing((course: any) => ({ ...course, lessons: course.lessons.filter((_: any, i: number) => i !== index) }))
  }

  function addQuestion() {
    setEditing((course: any) => ({ ...course, quiz: [...course.quiz, { q: '', options: ['', '', '', ''] }], answer_key: [...course.answer_key, 0] }))
  }

  function updateQuestion(index: number, field: string, value: any) {
    setEditing((course: any) => ({ ...course, quiz: course.quiz.map((question: any, i: number) => i === index ? { ...question, [field]: value } : question) }))
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setEditing((course: any) => ({
      ...course,
      quiz: course.quiz.map((question: any, i: number) => i === questionIndex
        ? { ...question, options: question.options.map((option: string, oi: number) => oi === optionIndex ? value : option) }
        : question),
    }))
  }

  function removeQuestion(index: number) {
    setEditing((course: any) => ({ ...course, quiz: course.quiz.filter((_: any, i: number) => i !== index), answer_key: course.answer_key.filter((_: any, i: number) => i !== index) }))
  }

  const totalRevenue = rows.filter(row => row.paid_at).reduce((sum, row) => sum + (row.amount_paid || 0), 0)
  const activeCourses = courses.filter(course => course.is_active)

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="dashboard-eyebrow">Content & revenue</p>
          <div className="flex items-center gap-2 mb-1"><GraduationCap size={22} className="text-accent" /><h1 className="dashboard-title">Academy</h1></div>
          <p className="dashboard-intro max-w-2xl">Add courses, change wording, prices and course imagery, or archive courses without breaking certificates already issued.</p>
        </div>
        <button onClick={() => { setOriginalSlug(''); setEditing(blankCourse()); setError(''); setNotice('') }} className="btn-primary text-[13px] inline-flex items-center gap-2"><Plus size={14} /> Add course</button>
      </div>

      {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {editing && (
        <div className="dashboard-card mb-8 border-gold ring-2 ring-gold/20">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div><h2 className="text-[18px] font-semibold text-ink">{originalSlug ? 'Edit course' : 'Add a course'}</h2><p className="text-[12px] text-gray-500">Quiz answers are stored securely and never sent to learners.</p></div>
            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-ink"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <label className="text-[12px] text-gray-600">Course name<input value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value, slug: originalSlug ? editing.slug : event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} className="input-field mt-1" /></label>
            <label className="text-[12px] text-gray-600">Web address / slug<input value={editing.slug} onChange={event => setEditing({ ...editing, slug: event.target.value })} disabled={Boolean(originalSlug)} className="input-field mt-1 disabled:bg-gray-100" /></label>
            <label className="text-[12px] text-gray-600 md:col-span-2">Short description<input value={editing.tagline} onChange={event => setEditing({ ...editing, tagline: event.target.value })} className="input-field mt-1" /></label>
            <label className="text-[12px] text-gray-600">Category<select value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })} className="input-field mt-1">{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
            <label className="text-[12px] text-gray-600">Duration in minutes<input type="number" min="1" value={editing.minutes} onChange={event => setEditing({ ...editing, minutes: Number(event.target.value) })} className="input-field mt-1" /></label>
            <label className="text-[12px] text-gray-600">Member price (£)<input type="number" min="0" step="0.01" value={(editing.price || 0) / 100} onChange={event => setEditing({ ...editing, price: Math.round(Number(event.target.value) * 100) })} className="input-field mt-1" /></label>
            <label className="md:col-span-2 flex items-center gap-2 text-[12px] text-gray-600"><input type="checkbox" checked={Boolean(editing.is_core)} onChange={event => setEditing({ ...editing, is_core: event.target.checked })} /> Include this course in the Core Curriculum bundle</label>
          </div>

          <div className="border-t border-border pt-5 mb-6">
            <div className="mb-3"><h3 className="text-[15px] font-medium text-ink">Course image</h3><p className="text-[11px] text-gray-500">This image appears on the Academy course card and course page. Upload a landscape image for the best result.</p></div>
            <div className="grid gap-4 md:grid-cols-[260px_1fr] rounded-xl border border-border bg-surface/50 p-4">
              <div className="aspect-[16/10] overflow-hidden rounded-xl border border-border bg-white">
                {editing.image_url ? <img src={editing.image_url} alt={`${editing.title || 'Course'} preview`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-300"><ImageIcon size={34} /></div>}
              </div>
              <div className="flex flex-col justify-center gap-3">
                <p className="text-[12px] leading-5 text-gray-500">Choose a JPEG, PNG or WebP from your computer or phone. You no longer need to paste an image URL.</p>
                <div className="flex flex-wrap gap-2">
                  <label className="btn-secondary w-fit cursor-pointer inline-flex items-center gap-2"><Upload size={14}/>{uploadingImage ? 'Uploading...' : editing.image_url ? 'Replace image' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingImage} onChange={event => { const file = event.target.files?.[0]; if (file) uploadCourseImage(file); event.target.value = '' }} /></label>
                  {editing.image_url ? <button type="button" onClick={() => setEditing({ ...editing, image_url: '' })} className="btn-secondary text-[12px]">Remove image</button> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5 mb-6">
            <div className="flex items-center justify-between mb-3"><div><h3 className="text-[15px] font-medium text-ink">Course modules</h3><p className="text-[11px] text-gray-500">This is the wording learners read.</p></div><button onClick={addLesson} className="btn-secondary text-[12px] inline-flex items-center gap-1"><Plus size={12} /> Add module</button></div>
            <div className="space-y-4">
              {editing.lessons.map((lesson: any, index: number) => (
                <div key={index} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2"><p className="text-[12px] font-semibold text-ink">Module {index + 1}</p><button onClick={() => removeLesson(index)} disabled={editing.lessons.length === 1} className="text-red-500 disabled:opacity-30"><Trash2 size={14} /></button></div>
                  <input value={lesson.title} onChange={event => updateLesson(index, 'title', event.target.value)} placeholder="Module title" className="input-field mb-2" />
                  <textarea value={lesson.content} onChange={event => updateLesson(index, 'content', event.target.value)} placeholder="Teaching content" rows={7} className="input-field resize-y" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-5 mb-6">
            <div className="flex items-center justify-between mb-3"><div><h3 className="text-[15px] font-medium text-ink">Final quiz</h3><p className="text-[11px] text-gray-500">Choose the correct answer under each question.</p></div><button onClick={addQuestion} className="btn-secondary text-[12px] inline-flex items-center gap-1"><Plus size={12} /> Add question</button></div>
            <div className="space-y-4">
              {editing.quiz.map((question: any, index: number) => (
                <div key={index} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2"><p className="text-[12px] font-semibold text-ink">Question {index + 1}</p><button onClick={() => removeQuestion(index)} disabled={editing.quiz.length === 1} className="text-red-500 disabled:opacity-30"><Trash2 size={14} /></button></div>
                  <input value={question.q} onChange={event => updateQuestion(index, 'q', event.target.value)} placeholder="Question" className="input-field mb-3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">{question.options.map((option: string, optionIndex: number) => <input key={optionIndex} value={option} onChange={event => updateOption(index, optionIndex, event.target.value)} placeholder={`Answer ${optionIndex + 1}`} className="input-field" />)}</div>
                  <label className="text-[12px] text-gray-600">Correct answer<select value={editing.answer_key[index] ?? 0} onChange={event => setEditing({ ...editing, answer_key: editing.answer_key.map((answer: number, i: number) => i === index ? Number(event.target.value) : answer) })} className="input-field mt-1">{question.options.map((_: string, optionIndex: number) => <option key={optionIndex} value={optionIndex}>Answer {optionIndex + 1}</option>)}</select></label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2"><button onClick={() => act({ action: 'save_course', course: editing }, 'save-course', 'Course saved. It is now in the catalogue.', true)} disabled={busyId === 'save-course' || uploadingImage} className="btn-primary text-[13px] inline-flex items-center gap-2 disabled:opacity-50"><Save size={14} /> {busyId === 'save-course' ? 'Saving...' : 'Save course'}</button><button onClick={() => setEditing(null)} className="btn-secondary text-[13px]">Cancel</button></div>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div> : <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Course revenue</p><p className="text-[22px] font-semibold text-ink">£{(totalRevenue / 100).toFixed(2)}</p></div>
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Live courses</p><p className="text-[22px] font-semibold text-ink">{activeCourses.length}</p></div>
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Certificates issued</p><p className="text-[22px] font-semibold text-green-700">{rows.filter(row => row.completed_at).length}</p></div>
        </div>

        <div className="dashboard-card mb-8">
          <h2 className="text-[16px] font-medium text-ink mb-1 flex items-center gap-2"><UserPlus size={16} className="text-accent" /> Enrol a therapist</h2>
          <p className="text-[12px] text-gray-500 mb-3">Grant a live course free of charge. The therapist is notified immediately.</p>
          <div className="flex flex-col sm:flex-row gap-2"><select value={grantCandidate} onChange={event => setGrantCandidate(event.target.value)} className="input-field text-[13px] flex-1"><option value="">Choose a therapist...</option>{candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>)}</select><select value={grantCourse} onChange={event => setGrantCourse(event.target.value)} className="input-field text-[13px] flex-1"><option value="">Choose a course...</option>{activeCourses.map(course => <option key={course.slug} value={course.slug}>{course.title}</option>)}</select><button disabled={!grantCandidate || !grantCourse || busyId === 'grant'} onClick={() => act({ action: 'grant', candidateId: grantCandidate, courseSlug: grantCourse }, 'grant', 'Enrolled - the therapist has been notified.')} className="btn-primary text-[13px] shrink-0 disabled:opacity-50">{busyId === 'grant' ? 'Enrolling...' : 'Enrol free'}</button></div>
        </div>

        <h2 className="text-[16px] font-medium text-ink mb-3 flex items-center gap-2"><BookOpen size={16} className="text-accent" /> Course catalogue</h2>
        <div className="space-y-3 mb-8">{courses.map(course => {
          const open = openCourse === course.slug
          return <div key={course.slug} className={`dashboard-card !p-0 overflow-hidden ${course.is_active ? '' : 'opacity-70'}`}>
            <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">{course.image_url ? <img src={course.image_url} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-gray-300"><ImageIcon size={20}/></div>}</div>
              <button onClick={() => setOpenCourse(open ? null : course.slug)} className="text-left flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[14px] font-medium text-ink">{course.title}</p><span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${course.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{course.is_active ? 'Live' : 'Archived'}</span>{course.managed && <span className="text-[10px] text-accent">Edited</span>}</div><p className="text-[11px] text-gray-500 mt-1">{course.category} · {course.lessons.length} modules · £{((course.price || 0) / 100).toFixed(2)} · {course.enrolments} enrolments · £{(course.revenue / 100).toFixed(2)} revenue</p></button>
              <div className="flex items-center gap-2"><button onClick={() => editCourse(course)} className="btn-secondary text-[11px]">Edit</button><button onClick={() => act({ action: course.is_active ? 'archive_course' : 'restore_course', courseSlug: course.slug }, `toggle-${course.slug}`, course.is_active ? 'Course archived. Existing learners and certificates are preserved.' : 'Course restored to the catalogue.')} className={`text-[11px] font-medium ${course.is_active ? 'text-red-500' : 'text-green-700'}`}>{course.is_active ? 'Archive' : 'Restore'}</button><button onClick={() => setOpenCourse(open ? null : course.slug)} className="text-gray-400">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button></div>
            </div>
            {open && <div className="border-t border-border bg-surface/50 p-4"><p className="text-[13px] text-gray-600 mb-3">{course.tagline}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{course.lessons.map((lesson: any, index: number) => <div key={index} className="bg-white border border-border rounded-lg p-3"><p className="text-[12px] font-medium text-ink">{index + 1}. {lesson.title}</p><p className="text-[11px] text-gray-500 mt-1 line-clamp-3 whitespace-pre-line">{lesson.content}</p></div>)}</div></div>}
          </div>
        })}</div>

        <h2 className="text-[16px] font-medium text-ink mb-3">Learners ({rows.filter(row => row.paid_at).length})</h2>
        {rows.filter(row => row.paid_at).length === 0 ? <div className="dashboard-card text-center py-12 text-gray-400"><GraduationCap size={40} className="mx-auto mb-3 opacity-30" /><p>No enrolments yet.</p></div> : <div className="dashboard-card overflow-x-auto"><table className="w-full text-left text-[13px]"><thead><tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-border"><th className="py-2 pr-4">Therapist</th><th className="py-2 pr-4">Course</th><th className="py-2 pr-4">Paid</th><th className="py-2 pr-4">Progress</th><th className="py-2 pr-4">Status</th><th className="py-2" /></tr></thead><tbody>{rows.filter(row => row.paid_at).map(row => <tr key={row.id} className="border-b border-border/60"><td className="py-2.5 pr-4 font-medium text-ink capitalize">{row.candidate_name}</td><td className="py-2.5 pr-4">{row.course_title}</td><td className="py-2.5 pr-4 whitespace-nowrap">£{((row.amount_paid || 0) / 100).toFixed(2)}{row.amount_paid === 0 ? ' (comp)' : ''}</td><td className="py-2.5 pr-4">{row.lessons_done}/{row.lessons_total}{row.quiz_score != null ? ` · quiz ${row.quiz_score}%` : ''}</td><td className="py-2.5 pr-4">{row.completed_at ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700"><Award size={11} /> Certified</span> : <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">In progress</span>}</td><td className="py-2.5 text-right">{row.completed_at ? <button onClick={() => { const reason = window.prompt('Reason shown to the therapist (optional):') ?? ''; act({ action: 'revoke', id: row.id, reason }, row.id, 'Certificate withdrawn.') }} className="text-[11px] font-medium text-red-500">Revoke</button> : <button onClick={() => act({ action: 'award', id: row.id }, row.id, 'Certificate awarded.')} className="text-[11px] font-medium text-green-700">Award certificate</button>}</td></tr>)}</tbody></table></div>}
      </>}
    </DashboardShell>
  )
}