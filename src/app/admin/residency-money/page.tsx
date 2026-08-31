'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { AlertTriangle, Banknote, CalendarDays, CheckCircle2, RefreshCw } from 'lucide-react'

export default function AdminResidencyMoneyPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/residency-money', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(data.error || 'Could not load Residency money.')
      else setBookings(data.bookings || [])
    } catch { setError('Could not load Residency money.') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const metrics = useMemo(() => {
    const paid = bookings.filter(b => b.paid_at)
    return {
      collected: paid.reduce((sum, b) => sum + Number(b.amount_paid || 0), 0),
      fees: paid.reduce((sum, b) => sum + Number(b.platform_fee || 0), 0),
      pending: paid.filter(b => b.payout_status !== 'paid' && Number(b.payout_amount || 0) > 0).reduce((sum, b) => sum + Number(b.payout_amount || 0), 0),
      ready: paid.filter(b => b.payout_ready).length,
    }
  }, [bookings])

  async function action(bookingId: string, body: Record<string, any>) {
    setBusy(bookingId); setError('')
    try {
      const res = await fetch('/api/admin/residency-money', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, ...body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Could not update booking.'); return }
      await load()
    } catch { setError('Could not update booking.') } finally { setBusy(null) }
  }

  function openDispute(booking: any) {
    const reason = window.prompt('Why is this Residency payment/payout being put under review?')
    if (!reason?.trim()) return
    action(booking.id, { action: 'open_dispute', reason })
  }

  function resolveDispute(booking: any) {
    const refundRaw = window.prompt(`Refund to property (£). Maximum £${Number(booking.amount_paid || 0).toLocaleString('en-GB')}`, String(booking.refund_amount || 0))
    if (refundRaw === null) return
    const payoutRaw = window.prompt('Final specialist payout (£)', String(booking.payout_amount || 0))
    if (payoutRaw === null) return
    const refundAmount = Number(refundRaw)
    const payoutAmount = Number(payoutRaw)
    if (!Number.isFinite(refundAmount) || refundAmount < 0 || !Number.isFinite(payoutAmount) || payoutAmount < 0) {
      setError('Enter valid non-negative amounts.'); return
    }
    if (!window.confirm(`Resolve this issue with a £${refundAmount.toLocaleString('en-GB')} refund and £${payoutAmount.toLocaleString('en-GB')} specialist payout?`)) return
    action(booking.id, { action: 'resolve_dispute', refundAmount, payoutAmount })
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="dashboard-eyebrow">Residency operations</p>
          <h1 className="dashboard-title">Residency Money</h1>
          <p className="dashboard-intro">Track property payments, the Spa Platform booking fee and specialist payouts. Payouts stay locked until the Residency has ended and any dispute is resolved.</p>
        </div>
        <button onClick={load} className="btn-secondary inline-flex items-center gap-2 self-start"><RefreshCw size={14}/>Refresh</button>
      </div>

      <div className="dashboard-metrics mb-8">
        <div className="dashboard-metric"><Banknote size={16} className="text-accent mb-3"/><p className="dashboard-metric-value">£{metrics.collected.toLocaleString('en-GB')}</p><p className="dashboard-metric-label">Collected from properties</p></div>
        <div className="dashboard-metric"><Banknote size={16} className="text-accent mb-3"/><p className="dashboard-metric-value">£{metrics.fees.toLocaleString('en-GB')}</p><p className="dashboard-metric-label">Platform fees</p></div>
        <div className="dashboard-metric"><CalendarDays size={16} className="text-accent mb-3"/><p className="dashboard-metric-value">£{metrics.pending.toLocaleString('en-GB')}</p><p className="dashboard-metric-label">Specialist payout pending</p></div>
        <div className="dashboard-metric"><CheckCircle2 size={16} className="text-accent mb-3"/><p className="dashboard-metric-value">{metrics.ready}</p><p className="dashboard-metric-label">Ready to pay</p></div>
      </div>

      {error && <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? <div className="py-20 text-center text-sm text-muted">Loading Residency payments…</div> : bookings.length === 0 ? (
        <div className="dashboard-panel py-16 text-center"><p className="dashboard-eyebrow">No bookings yet</p><h2 className="dashboard-section-title">Residency payments will appear here</h2></div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const payout = Number(booking.payout_amount || 0)
            const fee = Number(booking.platform_fee || 0)
            const paid = Boolean(booking.paid_at)
            return <div key={booking.id} className="dashboard-card">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl text-ink">{booking.employer_name || booking.property_name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] ${paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{paid ? 'Property paid' : booking.status}</span>
                    {booking.dispute_status === 'open' && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-red-700">Payout on hold</span>}
                  </div>
                  <p className="text-sm text-secondary">{booking.candidate_name} · {booking.start_date || 'TBC'} – {booking.end_date || 'TBC'} · {booking.days_required || 0} days</p>
                  {booking.dispute_reason && <p className="mt-3 max-w-3xl text-[12px] leading-5 text-red-700"><AlertTriangle size={13} className="inline mr-1"/>{booking.dispute_reason}</p>}
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-x-7 gap-y-3 text-sm sm:grid-cols-4 xl:min-w-[520px]">
                  <div><p className="text-[10px] uppercase tracking-[.12em] text-muted">Collected</p><p className="mt-1 font-semibold text-ink">£{Number(booking.amount_paid || 0).toLocaleString('en-GB')}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[.12em] text-muted">Platform fee</p><p className="mt-1 font-semibold text-accent">£{fee.toLocaleString('en-GB')}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[.12em] text-muted">Specialist</p><p className="mt-1 font-semibold text-ink">£{payout.toLocaleString('en-GB')}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[.12em] text-muted">Payout</p><p className="mt-1 font-semibold text-ink">{booking.payout_status || '-'}</p></div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                {paid && booking.payout_status !== 'paid' && booking.dispute_status !== 'open' && <button disabled={busy===booking.id} onClick={() => openDispute(booking)} className="btn-secondary !py-2 text-[12px] !text-red-600">Put on hold</button>}
                {booking.dispute_status === 'open' && <button disabled={busy===booking.id} onClick={() => resolveDispute(booking)} className="btn-secondary !py-2 text-[12px]">Resolve issue</button>}
                {booking.payout_ready && <button disabled={busy===booking.id} onClick={() => { if (window.confirm(`Confirm the £${payout.toLocaleString('en-GB')} specialist payout has been sent?`)) action(booking.id,{action:'mark_paid_out'}) }} className="btn-primary !py-2 text-[12px]">Mark payout paid</button>}
                {paid && booking.payout_status !== 'paid' && !booking.payout_ready && booking.dispute_status !== 'open' && <span className="self-center text-[11px] text-muted">Payout unlocks after the Residency end date.</span>}
                {booking.payout_status === 'paid' && <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-green-700"><CheckCircle2 size={14}/>Payout completed{booking.payout_at ? ` · ${new Date(booking.payout_at).toLocaleDateString('en-GB')}` : ''}</span>}
              </div>
            </div>
          })}
        </div>
      )}
    </DashboardShell>
  )
}
