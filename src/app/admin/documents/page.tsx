'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import SopSheet from '@/components/documents/SopSheet'
import type { SopDocument } from '@/lib/documents/types'
import { TIER_LABEL, type BuildTier } from '@/lib/documents/library-plan'
import { LIFE_SAFETY_WARNING } from '@/lib/documents/safety'
import { Check, Eye, Plus, Printer, RefreshCw, RotateCcw, Trash2, Download, Sparkles, ShieldAlert, Layers, Inbox } from 'lucide-react'

// The library, and the desk it is signed off at.
//
// Read it, print it, then approve it. Nothing here reaches a property until
// she has, and the screen says which state each one is in rather than leaving
// her to work it out from which buttons happen to be enabled.

type Row = {
  id: string
  reference: string
  kind: string
  title: string
  department: string | null
  version: string
  status: 'draft' | 'approved' | 'retired'
  approved_by_name: string | null
  approved_at: string | null
  approved_version: string | null
  missing: string[]
  stale: boolean
  written: boolean
  lifeSafety: boolean
  tier: 'day-1' | 'month-1' | 'quarter-1' | null
  tier_reason: string | null
  created_at: string
}

const STATUS_LABEL: Record<Row['status'], string> = {
  draft: 'Draft, not signed off',
  approved: 'Signed off',
  retired: 'Retired',
}

