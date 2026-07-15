'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Calendar, Clock, Banknote, Star, X, Zap, Car, TrainFront, MapPin } from 'lucide-react'
import ReviewForm from '@/components/ReviewForm'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [counteringId, setCounteringId] = useState<string | null>(null)
  const [counterRate, setCounterRate] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [reviewing, setReviewing] = useState<{ userId: string; name: string } | null>(null)
  const [listing, setListing] = useState<{ available: boolean; tier: string | null; until: string | null } | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/agency/booking')
      if (res.ok) {
        const j = await res.json()
        setBookings((j.bookings || []).filter((b: any) => b.viewer_role === 'candidate'))
      } else {
        setBookings([])
      }
    } catch {
      setBookings([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Listing status — select * so a not-yet-migrated live table can't 400 the query
    async function loadListing() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
        if (data) setListing({ available: Boolean(data.agency_available), tier: data.agency_tier || null, until: data.agency_listed_until || null })
      } catch { /* card simply not shown */ }
    }
    loadListing()
  }, [])

  async function act(bookingId: string, action: 'accept' | 'decline' | 'counter', rate?: string) {
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

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    countered: 'bg-[#FDF6EC] text-accent',
    accepted: 'bg-green-50 text-green-700',
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-blue-50 text-blue-700',
    declined: 'bg-red-50 text-red-700',
    cancelled: 'bg-red-50 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
  }

  const offers = bookings.filter((b) => b.status === 'pending' || b.status === 'countered')
  const shifts = bookings.filter((b) => b.status !== 'pending' && b.status !== 'countered')

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Agency Shifts</h1>

      {/* Listing status */}
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
            <Link href="/talent/onboarding?step=9" className="text-[12px] font-medium text-green-800 underline shrink-0 ml-4">Manage</Link>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-[#FDF6EC] border border-border rounded-xl px-5 py-4 mb-6">
            <div>
              <p className="text-[14px] font-medium text-ink">You&apos;re not on the agency register yet</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Join from {AGENCY_LISTING_TIERS.basic.display} to appear in the directory and receive shift offers - urgent same-day offers arrive by text.</p>
            </div>
            <Link href="/talent/onboarding?step=9" className="btn-primary text-[12px] shrink-0 ml-4">Join now</Link>
          </div>
        )
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Offers awaiting a response */}
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
                          <h3 className="font-medium text-ink">{b.employer_name || 'Property'}</h3>
                          {b.urgent && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                              <Zap size={11} /> URGENT - TODAY
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>
                            {b.status === 'countered' ? 'counter sent' : b.status}
                          </span>
                          {b.expires_at && (
                            <span className={`text-[11px] font-medium ${b.urgent ? 'text-red-600' : 'text-amber-600'}`}>{expiryLabel(b.expires_at)}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>
                          {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
                          {b.hours && <span>{b.hours}h</span>}
                          <span className="flex items-center space-x-1 font-medium text-ink"><Banknote size={14} className="text-accent" /><span>£{b.rate}/hr{b.hours ? ` · £${b.rate * b.hours} total` : ''}</span></span>
                        </div>
                        {(b.employer_location || b.commute_car_required !== null || b.nearest_transport) && (
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500 mt-2">
                            {b.employer_location && <span className="flex items-center gap-1"><MapPin size={12} />{b.employer_location}{b.employer_postcode ? ` (${b.employer_postcode})` : ''}</span>}
                            {b.commute_car_required === true && <span className="flex items-center gap-1 text-amber-700"><Car size={12} /> Car required</span>}
                            {b.commute_car_required === false && <span className="flex items-center gap-1"><TrainFront size={12} /> Reachable by public transport</span>}
                            {b.nearest_transport && <span className="flex items-center gap-1"><TrainFront size={12} />{b.nearest_transport}</span>}
                          </div>
                        )}
                      </div>

                      {b.status === 'pending' ? (
                        counteringId === b.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={1} value={counterRate}
                              onChange={(e) => setCounterRate(e.target.value)}
                              placeholder="Your rate (£/hour)"
                              className="input-field text-[13px] w-36"
                            />
                            <button onClick={() => act(b.id, 'counter', counterRate)} disabled={busyId === b.id} className="btn-primary text-[12px] disabled:opacity-50">Send</button>
                            <button onClick={() => { setCounteringId(null); setCounterRate(''); setActionError('') }} className="btn-secondary text-[12px]">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => act(b.id, 'accept')} disabled={busyId === b.id} className="btn-primary text-[12px] disabled:opacity-50">Accept</button>
                            <button onClick={() => { setCounteringId(b.id); setCounterRate(String(b.rate || '')); setActionError('') }} disabled={busyId === b.id} className="btn-secondary text-[12px] disabled:opacity-50">Counter</button>
                            <button onClick={() => act(b.id, 'decline')} disabled={busyId === b.id} className="text-[12px] font-medium text-red-600 hover:text-red-700 px-3 py-2.5 disabled:opacity-50">Decline</button>
                          </div>
                        )
                      ) : (
                        <p className="text-[13px] text-gray-500">Counter sent - awaiting the property's response.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booked / past shifts */}
          {offers.length > 0 && <h2 className="text-[16px] font-medium text-ink mb-3">Shifts</h2>}
          {shifts.length === 0 && offers.length === 0 ? (
            <div className="dashboard-card text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No agency shifts booked yet.</p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="dashboard-card text-center py-8 text-gray-400">
              <p className="text-sm">No confirmed shifts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((b) => (
                <div key={b.id} className="dashboard-card flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-ink">{b.employer_name || 'Property'}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>
                      {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
                      {b.hours && <span>{b.hours}h</span>}
                    </div>
                    {(b.status === 'accepted' || b.status === 'confirmed') && (
                      <p className="text-[11px] text-green-700 mt-1.5">Agreed at £{b.rate}/hour{b.hours ? ` — you earn £${b.rate * b.hours} for ${b.hours} hours` : ''}. This agreement is on record; payment is settled directly with the property for now.</p>
                    )}
                  </div>
                  <div className="text-right">
                    {b.rate && <p className="font-medium text-ink">£{b.rate}/hr</p>}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status}</span>
                    {(b.status === 'accepted' || b.status === 'confirmed' || b.status === 'completed') && b.employer_user_id && (
                      <button type="button"
                        onClick={() => setReviewing({ userId: b.employer_user_id, name: b.employer_name || 'this property' })}
                        className="block ml-auto mt-2 text-[12px] font-medium text-amber-500 hover:underline">
                        <span className="inline-flex items-center gap-1"><Star size={11} /> Review property</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Review modal — offered on agreed shifts */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-ink">Review {reviewing.name}</h2>
              <button type="button" onClick={() => setReviewing(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <ReviewForm reviewedId={reviewing.userId} reviewedName={reviewing.name} type="employer" />
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
