'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import SopSheet from '@/components/documents/SopSheet'
import type { SopDocument } from '@/lib/documents/types'
import { Check, Eye, Plus, Printer, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'

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
  document: SopDocument
  approved_by_name: string | null
  approved_at: string | null
  approved_version: string | null
  missing: string[]
  stale: boolean
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
  const [reading, setReading] = useState<Row | null>(null)

  async function load() {
    const res = await fetch('/api/admin/documents', { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load the library.'); return }
    setUnavailable(Boolean(body.unavailable))
    setRows(body.rows || [])
  }
  useEffect(() => { load() }, [])

  async function act(action: string, id?: string) {
    setBusy(id || action); setError(''); setNote('')
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error || `That did not work (${res.status}). Tell Claude what you pressed and this number.`)
        return false
      }
      if (action === 'approve') setNote('Signed off. It can be issued to a property now.')
      await load()
      return true
    } catch {
      setError('That did not work. Check your connection and try again.')
      return false
    } finally { setBusy('') }
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
            {reading.status !== 'approved' ? (
              <button type="button" disabled={busy === reading.id}
                onClick={async () => { if (await act('approve', reading.id)) setReading(null) }}
                className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                <Check size={13} /> Sign this off
              </button>
            ) : (
              <span className="border border-[#166534]/30 bg-[#f3fbf5] px-3 py-1.5 text-[12px] font-semibold text-[#166534]">
                Signed off by {reading.approved_by_name || 'you'}
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
          <button type="button" disabled={busy === 'add_example'} onClick={() => act('add_example')}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
            <Plus size={13} /> Add the worked example
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-[13px] text-secondary">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">
            Nothing in the library yet. Add the worked example to see the layout and decide whether you like it.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map(row => (
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

                {row.missing.length > 0 && (
                  <p className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                    Not ready to sign off. Still needs: {row.missing.join(', ')}.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setReading(row)}
                    className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink">
                    <Eye size={13} /> Read it
                  </button>

                  {row.status === 'approved' ? (
                    <button type="button" disabled={busy === row.id} onClick={() => act('unapprove', row.id)}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                      <RotateCcw size={13} /> Take the sign-off back
                    </button>
                  ) : (
                    <button type="button" disabled={busy === row.id || row.missing.length > 0}
                      onClick={() => act('approve', row.id)}
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
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
