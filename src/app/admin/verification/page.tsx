'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { ShieldCheck, FileText, X } from 'lucide-react'

// WHC Verified approval desk: check the therapist's insurance certificate
// (and its expiry) plus qualification docs, then award or refuse the badge.

export default function AdminVerificationPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState<any>(null)
  const [reason, setReason] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/admin/verification')
      const j = res.ok ? await res.json() : { rows: [] }
      setRows(j.rows || [])
    } catch { /* empty */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function decide(id: string, decision: 'verified' | 'rejected', why?: string) {
    setError('')
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision, reason: why }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not update.'); return }
      setRejecting(null); setReason('')
      await load()
    } catch { setError('Something went wrong - please try again.') } finally { setBusyId(null) }
  }

  const pending = rows.filter(r => r.verification_status === 'pending')
  const rest = rows.filter(r => r.verification_status !== 'pending')
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700', verified: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700', lapsed: 'bg-gray-100 text-gray-500',
  }

  const card = (r: any) => (
    <div key={r.id} className={`dashboard-card ${r.verification_status === 'pending' ? 'border-amber-200 ring-1 ring-amber-100' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-serif text-lg font-semibold text-ink">{r.full_name || 'Therapist'}</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[r.verification_status] || 'bg-gray-100 text-gray-500'}`}>{r.verification_status}</span>
            {r.whc_verified && <ShieldCheck size={15} className="text-green-600" />}
          </div>
          <p className="text-sm text-gray-500">{r.role_level || 'Therapist'}{r.review_score ? ` · ${Number(r.review_score).toFixed(1)}★ (${r.review_count})` : ''}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Insurance expiry: {r.insurance_expiry_date ? new Date(r.insurance_expiry_date).toLocaleDateString('en-GB') : 'not given'}
            {r.insurance_expiry_date && new Date(r.insurance_expiry_date).getTime() < Date.now() + 30 * 86400000 && (
              <span className="text-amber-600 font-medium"> - {new Date(r.insurance_expiry_date).getTime() < Date.now() ? 'EXPIRED' : 'expires within 30 days'}</span>
            )}
          </p>
          {Array.isArray(r.qualifications) && r.qualifications.length > 0 && (
            <p className="text-[12px] text-gray-500 mt-1">Claimed qualifications: {r.qualifications.join(', ')}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {r.insurance_document_url && (
              <a href={r.insurance_document_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"><FileText size={12} /> Insurance certificate</a>
            )}
            {(Array.isArray(r.verification_docs) ? r.verification_docs : []).map((d: any, i: number) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"><FileText size={12} /> {d.name || `Document ${i + 1}`}</a>
            ))}
          </div>
          {r.verification_notes && <p className="text-[12px] text-gray-400 mt-2">Last decision note: {r.verification_notes}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!r.whc_verified && (
            <button onClick={() => decide(r.id, 'verified')} disabled={busyId === r.id}
              className="btn-primary !py-2 text-[12px] flex items-center gap-1 disabled:opacity-50"><ShieldCheck size={13} /> Verify</button>
          )}
          {r.verification_status !== 'rejected' && (
            <button onClick={() => { setRejecting(r); setReason('') }} disabled={busyId === r.id}
              className="text-[12px] font-medium text-red-600 hover:text-red-700 px-3 py-2 disabled:opacity-50">{r.whc_verified ? 'Revoke' : 'Reject'}</button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-2">Verification</h1>
      <p className="text-[13px] text-gray-500 mb-6">Check documents, award the WHC Verified badge. Expiring insurance is chased automatically; expired insurance pauses the badge.</p>
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : rows.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <ShieldCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p>No verification submissions yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[16px] font-medium text-ink mb-3">Awaiting review ({pending.length})</h2>
              <div className="space-y-4">{pending.map(card)}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <h2 className="text-[16px] font-medium text-ink mb-3">Decided</h2>
              <div className="space-y-4">{rest.map(card)}</div>
            </div>
          )}
        </>
      )}

      {/* Reject / revoke modal */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-lg font-bold text-ink">{rejecting.whc_verified ? 'Revoke badge' : 'Reject verification'}</h2>
              <button onClick={() => setRejecting(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{rejecting.full_name} will be told why, by email and in-app, so they can fix it and resubmit.</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input-field mb-3" placeholder="Reason (shown to the therapist)..." />
            <div className="flex gap-3">
              <button onClick={() => setRejecting(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => decide(rejecting.id, 'rejected', reason)} disabled={busyId === rejecting.id}
                className="btn-primary flex-1 disabled:opacity-50">{busyId === rejecting.id ? 'Saving...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
