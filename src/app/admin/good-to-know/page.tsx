'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Plus, Save, Trash2, Upload } from 'lucide-react'

type Entry = {
  id?: string
  section: string
  name: string
  short_name: string
  url: string
  image_url: string
  what: string
  why_it_matters: string
  why_we_rate_it: string
  why_spas_value_it: string
  tags: string
  is_published: boolean
}

const BLANK: Entry = {
  section: 'professional-bodies', name: '', short_name: '', url: '', image_url: '',
  what: '', why_it_matters: '', why_we_rate_it: '', why_spas_value_it: '', tags: '', is_published: true,
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] text-secondary">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-5 text-muted">{hint}</span> : null}
    </label>
  )
}

export default function AdminGoodToKnowPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [sections, setSections] = useState<{ id: string; title: string; intro: string }[]>([])
  const [seedAvailable, setSeedAvailable] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<Entry | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/good-to-know')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Could not load the page.'); return }
      setEntries(data.entries || [])
      setSections(data.sections || [])
      setSeedAvailable(Boolean(data.seedAvailable))
      setUnavailable(Boolean(data.unavailable))
      setError('')
    } catch {
      setError('Could not load the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function send(payload: Record<string, unknown>, success: string) {
    setBusy(true); setError(''); setMessage('')
    try {
      const res = await fetch('/api/admin/good-to-know', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'That did not save.'); return null }
      setMessage(success)
      await load()
      return data
    } catch {
      setError('That did not save.')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function uploadImage(file: File) {
    setUploading(true); setError('')
    try {
      // The upload route needs a bucket and a path as well as the file, and
      // says "Missing file, bucket, or path" when it does not get them. This
      // sent the file alone, so the button failed on every picture with an
      // error that read like the file was the problem.
      const slug = (editing?.short_name || editing?.name || 'entry')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'entry'
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const form = new FormData()
      form.append('file', file)
      form.append('bucket', 'site-images')
      form.append('path', `good-to-know/${slug}/${Date.now()}-${safeName}`)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) { setError(data.error || 'The picture could not be uploaded.'); return }
      setEditing(current => (current ? { ...current, image_url: data.url } : current))
    } catch {
      setError('The picture could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  function edit(row: any) {
    setEditing({
      id: row.id, section: row.section, name: row.name || '', short_name: row.short_name || '',
      url: row.url || '', image_url: row.image_url || '', what: row.what || '',
      why_it_matters: row.why_it_matters || '', why_we_rate_it: row.why_we_rate_it || '',
      why_spas_value_it: row.why_spas_value_it || '',
      tags: Array.isArray(row.tags) ? row.tags.join(', ') : '', is_published: row.is_published !== false,
    })
  }

  async function move(row: any, direction: -1 | 1) {
    const siblings = entries.filter(entry => entry.section === row.section)
    const index = siblings.findIndex(entry => entry.id === row.id)
    const next = index + direction
    if (index < 0 || next < 0 || next >= siblings.length) return
    const reordered = [...siblings]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(next, 0, moved)
    await send({ action: 'reorder', order: reordered.map(entry => entry.id) }, 'Order saved.')
  }

  return (
    <DashboardShell role="admin">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[26px] tracking-[-0.02em] text-ink">Good to Know</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-secondary">
            The organisations that govern, insure, qualify and report on this industry, and what
            Talent House makes of each one. This page is only worth reading while it is right, so
            it lives here rather than in the code.
          </p>
        </div>
        <a href="/good-to-know" target="_blank" rel="noreferrer noopener" className="btn-secondary inline-flex items-center gap-1.5 text-[12px]">
          View the page <ExternalLink size={12} />
        </a>
      </div>

      {error ? <div role="alert" className="mb-5 border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div> : null}
      {message ? <div className="mb-5 border border-[#dddddd] bg-[#f1f1f1] px-4 py-3 text-[13px] text-ink">{message}</div> : null}
      {unavailable ? (
        <div className="mb-5 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-800">
          <strong className="font-semibold">The table is not there yet.</strong> Run the Good to Know migration and this
          screen comes to life. Until then the live page shows the version written into the code, so nothing is broken.
        </div>
      ) : null}

      {seedAvailable ? (
        <div className="dashboard-card mb-6">
          <p className="text-[13px] font-semibold text-ink">Start from what is already live</p>
          <p className="mt-1.5 text-[13px] leading-6 text-secondary">
            The page currently shows the version written into the code. Import it and every organisation
            becomes editable here, exactly as it reads now. Offered rather than done for you, because an
            import replaces whatever is here.
          </p>
          <button type="button" disabled={busy} onClick={() => send({ action: 'seed' }, 'Imported. Everything on the page is now yours to edit.')}
            className="btn-primary mt-4 inline-flex items-center gap-1.5 text-[13px] disabled:opacity-40">
            <Upload size={13} /> Import the current page
          </button>
        </div>
      ) : null}

      <button type="button" onClick={() => setEditing({ ...BLANK })} className="btn-primary mb-6 inline-flex items-center gap-1.5 text-[13px]">
        <Plus size={13} /> Add an organisation
      </button>

      {editing ? (
        <section className="dashboard-card mb-7">
          <h2 className="font-serif text-[18px] text-ink">{editing.id ? 'Edit entry' : 'New entry'}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Section">
              <select value={editing.section} onChange={e => setEditing({ ...editing, section: e.target.value })} className="input-field mt-1.5">
                {sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}
              </select>
            </Field>
            <Field label="Name">
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="input-field mt-1.5" placeholder="British Association of Beauty Therapy and Cosmetology" />
            </Field>
            <Field label="Short name" hint="The initials people actually say. Shown beside the full name and on the link.">
              <input value={editing.short_name} onChange={e => setEditing({ ...editing, short_name: e.target.value })} className="input-field mt-1.5" placeholder="BABTAC" />
            </Field>
            <Field label="Website" hint="Type it however you like. A bare domain works.">
              <input value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} className="input-field mt-1.5" placeholder="babtac.com" />
            </Field>
            <Field label="Tags" hint="Comma separated. Three is plenty.">
              <input value={editing.tags} onChange={e => setEditing({ ...editing, tags: e.target.value })} className="input-field mt-1.5" placeholder="Insurance, Membership, Accreditation" />
            </Field>
            <Field label="Picture" hint="Your own photography. The card draws a monogram until there is one.">
              <div className="mt-1.5 flex items-center gap-2">
                <input value={editing.image_url} onChange={e => setEditing({ ...editing, image_url: e.target.value })} className="input-field" placeholder="https://..." />
                <label className="btn-secondary shrink-0 cursor-pointer text-[12px]">
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file) }} />
                </label>
              </div>
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="What it is" hint="Described from their own published material. Nothing invented: this page is only worth reading because it is right.">
              <textarea rows={3} value={editing.what} onChange={e => setEditing({ ...editing, what: e.target.value })} className="input-field mt-1.5" />
            </Field>
            <Field label="Why professionals need it" hint="The specific reason this affects a career.">
              <textarea rows={3} value={editing.why_it_matters} onChange={e => setEditing({ ...editing, why_it_matters: e.target.value })} className="input-field mt-1.5" />
            </Field>
            <Field label="Why Talent House rates it" hint="Your view, said plainly. A reference page that refuses to have one is a list of links somebody could have found themselves.">
              <textarea rows={3} value={editing.why_we_rate_it} onChange={e => setEditing({ ...editing, why_we_rate_it: e.target.value })} className="input-field mt-1.5" />
            </Field>
            <Field label="Why spas value it" hint="What it does for a business rather than a person.">
              <textarea rows={3} value={editing.why_spas_value_it} onChange={e => setEditing({ ...editing, why_spas_value_it: e.target.value })} className="input-field mt-1.5" />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy} onClick={async () => {
              const saved = await send({ ...editing, action: editing.id ? 'update' : 'create' }, editing.id ? 'Saved.' : 'Added.')
              if (saved?.success) setEditing(null)
            }} className="btn-primary inline-flex items-center gap-1.5 text-[13px] disabled:opacity-40"><Save size={13} /> Save</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary text-[13px]">Cancel</button>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-[12px] text-secondary">
              <input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} className="h-4 w-4" />
              Show on the page
            </label>
          </div>
        </section>
      ) : null}

      {loading ? <div className="skeleton h-64 rounded-xl" /> : sections.map(section => {
        const rows = entries.filter(entry => entry.section === section.id)
        return (
          <section key={section.id} className="mb-7">
            <h2 className="font-serif text-[18px] text-ink">{section.title}</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted">{section.intro}</p>
            {rows.length === 0 ? (
              <div className="dashboard-card mt-3 text-[13px] text-secondary">Nothing in this section yet.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {rows.map((row, index) => (
                  <div key={row.id} className="dashboard-card flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        {row.name}{row.short_name ? <span className="ml-2 text-[12px] font-normal text-muted">{row.short_name}</span> : null}
                        {row.is_published === false ? <span className="ml-2 rounded-full bg-[#e7e7e7] px-2 py-0.5 text-[10px] text-secondary">Hidden</span> : null}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">{row.url}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" disabled={busy || index === 0} onClick={() => move(row, -1)} className="border border-border p-2 text-secondary hover:text-ink disabled:opacity-30" aria-label={`Move ${row.name} up`}><ArrowUp size={13} /></button>
                      <button type="button" disabled={busy || index === rows.length - 1} onClick={() => move(row, 1)} className="border border-border p-2 text-secondary hover:text-ink disabled:opacity-30" aria-label={`Move ${row.name} down`}><ArrowDown size={13} /></button>
                      <button type="button" disabled={busy} onClick={() => send({ action: 'update', ...row, tags: (row.tags || []).join(','), is_published: row.is_published === false }, row.is_published === false ? 'Now on the page.' : 'Hidden from the page.')} className="border border-border p-2 text-secondary hover:text-ink disabled:opacity-40" aria-label={row.is_published === false ? `Show ${row.name}` : `Hide ${row.name}`}>
                        {row.is_published === false ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button type="button" onClick={() => edit(row)} className="btn-secondary text-[12px]">Edit</button>
                      <button type="button" disabled={busy} onClick={() => { if (confirm(`Remove ${row.name} from Good to Know?`)) send({ action: 'delete', id: row.id }, 'Removed.') }} className="border border-border p-2 text-secondary hover:text-red-600 disabled:opacity-40" aria-label={`Remove ${row.name}`}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </DashboardShell>
  )
}
