'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { MANUAL_VERIFICATION_TYPES } from '@/lib/verification-badges'
import { ShieldCheck, FileText, X, Clock3 } from 'lucide-react'

export default function AdminVerificationPage() {
  const [rows, setRows] = useState<any[]>([])
  const [verifications, setVerifications] = useState<Record<string, string[]>>({})
  const [verificationsAvailable, setVerificationsAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyMark, setBusyMark] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState<any>(null)
  const [reason, setReason] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/admin/verification')
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error || 'Could not load verification submissions.'); setRows([]) }
      else {
        setRows(j.rows || [])
        setVerifications(j.verifications || {})
        setVerificationsAvailable(j.verifications_available !== false)
      }
    } catch { setError('Could not load verification submissions.') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleMark(candidateId: string, type: string, granted: boolean) {
    setError('')
    setBusyMark(`${candidateId}:${type}`)
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: granted ? 'revoke_verification' : 'grant_verification', candidateId, type }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error || 'Could not update verification marks.'); return }
      setVerifications(prev => {
        const current = prev[candidateId] || []
        const next = granted ? current.filter(t => t !== type) : [...current, type]
        return { ...prev, [candidateId]: next }
      })
    } catch { setError('Something went wrong - please try again.') } finally { setBusyMark(null) }
  }

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
  const verified = rows.filter(r => r.verification_status === 'verified')
  const attention = rows.filter(r => r.verification_status === 'lapsed' || r.verification_status === 'rejected')
  const rest = rows.filter(r => r.verification_status !== 'pending')

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700', verified: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700', lapsed: 'bg-gray-100 text-gray-500',
  }

  const card = (r: any) => (
    <div key={r.id} className={`dashboard-card ${r.verification_status === 'pending' ? 'border-amber-200 ring-1 ring-amber-100' : ''}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-semibold text-ink">{r.full_name || 'Therapist'}</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[r.verification_status] || 'bg-gray-100 text-gray-500'}`}>{r.verification_status}</span>
            {r.whc_verified && <ShieldCheck size={15} className="text-green-600" />}
          </div>
          <p className="text-sm text-gray-500">{r.role_level || 'Therapist'}{r.review_score ? ` · ${Number(r.review_score).toFixed(1)}★ (${r.review_count})` : ''}</p>
          <div className="mt-2 border border-border bg-surface px-3 py-2.5 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">Right to work</p>
            <p className="text-[12px] text-gray-600 mt-1">
              {r.right_to_work_uk || r.right_to_work_ireland
                ? <>Declared: {[r.right_to_work_uk ? 'United Kingdom' : null, r.right_to_work_ireland ? 'Ireland' : null].filter(Boolean).join(' and ')}</>
                : 'No country declared yet'}
              {' · '}Expiry: {r.right_to_work_expiry_date ? new Date(r.right_to_work_expiry_date).toLocaleDateString('en-GB') : 'none given'}
              {r.right_to_work_expiry_date && new Date(r.right_to_work_expiry_date).getTime() < Date.now() && <span className="text-red-600 font-medium"> - EXPIRED</span>}
            </p>
            {r.right_to_work_document_url ? (
              <a href={r.right_to_work_document_url} target="_blank" rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"><FileText size={12} /> Right-to-work evidence</a>
            ) : (
              <p className="text-[12px] text-amber-700 mt-1.5">No right-to-work document uploaded - do not verify without evidence.</p>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Insurance expiry: {r.insurance_expiry_date ? new Date(r.insurance_expiry_date).toLocaleDateString('en-GB') : 'not given'}
            {r.insurance_expiry_date && new Date(r.insurance_expiry_date).getTime() < Date.now() + 30 * 86400000 && (
              <span className="text-amber-600 font-medium"> - {new Date(r.insurance_expiry_date).getTime() < Date.now() ? 'EXPIRED' : 'expires within 30 days'}</span>
            )}
          </p>
          {Array.isArray(r.qualifications) && r.qualifications.length > 0 && (
            <p className="text-[12px] text-gray-500 mt-1">Claimed qualifications: {r.qualifications.join(', ')}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
            {r.insurance_document_url && (
              <a href={r.insurance_document_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"><FileText size={12} /> Insurance certificate</a>
            )}
            {(Array.isArray(r.verification_docs) ? r.verification_docs : []).map((d: any, i: number) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"><FileText size={12} /> {d.name || `Document ${i + 1}`}</a>
            ))}
          </div>
          {verificationsAvailable && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">Verifications</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MANUAL_VERIFICATION_TYPES.map(mark => {
                  const granted = (verifications[r.id] || []).includes(mark.type)
                  const busy = busyMark === `${r.id}:${mark.type}`
                  return (
                    <button key={mark.type} onClick={() => toggleMark(r.id, mark.type, granted)} disabled={busy}
                      title={granted ? `Revoke: ${mark.label}` : `Grant: ${mark.label}`}
                      className={`px-2.5 py-1 text-[11px] font-medium border transition-colors disabled:opacity-50 ${granted ? 'bg-accent border-accent text-white' : 'bg-white border-border text-secondary hover:border-accent hover:text-accent'}`}>
                      {mark.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {r.verification_notes && <p className="text-[12px] text-gray-400 mt-3">Last decision note: {r.verification_notes}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
          {(!r.whc_verified || r.verification_status === 'pending' || r.right_to_work_status === 'pending') && (
            <button onClick={() => decide(r.id, 'verified')} disabled={busyId === r.id}
              className="btn-primary !py-2 text-[12px] flex items-center gap-1 disabled:opacity-50"><ShieldCheck size={13} /> {r.whc_verified ? 'Approve resubmission' : 'Verify'}</button>
          )}
          {r.verification_status !== 'rejected' && (
            <button onClick={() => { setRejecting(r); setReason('') }} disabled={busyId === r.id}
              className="btn-secondary !py-2 text-[12px] !text-red-600 disabled:opacity-50">{r.whc_verified ? 'Revoke' : 'Reject'}</button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-8">
        <p className="dashboard-eyebrow">Trust & compliance</p>
        <h1 className="dashboard-title">Verification</h1>
        <p className="dashboard-intro">Review right-to-work evidence alongside insurance and qualification documents before awarding WHC Verified. Your decision covers right-to-work AND insurance evidence together. Expired insurance automatically pauses the badge until valid cover is supplied.</p>
      </div>

      {!loading && rows.length > 0 && (
        <div className="dashboard-metrics mb-8">
          <div className="dashboard-metric"><Clock3 size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{pending.length}</p><p className="dashboard-metric-label">Awaiting review</p></div>
          <div className="dashboard-metric"><ShieldCheck size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{verified.length}</p><p className="dashboard-metric-label">Verified</p></div>
          <div className="dashboard-metric"><FileText size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{attention.length}</p><p className="dashboard-metric-label">Rejected or lapsed</p></div>
          <div className="dashboard-metric"><FileText size={16} className="text-accent mb-3" /><p className="dashboard-metric-value">{rows.length}</p><p className="dashboard-metric-label">Total records</p></div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6 border border-red-100">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : rows.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <ShieldCheck size={42} className="mx-auto mb-4 opacity-30" />
          <p>No verification submissions yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-10">
              <p className="dashboard-eyebrow">Action required</p>
              <h2 className="dashboard-section-title mb-4">Awaiting review ({pending.length})</h2>
              <div className="space-y-3">{pending.map(card)}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <p className="dashboard-eyebrow">History</p>
              <h2 className="dashboard-section-title mb-4">Decided</h2>
              <div className="space-y-3">{rest.map(card)}</div>
            </div>
          )}
        </>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-[#07243b]/70 z-50 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white max-w-md w-full p-6 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-ink">{rejecting.whc_verified ? 'Revoke badge' : 'Reject verification'}</h2>
              <button onClick={() => setRejecting(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">This decision covers both the right-to-work and insurance evidence. {rejecting.full_name} will be told why by email and in-app so they can correct the issue and resubmit.</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input-field mb-4" placeholder="Reason shown to the therapist..." />
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