export default function AdminDocumentsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  // The list no longer carries four hundred and sixty document bodies, so
  // opening one fetches it.
  const [reading, setReading] = useState<{ row: Row; document: SopDocument } | null>(null)
  const [opening, setOpening] = useState('')
  // Four hundred and sixty documents is not a list anybody scrolls. It is
  // filtered, counted, and worked through a tier at a time.
  const [tier, setTier] = useState<BuildTier | 'all'>('day-1')
  const [department, setDepartment] = useState('all')
  const [only, setOnly] = useState<'all' | 'unwritten' | 'unsigned'>('all')

  async function load() {
    const res = await fetch('/api/admin/documents', { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load the library.'); return }
    setUnavailable(Boolean(body.unavailable))
    setRows(body.rows || [])
  }
  useEffect(() => { load() }, [])

  async function act(action: string, id?: string, extra: Record<string, unknown> = {}) {
    setBusy(id || action); setError(''); setNote('')
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, ...extra }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error || `That did not work (${res.status}). Tell Claude what you pressed and this number.`)
        return false
      }
      if (action === 'approve') setNote('Signed off. It can be issued to a property now.')
      if (action === 'draft_tier') {
        setNote(body?.submitted
          ? `${body.submitted} documents sent to be written. It takes a while, and you do not have to wait: come back later and press Collect what is ready.`
          : body?.note || 'Nothing to send.')
      }
      if (action === 'collect') {
        setNote(body?.collected
          ? `${body.collected} documents came back written. Read them before signing any off.`
          : body?.stillRunning
            ? 'Still being written. Try again in a little while.'
            : body?.note || 'Nothing came back.')
      }
      if (action === 'draft') {
        setNote(body?.lifeSafety
          ? 'Drafted. This one is life safety: read every step against the actual building before you sign it off.'
          : 'Drafted. Read it, correct it, then sign it off.')
      }
      await load()
      return true
    } catch {
      setError('That did not work. Check your connection and try again.')
      return false
    } finally { setBusy('') }
  }

  async function open(row: Row) {
    setOpening(row.id); setError('')
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', id: row.id }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) { setError(body?.error || 'That document could not be opened.'); return }
      setReading({ row, document: body.document as SopDocument })
    } catch {
      setError('That document could not be opened. Check your connection.')
    } finally { setOpening('') }
  }

  // The extra statement a life safety document takes, asked once and plainly
  // rather than buried in a tick box nobody reads.
  async function signOff(row: Row) {
    if (row.lifeSafety) {
      const sure = window.confirm(
        `${row.title}\n\nThis is a life safety document.\n\nConfirm that a competent person has checked it `
        + 'against the actual premises, equipment and team.',
      )
      if (!sure) return false
      return act('approve', row.id, { competentPersonChecked: true })
    }
    return act('approve', row.id)
  }

  if (reading) {
    return (
      <DashboardShell role="admin">
        <div className="print:hidden">
          <button type="button" onClick={() => setReading(null)}
            className="text-[12px] text-secondary underline hover:text-ink">&larr; Back to the library</button>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary">
              <Printer size={13} /> Print or save as PDF
            </button>
            {reading.row.status !== 'approved' ? (
              <button type="button" disabled={busy === reading.row.id}
                onClick={async () => { if (await signOff(reading.row)) setReading(null) }}
                className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                <Check size={13} /> Sign this off
              </button>
            ) : (
              <span className="border border-[#166534]/30 bg-[#f3fbf5] px-3 py-1.5 text-[12px] font-semibold text-[#166534]">
                Signed off by {reading.row.approved_by_name || 'you'}
              </span>
            )}
          </div>
          {error && <p className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        </div>
        <div className="mt-6 border border-border bg-white shadow-sm print:mt-0 print:border-0 print:shadow-none">
          <SopSheet document={reading.document} />
        </div>
      </DashboardShell>
    )
  }

  const visible = rows.filter(row => {
    if (tier !== 'all' && row.tier !== tier) return false
    if (department !== 'all' && row.department !== department) return false
    if (only === 'unwritten' && row.written) return false
    if (only === 'unsigned' && (!row.written || row.status === 'approved')) return false
    return true
  })

  return (
    <DashboardShell role="admin">
      <div className="max-w-5xl">
        <p className="eyebrow">Standards</p>
        <h1 className="text-[32px] mt-1">The document library</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          Procedures, risk assessments, job descriptions and policies. Read each one, print it to check how it
          sits on a page, then sign it off. Nothing reaches a property until you have.
        </p>

        {unavailable && (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            This is not switched on yet. Run the documents migration in Supabase.
          </p>
        )}
        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        {note && <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={load}
            className="flex items-center gap-1.5 text-[12px] text-secondary hover:text-ink">
            <RefreshCw size={13} /> Refresh
          </button>
          <button type="button" disabled={busy === 'import_plan'} onClick={() => act('import_plan')}
            className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-40">
            <Download size={13} /> {busy === 'import_plan' ? 'Importing...' : 'Import the build plan'}
          </button>
          {tier !== 'all' && (
            <button type="button" disabled={busy === 'draft_tier'} onClick={() => act('draft_tier', undefined, { tier })}
              className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
              <Layers size={13} /> {busy === 'draft_tier' ? 'Sending...' : 'Write this whole tier'}
            </button>
          )}
          <button type="button" disabled={busy === 'collect'} onClick={() => act('collect')}
            className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-40">
            <Inbox size={13} /> {busy === 'collect' ? 'Checking...' : 'Collect what is ready'}
          </button>
          <button type="button" disabled={busy === 'add_example'} onClick={() => act('add_example')}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
            <Plus size={13} /> Add the worked example
          </button>
        </div>

        {rows.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
              {[
                ['Planned', rows.length],
                ['Written', rows.filter(r => r.written).length],
                ['Signed off', rows.filter(r => r.status === 'approved').length],
                ['Still to write', rows.filter(r => !r.written).length],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-white px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[.14em] text-muted">{label}</p>
                  <p className="mt-0.5 text-[22px] font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(['day-1', 'month-1', 'quarter-1', 'all'] as const).map(option => (
                <button key={option} type="button" onClick={() => setTier(option)}
                  className={`border px-3 py-1.5 text-[12px] ${tier === option ? 'border-[#1c1c1c] bg-[#1c1c1c] text-white' : 'border-border text-secondary'}`}>
                  {option === 'all' ? 'Everything' : TIER_LABEL[option]}
                  <span className="ml-1.5 opacity-60">
                    {option === 'all' ? rows.length : rows.filter(r => r.tier === option).length}
                  </span>
                </button>
              ))}
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="border border-border px-2 py-1.5 text-[12px] text-secondary">
                <option value="all">Every department</option>
                {Array.from(new Set(rows.map(r => r.department).filter(Boolean))).sort().map(name => (
                  <option key={String(name)} value={String(name)}>{name}</option>
                ))}
              </select>
              <select value={only} onChange={e => setOnly(e.target.value as typeof only)}
                className="border border-border px-2 py-1.5 text-[12px] text-secondary">
                <option value="all">Any state</option>
                <option value="unwritten">Not written yet</option>
                <option value="unsigned">Written, not signed off</option>
              </select>
            </div>
          </>
        )}

        {loading ? (
          <p className="mt-8 text-[13px] text-secondary">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">
            Nothing in the library yet. Import the build plan to put all four hundred and sixty documents in as
            drafts, or add the worked example on its own to look at the layout first.
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">Nothing matches those filters.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {visible.slice(0, 60).map(row => (
              <div key={row.id} className="dashboard-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-ink">{row.title}</p>
                    <p className="text-[12px] text-secondary">
                      <span className="font-mono">{row.reference}</span> &middot; version {row.version}
                      {row.department ? ` · ${row.department}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 border px-2.5 py-1 text-[11px] ${
                    row.status === 'approved'
                      ? 'border-[#166534]/30 bg-[#f3fbf5] text-[#166534]'
                      : 'border-border text-secondary'
                  }`}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </div>

                {row.status === 'approved' && (
                  <p className="mt-2 text-[12px] text-secondary">
                    Signed off by {row.approved_by_name || 'you'}
                    {row.approved_at ? ` on ${new Date(row.approved_at).toLocaleDateString('en-GB')}` : ''}
                    {row.approved_version ? `, at version ${row.approved_version}` : ''}.
                  </p>
                )}

                {/* An approval that applied to an earlier version is not an
                    approval of this one, and saying so is the whole point. */}
                {row.stale && (
                  <p className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                    This was signed off at version {row.approved_version} and it is now {row.version}. Read it again.
                  </p>
                )}

                {row.lifeSafety && (
                  <p className="mt-3 flex gap-2 border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-900">
                    <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                    <span><span className="font-semibold">Life safety. </span>{LIFE_SAFETY_WARNING}</span>
                  </p>
                )}

                {row.tier_reason && !row.written && (
                  <p className="mt-2 text-[12px] text-secondary">{row.tier_reason}</p>
                )}

                {!row.written && (
                  <p className="mt-2 text-[12px] text-muted">Not written yet. Nothing in it but the reference.</p>
                )}

                {row.written && row.missing.length > 0 && (
                  <p className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                    Not ready to sign off. Still needs: {row.missing.join(', ')}.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!row.written && (
                    <button type="button" disabled={busy === row.id} onClick={() => act('draft', row.id)}
                      className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                      <Sparkles size={13} /> {busy === row.id ? 'Drafting...' : 'Draft it'}
                    </button>
                  )}

                  <button type="button" disabled={!row.written || opening === row.id} onClick={() => open(row)}
                    className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-30">
                    <Eye size={13} /> {opening === row.id ? 'Opening...' : 'Read it'}
                  </button>

                  {row.status === 'approved' ? (
                    <button type="button" disabled={busy === row.id} onClick={() => act('unapprove', row.id)}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                      <RotateCcw size={13} /> Take the sign-off back
                    </button>
                  ) : (
                    <button type="button" disabled={busy === row.id || row.missing.length > 0}
                      onClick={() => signOff(row)}
                      className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                      <Check size={13} /> Sign it off
                    </button>
                  )}

                  <button type="button" disabled={busy === row.id}
                    onClick={() => {
                      if (!window.confirm(`Delete ${row.title}? This cannot be undone.`)) return
                      act('delete', row.id)
                    }}
                    className="ml-auto inline-flex items-center gap-1.5 border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-700 disabled:opacity-40">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {visible.length > 60 && (
              <p className="pt-2 text-[12px] text-secondary">
                Showing 60 of {visible.length}. Narrow it by department to see the rest.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
