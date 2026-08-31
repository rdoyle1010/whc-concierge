'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Calendar, Clock, Banknote, Star, X, Zap, ShieldCheck, MessageSquare, Check } from 'lucide-react'
import ReviewForm from '@/components/ReviewForm'
import { AGENCY_PLATFORM_FEE_PCT, AGENCY_PLUS_FEE_PCT } from '@/lib/constants'

export default function EmployerAgencyPage() {
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reviewing, setReviewing] = useState<{ userId: string; name: string; bookingId?: string } | null>(null)
  const [disputing, setDisputing] = useState<any>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [disputeRequested, setDisputeRequested] = useState('Refund minus the WHC admin fee')
  const [urgentOpen, setUrgentOpen] = useState(false)
  const [urgentBusy, setUrgentBusy] = useState(false)
  const [urgentForm, setUrgentForm] = useState({
    shiftDate: new Date().toLocaleDateString('en-CA'),
    shiftStartTime: '09:00', shiftEndTime: '17:00', radius: '25', maxRate: '', shiftType: '', notes: '',
  })
  const plusActive = Boolean(profile?.agency_plus_active)
  const agencyFeePct = Math.round((plusActive ? AGENCY_PLUS_FEE_PCT : AGENCY_PLATFORM_FEE_PCT) * 100)

  async function load() {
    try {
      const bookingsRes = await fetch('/api/agency/booking')
      if (bookingsRes.ok) {
        const j = await bookingsRes.json()
        setProfile(j.viewer?.employer || null)
        setBookings((j.bookings || []).filter((b: any) => b.viewer_role === 'employer'))
      } else {
        setProfile(null)
        setBookings([])
      }
    } catch {
      setProfile(null)
      setBookings([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === 'true' || params.get('paid') === 'processing') setNotice('Payment is being confirmed. The booking updates automatically once Stripe completes the payment webhook.')
    if (params.get('registered') === 'true') setNotice('Welcome aboard - you are now a registered Preferred Employer and can book agency cover.')
    if (params.get('plus') === 'active') setNotice('Agency Plus is active - your booking fee is now 10% and your cover requests take priority.')
  }, [])

  async function startCheckout(type: 'agency_booking' | 'employer_registration' | 'agency_plus', extra: Record<string, any> = {}) {
    setError('')
    try {
      const agencyPayment = type === 'agency_booking'
      const res = await fetch(agencyPayment ? '/api/mobile/agency/checkout' : '/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agencyPayment
          ? { bookingId: extra.bookingId, returnPath: '/employer/agency' }
          : { type, returnUrl: window.location.origin, ...extra }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) { setError(j.error || 'Could not start the payment - please try again.'); setBusyId(null); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
      setBusyId(null)
    }
  }

  async function submitUrgent() {
    setError('')
    setUrgentBusy(true)
    try {
      const res = await fetch('/api/agency/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'urgent_cascade',
          shiftDate: urgentForm.shiftDate,
          shiftStartTime: urgentForm.shiftStartTime,
          shiftEndTime: urgentForm.shiftEndTime,
          radius: urgentForm.radius,
          maxRate: urgentForm.maxRate || undefined,
          shiftType: urgentForm.shiftType || undefined,
          notes: urgentForm.notes || undefined,
        }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not send the request - please try again.'); return }
      setUrgentOpen(false)
      setNotice(`Done - the shift has been offered to ${j.first_name} (nearest available match). ${j.queue_size > 1 ? `If they can't take it, it moves automatically through ${j.queue_size - 1} more therapist${j.queue_size > 2 ? 's' : ''}, 30 minutes each.` : 'They are the only match right now.'} You'll be notified the moment someone accepts.`)
      await load()
    } catch {
      setError('Something went wrong - please try again.')
    } finally {
      setUrgentBusy(false)
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

  // Accepted or confirmed shifts that have not yet started can be cancelled
  // via /api/agency/cancel (past shifts go through Shift Resolution instead).
  const todayLondon = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
  const canCancel = (b: any) => ['accepted', 'confirmed'].includes(b.status) && b.shift_date && String(b.shift_date) >= todayLondon

  async function cancelShift(bookingId: string) {
    setCancelError('')
    setBusyId(bookingId)
    try {
      const res = await fetch('/api/agency/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, reason: cancelReason.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setCancelError(j.error || 'Could not cancel this shift - please try again.'); return }
      setCancellingId(null)
      setCancelReason('')
      setNotice('The shift has been cancelled and the professional has been notified.')
      await load()
    } catch {
      setCancelError('Could not cancel this shift - please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700', countered: 'bg-[#f5f6f8] text-accent', accepted: 'bg-blue-50 text-blue-700', confirmed: 'bg-green-50 text-green-700', completed: 'bg-blue-50 text-blue-700', declined: 'bg-red-50 text-red-700', cancelled: 'bg-red-50 text-red-700', expired: 'bg-gray-100 text-gray-500',
  }

  const effHours = (b: any) => (b.hours && b.hours > 0 ? b.hours : 8)
  const totalDue = (b: any) => b.rate * effHours(b) + (b.platform_fee || Math.ceil(b.rate * effHours(b) * AGENCY_PLATFORM_FEE_PCT))
  const needsAction = bookings.filter(b => b.status === 'accepted')
  const open = bookings.filter(b => b.status === 'pending' || b.status === 'countered')
  const rest = bookings.filter(b => !['accepted', 'pending', 'countered'].includes(b.status))
  const totalPaid = bookings.filter(b => b.paid_at).reduce((s, b) => s + (b.amount_paid || 0), 0)
  const awaitingPayment = needsAction.reduce((s, b) => s + totalDue(b), 0)
  const refunded = bookings.reduce((s, b) => s + (b.refund_amount || 0), 0)
  const hasMoney = totalPaid > 0 || awaitingPayment > 0 || refunded > 0

  const renderCard = (b: any) => (
    <div key={b.id} className={`dashboard-card ${b.urgent && (b.status === 'pending' || b.status === 'countered') ? '!border-red-300 ring-1 ring-red-200' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap"><Link href={`/agency/${b.candidate_id}`} className="font-medium text-ink hover:underline">{b.candidate_name || 'Candidate'}</Link>{b.cascade_total != null && <span className="text-[10px] font-semibold uppercase tracking-wide bg-ink text-white px-2 py-0.5 rounded-full">Auto-match</span>}{b.booking_group && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">Weekly booking</span>}{b.urgent && (b.status === 'pending' || b.status === 'countered') && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700"><Zap size={11} /> URGENT</span>}<span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status === 'countered' ? 'countered - respond on their profile' : b.status}</span></div>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500"><span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>{b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}{b.hours && <span>{b.hours}h</span>}<span className="flex items-center space-x-1 font-medium text-ink"><Banknote size={14} className="text-accent" /><span>£{b.rate}/hr</span></span>{b.distance_miles != null && <span>{b.distance_miles} miles from them</span>}</div>
          {b.cascade_total != null && (b.status === 'pending' || b.status === 'countered') && <p className="text-[12px] text-ink mt-1.5">Offered to <span className="font-medium">{b.candidate_name}</span> ({b.cascade_position} of {b.cascade_total} in the queue){b.expires_at ? ` - they have until ${new Date(b.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} before it moves to the next therapist` : ''}.</p>}
          {b.cascade_total != null && b.status === 'expired' && <p className="text-[12px] text-gray-500 mt-1.5">Not filled - all {b.cascade_total} matching therapist{b.cascade_total > 1 ? 's were' : ' was'} offered it. Try again with a higher rate cap, or book directly from the directory.</p>}
          {b.status === 'accepted' && <p className="text-[12px] text-blue-700 mt-1.5">Accepted - pay £{totalDue(b)} to confirm ({effHours(b)}h × £{b.rate} + {agencyFeePct}% WHC fee). WHC pays the professional after the shift.</p>}
          {b.status === 'confirmed' && b.dispute_status === 'open' && <p className="text-[12px] text-amber-700 mt-1.5">Issue reported - WHC is reviewing it and will confirm the outcome. The professional&apos;s payout is on hold.</p>}
          {b.status === 'confirmed' && b.dispute_status === 'resolved' && <p className="text-[12px] text-gray-600 mt-1.5">Issue resolved{b.refund_amount ? ` - £${b.refund_amount} refund agreed` : ' - no refund agreed'}.</p>}
          {b.status === 'confirmed' && !b.dispute_status && <p className="text-[12px] text-green-700 mt-1.5">Paid{b.amount_paid ? ` £${b.amount_paid}` : ''}{b.paid_at ? ` on ${new Date(b.paid_at).toLocaleDateString('en-GB')}` : ''} - booking confirmed. The professional is paid by WHC after the shift; nothing more to do.</p>}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">{b.status === 'accepted' && <button type="button" onClick={() => { setBusyId(b.id); startCheckout('agency_booking', { bookingId: b.id }) }} disabled={busyId === b.id} className="btn-primary text-[12px] disabled:opacity-50">{busyId === b.id ? 'Opening payment...' : `Pay £${totalDue(b)} now`}</button>}<div className="flex items-center gap-3"><Link href="/employer/messages" className="text-[12px] font-medium text-gray-500 hover:text-ink inline-flex items-center gap-1"><MessageSquare size={12} /> Messages</Link>{b.paid_at && <Link href={`/employer/agency/receipt/${b.id}`} className="text-[12px] font-medium text-gray-500 hover:text-ink">Receipt</Link>}{(b.status === 'confirmed' || b.status === 'completed') && b.candidate_user_id && (b.reviewed_by_viewer ? <span className="text-[12px] font-medium text-green-700 inline-flex items-center gap-1"><Check size={12} /> Reviewed</span> : <button type="button" onClick={() => setReviewing({ userId: b.candidate_user_id, name: b.candidate_name || 'this candidate', bookingId: b.id })} className="text-[12px] font-medium text-amber-500 hover:underline inline-flex items-center gap-1"><Star size={11} /> Review</button>)}{(b.status === 'confirmed' || b.status === 'completed') && b.paid_at && !b.dispute_status && <button type="button" onClick={() => { setDisputing(b); setDisputeReason(''); setError('') }} className="text-[12px] font-medium text-red-500 hover:underline">Report an issue</button>}</div>{canCancel(b) && (cancellingId === b.id ? <div className="flex flex-col items-end gap-1.5"><input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancelling" className="input-field text-[12px] w-56" />{cancelError && <p className="text-[11px] text-red-600 max-w-[240px]">{cancelError}</p>}<div className="flex items-center gap-3"><button type="button" onClick={() => cancelShift(b.id)} disabled={busyId === b.id || !cancelReason.trim()} className="text-[12px] font-medium text-red-600 hover:text-red-700 disabled:opacity-50">Confirm cancellation</button><button type="button" onClick={() => { setCancellingId(null); setCancelReason(''); setCancelError('') }} className="text-[12px] text-gray-400 hover:text-ink">Keep shift</button></div></div> : <button type="button" onClick={() => { setCancellingId(b.id); setCancelReason(''); setCancelError('') }} className="text-[12px] text-gray-400 underline hover:text-red-600">Cancel shift</button>)}</div>
      </div>
    </div>
  )

  return (
    <DashboardShell role="employer">
      <div className="mb-6">
        <p className="dashboard-eyebrow">Flexible staffing</p>
        <h1 className="dashboard-title">Agency Cover &amp; Bookings</h1>
        <p className="dashboard-intro">Book vetted temporary cover, manage offers and keep payments in one place.</p>
      </div>
      {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{notice}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
      {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div> : <>
        {profile && (profile.preferred_employer ? <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6"><ShieldCheck size={18} className="text-green-700 shrink-0" /><div><p className="text-[14px] font-medium text-green-800">Registered Preferred Employer</p><p className="text-[12px] text-green-700 mt-0.5">{profile.preferred_until ? `Registration renews ${new Date(profile.preferred_until).toLocaleDateString('en-GB')}. ` : ''}You can book agency cover - find talent in the <Link href="/agency" className="underline">agency directory</Link>.</p></div></div> : <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f5f6f8] border border-border rounded-xl px-5 py-4 mb-6"><div><p className="text-[14px] font-medium text-ink">Register as a Preferred Employer</p><p className="text-[12px] text-gray-500 mt-0.5">£150/year. Book vetted agency cover by the hour - including urgent same-day sickness cover - with all payments handled by Wellness House Collective.</p></div><button type="button" onClick={() => { setBusyId('register'); startCheckout('employer_registration', { employerId: profile.id }) }} disabled={busyId === 'register'} className="btn-primary text-[12px] shrink-0 disabled:opacity-50">{busyId === 'register' ? 'Opening payment...' : 'Register - £150/year'}</button></div>)}

        {profile?.preferred_employer && (plusActive ? (
          <div className="mb-6 flex items-center justify-between gap-3 border border-border bg-[#f5f6f8] px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-accent">Agency Plus member</p>
              <p className="mt-1 text-[13px] text-ink">Your booking fee is 10% instead of 15% and your cover requests are shown to professionals first.{profile.agency_plus_until ? ` Renews ${new Date(profile.agency_plus_until).toLocaleDateString('en-GB')}.` : ''}</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex flex-col gap-3 border border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] font-medium text-ink">Agency Plus - for properties that book cover regularly</p>
              <p className="mt-0.5 text-[12px] leading-5 text-gray-500">£99/month. Booking fee drops from 15% to 10%, your requests take priority with professionals, and everything stays on one monthly invoice. On a typical £200 shift that is £10 back every time - two shifts a week and it pays for itself. Professionals always keep 100% of the agreed rate.</p>
            </div>
            <button type="button" onClick={() => { setBusyId('plus'); startCheckout('agency_plus', { employerId: profile.id }) }} disabled={busyId === 'plus'} className="btn-primary shrink-0 text-[12px] disabled:opacity-50">{busyId === 'plus' ? 'Opening payment...' : 'Join Agency Plus - £99/month'}</button>
          </div>
        ))}

        {profile?.preferred_employer && <div className="grid gap-3 mb-6 md:grid-cols-2"><Link href="/agency" className="group dashboard-card"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-accent">Agency directory</p><h2 className="mt-2 text-[18px] font-semibold text-ink">Need cover? See who is available near you</h2><p className="mt-1 text-[12px] leading-5 text-gray-500">Browse local professionals by date, hours and distance, then open a profile and send an offer.</p><span className="mt-4 inline-flex text-[12px] font-semibold text-accent group-hover:underline">Browse available people →</span></Link><button type="button" onClick={() => { setUrgentOpen(true); setError('') }} className="group bg-ink p-5 text-left"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/80">Urgent same-day cover</p><h2 className="mt-2 flex items-center gap-2 text-[18px] font-semibold text-white"><Zap size={16} className="text-white" /> Need someone today?</h2><p className="mt-1 text-[12px] leading-5 text-white/75">Send the shift to the nearest available people automatically. Each person gets 30 minutes before it moves on.</p><span className="mt-4 inline-flex border border-white/30 px-3 py-2 text-[12px] font-semibold text-white group-hover:bg-white/10">Send urgent cover request →</span></button></div>}

        {hasMoney && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"><div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Paid to WHC</p><p className="text-[20px] font-semibold text-ink">£{totalPaid}</p></div><div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Awaiting your payment</p><p className="text-[20px] font-semibold text-amber-600">£{awaitingPayment}</p></div><div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Refunds agreed</p><p className="text-[20px] font-semibold text-green-700">£{refunded}</p></div></div>}

        {bookings.length === 0 ? <div className="dashboard-card text-center py-14 px-6"><Calendar size={42} className="mx-auto mb-4 text-gray-300" /><h2 className="text-xl font-serif text-ink">No agency bookings yet.</h2><p className="text-[13px] text-gray-500 mt-2 max-w-xl mx-auto">Your confirmed shifts, payments and completed agency bookings will appear here.</p><div className="flex flex-wrap justify-center gap-3 mt-6"><Link href="/agency" className="btn-primary">Browse available professionals</Link>{profile?.preferred_employer && <button type="button" onClick={() => { setUrgentOpen(true); setError('') }} className="btn-secondary inline-flex items-center gap-2"><Zap size={14} />Request urgent cover</button>}</div></div> : <>{needsAction.length > 0 && <div className="mb-8"><h2 className="text-[16px] font-medium text-ink mb-3">Awaiting your payment</h2><div className="space-y-4">{needsAction.map(renderCard)}</div></div>}{open.length > 0 && <div className="mb-8"><h2 className="text-[16px] font-medium text-ink mb-3">Offers awaiting the candidate</h2><div className="space-y-4">{open.map(renderCard)}</div></div>}{rest.length > 0 && <div className="mb-8"><h2 className="text-[16px] font-medium text-ink mb-3">Booked &amp; past</h2><div className="space-y-4">{rest.map(renderCard)}</div></div>}</>}
      </>}

      {urgentOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setUrgentOpen(false)}><div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-2"><h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2"><Zap size={16} className="text-accent" /> Urgent cover</h2><button type="button" onClick={() => setUrgentOpen(false)} className="text-gray-300 hover:text-ink"><X size={20} /></button></div><p className="text-[12px] text-gray-500 mb-4">We&apos;ll offer this shift to the nearest available therapists in turn - each gets 30 minutes to accept before it moves on. You pay their hourly rate plus the {agencyFeePct + 5}% same-day WHC fee once someone accepts (standard bookings made ahead carry {agencyFeePct}%). The professional always receives their full rate.</p><div className="grid grid-cols-2 gap-3 mb-3"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Shift date</label><input type="date" value={urgentForm.shiftDate} min={new Date().toLocaleDateString('en-CA')} onChange={e => setUrgentForm({ ...urgentForm, shiftDate: e.target.value })} className="input-field" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Starts</label><input type="time" value={urgentForm.shiftStartTime} onChange={e => setUrgentForm({ ...urgentForm, shiftStartTime: e.target.value })} className="input-field" /></div></div><div className="grid grid-cols-2 gap-3 mb-3"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Finishes</label><input type="time" value={urgentForm.shiftEndTime} onChange={e => setUrgentForm({ ...urgentForm, shiftEndTime: e.target.value })} className="input-field" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Search radius</label><select value={urgentForm.radius} onChange={e => setUrgentForm({ ...urgentForm, radius: e.target.value })} className="input-field"><option value="5">Within 5 miles</option><option value="10">Within 10 miles</option><option value="25">Within 25 miles</option><option value="50">Within 50 miles</option><option value="100">Within 100 miles</option></select></div></div><div className="grid grid-cols-2 gap-3 mb-3"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Max rate (£/hr, optional)</label><input type="number" min={1} value={urgentForm.maxRate} placeholder="No cap" onChange={e => setUrgentForm({ ...urgentForm, maxRate: e.target.value })} className="input-field" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Treatment / role</label><input type="text" value={urgentForm.shiftType} placeholder="e.g. Massage, Facials" onChange={e => setUrgentForm({ ...urgentForm, shiftType: e.target.value })} className="input-field" /></div></div><label className="block text-sm font-medium text-gray-700 mb-1.5">Notes for the therapist (optional)</label><textarea rows={2} value={urgentForm.notes} onChange={e => setUrgentForm({ ...urgentForm, notes: e.target.value })} className="input-field mb-4" placeholder="e.g. 10am start, ESPA treatments, parking on site..." />{error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}<button type="button" onClick={submitUrgent} disabled={urgentBusy || !urgentForm.shiftDate} className="btn-primary w-full disabled:opacity-50">{urgentBusy ? 'Finding the nearest available...' : 'Send it out'}</button></div></div>}

      {disputing && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDisputing(null)}><div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-2"><h2 className="font-serif text-lg font-bold text-ink">Report an issue</h2><button type="button" onClick={() => setDisputing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button></div><p className="text-[12px] text-gray-500 mb-4">Shift on {disputing.shift_date ? new Date(disputing.shift_date).toLocaleDateString('en-GB') : 'the agreed date'} with {disputing.candidate_name}. Wellness House Collective will review this and confirm the outcome with both of you. The professional&apos;s payout is held in the meantime and any refund is calculated as part of the WHC resolution.</p><label className="block text-sm font-medium text-gray-700 mb-1.5">What happened?</label><textarea rows={4} value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="input-field mb-4" placeholder="e.g. Left at 2pm having been booked until 6pm; did not attend; arrived unprepared..." /><label className="block text-sm font-medium text-gray-700 mb-1.5">What outcome are you asking for?</label><select value={disputeRequested} onChange={e => setDisputeRequested(e.target.value)} className="input-field mb-4"><option>Refund minus the WHC admin fee</option><option>Partial refund (e.g. hours not worked)</option><option>No refund - just noting the issue</option></select>{error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}<button type="button" onClick={submitDispute} disabled={busyId === disputing.id || !disputeReason.trim()} className="btn-primary w-full disabled:opacity-50">{busyId === disputing.id ? 'Sending...' : 'Submit to WHC'}</button></div></div>}

      {reviewing && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewing(null)}><div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="font-serif text-lg font-bold text-ink">Review {reviewing.name}</h2><button type="button" onClick={() => setReviewing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button></div><ReviewForm reviewedId={reviewing.userId} reviewedName={reviewing.name} type="candidate" bookingId={reviewing.bookingId} onComplete={() => { setBookings(current => current.map(b => b.id === reviewing.bookingId ? { ...b, reviewed_by_viewer: true } : b)) }} /></div></div>}
    </DashboardShell>
  )
}
