'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { CalendarCheck, Check, X, Eye } from 'lucide-react'

// Residency listings previously went for "approval" with no approval UI
// anywhere - they sat pending forever. This is that missing desk.

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
  const rest = rows.filter(r => r.approval_status !== 'pending')
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700', approved: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-700',
  }

  const card = (r: any) => (
    <div key={r.id} className={`dashboard-card ${r.approval_status === 'pending' ? 'border-amber-200 ring-1 ring-amber-100' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-serif text-lg font-semibold text-ink">{r.full_name || 'Specialist'}</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[r.approval_status] || 'bg-gray-100 text-gray-500'}`}>{r.approval_status}</span>
          </div>
          <p className="text-sm text-gray-500">{r.primary_specialism}{r.current_location ? ` · ${r.current_location}` : ''}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {r.weekly_rate ? `£${r.weekly_rate}/week` : ''}{r.day_rate ? ` · £${r.day_rate}/day` : ''}{r.negotiable ? ' · negotiable' : ''}
          </p>
          {r.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{r.bio}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setSelected(r)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="View"><Eye size={17} /></button>
          {r.approval_status !== 'approved' && (
            <button onClick={() => decide(r.id, 'approved')} disabled={busyId === r.id}
              className="btn-primary !py-2 text-[12px] flex items-center gap-1 disabled:opacity-50"><Check size={13} /> Approve</button>
          )}
          {r.approval_status !== 'rejected' && (
            <button onClick={() => { setRejecting(r); setReason('') }} disabled={busyId === r.id}
              className="text-[12px] font-medium text-red-600 hover:text-red-700 px-3 py-2 disabled:opacity-50">Reject</button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Residency Listings</h1>
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : rows.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <CalendarCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p>No residency listings yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[16px] font-medium text-ink mb-3">Awaiting approval ({pending.length})</h2>
              <div className="space-y-4">{pending.map(card)}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <h2 className="text-[16px] font-medium text-ink mb-3">All listings</h2>
              <div className="space-y-4">{rest.map(card)}</div>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-serif text-xl font-bold text-ink">{selected.full_name || 'Specialist'}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{selected.primary_specialism}{selected.current_location ? ` · ${selected.current_location}` : ''}</p>
            {selected.bio && <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{selected.bio}</p>}
            <div className="text-sm text-gray-500 space-y-1">
              {selected.weekly_rate && <p>Weekly rate: £{selected.weekly_rate}</p>}
              {selected.day_rate && <p>Day rate: £{selected.day_rate}</p>}
              {selected.monthly_rate && <p>Monthly rate: £{selected.monthly_rate}</p>}
              {Array.isArray(selected.secondary_specialisms) && selected.secondary_specialisms.length > 0 && <p>Also offers: {selected.secondary_specialisms.join(', ')}</p>}
              {Array.isArray(selected.qualifications) && selected.qualifications.length > 0 && <p>Qualifications: {selected.qualifications.join(', ')}</p>}
              {selected.available_from && <p>Available from: {new Date(selected.available_from).toLocaleDateString('en-GB')}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-lg font-bold text-ink mb-2">Reject listing</h2>
            <p className="text-sm text-gray-500 mb-3">{rejecting.full_name} will be told why, by email and in-app, so they can fix it and resubmit.</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input-field mb-3" placeholder="Reason (shown to the specialist)..." />
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
