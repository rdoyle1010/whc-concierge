'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, Banknote, Star, X, Zap, ShieldCheck, MessageSquare } from 'lucide-react'
import ReviewForm from '@/components/ReviewForm'

// The property's home for agency cover: register as a Preferred Employer,
// see every offer you've made, pay for accepted shifts, track what's booked.

export default function EmployerAgencyPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reviewing, setReviewing] = useState<{ userId: string; name: string; bookingId?: string } | null>(null)
  const [disputing, setDisputing] = useState<any>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeRequested, setDisputeRequested] = useState('Refund minus the WHC admin fee')

  async function load() {
    try {
      const [{ data: { user } }, bookingsRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch('/api/agency/booking'),
      ])
      if (user) {
        const { data: emp } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
        setProfile(emp)
      }
      if (bookingsRes.ok) {
        const j = await bookingsRes.json()
        setBookings((j.bookings || []).filter((b: any) => b.viewer_role === 'employer'))
      }
    } catch { /* shown as empty */ }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === 'true') setNotice('Payment received - the booking is confirmed and WHC will pay the therapist after the shift.')
    if (params.get('registered') === 'true') setNotice('Welcome aboard - you are now a registered Preferred Employer and can book agency cover.')
  }, [])

  async function startCheckout(type: 'agency_booking' | 'employer_registration', extra: Record<string, any> = {}) {
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, returnUrl: window.location.origin, ...extra }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) { setError(j.error || 'Could not start the payment - please try again.'); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
    }
  }

  async function submitDispute() {
    if (!disputing) return
    setError('')
    setBusyId(disputing.id)
    try {
      const res = await fetch('/api/agency/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispute', bookingId: disputing.id, reason: disputeReason, requested: disputeRequested }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not report the issue - please try again.'); return }
      setDisputing(null)
      setDisputeReason('')
      setNotice('Issue reported - Wellness House Collective will review it and confirm the outcome. The therapist payout is on hold in the meantime.')
      await load()
    } catch {
      setError('Something went wrong - please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    countered: 'bg-[#FDF6EC] text-accent',
    accepted: 'bg-blue-50 text-blue-700',
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-blue-50 text-blue-700',
    declined: 'bg-red-50 text-red-700',
    cancelled: 'bg-red-50 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
  }

  const effHours = (b: any) => (b.hours && b.hours > 0 ? b.hours : 8)
  const totalDue = (b: any) => b.rate * effHours(b) + (b.platform_fee || Math.ceil(b.rate * effHours(b) * 0.10))

  const needsAction = bookings.filter(b => b.status === 'accepted')
  const open = bookings.filter(b => b.status === 'pending' || b.status === 'countered')
  const rest = bookings.filter(b => !['accepted', 'pending', 'countered'].includes(b.status))

  // ── Payment history summary ──
  const totalPaid = bookings.filter(b => b.paid_at).reduce((s, b) => s + (b.amount_paid || 0), 0)
  const awaitingPayment = needsAction.reduce((s, b) => s + totalDue(b), 0)
  const refunded = bookings.reduce((s, b) => s + (b.refund_amount || 0), 0)
  const hasMoney = totalPaid > 0 || awaitingPayment > 0 || refunded > 0

  const renderCard = (b: any) => (
    <div key={b.id} className={`bg-white border rounded-xl p-5 ${b.urgent && (b.status === 'pending' || b.status === 'countered') ? 'border-red-300 ring-1 ring-red-200' : 'border-border'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link href={`/agency/${b.candidate_id}`} className="font-medium text-ink hover:underline">{b.candidate_name || 'Candidate'}</Link>
            {b.urgent && (b.status === 'pending' || b.status === 'countered') && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700"><Zap size={11} /> URGENT</span>
            )}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status === 'countered' ? 'countered - respond on their profile' : b.status}</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>
            {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
            {b.hours && <span>{b.hours}h</span>}
            <span className="flex items-center space-x-1 font-medium text-ink"><Banknote size={14} className="text-accent" /><span>£{b.rate}/hr</span></span>
            {b.distance_miles != null && <span>{b.distance_miles} miles from them</span>}
          </div>
          {b.status === 'accepted' && (
            <p className="text-[12px] text-blue-700 mt-1.5">Accepted - pay £{totalDue(b)} to confirm ({effHours(b)}h × £{b.rate} + 10% WHC fee). WHC pays the therapist after the shift.</p>
          )}
          {b.status === 'confirmed' && b.dispute_status === 'open' && (
            <p className="text-[12px] text-amber-700 mt-1.5">Issue reported - WHC is reviewing it and will confirm the outcome. The therapist&apos;s payout is on hold.</p>
          )}
          {b.status === 'confirmed' && b.dispute_status === 'resolved' && (
            <p className="text-[12px] text-gray-600 mt-1.5">Issue resolved{b.refund_amount ? ` - £${b.refund_amount} refund agreed (admin fee retained)` : ' - no refund agreed'}.</p>
          )}
          {b.status === 'confirmed' && !b.dispute_status && (
            <p className="text-[12px] text-green-700 mt-1.5">Paid{b.amount_paid ? ` £${b.amount_paid}` : ''}{b.paid_at ? ` on ${new Date(b.paid_at).toLocaleDateString('en-GB')}` : ''} - booking confirmed. The therapist is paid by WHC after the shift; nothing more to do.</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {b.status === 'accepted' && (
            <button onClick={() => { setBusyId(b.id); startCheckout('agency_booking', { bookingId: b.id }) }} disabled={busyId === b.id}
              className="btn-primary text-[12px] disabled:opacity-50">
              {busyId === b.id ? 'Opening payment...' : `Pay £${totalDue(b)} now`}
            </button>
          )}
          <div className="flex items-center gap-3">
            <Link href="/employer/messages" className="text-[12px] font-medium text-gray-500 hover:text-ink inline-flex items-center gap-1"><MessageSquare size={12} /> Messages</Link>
            {(b.status === 'confirmed' || b.status === 'completed') && b.candidate_user_id && (
              <button type="button" onClick={() => setReviewing({ userId: b.candidate_user_id, name: b.candidate_name || 'this candidate', bookingId: b.id })}
                className="text-[12px] font-medium text-amber-500 hover:underline inline-flex items-center gap-1"><Star size={11} /> Review</button>
            )}
            {(b.status === 'confirmed' || b.status === 'completed') && b.paid_at && !b.dispute_status && (
              <button type="button" onClick={() => { setDisputing(b); setDisputeReason(''); setError('') }}
                className="text-[12px] font-medium text-red-500 hover:underline">Report an issue</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardShell role="employer">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Agency Bookings</h1>

      {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{notice}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Preferred Employer status */}
          {profile && (
            profile.preferred_employer ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
                <ShieldCheck size={18} className="text-green-700 shrink-0" />
                <div>
                  <p className="text-[14px] font-medium text-green-800">Registered Preferred Employer</p>
                  <p className="text-[12px] text-green-700 mt-0.5">
                    {profile.preferred_until ? `Registration renews ${new Date(profile.preferred_until).toLocaleDateString('en-GB')}. ` : ''}You can book agency cover - find talent in the <Link href="/agency" className="underline">agency directory</Link>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDF6EC] border border-border rounded-xl px-5 py-4 mb-6">
                <div>
                  <p className="text-[14px] font-medium text-ink">Register as a Preferred Employer</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">£150/year. Book vetted agency cover by the hour - including urgent same-day sickness cover - with all payments handled by Wellness House Collective.</p>
                </div>
                <button onClick={() => startCheckout('employer_registration', { employerId: profile.id })} className="btn-primary text-[12px] shrink-0">Register - £150/year</button>
              </div>
            )
          )}

          {/* Payment history summary */}
          {hasMoney && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Paid to WHC</p><p className="text-[20px] font-semibold text-ink">£{totalPaid}</p></div>
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Awaiting your payment</p><p className="text-[20px] font-semibold text-amber-600">£{awaitingPayment}</p></div>
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Refunds agreed</p><p className="text-[20px] font-semibold text-green-700">£{refunded}</p></div>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="dashboard-card text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No agency bookings yet.</p>
              <Link href="/agency" className="text-[13px] text-accent underline mt-2 inline-block">Browse the agency directory</Link>
            </div>
          ) : (
            <>
              {needsAction.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-[16px] font-medium text-ink mb-3">Awaiting your payment</h2>
                  <div className="space-y-4">{needsAction.map(renderCard)}</div>
                </div>
              )}
              {open.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-[16px] font-medium text-ink mb-3">Offers awaiting the candidate</h2>
                  <div className="space-y-4">{open.map(renderCard)}</div>
                </div>
              )}
              {rest.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-[16px] font-medium text-ink mb-3">Booked &amp; past</h2>
                  <div className="space-y-4">{rest.map(renderCard)}</div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Report an issue modal */}
      {disputing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDisputing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-lg font-bold text-ink">Report an issue</h2>
              <button type="button" onClick={() => setDisputing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <p className="text-[12px] text-gray-500 mb-4">
              Shift on {disputing.shift_date ? new Date(disputing.shift_date).toLocaleDateString('en-GB') : 'the agreed date'} with {disputing.candidate_name}. Wellness House Collective will review this and confirm the outcome with both of you - the therapist&apos;s payout is held in the meantime. Any refund is minus the 10% admin fee.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What happened?</label>
            <textarea rows={4} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="input-field mb-4"
              placeholder="e.g. Left at 2pm having been booked until 6pm; did not attend; arrived unprepared..." />
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What outcome are you asking for?</label>
            <select value={disputeRequested} onChange={(e) => setDisputeRequested(e.target.value)} className="input-field mb-4">
              <option>Refund minus the WHC admin fee</option>
              <option>Partial refund (e.g. hours not worked)</option>
              <option>No refund - just noting the issue</option>
            </select>
            {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
            <button onClick={submitDispute} disabled={busyId === disputing.id || !disputeReason.trim()}
              className="btn-primary w-full disabled:opacity-50">
              {busyId === disputing.id ? 'Sending...' : 'Submit to WHC'}
            </button>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-ink">Review {reviewing.name}</h2>
              <button type="button" onClick={() => setReviewing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <ReviewForm reviewedId={reviewing.userId} reviewedName={reviewing.name} type="candidate" bookingId={reviewing.bookingId} />
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
