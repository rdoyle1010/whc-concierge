'use client'

import { useCallback, useEffect, useState } from 'react'
import { getViewer } from '@/lib/viewer'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import { Banknote, CalendarDays, CheckCircle2, Crown, MapPin, ShieldCheck } from 'lucide-react'

export default function TalentResidencyPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [counterOpen, setCounterOpen] = useState<string | null>(null)
  const [counterRate, setCounterRate] = useState('')
  const [payoutState, setPayoutState] = useState<'loading' | 'not_started' | 'incomplete' | 'active' | 'unavailable'>('loading')
  const [payoutBusy, setPayoutBusy] = useState(false)
  const [openRoles, setOpenRoles] = useState<any[]>([])
  const [listing, setListing] = useState<any>(null)
  const [featureBusy, setFeatureBusy] = useState(false)
  const [featuredPrice, setFeaturedPrice] = useState('£99')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (params.get('checkout') === 'success' && sessionId) {
      fetch('/api/commercial/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
        .then(async res => ({ ok: res.ok, body: await res.json().catch(() => ({})) }))
        .then(x => x.ok ? setNotice(x.body.message || 'Payment confirmed - your listing is now featured for 30 days.') : setError(x.body.error || 'Payment could not be confirmed.'))
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    // Checkout charges the admin-set commercial_settings price - £99 is only
    // the fallback if the lookup fails.
    fetch('/api/commercial-settings?product=residency_featured', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const pence = Number(json?.setting?.price_pence || 0)
        if (pence > 0) {
          const pounds = pence / 100
          setFeaturedPrice(Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`)
        }
      })
      .catch(() => {})
  }, [])

  async function buyFeatured() {
    if (featureBusy) return
    setFeatureBusy(true); setError('')
    try {
      const res = await fetch('/api/commercial/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: 'residency_featured', returnUrl: window.location.origin }) })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not start the payment.'); return }
      window.location.href = json.url
    } catch { setError('Could not start the payment.') } finally { setFeatureBusy(false) }
  }

  useEffect(() => {
    fetch('/api/residency/open-roles')
      .then(res => res.ok ? res.json() : { roles: [] })
      .then(json => setOpenRoles(json.roles || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/talent/payouts')
      .then(res => res.ok ? res.json() : { state: 'unavailable' })
      .then(json => setPayoutState(json.state || 'unavailable'))
      .catch(() => setPayoutState('unavailable'))
  }, [])

  async function startPayouts() {
    if (payoutBusy) return
    setPayoutBusy(true); setError('')
    try {
      const res = await fetch('/api/talent/payouts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.origin }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not start payout setup.'); return }
      window.location.href = json.url
    } catch { setError('Could not start payout setup.') } finally { setPayoutBusy(false) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    const user = await getViewer()
    if (!user) { window.location.href = '/login?role=talent'; return }
    const { data: candidate } = await supabase.from('candidate_profiles').select('id,full_name,residency_member,residency_subscription_status').eq('user_id', user.id).maybeSingle()
    setProfile(candidate)
    if (candidate) {
      const { data } = await supabase.from('residency_bookings').select('*').eq('candidate_id', candidate.id).order('created_at', { ascending: false })
      setBookings(data || [])
      try {
        const res = await fetch('/api/residency/create')
        const json = res.ok ? await res.json() : { listing: null }
        setListing(json.listing || null)
      } catch { setListing(null) }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Membership is genuinely active only while the subscription is healthy -
  // a lapsed member is already hidden from the public directory.
  const memberActive = Boolean(profile?.residency_member) && !['past_due', 'canceled', 'cancelled', 'unpaid'].includes(String(profile?.residency_subscription_status || ''))

  async function respond(bookingId: string, action: 'accept' | 'decline' | 'counter', counterDayRate?: number) {
    setBusy(bookingId); setError('')
    const res = await fetch('/api/residency/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, action, counterDayRate }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) setError(data.error || 'Could not update the offer.')
    else { setCounterOpen(null); setCounterRate('') }
    await load(); setBusy(null)
  }

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <div className="max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div><p className="dashboard-eyebrow mb-2">Residency Marketplace</p><h1 className="dashboard-title">Residency offers</h1><p className="dashboard-intro mt-2">Review hotel invitations and keep your agreed terms protected on Talent House Collective.</p></div>
          <div className="flex flex-wrap gap-2">
            <Link href="/talent/before-you-arrive" className="btn-secondary">Before You Arrive</Link>
            <Link href="/residency/create" className="btn-primary">{memberActive ? 'Manage Residency Listing' : 'Join Residency'}</Link>
          </div>
        </div>

        {!loading && <div className={`rounded-2xl border p-5 mb-7 flex items-start gap-3 ${memberActive ? 'border-emerald-200 bg-emerald-50' : 'border-accent/20 bg-white'}`}>
          {memberActive ? <CheckCircle2 size={20} className="text-emerald-700 mt-0.5"/> : <Crown size={20} className="text-accent mt-0.5"/>}
          <div>
            <p className="font-medium text-ink text-sm">{memberActive ? 'Residency membership active' : profile?.residency_member ? 'Residency membership needs attention' : 'Residency membership'}</p>
            <p className="text-xs text-muted mt-1 leading-5">
              {memberActive
                ? 'Your profile can receive structured hotel offers.'
                : profile?.residency_member
                  ? 'Your membership payment has lapsed, so your listing is hidden from properties. Renew from Billing to go live again.'
                  : 'Residency listings are £10/month. Activate membership to be promoted to properties and receive offers.'}
            </p>
          </div>
        </div>}

        {payoutState !== 'loading' && payoutState !== 'unavailable' && <div className={`rounded-2xl border p-5 mb-7 flex items-start gap-3 ${payoutState === 'active' ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-white'}`}>
          <Banknote size={20} className={payoutState === 'active' ? 'text-emerald-700 mt-0.5' : 'text-accent mt-0.5'}/>
          <div className="flex-1">
            <p className="font-medium text-ink text-sm">{payoutState === 'active' ? 'Payouts active' : payoutState === 'incomplete' ? 'Finish your payout setup' : 'Set up payouts'}</p>
            <p className="text-xs text-muted mt-1 leading-5">
              {payoutState === 'active'
                ? 'Your bank account is connected. Residency payouts are sent to it automatically once a booking completes.'
                : payoutState === 'incomplete'
                  ? 'Your Stripe setup is not finished yet - complete it so payouts can reach your bank account automatically.'
                  : 'Connect your bank account securely through Stripe so residency payouts reach you automatically when a booking completes. Takes about two minutes.'}
            </p>
            {payoutState !== 'active' && <button type="button" onClick={startPayouts} disabled={payoutBusy} className="btn-primary mt-3 text-[12px]">{payoutBusy ? 'Opening Stripe...' : payoutState === 'incomplete' ? 'Continue setup' : 'Set up payouts with Stripe'}</button>}
          </div>
        </div>}

        {notice && <div className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{notice}</div>}
        {!loading && listing && listing.approval_status === 'approved' && (
          (listing.is_featured && (!listing.featured_until || new Date(listing.featured_until) > new Date())) ? (
            <div className="rounded-2xl border border-accent/30 bg-[#f1f1f1] p-5 mb-7 flex items-start gap-3">
              <Crown size={20} className="text-accent mt-0.5"/>
              <div>
                <p className="font-medium text-ink text-sm">Your listing is featured</p>
                <p className="text-xs text-muted mt-1 leading-5">It sits at the top of the Residency marketplace with the Featured badge{listing.featured_until ? ` until ${new Date(listing.featured_until).toLocaleDateString('en-GB')}` : ''}.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white p-5 mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Crown size={20} className="text-accent mt-0.5"/>
                <div>
                  <p className="font-medium text-ink text-sm">Feature your listing</p>
                  <p className="text-xs text-muted mt-1 leading-5">30 days at the top of the Residency marketplace with the Featured badge - seen first by every property browsing for specialists.</p>
                </div>
              </div>
              <button type="button" onClick={buyFeatured} disabled={featureBusy} className="btn-primary shrink-0 text-[12px] disabled:opacity-50">{featureBusy ? 'Opening payment...' : `Go Featured - ${featuredPrice} / 30 days`}</button>
            </div>
          )
        )}

        <div className="rounded-2xl border border-border bg-white p-5 mb-7 flex items-start gap-3"><ShieldCheck size={20} className="text-accent mt-0.5"/><div><p className="font-medium text-ink text-sm">Why keep the booking here?</p><p className="text-xs text-muted mt-1 leading-5">Accepted rates, dates, accommodation and travel terms are recorded before payment. Completed platform residencies can qualify for verified reviews, and once a booking confirms you get a Before You Arrive pack with the property&apos;s details.</p></div></div>

        {openRoles.length > 0 && <div className="rounded-2xl border border-border bg-white p-5 mb-7">
          <p className="font-medium text-ink text-sm mb-1">Open residency roles matched to you</p>
          <p className="text-xs text-muted mb-3">Properties advertising residency roles right now, ranked by your match.</p>
          <div className="flex flex-wrap gap-2">
            {openRoles.map(role => (
              <Link key={role.id} href={`/jobs/${role.id}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] hover:border-ink/30">
                <span className="font-semibold text-ink">{role.job_title}</span>
                <span className="text-muted">{role.property_name}{role.location ? ` · ${role.location}` : ''}</span>
                <span className="rounded-full bg-[#e7e7e7] px-1.5 py-0.5 text-[10px] font-bold text-[#1c1c1c]">{role.score}%</span>
              </Link>
            ))}
          </div>
        </div>}

        {error && <p className="text-[13px] text-red-600 font-medium mb-4">{error}</p>}

        {loading ? <div className="skeleton h-44 rounded-2xl"/> : bookings.length === 0 ? <div className="bg-white border border-border rounded-2xl p-12 text-center"><p className="font-medium text-ink">No residency offers yet</p><p className="text-sm text-secondary mt-2 mb-5">Keep your availability and specialist profile up to date so the right properties can find you.</p><Link href="/residency/create" className="btn-primary inline-block">{memberActive ? 'Update Residency Profile' : 'Join Residency'}</Link></div> : <div className="space-y-4">{bookings.map(b => {
          const awaitingMe = b.status === 'offered' || (b.status === 'countered' && b.countered_by === 'employer')
          const awaitingThem = b.status === 'countered' && b.countered_by !== 'employer'
          return <div key={b.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0"><span className="text-xs font-semibold uppercase tracking-[.12em] text-accent">{b.status === 'countered' ? (awaitingThem ? 'countered - awaiting the property' : 'property countered') : b.status}</span><h2 className="text-xl font-semibold text-ink mt-2">{b.property_name}</h2><div className="flex flex-wrap gap-4 mt-3 text-sm text-muted"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{b.start_date} - {b.end_date}</span><span>{b.days_required} working days</span></div><div className="flex flex-wrap gap-2 mt-4">{b.accommodation_included && <span className="badge-gold">Accommodation included</span>}{b.travel_included && <span className="badge-gold">Travel included</span>}</div>{b.services_required && <p className="text-sm text-secondary mt-4 leading-6"><span className="font-medium text-ink">Requested services:</span> {b.services_required}</p>}{b.notes && <p className="text-sm text-secondary mt-2 leading-6"><span className="font-medium text-ink">Property notes:</span> {b.notes}</p>}</div>
            <div className="lg:w-72 rounded-xl bg-surface p-4 shrink-0"><p className="text-xs text-muted">{awaitingThem ? 'Your counter' : 'Offer'}</p><p className="text-2xl font-semibold text-ink mt-1">£{Number(b.proposed_day_rate).toLocaleString('en-GB')}<span className="text-xs font-normal text-muted">/day</span></p><p className="text-xs text-muted mt-1">£{Number(b.proposed_total).toLocaleString('en-GB')} residency value</p>
              {awaitingMe && (counterOpen === b.id ? (
                <div className="mt-4">
                  <label className="block text-[11px] font-semibold text-ink mb-1">Your counter (£/day)</label>
                  <input aria-label="Counter offer rate" value={counterRate} onChange={e => setCounterRate(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder={`e.g. ${Math.round(Number(b.proposed_day_rate) * 1.1)}`} className="input-field text-[13px] w-full mb-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <button disabled={busy===b.id} onClick={() => { setCounterOpen(null); setCounterRate('') }} className="btn-secondary !px-2 !py-2 text-[11px]">Back</button>
                    <button disabled={busy===b.id || !Number(counterRate)} onClick={() => respond(b.id, 'counter', Number(counterRate))} className="btn-primary !px-2 !py-2 text-[11px]">{busy===b.id ? 'Sending...' : 'Send counter'}</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button disabled={busy===b.id} onClick={() => respond(b.id,'decline')} className="btn-secondary !px-2 !py-2 text-[11px]">Decline</button>
                  <button disabled={busy===b.id} onClick={() => { setCounterOpen(b.id); setCounterRate('') }} className="btn-secondary !px-2 !py-2 text-[11px]">Counter</button>
                  <button disabled={busy===b.id} onClick={() => respond(b.id,'accept')} className="btn-primary !px-2 !py-2 text-[11px]">Accept</button>
                </div>
              ))}
              {awaitingThem && <p className="mt-4 text-xs text-amber-700">Your counter is with the property - you will be notified when they respond.</p>}
              {b.status === 'accepted' && <p className="mt-4 text-xs text-amber-700">Accepted - awaiting property payment.</p>}
              {b.status === 'confirmed' && <div className="mt-4"><p className="text-xs text-emerald-700 font-medium">Confirmed - payment received.</p><Link href="/talent/before-you-arrive" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1c1c1c] underline"><MapPin size={11}/> Your Before You Arrive pack</Link></div>}
            </div>
          </div>
        </div>})}</div>}
      </div>
    </DashboardShell>
  )
}
