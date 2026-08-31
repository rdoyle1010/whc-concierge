'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Clock, Banknote, CheckCircle2 } from 'lucide-react'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import AgencyCaseAgreementPanel from '@/components/AgencyCaseAgreementPanel'

const EMPLOYER_ISSUE_OPTIONS = [
  ['no_show','Professional did not attend / no-show'],
  ['late_arrival','Professional arrived late'],
  ['left_early','Professional left shift early'],
  ['shift_changed','Shift hours were different from agreed'],
  ['extra_hours','Approve / report additional hours worked'],
  ['retail_commission','Retail commission adjustment'],
  ['treatment_commission','Treatment / service commission adjustment'],
  ['tips_service_charge','Tips or service charge adjustment'],
  ['expenses','Expenses adjustment'],
  ['professional_cancelled','Professional cancelled the shift'],
  ['conduct_concern','Conduct / standards concern'],
  ['incorrect_payment','Incorrect payment'],
  ['other','Other'],
]

const TALENT_ISSUE_OPTIONS = [
  ['property_cancelled','Property cancelled or ended my shift early'],
  ['extra_hours','I worked additional hours'],
  ['shift_changed','My shift hours were changed'],
  ['retail_commission','Retail commission is owed'],
  ['treatment_commission','Treatment / service commission is owed'],
  ['tips_service_charge','Tips or service charge is owed'],
  ['expenses','Expenses are owed'],
  ['incorrect_payment','My payment is incorrect'],
  ['conduct_concern','Property conduct / working conditions concern'],
  ['other','Other issue with this shift'],
]

const ALL_ISSUE_OPTIONS = [...EMPLOYER_ISSUE_OPTIONS, ...TALENT_ISSUE_OPTIONS]
const agencyFeePct = Math.round(AGENCY_PLATFORM_FEE_PCT * 100)

