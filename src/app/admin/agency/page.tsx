'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Banknote, CheckCircle2 } from 'lucide-react'

// WHC's agency money view: what each property has paid in, what each
// therapist is owed, and a one-click "mark paid out" once the bank
// transfer to the therapist has been made.

export default function AdminAgencyPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [resolveInputs, setResolveInputs] = useState<Record<string, { refund: string; payout: string }>>({})
  const [credits, setCredits] = useState<any[]>([])

  async function load() {
    try {
      const res = await fetch('/api/admin/agency')
      if (res.ok) {
        const j = await res.json()
        setBookings(j.bookings || [])
        setCredits(j.referral_credits || [])
      }
    } catch { /* empty state */ }
    setLoading(false)
  }

  async function creditApplied(referralId: string) {
    setError('')
    setBusyId(referralId)
    try {
      const res = await fetch('/api/admin/agency', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'referral_credit_applied', referralId }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not update.'); return }
      await load()
    } catch { setError('Something went wrong - please try again.') } finally { setBusyId(null) }
  }

  useEffect(() => { load() }, [])

  async function markPaidOut(bookingId: string) {
    setError('')
    setBusyId(bookingId)
    try {
      const res = await fetch('/api/admin/agency', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid_out', bookingId }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not update.'); return }
      await load()
    } catch {
      setError('Something went wrong - please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function resolveDispute(bookingId: string) {
    setError('')
    setBusyId(bookingId)
    try {
      const inputs = resolveInputs[bookingId] || { refund: '0', payout: '' }
      const res = await fetch('/api/admin/agency', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_dispute', bookingId,
          refundAmount: inputs.refund === '' ? 0 : parseInt(inputs.refund, 10) || 0,
          payoutAmount: inputs.payout === '' ? undefined : parseInt(inputs.payout, 10) || 0,
        }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not resolve.'); return }
      await load()
    } catch {
      setError('Something went wrong - please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const paidIn = bookings.filter(b => b.paid_at)
  const owed = paidIn.filter(b => b.payout_status === 'pending' && b.dispute_status !== 'open')
  const disputes = bookings.filter(b => b.dispute_status === 'open')
  const totalCollected = paidIn.reduce((s, b) => s + (b.amount_paid || 0), 0)
  const totalRefunded = bookings.reduce((s, b) => s + (b.refund_amount || 0), 0)
  const totalOwed = owed.reduce((s, b) => s + (b.payout_amount || 0), 0)
  const margin = paidIn.reduce((s, b) => s + ((b.amount_paid || 0) - (b.payout_status === 'cancelled' ? 0 : (b.payout_amount || 0)) - (b.refund_amount || 0)), 0)

  return (
    <DashboardShell role="admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Agency Money</h1>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Referral credits to apply in Stripe */}
          {credits.length > 0 && (
            <div className="dashboard-card border-amber-200 ring-1 ring-amber-100 mb-6">
              <h2 className="text-[16px] font-medium text-ink mb-1">Referral credits to apply ({credits.length})</h2>
              <p className="text-[12px] text-gray-500 mb-3">Each referrer below is owed a free month on their register listing - apply a one-month coupon to their subscription in Stripe, then mark it done.</p>
              <div className="space-y-2">
                {credits.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span><span className="font-medium text-ink">{c.referrer_name}</span> referred {c.referred_name}{c.converted_at ? ` · joined ${new Date(c.converted_at).toLocaleDateString('en-GB')}` : ''}</span>
                    <button onClick={() => creditApplied(c.id)} disabled={busyId === c.id}
                      className="text-[12px] font-medium text-green-700 hover:underline disabled:opacity-50 shrink-0">
                      {busyId === c.id ? '...' : 'Credit applied'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="dashboard-card"><p className="eyebrow mb-1">Collected from properties</p><p className="text-[22px] font-semibold text-ink">£{totalCollected}</p></div>
            <div className="dashboard-card"><p className="eyebrow mb-1">Owed to therapists</p><p className="text-[22px] font-semibold text-amber-600">£{totalOwed}</p></div>
            <div className="dashboard-card"><p className="eyebrow mb-1">Refunded</p><p className="text-[22px] font-semibold text-gray-600">£{totalRefunded}</p></div>
            <div className="dashboard-card"><p className="eyebrow mb-1">WHC margin</p><p className="text-[22px] font-semibold text-green-700">£{margin}</p></div>
          </div>

          {/* Open disputes - resolve before paying out */}
          {disputes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[16px] font-medium text-ink mb-3">Open disputes ({disputes.length})</h2>
              <div className="space-y-4">
                {disputes.map(b => {
                  const inputs = resolveInputs[b.id] || { refund: '', payout: String(b.payout_amount ?? '') }
                  const setInputs = (patch: Partial<{ refund: string; payout: string }>) =>
                    setResolveInputs(prev => ({ ...prev, [b.id]: { ...inputs, ...patch } }))
                  return (
                    <div key={b.id} className="bg-white border border-red-200 ring-1 ring-red-100 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <p className="text-[14px] font-medium text-ink">{b.employer_name} vs {b.candidate_name} - {b.shift_date ? new Date(b.shift_date).toLocaleDateString('en-GB') : 'date TBC'}</p>
                        <p className="text-[12px] text-gray-500">Paid in £{b.amount_paid || '-'} · payout was £{b.payout_amount || '-'}{b.stripe_payment_intent ? ` · Stripe PI ${b.stripe_payment_intent}` : ''}</p>
                      </div>
                      <p className="text-[13px] text-secondary mb-1"><span className="font-medium">What happened:</span> {b.dispute_reason}</p>
                      {b.dispute_requested && <p className="text-[13px] text-secondary mb-3"><span className="font-medium">Property asked for:</span> {b.dispute_requested}</p>}
                      <div className="flex items-end flex-wrap gap-3">
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">Refund to property (£)</label>
                          <input type="number" min={0} value={inputs.refund} onChange={e => setInputs({ refund: e.target.value })} className="input-field !py-1.5 text-[13px] w-36" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">Adjusted payout to therapist (£)</label>
                          <input type="number" min={0} value={inputs.payout} onChange={e => setInputs({ payout: e.target.value })} className="input-field !py-1.5 text-[13px] w-36" />
                        </div>
                        <button onClick={() => resolveDispute(b.id)} disabled={busyId === b.id}
                          className="btn-primary text-[12px] disabled:opacity-50">{busyId === b.id ? 'Resolving...' : 'Resolve'}</button>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Issue any actual refund in the Stripe dashboard against the payment intent above - the 10% admin fee is normally retained. Set payout to 0 for a no-show.</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="dashboard-card text-center py-16 text-gray-400">
              <Banknote size={48} className="mx-auto mb-4 opacity-50" />
              <p>No agency bookings yet.</p>
            </div>
          ) : (
            <div className="dashboard-card overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-border">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Property</th>
                    <th className="py-2 pr-4">Therapist</th>
                    <th className="py-2 pr-4">Rate</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Paid in</th>
                    <th className="py-2 pr-4">Payout due</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-4 whitespace-nowrap">{b.shift_date ? new Date(b.shift_date).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-2.5 pr-4">{b.employer_name}</td>
                      <td className="py-2.5 pr-4">{b.candidate_name}{b.candidate_phone ? <span className="block text-[11px] text-gray-400">{b.candidate_phone}</span> : null}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">£{b.rate}/hr{b.hours ? ` × ${b.hours}h` : ''}</td>
                      <td className="py-2.5 pr-4 capitalize">
                        {b.status}
                        {b.dispute_status === 'open' && <span className="ml-1.5 text-[10px] font-semibold uppercase bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">dispute</span>}
                        {b.dispute_status === 'resolved' && <span className="ml-1.5 text-[10px] font-medium uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">resolved</span>}
                      </td>
                      <td className="py-2.5 pr-4">{b.paid_at ? `£${b.amount_paid || '-'} on ${new Date(b.paid_at).toLocaleDateString('en-GB')}` : <span className="text-gray-400">not paid</span>}</td>
                      <td className="py-2.5 pr-4">{b.payout_amount ? `£${b.payout_amount}` : '-'}</td>
                      <td className="py-2.5 text-right">
                        {b.paid_at && b.payout_status !== 'paid' && (
                          <button onClick={() => markPaidOut(b.id)} disabled={busyId === b.id}
                            className="btn-secondary text-[11px] disabled:opacity-50 whitespace-nowrap">
                            {busyId === b.id ? 'Saving...' : 'Mark paid out'}
                          </button>
                        )}
                        {b.payout_status === 'paid' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-700"><CheckCircle2 size={12} /> Paid out{b.payout_at ? ` ${new Date(b.payout_at).toLocaleDateString('en-GB')}` : ''}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
