'use client'

import { useEffect, useRef, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Check, Loader2, Trash2, Upload, FileSpreadsheet } from 'lucide-react'
import { readableSize, type Attachment } from '@/lib/documents/attachments'
import { formatOf, type Format } from '@/lib/documents/formats'

// Files that go in a pack.
//
// Not everything worth selling is a procedure. Her compliance register is a
// spreadsheet and should stay one: a register is something a manager filters
// and sorts, and turning it into a PDF would make it a picture of a tool
// rather than the tool. This is where those files are uploaded and told which
// packs they belong to.

type Slug = { slug: string; name: string }

/** What can stand in for the reporting workbook. */
const SPREADSHEET = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
])

export default function StandardsFilesPage() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [slugs, setSlugs] = useState<Slug[]>([])
  const [limits, setLimits] = useState<{ maxBytes: number; allowed: string[] }>({ maxBytes: 0, allowed: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, Attachment>>({})
  // Just the spreadsheets, or just the manuals. A list of forty files where
  // they are all called something sensible is still a list of forty files.
  const [format, setFormat] = useState<Format | 'all'>('all')
  const fileInput = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch('/api/admin/standards-files', { cache: 'no-store' })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body) { setError(body?.error || 'Could not load the files.'); setLoading(false); return }
    setAttachments(body.attachments || [])
    setSlugs(body.slugs || [])
    setLimits({ maxBytes: body.maxBytes || 0, allowed: body.allowed || [] })
    setDrafts(Object.fromEntries((body.attachments || []).map((a: Attachment) => [a.id, a])))
    setLoading(false)
  }

  useEffect(() => { load().catch(() => { setError('Could not load the files.'); setLoading(false) }) }, [])

  async function act(action: string, payload: Record<string, unknown>, key: string) {
    setBusy(key); setError(''); setNote('')
    const res = await fetch('/api/admin/standards-files', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    }).catch(() => null)
    const body = await res?.json().catch(() => null)
    if (!res?.ok) { setError(body?.error || 'That did not save.'); setBusy(''); return }
    // A warning is shown instead of the cheerful line, never underneath it.
    if (body?.warning) setError(body.warning)
    else setNote(body?.note || 'Saved.')
    await load()
    setBusy('')
  }

  // Which formats are actually here, in a stable order, so the row does not
  // reshuffle itself every time a file is uploaded.
  const ORDER: Format[] = ['Excel', 'Word', 'PowerPoint', 'PDF', 'CSV', 'File']
  const presentFormats = ORDER.filter(option =>
    attachments.some(attachment => formatOf(attachment.contentType, attachment.fileName) === option))
  const visible = format === 'all'
    ? attachments
    : attachments.filter(attachment => formatOf(attachment.contentType, attachment.fileName) === format)

  async function upload(file: File) {
    setBusy('upload'); setError(''); setNote('')
    const form = new FormData()
    form.append('file', file)
    form.append('name', file.name.replace(/\.[a-z0-9]+$/i, ''))
    const res = await fetch('/api/admin/standards-files', { method: 'POST', body: form }).catch(() => null)
    const body = await res?.json().catch(() => null)
    if (!res?.ok) { setError(body?.error || 'That did not upload.'); setBusy(''); return }
    setNote(body?.note || 'Uploaded.')
    if (fileInput.current) fileInput.current.value = ''
    await load()
    setBusy('')
  }

  const edit = (id: string, patch: Partial<Attachment>) =>
    setDrafts(current => ({ ...current, [id]: { ...current[id], ...patch } as Attachment }))

  const togglePack = (id: string, slug: string) => {
    const current = drafts[id]?.packSlugs || []
    edit(id, { packSlugs: current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug] })
  }

  return (
    <DashboardShell role="admin">
      <div className="max-w-4xl">
        <p className="eyebrow">Standards</p>
        <h1 className="mt-1 text-[32px]">Files in a pack</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-secondary">
          Spreadsheets, registers and anything else that belongs with a pack but is not a procedure. Upload it,
          tick the packs it goes with, then make it live. Anybody who has already bought one of those packs gets
          it too, without paying again.
        </p>

        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        {note && <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

        <div className="mt-6 border border-dashed border-border px-5 py-6">
          <label className="flex flex-wrap items-center gap-3">
            <span className="inline-flex cursor-pointer items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[13px] font-semibold text-white">
              {busy === 'upload' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {busy === 'upload' ? 'Uploading...' : 'Choose a file'}
            </span>
            <input
              ref={fileInput}
              type="file"
              disabled={busy === 'upload'}
              onChange={event => { const file = event.target.files?.[0]; if (file) upload(file) }}
              className="sr-only"
            />
            <span className="text-[12px] text-secondary">
              Excel, Word, PowerPoint, PDF or CSV. Up to {Math.round(limits.maxBytes / 1024 / 1024)} MB.
            </span>
          </label>
        </div>

        {/* Only worth showing once there is more than one kind of thing in
            here. A filter over a list of three is furniture. */}
        {presentFormats.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(['all', ...presentFormats] as const).map(option => (
              <button key={option} type="button" onClick={() => setFormat(option as Format | 'all')}
                className={format === option
                  ? 'border border-[#1c1c1c] bg-[#1c1c1c] px-2.5 py-1 text-[11px] font-medium text-white'
                  : 'border border-border px-2.5 py-1 text-[11px] text-secondary'}>
                {option === 'all' ? 'Everything' : option}
                <span className="ml-1.5 text-[10px] opacity-60">
                  {option === 'all'
                    ? attachments.length
                    : attachments.filter(a => formatOf(a.contentType, a.fileName) === option).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {loading ? <p className="mt-8 text-[13px] text-secondary">Loading...</p> : attachments.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">
            Nothing uploaded yet. The compliance register is the obvious first one.
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">
            Nothing in {format}. {attachments.length} {attachments.length === 1 ? 'file is' : 'files are'} here
            in other formats.
          </p>
        ) : (
          <div className="mt-8 border-t border-border">
            {visible.map(attachment => {
              const draft = drafts[attachment.id] || attachment
              const chosen = draft.packSlugs || []
              return (
                <div key={attachment.id} className="border-b border-border py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={15} className="shrink-0 text-muted" />
                        <input
                          value={draft.name || ''}
                          onChange={event => edit(attachment.id, { name: event.target.value })}
                          aria-label="File name as a buyer sees it"
                          className="w-full max-w-md border border-border px-2.5 py-1.5 text-[14px] font-semibold text-ink"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted">
                        {attachment.fileName} · {readableSize(attachment.sizeBytes)}
                      </p>
                      <textarea
                        value={draft.description || ''}
                        onChange={event => edit(attachment.id, { description: event.target.value })}
                        rows={2}
                        placeholder="What it is and what a buyer does with it."
                        aria-label="Description"
                        className="mt-2 w-full max-w-xl border border-border px-2.5 py-1.5 text-[13px] text-secondary"
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" disabled={busy === attachment.id}
                        onClick={() => act('save', {
                          id: attachment.id,
                          name: draft.name,
                          description: draft.description,
                          packSlugs: chosen,
                          isLive: draft.isLive === true,
                          replacesWorkbook: draft.replacesWorkbook === true,
                          sortOrder: draft.sortOrder || 0,
                        }, attachment.id)}
                        className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                        {busy === attachment.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                      <button type="button" disabled={busy === attachment.id}
                        onClick={() => {
                          if (!window.confirm(`Delete ${attachment.name}? Anybody who owns a pack it is in loses it.`)) return
                          act('delete', { id: attachment.id }, attachment.id)
                        }}
                        title="Delete this file"
                        className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[12px] text-secondary disabled:opacity-40">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {slugs.map(option => {
                      const on = chosen.includes(option.slug)
                      return (
                        <button key={option.slug} type="button"
                          onClick={() => togglePack(attachment.id, option.slug)}
                          className={on
                            ? 'border border-[#1c1c1c] bg-[#1c1c1c] px-2.5 py-1 text-[11px] font-medium text-white'
                            : 'border border-border px-2.5 py-1 text-[11px] text-secondary'}>
                          {option.name}
                        </button>
                      )
                    })}
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-[12px] text-secondary">
                    <input type="checkbox" checked={draft.isLive === true}
                      onChange={event => edit(attachment.id, { isLive: event.target.checked })}
                      className="h-3.5 w-3.5" />
                    {/* Said as a consequence rather than as a state. "Live"
                        means nothing on its own; being delivered to people
                        who have already paid is the thing she is deciding. */}
                    Deliver this to everybody who owns one of those packs
                  </label>
                  {/* Only offered on a spreadsheet, because replacing the
                      reporting workbook with a PDF is not a thing anybody
                      means to do. Stated rather than guessed at: the
                      compliance register is a spreadsheet too, and a rule
                      that inferred this would withdraw the workbook the first
                      time a register went into the same pack. */}
                  {SPREADSHEET.has(attachment.contentType || '') && (
                    <label className="mt-2 flex items-start gap-2 text-[12px] text-secondary">
                      <input type="checkbox" checked={draft.replacesWorkbook === true}
                        onChange={event => edit(attachment.id, { replacesWorkbook: event.target.checked })}
                        className="mt-0.5 h-3.5 w-3.5" />
                      <span>
                        This is the reporting workbook
                        <span className="block text-[11px] text-muted">
                          The one built in code is not offered to anybody who gets this file. Yours is the
                          workbook.
                        </span>
                      </span>
                    </label>
                  )}
                  {chosen.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-[#7a4a00]">
                      Not in any pack yet, so nobody can reach it.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
