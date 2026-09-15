'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { EVENT_KINDS, eventDateLabel, eventWhereLabel } from '@/lib/events'
import { Megaphone, Plus, Trash2 } from 'lucide-react'

// What is on, and telling the register about it.
//
// Publishing and announcing are two buttons on purpose. Publishing puts an
// event on the site and is reversible. Announcing puts it in several hundred
// inboxes and is not, so it is pressed deliberately and only once.

const BLANK = {
  id: '', title: '', summary: '', description: '', kind: 'launch',
  host: '', location: '', is_online: false, starts_at: '', ends_at: '',
  booking_url: '', image_url: '', members_only: false, is_published: false,
}

export default function AdminEventsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState<any>(BLANK)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  async function load() {
    const res = await fetch('/api/admin/events', { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load events.'); return }
    setUnavailable(Boolean(body.unavailable))
    setRows(body.rows || [])
  }
  useEffect(() => { load() }, [])

  async function send(payload: Record<string, any>) {
    setBusy(true); setError(''); setNote('')
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error || 'That did not work.'); return null }
      await load()
      return body
    } catch {
      setError('That did not work. Check your connection and try again.')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    const result = await send({ action: 'save', ...form })
    if (!result) return
    setNote(form.id ? 'Saved.' : 'Event created.')
    setForm(BLANK); setEditing(false)
  }

  async function announce(row: any) {
    const result = await send({ action: 'announce', id: row.id })
    if (!result) return
    setNote(`Told ${result.sent} people about ${row.title}.${result.failed ? ` ${result.failed} did not send.` : ''}`)
  }

  return (
    <DashboardShell role="admin">
      <div className="max-w-5xl">
        <p className="eyebrow">Content &amp; revenue</p>
        <h1 className="text-[32px] mt-1">Events</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          Brand launches, masterclasses, product house training, trade shows and awards. Most professionals
          are not looking for work, and all of them want to know what is on. This is the reason they open
          your emails.
        </p>

        {unavailable && (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Events are not switched on yet. Run the events migration in Supabase and this starts working.
          </p>
        )}
        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        {note && <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

        {!editing && (
          <button type="button" onClick={() => { setForm(BLANK); setEditing(true) }}
            className="btn-primary mt-6 inline-flex items-center gap-2 px-4 py-2 text-[13px]">
            <Plus size={15} /> Add an event
          </button>
        )}

        {editing && (
          <div className="dashboard-card mt-6">
            <h2 className="text-[20px]">{form.id ? 'Edit event' : 'New event'}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} full />
              <div>
                <label className="block text-[12px] font-semibold text-ink">Kind</label>
                <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} className="input-field mt-1 w-full">
                  {EVENT_KINDS.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                </select>
              </div>
              <Field label="Who is running it" value={form.host} onChange={v => setForm({ ...form, host: v })} />
              <Field label="Starts" type="datetime-local" value={form.starts_at} onChange={v => setForm({ ...form, starts_at: v })} />
              <Field label="Ends (optional)" type="datetime-local" value={form.ends_at} onChange={v => setForm({ ...form, ends_at: v })} />
              <Field label="Location" value={form.location} onChange={v => setForm({ ...form, location: v })} />
              <Field label="Booking link" value={form.booking_url} onChange={v => setForm({ ...form, booking_url: v })} />
              <Field label="Image URL" value={form.image_url} onChange={v => setForm({ ...form, image_url: v })} full />
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-ink">One line for the card</label>
                <input value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} className="input-field mt-1 w-full" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-ink">The full thing</label>
                <textarea rows={7} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field mt-1 w-full text-[13px]" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-5">
              <Check label="Online" checked={form.is_online} onChange={v => setForm({ ...form, is_online: v })} />
              <Check label="Members only" checked={form.members_only} onChange={v => setForm({ ...form, members_only: v })} />
              <Check label="Published on the site" checked={form.is_published} onChange={v => setForm({ ...form, is_published: v })} />
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={save} disabled={busy} className="btn-primary px-5 py-2 text-[13px] disabled:opacity-50">
                {busy ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => { setEditing(false); setForm(BLANK) }} className="btn-secondary px-5 py-2 text-[13px]">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-[13px] text-secondary">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">No events yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map(row => (
              <div key={row.id} className="dashboard-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-ink">{row.title}</p>
                    <p className="text-[12px] text-secondary">
                      {eventDateLabel(row.starts_at, row.ends_at)} · {eventWhereLabel(row)}
                      {row.host ? ` · ${row.host}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 text-[11px] border ${row.is_published ? 'border-[#166534]/30 bg-[#f3fbf5] text-[#166534]' : 'border-border text-secondary'}`}>
                      {row.is_published ? 'Live' : 'Draft'}
                    </span>
                    <span className={`px-2.5 py-1 text-[11px] border ${row.announced_at ? 'border-[#166534]/30 bg-[#f3fbf5] text-[#166534]' : 'border-border text-secondary'}`}>
                      {row.announced_at ? 'Register told' : 'Not announced'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => {
                    setForm({
                      ...BLANK, ...row,
                      summary: row.summary || '', description: row.description || '',
                      host: row.host || '', location: row.location || '',
                      booking_url: row.booking_url || '', image_url: row.image_url || '',
                      starts_at: (row.starts_at || '').slice(0, 16),
                      ends_at: (row.ends_at || '').slice(0, 16),
                    })
                    setEditing(true)
                  }} className="border border-border px-3 py-1.5 text-[12px] font-medium text-secondary">Edit</button>

                  <button type="button" disabled={busy || !row.is_published || !!row.announced_at}
                    onClick={() => announce(row)}
                    title={!row.is_published ? 'Publish it first' : row.announced_at ? 'Already announced' : ''}
                    className="inline-flex items-center gap-1.5 border border-[#222321] bg-[#222321] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                    <Megaphone size={13} /> Tell the register
                  </button>

                  <button type="button" disabled={busy}
                    onClick={() => send({ action: 'delete', id: row.id })}
                    className="ml-auto inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] text-red-700 disabled:opacity-40">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function Field({ label, value, onChange, type = 'text', full = false }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[12px] font-semibold text-ink">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input-field mt-1 w-full" />
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  )
}
