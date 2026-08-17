'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Download, FileUp, Paperclip, Trash2 } from 'lucide-react'

type Course = {
  slug: string
  title: string
  lessons: { title: string }[]
}

type Resource = {
  id: string
  course_slug: string
  module_index: number | null
  title: string
  description: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  created_at: string
}

export default function AcademyDownloadsAdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [courseSlug, setCourseSlug] = useState('')
  const [moduleIndex, setModuleIndex] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [academyResponse, downloadResponse] = await Promise.all([
        fetch('/api/admin/academy'),
        fetch('/api/admin/academy/downloads'),
      ])
      const academyJson = await academyResponse.json()
      const downloadJson = await downloadResponse.json()
      if (!academyResponse.ok) throw new Error(academyJson.error || 'Could not load Academy courses.')
      if (!downloadResponse.ok) throw new Error(downloadJson.error || 'Could not load Academy downloads.')
      setCourses(academyJson.courses || [])
      setResources(downloadJson.resources || [])
      setCourseSlug(current => current || academyJson.courses?.[0]?.slug || '')
    } catch (caught: any) {
      setError(caught.message || 'Could not load Academy downloads.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const selectedCourse = useMemo(() => courses.find(course => course.slug === courseSlug), [courses, courseSlug])
  const courseMap = useMemo(() => new Map(courses.map(course => [course.slug, course])), [courses])

  async function upload() {
    if (!courseSlug || !title.trim() || !file) {
      setError('Choose a course, add a title and select a file.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const form = new FormData()
      form.append('courseSlug', courseSlug)
      form.append('moduleIndex', moduleIndex)
      form.append('title', title.trim())
      form.append('description', description.trim())
      form.append('file', file)

      const response = await fetch('/api/admin/academy/downloads', { method: 'POST', body: form })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not upload the file.')

      setNotice('Download uploaded and attached to the course.')
      setTitle('')
      setDescription('')
      setModuleIndex('')
      setFile(null)
      const input = document.getElementById('academy-download-file') as HTMLInputElement | null
      if (input) input.value = ''
      await load()
    } catch (caught: any) {
      setError(caught.message || 'Could not upload the file.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(resource: Resource) {
    if (!window.confirm(`Remove “${resource.title}”? This also deletes the stored file.`)) return
    setDeleting(resource.id)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/academy/downloads?id=${encodeURIComponent(resource.id)}`, { method: 'DELETE' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not remove the download.')
      setNotice('Download removed.')
      await load()
    } catch (caught: any) {
      setError(caught.message || 'Could not remove the download.')
    } finally {
      setDeleting(null)
    }
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return 'Size unavailable'
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2"><Download size={21} className="text-accent" /><h1 className="text-2xl font-semibold tracking-tight text-ink">Academy Downloads</h1></div>
        <p className="max-w-3xl text-[13px] leading-6 text-gray-500">Upload your own workbooks, templates, PDFs, spreadsheets or guides and attach them to a whole course or to a specific module. Files are stored privately.</p>
      </div>

      {notice && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="dashboard-card mb-8">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f1ec] text-[#9c7a42]"><FileUp size={18} /></div>
          <div><h2 className="text-[16px] font-semibold text-ink">Add a download</h2><p className="mt-1 text-[12px] text-gray-500">PDF, Word, Excel, CSV or text files. Maximum 20 MB per file.</p></div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-[12px] text-gray-600">Attach to course
            <select value={courseSlug} onChange={event => { setCourseSlug(event.target.value); setModuleIndex('') }} className="input-field mt-1">
              {courses.map(course => <option key={course.slug} value={course.slug}>{course.title}</option>)}
            </select>
          </label>
          <label className="text-[12px] text-gray-600">Attach to module <span className="text-gray-400">(optional)</span>
            <select value={moduleIndex} onChange={event => setModuleIndex(event.target.value)} className="input-field mt-1">
              <option value="">Whole course / general resources</option>
              {(selectedCourse?.lessons || []).map((lesson, index) => <option key={index} value={index}>Module {index + 1}: {lesson.title}</option>)}
            </select>
          </label>
          <label className="text-[12px] text-gray-600">Download title
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Spa P&L Workbook" className="input-field mt-1" />
          </label>
          <label className="text-[12px] text-gray-600">File
            <input id="academy-download-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={event => setFile(event.target.files?.[0] || null)} className="input-field mt-1 file:mr-3 file:rounded-md file:border-0 file:bg-[#10283b] file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-white" />
          </label>
          <label className="text-[12px] text-gray-600 md:col-span-2">Short description <span className="text-gray-400">(optional)</span>
            <textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} placeholder="Explain what this resource is for and when the learner should use it." className="input-field mt-1 resize-y" />
          </label>
        </div>

        <button type="button" onClick={upload} disabled={busy || loading || !file || !courseSlug || !title.trim()} className="btn-primary mt-5 inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
          <FileUp size={14} /> {busy ? 'Uploading...' : 'Upload & attach'}
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2"><Paperclip size={16} className="text-accent" /><h2 className="text-[16px] font-medium text-ink">Attached downloads</h2></div>
      {loading ? (
        <div className="flex h-44 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>
      ) : resources.length === 0 ? (
        <div className="dashboard-card text-[13px] text-gray-500">No Academy downloads have been uploaded yet.</div>
      ) : (
        <div className="space-y-3">
          {resources.map(resource => {
            const course = courseMap.get(resource.course_slug)
            const module = resource.module_index === null ? null : course?.lessons?.[resource.module_index]
            return (
              <div key={resource.id} className="dashboard-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-ink">{resource.title}</p>
                    <span className="rounded-full bg-[#f3f1ec] px-2 py-0.5 text-[10px] font-medium text-[#6c7780]">{course?.title || resource.course_slug}</span>
                    {module && <span className="rounded-full bg-[#f8f3e8] px-2 py-0.5 text-[10px] font-medium text-[#9c7a42]">Module {Number(resource.module_index) + 1}</span>}
                  </div>
                  {resource.description && <p className="mb-1 text-[12px] leading-5 text-gray-500">{resource.description}</p>}
                  <p className="text-[11px] text-gray-400">{resource.file_name} · {formatBytes(resource.file_size)}{module ? ` · ${module.title}` : ' · whole-course resource'}</p>
                </div>
                <button type="button" onClick={() => remove(resource)} disabled={deleting === resource.id} className="btn-secondary inline-flex shrink-0 items-center justify-center gap-2 text-[12px] text-red-600 disabled:opacity-50">
                  <Trash2 size={13} /> {deleting === resource.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
