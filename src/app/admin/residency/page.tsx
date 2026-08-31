'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { CalendarCheck, Check, X, Eye, Clock3 } from 'lucide-react'

export default function AdminResidencyPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [rejecting, setRejecting] = useState<any>(null)
  const [reason, setReason] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/admin/listings?kind=residency')
      const j = res.ok ? await res.json() : { rows: [] }
      setRows(j.rows || [])
    } catch { /* empty */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleFeatured(id: string, featured: boolean) {
    setBusyId(id)
    const res = await fetch('/api/admin/listings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'residency_feature', id, featured }),
    })
    if (res.ok) setRows(current => current.map((row: any) => row.id === id ? { ...row, is_featured: featured } : row))
    setBusyId(null)
  }

  async function decide(id: string, decision: 'approved' | 'rejected', why?: string) {
    setError('')
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'residency_decision', id, decision, reason: why }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not update.'); return }
      setRejecting(null); setReason('')
      await load()
    } catch { setError('Something went wrong - please try again.') } finally { setBusyId(null) }
  }

  const pending = rows.filter(r => r.approval_status === 'pending')
  const approved = rows.filter(r => r.approval_status === 'approved')
  const rejected = rows.filter(r => r.approval_status === 'rejected')
  const rest = rows.filter(r => r.approval_status !== 'pending')
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700', approved: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-700',
  }

  const card = (r: any) => (
    <div key={r.id} className={`dashboard-card ${r.approval_status === 'pending' ? 'border-amber-200 ring-1 ring-amber-100' : ''}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-semibold text-ink">{r.full_name || 'Specialist'}</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[r.approval_status] || 'bg-gray-100 text-gray-500'}`}>{r.approval_status}</span>
          </div>
          <p className="text-sm text-gray-500">{r.primary_specialism}{r.current_location ? ` · ${r.current_location}` : ''}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {r.weekly_rate ? `£${r.weekly_rate}/week` : ''}{r.day_rate ? ` · £${r.day_rate}/day` : ''}{r.negotiable ? ' · negotiable' : ''}
          </p>
          {r.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2 max-w-3xl">{r.bio}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
          <button onClick={() => setSelected(r)} className="btn-secondary !py-2 !px-3 inline-flex items-center gap-1 text-[12px]" title="View"><Eye size={14} /> View</button>
          {r.approval_status !== 'approved' && (
            <button onClick={() => decide(r.id, 'approved')} disabled={busyId === r.id}
              className="btn-primary !py-2 text-[12px] flex items-center gap-1 disabled:opacity-50"><Check size={13} /> Approve</button>
          )}
          {r.approval_status === 'approved' && (
            <button onClick={() => toggleFeatured(r.id, !r.is_featured)} disabled={busyId === r.id}
              className={`!py-2 text-[12px] rounded-lg px-3 font-semibold disabled:opacity-50 ${r.is_featured ? 'bg-[#f5eedd] text-[#10283b] border border-[#e5e5e5]' : 'btn-secondary'}`}>
              {r.is_featured ? '★ Featured' : 'Feature'}</button>
          )}
          {r.approval_status !== 'rejected' && (
            <button onClick={() => { setRejecting(r); setReason('') }} disabled={busyId === r.id}
              className="btn-secondary !py-2 text-[12px] !text-red-600 disabled:opacity-50">Reject</button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-8">
        <p className="dashboard-eyebrow">Residency marketplace</p>
        <h1 className="dashboard-title">Residency Listings</h1>
        <p className="dashboard-intro">Approve specialist listings before they appear in the Residency marketplace. Review positioning, location, rates and qualifications without exposing direct contact details.</p>
      </div>

      {!loading && rows.length > 0 && (
        <div className="dashboard-metrics mb-8">
          <div className="dashboard-metric"><Clock3 size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{pending.length}</p><p className="dashboard-metric-label">Awaiting approval</p></div>
          <div className="dashboard-metric"><CalendarCheck size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{approved.length}</p><p className="dashboard-metric-label">Approved</p></div>
          <div className="dashboard-metric"><X size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{rejected.length}</p><p className="dashboard-metric-label">Rejected</p></div>
          <div className="dashboard-metric"><Eye size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{rows.length}</p><p className="dashboard-metric-label">Total listings</p></div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6 border border-red-100">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : rows.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <CalendarCheck size={42} className="mx-auto mb-4 opacity-30" />
          <p>No residency listings yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-10">
              <p className="dashboard-eyebrow">Action required</p>
              <h2 className="dashboard-section-title mb-4">Awaiting approval ({pending.length})</h2>
              <div className="space-y-3">{pending.map(card)}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <p className="dashboard-eyebrow">Marketplace history</p>
              <h2 className="dashboard-section-title mb-4">All listings</h2>
              <div className="space-y-3">{rest.map(card)}</div>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-7 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div><p className="dashboard-eyebrow">Specialist listing</p><h2 className="text-2xl font-semibold text-ink">{selected.full_name || 'Specialist'}</h2></div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{selected.primary_specialism}{selected.current_location ? ` · ${selected.current_location}` : ''}</p>
            {selected.bio && <p className="text-sm text-gray-600 whitespace-pre-wrap mb-5 leading-7">{selected.bio}</p>}
            <div className="dashboard-rule pt-4 text-sm text-gray-500 space-y-2">
              {selected.weekly_rate && <p>Weekly rate: <span className="text-ink">£{selected.weekly_rate}</span></p>}
              {selected.day_rate && <p>Day rate: <span className="text-ink">£{selected.day_rate}</span></p>}
              {selected.monthly_rate && <p>Monthly rate: <span className="text-ink">£{selected.monthly_rate}</span></p>}
              {Array.isArray(selected.secondary_specialisms) && selected.secondary_specialisms.length > 0 && <p>Also offers: {selected.secondary_specialisms.join(', ')}</p>}
              {Array.isArray(selected.qualifications) && selected.qualifications.length > 0 && <p>Qualifications: {selected.qualifications.join(', ')}</p>}
              {selected.available_from && <p>Available from: {new Date(selected.available_from).toLocaleDateString('en-GB')}</p>}
            </div>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white max-w-md w-full p-6 border border-border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-ink mb-2">Reject listing</h2>
            <p className="text-sm text-gray-500 mb-4">{rejecting.full_name} will be told why by email and in-app so they can correct the listing and resubmit.</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input-field mb-4" placeholder="Reason shown to the specialist..." />
            <div className="flex gap-3">
              <button onClick={() => setRejecting(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => decide(rejecting.id, 'rejected', reason)} disabled={busyId === rejecting.id}
                className="btn-primary flex-1 disabled:opacity-50">{busyId === rejecting.id ? 'Saving...' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