export default function AgencyResolutionCentre({ role }: { role: 'talent'|'employer' }) {
  const supabase = createClient()
  const issueOptions = role === 'talent' ? TALENT_ISSUE_OPTIONS : EMPLOYER_ISSUE_OPTIONS
  const defaultIssue = role === 'talent' ? 'property_cancelled' : 'no_show'
  const [userId, setUserId] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [responses, setResponses] = useState<Record<string,string>>({})
  const [form, setForm] = useState({ issueType: defaultIssue, description: '', actualStartTime: '', actualEndTime: '', requestedAdjustmentType: 'none', requestedAmount: '', requestedReason: '' })

  async function load() {
    setLoading(true)
    const [{ data: auth }, bookingRes, casesRes] = await Promise.all([
      supabase.auth.getUser(), fetch('/api/agency/booking'), fetch('/api/agency/cases'),
    ])
    setUserId(auth.user?.id || '')
    if (bookingRes.ok) {
      const j = await bookingRes.json()
      setBookings((j.bookings || []).filter((b: any) => b.viewer_role === (role === 'talent' ? 'candidate' : 'employer')))
    }
    if (casesRes.ok) setCases((await casesRes.json()).cases || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (role === 'employer') {
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('session_id')
      if (params.get('adjustment') === 'processing' && sessionId) {
        fetch('/api/agency/cases/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
          .then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
          .then(result => { if (result.ok) { setNotice('Additional shift payment confirmed. The case is closed and the professional payout has been updated.'); load() } else setError(result.body.error || 'The additional payment could not be confirmed.') })
          .catch(() => setError('The additional payment could not be confirmed.'))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const eligible = useMemo(() => bookings.filter(b => ['confirmed','completed'].includes(b.status)), [bookings])
  const activeCaseByBooking = useMemo(() => new Map(cases.filter(c => ['open','awaiting_response','under_review','awaiting_agreement','awaiting_payment'].includes(c.status)).map(c => [c.booking_id, c])), [cases])

  async function openCase() {
    if (!opening) return
    setBusy(true); setError('')
    const res = await fetch('/api/agency/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'open', bookingId: opening.id, ...form }) })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) setError(j.error || 'Could not open this case.')
    else {
      setNotice(role === 'talent' ? 'Your issue has been sent to WHC. Any affected payout will be protected while the case is reviewed.' : 'Case opened. The payout is on hold while the professional responds and WHC reviews the issue.')
      setOpening(null)
      setForm({ issueType: defaultIssue, description: '', actualStartTime: '', actualEndTime: '', requestedAdjustmentType: 'none', requestedAmount: '', requestedReason: '' })
      await load()
    }
    setBusy(false)
  }

  async function respond(caseId: string) {
    const response = (responses[caseId] || '').trim()
    if (!response) return
    setBusy(true); setError('')
    const res = await fetch('/api/agency/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'respond', caseId, response }) })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) setError(j.error || 'Could not save your response.')
    else { setNotice('Response sent to WHC for review.'); await load() }
    setBusy(false)
  }

  async function payAdjustment(row: any) {
    setBusy(true); setError('')
    const res = await fetch('/api/agency/cases/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: row.id, returnUrl: window.location.origin }) })
    const j = await res.json().catch(() => ({}))
    if (!res.ok || !j.url) { setError(j.error || 'Could not open payment.'); setBusy(false); return }
    window.location.href = j.url
  }

  if (loading) return <div className="skeleton h-72 rounded-xl" />

  return <div className="space-y-7">
    {notice && <div role="status" className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">{notice}</div>}
    {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}

    <div className="dashboard-card">
      <div className="flex gap-3 items-start"><AlertTriangle size={20} className="text-accent mt-0.5"/><div><h2 className="font-serif text-xl text-ink">Shift Resolution Centre</h2><p className="text-sm text-secondary mt-1">{role === 'talent' ? 'Use this if a property changes or ends your shift, you work extra hours, or you are owed commission, service charge, expenses or other money. You can also report a property conduct or working-conditions concern.' : 'Use this for attendance, late arrival, early departure, cancellations, changed hours, payment adjustments or conduct concerns. Opening a case places the professional payout on hold until it is reviewed.'}</p></div></div>
    </div>

    <section>
      <h2 className="text-lg font-medium text-ink mb-3">Your eligible shifts</h2>
      {!eligible.length ? <div className="dashboard-card text-sm text-secondary">No confirmed or completed Agency shifts are available for a case yet.</div> : <div className="space-y-3">{eligible.map(b => {
        const existing = activeCaseByBooking.get(b.id)
        return <div key={b.id} className="dashboard-card flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><p className="font-medium text-ink">{role === 'talent' ? b.employer_name : b.candidate_name}</p><div className="text-xs text-secondary mt-1 flex flex-wrap gap-3"><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString('en-GB') : 'Date TBC'}</span><span className="inline-flex items-center gap-1"><Clock size={12}/>{b.shift_start_time ? String(b.shift_start_time).slice(0,5) : ''}{b.shift_end_time ? `–${String(b.shift_end_time).slice(0,5)}` : ''}</span><span className="inline-flex items-center gap-1"><Banknote size={12}/>£{b.rate}/hr</span></div></div>{existing ? <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-full">Case {String(existing.status).replace(/_/g,' ')}</span> : <button className="btn-secondary text-xs" onClick={() => { setOpening(b); setError(''); setForm(v => ({ ...v, issueType: defaultIssue })) }}>{role === 'talent' ? 'Report shift issue / money owed' : 'Raise issue / payment adjustment'}</button>}</div>
      })}</div>}
    </section>

    {cases.length > 0 && <section><h2 className="text-lg font-medium text-ink mb-3">Cases</h2><div className="space-y-4">{cases.map(row => <div key={row.id} className="dashboard-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-accent">Case {row.id.slice(0,8).toUpperCase()}</p><h3 className="font-medium text-ink mt-1">{ALL_ISSUE_OPTIONS.find(x => x[0] === row.issue_type)?.[1] || row.issue_type}</h3><p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{row.description}</p></div><span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full capitalize">{String(row.status).replace(/_/g,' ')}</span></div>
      {(row.actual_start_time || row.actual_end_time) && <p className="text-xs text-secondary mt-3">Reported actual time: {row.actual_start_time ? String(row.actual_start_time).slice(0,5) : '-'}–{row.actual_end_time ? String(row.actual_end_time).slice(0,5) : '-'}</p>}
      {row.requested_adjustment_type !== 'none' && <p className="text-sm mt-3"><strong>Requested:</strong> {row.requested_adjustment_type === 'refund' ? 'Refund / reduction' : 'Additional payment'}{row.requested_amount ? ` £${row.requested_amount}` : ''}{row.requested_reason ? ` - ${row.requested_reason}` : ''}</p>}
      {row.counterparty_response && <div className="mt-4 bg-[#f5f6f8] p-3 text-sm"><strong>Other party response:</strong><p className="mt-1 whitespace-pre-wrap">{row.counterparty_response}</p></div>}
      {row.resolution && <div className="mt-4 bg-green-50 p-3 text-sm"><strong>WHC resolution:</strong><p className="mt-1 whitespace-pre-wrap">{row.resolution}</p>{row.adjusted_payout_amount != null && <p className="mt-2">Professional payout: £{row.adjusted_payout_amount}</p>}{row.approved_refund_amount > 0 && <p>Refund: £{row.approved_refund_amount}</p>}{row.approved_extra_amount > 0 && <p>Additional professional payment: £{row.approved_extra_amount}</p>}</div>}
      {row.status === 'awaiting_response' && row.opened_by_user_id !== userId && <div className="mt-4"><textarea aria-label="Your response" value={responses[row.id] || ''} onChange={e => setResponses(v => ({ ...v, [row.id]: e.target.value }))} className="input-field min-h-24" placeholder="Give your version of what happened, including any hours, sales, expenses or other facts WHC should consider."/><button disabled={busy} onClick={() => respond(row.id)} className="btn-primary mt-2 text-xs">Send response</button></div>}
      {row.status === 'awaiting_response' && row.opened_by_user_id === userId && <p className="text-xs text-amber-700 mt-4">Waiting for the other party to respond.</p>}
      {row.status === 'under_review' && <p className="text-xs text-amber-700 mt-4">Both sides have been recorded. WHC Admin is reviewing the case.</p>}
      {row.status === 'awaiting_agreement' && <p className="text-xs text-amber-700 mt-4">WHC has proposed a resolution. Review it and sign in the case discussion and agreement section below.</p>}
      {role === 'employer' && row.status === 'awaiting_payment' && row.extra_payment_status === 'pending' && <div className="mt-4 flex items-center justify-between gap-4 bg-[#f5f6f8] p-4"><div><p className="font-medium text-ink">Additional payment approved</p><p className="text-xs text-gray-600 mt-1">Professional: £{row.approved_extra_amount} + {agencyFeePct}% WHC fee £{Math.ceil(Number(row.approved_extra_amount || 0) * AGENCY_PLATFORM_FEE_PCT)}.</p></div><button disabled={busy} onClick={() => payAdjustment(row)} className="btn-primary text-xs">Pay £{Number(row.approved_extra_amount || 0) + Math.ceil(Number(row.approved_extra_amount || 0) * AGENCY_PLATFORM_FEE_PCT)}</button></div>}
      {row.status === 'resolved' && <p className="text-xs text-green-700 mt-4 inline-flex items-center gap-1"><CheckCircle2 size={13}/>Case closed</p>}
    </div>)}</div></section>}

    <AgencyCaseAgreementPanel role={role} />

    {opening && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpening(null)}><div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl" onClick={e => e.stopPropagation()}><h2 className="font-serif text-2xl text-ink">{role === 'talent' ? 'Report a shift issue or money owed' : 'Raise a shift issue or adjustment'}</h2><p className="text-xs text-secondary mt-1">{role === 'talent' ? 'Tell WHC what happened. We will review it with the property and protect any affected payment while the case is open.' : 'WHC will hold the payout while the case is reviewed.'}</p><div className="space-y-4 mt-5"><label className="block text-xs font-medium">What happened?<select value={form.issueType} onChange={e => setForm(v => ({ ...v, issueType: e.target.value }))} className="input-field mt-1">{issueOptions.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label><label className="block text-xs font-medium">Explain what happened<textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} className="input-field min-h-28 mt-1" placeholder={role === 'talent' ? 'Tell us what changed, what you worked, what you are owed, or what concern you want WHC to review.' : 'Include the facts WHC needs to review.'}/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-medium">Actual start<input type="time" value={form.actualStartTime} onChange={e => setForm(v => ({ ...v, actualStartTime: e.target.value }))} className="input-field mt-1"/></label><label className="text-xs font-medium">Actual finish<input type="time" value={form.actualEndTime} onChange={e => setForm(v => ({ ...v, actualEndTime: e.target.value }))} className="input-field mt-1"/></label></div><label className="block text-xs font-medium">{role === 'talent' ? 'Are you asking for additional money?' : 'What adjustment are you asking for?'}<select value={form.requestedAdjustmentType} onChange={e => setForm(v => ({ ...v, requestedAdjustmentType: e.target.value }))} className="input-field mt-1">{role === 'talent' ? <><option value="none">No - report the issue only</option><option value="additional_payment">Yes - additional payment is owed</option></> : <><option value="none">No money adjustment - report issue only</option><option value="refund">Refund / reduce payment</option><option value="additional_payment">Additional payment owed</option></>}</select></label>{form.requestedAdjustmentType !== 'none' && <><label className="block text-xs font-medium">Amount requested (£)<input type="number" min="0" step="0.01" value={form.requestedAmount} onChange={e => setForm(v => ({ ...v, requestedAmount: e.target.value }))} className="input-field mt-1"/></label><label className="block text-xs font-medium">Why is this amount due?<textarea value={form.requestedReason} onChange={e => setForm(v => ({ ...v, requestedReason: e.target.value }))} className="input-field min-h-20 mt-1" placeholder={role === 'talent' ? 'For example: 1.5 extra hours, £500 retail at 10%, parking expense or agreed service charge.' : 'For example: hours not worked, extra hours, commission or expenses.'}/></label></>}<div className="flex gap-2 justify-end"><button onClick={() => setOpening(null)} className="btn-secondary">Cancel</button><button disabled={busy} onClick={openCase} className="btn-primary">{role === 'talent' ? 'Send to WHC' : 'Open case'}</button></div></div></div></div>}

    <p className="text-xs text-muted">For normal messages that do not involve attendance, conduct or money, use <Link href={role === 'talent' ? '/talent/messages' : '/employer/messages'} className="underline">Messages</Link>.</p>
  </div>
}
