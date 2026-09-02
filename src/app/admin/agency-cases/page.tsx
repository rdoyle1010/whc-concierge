'use client'

import { useEffect, useState } from 'react'
import { useDialog } from '@/components/useDialog'
import DashboardShell from '@/components/DashboardShell'

const label = (value: string) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function AdminAgencyCasesPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ resolution: '', adminNotes: '', refundAmount: '0', extraAmount: '0', adjustedPayoutAmount: '' })
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({})
  const [sendingFor, setSendingFor] = useState<string | null>(null)

  const resolveDialog = useDialog(() => setSelected(null), 'admin-agency-case-heading', { enabled: Boolean(selected) })

  async function load() {
    try {
      const res = await fetch('/api/admin/agency/cases')
      const j = await res.json().catch(() => ({}))
      if (!res.ok) setError(j.error || 'Could not load Agency cases.')
      else setCases(j.cases || [])
    } catch { setError('Could not load Agency cases.') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function sendMessage(caseId: string) {
    const message = (messageDrafts[caseId] || '').trim()
    if (!message || sendingFor) return
    setSendingFor(caseId); setError('')
    try {
      const res = await fetch('/api/admin/agency/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'message', caseId, message }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error || 'Could not send the message.'); return }
      setMessageDrafts(current => ({ ...current, [caseId]: '' }))
      await load()
    } catch { setError('Could not send the message.') } finally { setSendingFor(null) }
  }

  function choose(row: any) {
    setSelected(row); setError(''); setNotice('')
    const base = Number(row.booking?.payout_amount || ((row.booking?.rate || 0) * (row.booking?.hours || 8)))
    setForm({ resolution: '', adminNotes: '', refundAmount: '0', extraAmount: String(row.requested_adjustment_type === 'additional_payment' ? Number(row.requested_amount || 0) : 0), adjustedPayoutAmount: String(base + (row.requested_adjustment_type === 'additional_payment' ? Number(row.requested_amount || 0) : 0)) })
  }

  async function resolve() {
    if (!selected) return
    setBusy(true); setError('')
    const res = await fetch('/api/admin/agency/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', caseId: selected.id, ...form }) })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) setError(j.error || 'Could not resolve case.')
    else { setNotice(j.awaitingAgreement ? 'Resolution proposed. Both parties have been asked to agree the resolution.' : 'Case resolved and payout controls updated.'); setSelected(null); await load() }
    setBusy(false)
  }

  return <DashboardShell role="admin">
    <div className="mb-7"><p className="dashboard-eyebrow">Platform control</p><h1 className="dashboard-title">Agency Cases</h1><p className="dashboard-intro">Review attendance, conduct and money disputes. Payouts remain on hold until the case is resolved.</p></div>
    {notice && <div className="bg-green-50 text-green-800 border border-green-200 px-4 py-3 text-sm mb-5">{notice}</div>}
    {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm mb-5">{error}</div>}
    {loading ? <div className="skeleton h-72 rounded-xl"/> : !cases.length ? <div className="dashboard-card text-sm text-secondary">No Agency cases have been raised.</div> : <div className="space-y-4">{cases.map(row => <div key={row.id} className="dashboard-card"><div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"><div><div className="flex flex-wrap gap-2 items-center"><span className="text-[10px] uppercase tracking-wider text-accent">Case {row.id.slice(0,8).toUpperCase()}</span><span className={`text-xs rounded-full px-2.5 py-1 ${row.status === 'awaiting_agreement' ? 'bg-[#e7e7e7] text-[#1c1c1c] font-semibold' : 'bg-gray-100'}`}>{label(row.status)}</span></div><h2 className="font-medium text-ink mt-2">{row.candidate_name} · {row.employer_name}</h2><p className="text-xs text-secondary mt-1">Shift {row.booking?.shift_date ? new Date(row.booking.shift_date).toLocaleDateString('en-GB') : '-'} · {row.booking?.hours || 8}h · £{row.booking?.rate}/hr</p><p className="text-sm mt-3"><strong>{label(row.issue_type)}:</strong> {row.description}</p>{row.actual_start_time || row.actual_end_time ? <p className="text-xs mt-2">Reported actual time: {row.actual_start_time ? String(row.actual_start_time).slice(0,5) : '-'}–{row.actual_end_time ? String(row.actual_end_time).slice(0,5) : '-'}</p> : null}{row.requested_adjustment_type !== 'none' && <p className="text-sm mt-2"><strong>Requested:</strong> {label(row.requested_adjustment_type)}{row.requested_amount ? ` £${row.requested_amount}` : ''}{row.requested_reason ? ` - ${row.requested_reason}` : ''}</p>}{row.counterparty_response && <div className="bg-[#f1f1f1] p-3 mt-3 text-sm"><strong>Other party response</strong><p className="mt-1 whitespace-pre-wrap">{row.counterparty_response}</p></div>}{row.resolution && <div className="bg-green-50 p-3 mt-3 text-sm"><strong>Resolution</strong><p className="mt-1 whitespace-pre-wrap">{row.resolution}</p></div>}{row.status === 'awaiting_agreement' && row.proposed_resolution && <div className="bg-[#e7e7e7] p-3 mt-3 text-sm"><strong>Proposed resolution</strong><p className="mt-1 whitespace-pre-wrap">{row.proposed_resolution}</p><p className="mt-2 text-xs text-secondary">Refund £{Number(row.proposed_refund_amount || 0)} · Extra pay £{Number(row.proposed_extra_amount || 0)} · Final payout £{Number(row.proposed_payout_amount || 0)}</p></div>}
    {['awaiting_response','under_review','open','awaiting_agreement'].includes(row.status) && <div className="mt-4 border-t border-border pt-3">
      <p className="text-[10px] uppercase tracking-wider text-muted mb-2">Case thread</p>
      {(row.messages || []).length === 0 ? <p className="text-xs text-muted">No messages on this case yet.</p> : <div className="space-y-2 max-h-56 overflow-y-auto pr-1">{(row.messages || []).map((m: any) => <div key={m.id} className={`text-sm p-2.5 ${m.sender_role === 'admin' ? 'bg-[#e7e7e7]' : 'bg-surface'}`}><p className="text-[10px] uppercase tracking-wider text-muted">{label(m.sender_role || 'party')} · {m.created_at ? new Date(m.created_at).toLocaleString('en-GB') : ''}</p><p className="mt-1 whitespace-pre-wrap">{m.message}</p></div>)}</div>}
      <div className="mt-3 flex gap-2">
        <input value={messageDrafts[row.id] || ''} onChange={e => setMessageDrafts(current => ({ ...current, [row.id]: e.target.value }))} className="input-field flex-1 !py-2 text-[13px]" placeholder="Message both parties on this case..." />
        <button type="button" onClick={() => sendMessage(row.id)} disabled={sendingFor === row.id || !(messageDrafts[row.id] || '').trim()} className="btn-secondary text-xs disabled:opacity-50">{sendingFor === row.id ? 'Sending...' : 'Send'}</button>
      </div>
    </div>}</div>{['awaiting_response','under_review','open'].includes(row.status) && <button onClick={() => choose(row)} className="btn-primary text-xs">Review & resolve</button>}{row.status === 'awaiting_agreement' && <span className="text-xs font-semibold text-[#1c1c1c]">Both parties have been asked to agree the resolution</span>}{row.status === 'awaiting_payment' && <span className="text-xs font-semibold text-amber-700">Awaiting employer payment £{Number(row.approved_extra_amount || 0) + Math.ceil(Number(row.approved_extra_amount || 0)*.10)}</span>}</div></div>)}</div>}

    {selected && <div className="fixed inset-0 bg-[#0f0f0f]/70 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}><div {...resolveDialog.panelProps} className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 border border-border"><h2 id="admin-agency-case-heading" className="font-serif text-2xl text-ink">Resolve Agency case</h2><p className="text-xs text-secondary mt-1">A refund is returned through Stripe. An approved additional professional payment creates a separate employer checkout with the normal 10% WHC fee.</p><div className="space-y-4 mt-5"><label className="block text-xs font-medium">Resolution<textarea value={form.resolution} onChange={e => setForm(v => ({...v,resolution:e.target.value}))} className="input-field min-h-24 mt-1" placeholder="State the decision and why."/></label><label className="block text-xs font-medium">Internal admin notes<textarea value={form.adminNotes} onChange={e => setForm(v => ({...v,adminNotes:e.target.value}))} className="input-field min-h-20 mt-1"/></label><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="text-xs font-medium">Refund to employer £<input type="number" min="0" step="0.01" value={form.refundAmount} onChange={e => setForm(v=>({...v,refundAmount:e.target.value}))} className="input-field mt-1"/></label><label className="text-xs font-medium">Extra professional pay £<input type="number" min="0" step="0.01" value={form.extraAmount} onChange={e => { const extra=e.target.value; const base=Number(selected.booking?.payout_amount || ((selected.booking?.rate||0)*(selected.booking?.hours||8))); setForm(v=>({...v,extraAmount:extra,adjustedPayoutAmount:String(base+Number(extra||0))})) }} className="input-field mt-1"/></label><label className="text-xs font-medium">Final professional payout £<input type="number" min="0" step="0.01" value={form.adjustedPayoutAmount} onChange={e => setForm(v=>({...v,adjustedPayoutAmount:e.target.value}))} className="input-field mt-1"/></label></div><div className="flex justify-end gap-2"><button onClick={()=>setSelected(null)} className="btn-secondary">Cancel</button><button disabled={busy} onClick={resolve} className="btn-primary">Save resolution</button></div></div></div></div>}
  </DashboardShell>
}
