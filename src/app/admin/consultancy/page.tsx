'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { CheckCircle, XCircle, Star, ExternalLink } from 'lucide-react'

// Every listing appears on a page carrying Talent House's name, so somebody reads it
// before a hotel does. An edit to an approved listing sends it back here.

const TABS = ['pending', 'approved', 'rejected'] as const

export default function AdminConsultancyPage() {
  const [rows, setRows] = useState<any[]>([])
  const [tab, setTab] = useState<typeof TABS[number]>('pending')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  async function load() {
    const res = await fetch('/api/admin/consultancy', { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) setError(body.error || 'Could not load listings.')
    else setRows(body.rows || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function act(id: string, action: string, extra: Record<string, any> = {}) {
    setBusy(id); setError('')
    const res = await fetch('/api/admin/consultancy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy('')
    if (!res.ok) { setError(body.error || 'That did not work.'); return }
    setRejecting(null); setReason('')
    await load()
  }

  const shown = rows.filter(row => (row.approval_status || 'pending') === tab)
  const pendingCount = rows.filter(row => (row.approval_status || 'pending') === 'pending').length

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-7">
        <p className="dashboard-eyebrow">People &amp; operations</p>
        <h1 className="dashboard-title">Consultancy directory</h1>
        <p className="dashboard-intro">Read every listing before a property does. Approving one puts it in the public directory.</p>
      </div>

      {error && <div className="mb-6 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="flex space-x-1 mb-6">
        {TABS.map(item => (
          <button type="button" key={item} onClick={() => setTab(item)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === item ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
            {item}{item === 'pending' && pendingCount > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="skeleton h-64 w-full" /> : shown.length === 0 ? (
        <p className="py-12 text-center text-muted">No {tab} listings.</p>
      ) : (
        <div className="space-y-4">
          {shown.map(row => (
            <div key={row.id} className="dashboard-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">
                    {row.practice_name}
                    {row.featured && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink"><Star size={10} fill="currentColor" /> Featured</span>}
                  </p>
                  {row.headline && <p className="mt-1 text-[13px] text-secondary">{row.headline}</p>}
                  <p className="mt-1.5 text-[11px] text-muted">
                    {row.contact_name || 'No contact name'} · {(row.specialisms || []).length} specialism{(row.specialisms || []).length === 1 ? '' : 's'} ·{' '}
                    {(Array.isArray(row.projects) ? row.projects.length : 0)} project{(Array.isArray(row.projects) ? row.projects.length : 0) === 1 ? '' : 's'} ·{' '}
                    {row.is_live ? 'Wants to be live' : 'Draft'} · updated {new Date(row.updated_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {row.approval_status === 'approved' && row.is_live && (
                    <Link href={`/consultancy/${row.id}`} target="_blank" className="btn-secondary text-[12px] inline-flex items-center gap-1.5"><ExternalLink size={12} /> View</Link>
                  )}
                  {row.approval_status !== 'approved' && (
                    <button type="button" onClick={() => act(row.id, 'approve')} disabled={busy === row.id}
                      className="btn-primary text-[12px] inline-flex items-center gap-1.5 disabled:opacity-50"><CheckCircle size={13} /> Approve</button>
                  )}
                  {row.approval_status !== 'rejected' && (
                    <button type="button" onClick={() => { setRejecting(row.id); setReason('') }}
                      className="border border-red-200 px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 inline-flex items-center gap-1.5"><XCircle size={13} /> Reject</button>
                  )}
                  {row.approval_status === 'approved' && (
                    <button type="button" onClick={() => act(row.id, 'feature', { featured: !row.featured })} disabled={busy === row.id}
                      className="btn-secondary text-[12px] inline-flex items-center gap-1.5 disabled:opacity-50">
                      <Star size={12} /> {row.featured ? 'Remove feature' : 'Feature 30 days'}
                    </button>
                  )}
                </div>
              </div>

              {row.summary && <p className="mt-4 border-t border-border pt-4 text-[13px] leading-6 text-body whitespace-pre-line">{row.summary}</p>}
              {(row.specialisms || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.specialisms.map((item: string) => <span key={item} className="border border-border px-2 py-1 text-[11px] text-secondary">{item}</span>)}
                </div>
              )}
              {Array.isArray(row.projects) && row.projects.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {row.projects.map((project: any, index: number) => (
                    <div key={index} className="text-[12px] leading-6">
                      <span className="font-medium text-ink">{project.title}</span>
                      <span className="text-muted"> · {project.confidential ? 'Confidential' : project.client || 'No client named'}{project.year ? ` · ${project.year}` : ''}</span>
                      {project.outcome && <p className="text-secondary">{project.outcome}</p>}
                    </div>
                  ))}
                </div>
              )}
              {row.approval_notes && <p className="mt-3 bg-[#f1f1f1] p-3 text-[12px] text-secondary">Last decision: {row.approval_notes}</p>}

              {rejecting === row.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <label htmlFor={`reason-${row.id}`} className="eyebrow block mb-1.5">Why is it not approved?</label>
                  <textarea id={`reason-${row.id}`} rows={2} value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="They see this, so make it something they can act on." className="input-field" />
                  <div className="mt-3 flex gap-3">
                    <button type="button" onClick={() => act(row.id, 'reject', { reason })} disabled={busy === row.id}
                      className="bg-red-600 px-5 py-2 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-50">Reject listing</button>
                    <button type="button" onClick={() => setRejecting(null)} className="btn-secondary text-[12px]">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
