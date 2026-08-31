'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Calendar, Clock, Banknote, Star, X, Zap, Car, TrainFront, MapPin, Check } from 'lucide-react'
import ReviewForm from '@/components/ReviewForm'
import { AGENCY_LISTING_TIERS } from '@/lib/constants'

function expiryLabel(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `Expires in ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `Expires in ${hrs}h ${mins % 60}m`
  return `Expires ${new Date(expiresAt).toLocaleDateString('en-GB')}`
}

export default function TalentAgencyPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [counteringId, setCounteringId] = useState<string | null>(null)
  const [counterRate, setCounterRate] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [reviewing, setReviewing] = useState<{ userId: string; name: string; bookingId?: string } | null>(null)
  const [listing, setListing] = useState<{ available: boolean; tier: string | null; until: string | null } | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/agency/booking')
      if (res.ok) {
        const j = await res.json()
        setBookings((j.bookings || []).filter((b: any) => b.viewer_role === 'candidate'))
        const viewer = j.viewer?.candidate
        setListing(viewer ? {
          available: Boolean(viewer.agency_available),
          tier: viewer.agency_tier || null,
          until: viewer.agency_listed_until || null,
        } : null)
      } else {
        setBookings([])
        setListing(null)
      }
    } catch {
      setBookings([])
      setListing(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function act(bookingId: string, action: 'accept' | 'accept_group' | 'decline' | 'counter', rate?: string) {
    setActionError('')
    if (action === 'counter') {
      const parsed = parseInt(String(rate), 10)
      if (!parsed || parsed <= 0) { setActionError('Please enter a valid day rate to counter with.'); return }
    }
    setBusyId(bookingId)
    try {
      const res = await fetch('/api/agency/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookingId, ...(action === 'counter' ? { rate } : {}) }),
      })
      const j = await res.json()
      if (!res.ok) { setActionError(j.error || 'Something went wrong - please try again.'); return }
      setCounteringId(null)
      setCounterRate('')
      await load()
    } catch {
      setActionError('Something went wrong - please try again.')
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
      await load()
    } catch {
      setCancelError('Could not cancel this shift - please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    countered: 'bg-[#f5f6f8] text-accent',
    accepted: 'bg-green-50 text-green-700',
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-blue-50 text-blue-700',
    declined: 'bg-red-50 text-red-700',
    cancelled: 'bg-red-50 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
  }

  // Agency Plus properties' offers are surfaced first - part of what their
  // membership buys. The professional's rate and terms are identical.
  const offers = bookings.filter((b) => b.status === 'pending' || b.status === 'countered')
    .sort((a, b) => Number(Boolean(b.employer_agency_plus)) - Number(Boolean(a.employer_agency_plus)))
  const shifts = bookings.filter((b) => b.status !== 'pending' && b.status !== 'countered')

  // The professional keeps the full agreed rate - the WHC fee is paid by the
  // property on top, so nothing is deducted from the payout.
  const expectedPayout = (b: any) => b.payout_amount ?? Math.max(0, b.rate * (b.hours && b.hours > 0 ? b.hours : 8))
  const paidOut = shifts.filter((b) => b.payout_status === 'paid').reduce((s, b) => s + expectedPayout(b), 0)
  const awaitingPayout = shifts.filter((b) => b.paid_at && b.payout_status === 'pending' && b.dispute_status !== 'open').reduce((s, b) => s + expectedPayout(b), 0)
  const onHold = shifts.filter((b) => b.dispute_status === 'open').reduce((s, b) => s + expectedPayout(b), 0)
  const awaitingProperty = shifts.filter((b) => b.status === 'accepted').reduce((s, b) => s + expectedPayout(b), 0)
  const hasEarnings = shifts.some((b) => ['accepted', 'confirmed', 'completed'].includes(b.status))

  return (
    <DashboardShell role="talent">
      <div className="mb-6">
        <p className="dashboard-eyebrow">Agency register</p>
        <h1 className="dashboard-title">Agency Shifts</h1>
        <p className="dashboard-intro">Shift offers from properties that need cover, matched to your rate and travel area.</p>
      </div>

      {listing && (
        listing.available ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
            <div>
              <p className="text-[14px] font-medium text-green-800">
                You&apos;re on the agency register
                {listing.tier === 'featured' && <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide bg-green-600 text-white px-2 py-0.5 rounded-full">Featured</span>}
              </p>
              <p className="text-[12px] text-green-700 mt-0.5">
                {AGENCY_LISTING_TIERS[(listing.tier === 'featured' ? 'featured' : 'basic')].label} plan
                {listing.until ? ` - renews ${new Date(listing.until).toLocaleDateString('en-GB')}` : ''}. Properties can find you and send shift offers.
              </p>
            </div>
            <Link href="/talent/agency/settings" className="text-[12px] font-medium text-green-800 underline shrink-0 ml-4">Manage</Link>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-[#f5f6f8] border border-border rounded-xl px-5 py-4 mb-6">
            <div>
              <p className="text-[14px] font-medium text-ink">You&apos;re not on the agency register yet</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Join from {AGENCY_LISTING_TIERS.basic.display} to appear in the directory and receive shift offers - urgent same-day offers arrive by text.</p>
            </div>
            <Link href="/talent/agency/settings" className="btn-primary text-[12px] shrink-0 ml-4">Join now</Link>
          </div>
        )
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {hasEarnings && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Paid to you</p><p className="text-[20px] font-semibold text-green-700">£{paidOut}</p></div>
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Awaiting payout</p><p className="text-[20px] font-semibold text-ink">£{awaitingPayout}</p><p className="text-[10px] text-gray-400">Property has paid - WHC pays you after the shift</p></div>
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Awaiting property payment</p><p className="text-[20px] font-semibold text-amber-600">£{awaitingProperty}</p></div>
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">On hold</p><p className="text-[20px] font-semibold text-gray-500">£{onHold}</p><p className="text-[10px] text-gray-400">{onHold > 0 ? 'An issue is being reviewed by WHC' : 'No open issues'}</p></div>
            </div>
          )}
          {hasEarnings && (
            <p className="-mt-5 mb-8 text-right"><Link href="/talent/agency/statement" className="text-[12px] font-medium text-accent hover:underline">View monthly payout statement →</Link></p>
          )}

          {offers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[16px] font-medium text-ink mb-3">Offers</h2>
              <p className="text-[13px] text-gray-500 mb-4">Properties have offered you these shifts. Accept, decline or counter with a different day rate.</p>
              {actionError && <p className="text-[13px] text-red-600 mb-3">{actionError}</p>}
              <div className="space-y-4">
                {offers.map((b) => (
                  <div key={b.id} className={`bg-white border rounded-xl p-5 ${b.urgent ? 'border-red-300 ring-1 ring-red-200' : 'border-border'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-ink">{b.employer_name || 'Property'}{b.employer_agency_plus && <span className="ml-2 inline-flex rounded-full bg-ink px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white align-middle">Priority property</span>}</h3>
                          {b.employer_review_score > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-500"><Star size={10} className="fill-amber-400 text-amber-400" />{Number(b.employer_review_score).toFixed(1)}{b.employer_review_count ? ` (${b.employer_review_count})` : ''}</span>
                          )}
                          {b.urgent && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700"><Zap size={11} /> URGENT - TODAY</span>
                          )}
                          {b.booking_group && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">Weekly booking</span>}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status === 'countered' ? 'counter sent' : b.status}</span>
                          {b.expires_at && <span className={`text-[11px] font-medium ${b.urgent ? 'text-red-600' : 'text-amber-600'}`}>{expiryLabel(b.expires_at)}</span>}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>
                          {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
                          {b.hours && <span>{b.hours}h</span>}
                          <span className="flex items-center space-x-1 font-medium text-ink"><Banknote size={14} className="text-accent" /><span>£{b.rate}/hr{b.hours ? ` · £${b.rate * b.hours} total` : ''}</span></span>
                        </div>
                        {b.cascade_notes && <p className="text-[12px] text-gray-600 mt-1.5 italic">&ldquo;{b.cascade_notes}&rdquo;</p>}
                        {(b.employer_location || b.commute_car_required !== null || b.nearest_transport || b.distance_miles != null || b.taxi_support || b.parking_available) && (
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500 mt-2">
                            {b.employer_location && <span className="flex items-center gap-1"><MapPin size={12} />{b.employer_location}{b.employer_postcode ? ` (${b.employer_postcode})` : ''}</span>}
                            {b.distance_miles != null && <span className={`flex items-center gap-1 font-medium ${b.within_radius === false ? 'text-amber-700' : 'text-green-700'}`}>{b.distance_miles} miles from you{b.within_radius === false ? ` - outside your ${b.candidate_travel_radius}-mile radius` : b.within_radius === true ? ' - within your radius' : ''}</span>}
                            {b.commute_car_required === true && <span className="flex items-center gap-1 text-amber-700"><Car size={12} /> Car required</span>}
                            {b.commute_car_required === false && <span className="flex items-center gap-1"><TrainFront size={12} /> Car not marked as required</span>}
                            {b.nearest_transport && <span className="flex items-center gap-1"><TrainFront size={12} />{b.nearest_transport}{b.transport_walk_minutes ? ` · about ${b.transport_walk_minutes} min walk` : ''}</span>}
                            {b.parking_available && <span className="flex items-center gap-1"><Car size={12} /> Staff parking</span>}
                            {b.taxi_support && <span className="flex items-center gap-1">Taxi / shuttle help{b.taxi_notes ? ` · ${b.taxi_notes}` : ''}</span>}
                            {b.travel_notes && <span className="w-full text-gray-500">Property-supplied access note: {b.travel_notes}</span>}
                          </div>
                        )}
                      </div>

                      {b.status === 'pending' ? (
                        counteringId === b.id ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min={1} value={counterRate} onChange={(e) => setCounterRate(e.target.value)} placeholder="Your rate (£/hour)" className="input-field text-[13px] w-36" />
                            <button type="button" onClick={() => act(b.id, 'counter', counterRate)} disabled={busyId === b.id} className="btn-primary text-[12px] disabled:opacity-50">Send</button>
                            <button type="button" onClick={() => { setCounteringId(null); setCounterRate(''); setActionError('') }} className="btn-secondary text-[12px]">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => act(b.id, 'accept')} disabled={busyId === b.id} className="btn-primary text-[12px] disabled:opacity-50">Accept</button>
                              <button type="button" onClick={() => { setCounteringId(b.id); setCounterRate(String(b.rate || '')); setActionError('') }} disabled={busyId === b.id} className="btn-secondary text-[12px] disabled:opacity-50">Counter</button>
                              <button type="button" onClick={() => act(b.id, 'decline')} disabled={busyId === b.id} className="text-[12px] font-medium text-red-600 hover:text-red-700 px-3 py-2.5 disabled:opacity-50">Decline</button>
                            </div>
                            {b.booking_group && offers.filter(o => o.booking_group === b.booking_group).length > 1 && (
                              <button type="button" onClick={() => act(b.id, 'accept_group')} disabled={busyId === b.id} className="text-[12px] font-semibold text-green-700 hover:underline disabled:opacity-50">Accept all {offers.filter(o => o.booking_group === b.booking_group).length} weekly shifts</button>
                            )}
                          </div>
                        )
                      ) : (
                        <p className="text-[13px] text-gray-500">Counter sent - awaiting the property&apos;s response.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {offers.length > 0 && <h2 className="text-[16px] font-medium text-ink mb-3">Shifts</h2>}
          {shifts.length === 0 && offers.length === 0 ? (
            <div className="dashboard-card text-center py-16 text-gray-400"><Calendar size={48} className="mx-auto mb-4 opacity-50" /><p>No agency shifts booked yet.</p></div>
          ) : shifts.length === 0 ? (
            <div className="dashboard-card text-center py-8 text-gray-400"><p className="text-sm">No confirmed shifts yet.</p></div>
          ) : (
            <div className="space-y-4">
              {shifts.map((b) => (
                <div key={b.id} className="dashboard-card flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-ink">{b.employer_name || 'Property'}{b.employer_review_score > 0 ? <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-500 align-middle"><Star size={10} className="fill-amber-400 text-amber-400" />{Number(b.employer_review_score).toFixed(1)}</span> : null}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>
                      {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
                      {b.hours && <span>{b.hours}h</span>}
                    </div>
                    {b.status === 'accepted' && <p className="text-[11px] text-blue-700 mt-1.5">Agreed at £{b.rate}/hour - awaiting the property&apos;s payment to WHC. Once paid, your full payout of £{b.rate * (b.hours && b.hours > 0 ? b.hours : 8)} is confirmed. The property pays the WHC fee - nothing is deducted from you.</p>}
                    {(b.status === 'confirmed' || b.status === 'completed') && b.dispute_status === 'open' && <p className="text-[11px] text-amber-700 mt-1.5">The property has raised an issue with this shift - your payout of £{expectedPayout(b)} is on hold while WHC reviews it.</p>}
                    {(b.status === 'confirmed' || b.status === 'completed') && b.dispute_status !== 'open' && (
                      b.payout_status === 'cancelled' ? <p className="text-[11px] text-gray-500 mt-1.5">Issue resolved - no payout is due for this booking.</p> : <p className="text-[11px] text-green-700 mt-1.5">Paid &amp; confirmed - WHC pays you £{expectedPayout(b)} after the shift{b.payout_status === 'paid' ? ` (payout sent${b.payout_at ? ` ${new Date(b.payout_at).toLocaleDateString('en-GB')}` : ''})` : ''}.</p>
                    )}
                  </div>
                  <div className="text-right">
                    {b.rate && <p className="font-medium text-ink">£{b.rate}/hr</p>}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status}</span>
                    {(b.status === 'accepted' || b.status === 'confirmed' || b.status === 'completed') && b.employer_user_id && (
                      b.reviewed_by_viewer ? (
                        <span className="flex items-center justify-end gap-1 mt-2 text-[12px] font-medium text-green-700"><Check size={12} /> Reviewed</span>
                      ) : (
                        <button type="button" onClick={() => setReviewing({ userId: b.employer_user_id, name: b.employer_name || 'this property', bookingId: b.id })} className="block ml-auto mt-2 text-[12px] font-medium text-amber-500 hover:underline"><span className="inline-flex items-center gap-1"><Star size={11} /> Review property</span></button>
                      )
                    )}
                    {canCancel(b) && (
                      cancellingId === b.id ? (
                        <div className="mt-2 flex flex-col items-end gap-1.5">
                          <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancelling" className="input-field text-[12px] w-56" />
                          {cancelError && <p className="text-[11px] text-red-600 max-w-[240px]">{cancelError}</p>}
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => cancelShift(b.id)} disabled={busyId === b.id || !cancelReason.trim()} className="text-[12px] font-medium text-red-600 hover:text-red-700 disabled:opacity-50">Confirm cancellation</button>
                            <button type="button" onClick={() => { setCancellingId(null); setCancelReason(''); setCancelError('') }} className="text-[12px] text-gray-400 hover:text-ink">Keep shift</button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setCancellingId(b.id); setCancelReason(''); setCancelError('') }} className="block ml-auto mt-2 text-[12px] text-gray-400 underline hover:text-red-600">Cancel shift</button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {reviewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-ink">Review {reviewing.name}</h2>
              <button type="button" onClick={() => setReviewing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <ReviewForm
              reviewedId={reviewing.userId}
              reviewedName={reviewing.name}
              type="employer"
              bookingId={reviewing.bookingId}
              onComplete={() => {
                setBookings(current => current.map(b => b.id === reviewing.bookingId ? { ...b, reviewed_by_viewer: true } : b))
              }}
            />
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
