'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, CheckCircle2, Crown, MapPin, ShieldCheck } from 'lucide-react'

export default function TalentResidencyPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [counterOpen, setCounterOpen] = useState<string | null>(null)
  const [counterRate, setCounterRate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login?role=talent'; return }
    const { data: candidate } = await supabase.from('candidate_profiles').select('id,full_name,residency_member,residency_subscription_status').eq('user_id', user.id).maybeSingle()
    setProfile(candidate)
    if (candidate) {
      const { data } = await supabase.from('residency_bookings').select('*').eq('candidate_id', candidate.id).order('created_at', { ascending: false })
      setBookings(data || [])
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
    <div className="min-h-screen bg-[#F7F5F1] px-5 py-10 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div><p className="eyebrow mb-2">Residency Marketplace</p><h1 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">Residency offers</h1><p className="text-sm text-muted mt-2">Review hotel invitations and keep your agreed terms protected on Spa Platform.</p></div>
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

        <div className="rounded-2xl border border-border bg-white p-5 mb-7 flex items-start gap-3"><ShieldCheck size={20} className="text-accent mt-0.5"/><div><p className="font-medium text-ink text-sm">Why keep the booking here?</p><p className="text-xs text-muted mt-1 leading-5">Accepted rates, dates, accommodation and travel terms are recorded before payment. Completed platform residencies can qualify for verified reviews, and once a booking confirms you get a Before You Arrive pack with the property&apos;s details.</p></div></div>

        {error && <p className="text-[13px] text-red-600 font-medium mb-4">{error}</p>}

        {loading ? <div className="skeleton h-44 rounded-2xl"/> : bookings.length === 0 ? <div className="bg-white border border-border rounded-2xl p-12 text-center"><p className="font-medium text-ink">No residency offers yet</p><p className="text-sm text-muted mt-2 mb-5">Keep your availability and specialist profile up to date so the right properties can find you.</p><Link href="/residency/create" className="btn-primary inline-block">{memberActive ? 'Update Residency Profile' : 'Join Residency'}</Link></div> : <div className="space-y-4">{bookings.map(b => {
          const awaitingMe = b.status === 'offered' || (b.status === 'countered' && b.countered_by === 'employer')
          const awaitingThem = b.status === 'countered' && b.countered_by !== 'employer'
          return <div key={b.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0"><span className="text-xs font-semibold uppercase tracking-[.12em] text-accent">{b.status === 'countered' ? (awaitingThem ? 'countered - awaiting the property' : 'property countered') : b.status}</span><h2 className="text-xl font-semibold text-ink mt-2">{b.property_name}</h2><div className="flex flex-wrap gap-4 mt-3 text-sm text-muted"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{b.start_date} - {b.end_date}</span><span>{b.days_required} working days</span></div><div className="flex flex-wrap gap-2 mt-4">{b.accommodation_included && <span className="badge-gold">Accommodation included</span>}{b.travel_included && <span className="badge-gold">Travel included</span>}</div>{b.services_required && <p className="text-sm text-secondary mt-4 leading-6"><span className="font-medium text-ink">Requested services:</span> {b.services_required}</p>}{b.notes && <p className="text-sm text-secondary mt-2 leading-6"><span className="font-medium text-ink">Property notes:</span> {b.notes}</p>}</div>
            <div className="lg:w-72 rounded-xl bg-surface p-4 shrink-0"><p className="text-xs text-muted">{awaitingThem ? 'Your counter' : 'Offer'}</p><p className="text-2xl font-semibold text-ink mt-1">£{Number(b.proposed_day_rate).toLocaleString('en-GB')}<span className="text-xs font-normal text-muted">/day</span></p><p className="text-xs text-muted mt-1">£{Number(b.proposed_total).toLocaleString('en-GB')} residency value</p>
              {awaitingMe && (counterOpen === b.id ? (
                <div className="mt-4">
                  <label className="block text-[11px] font-semibold text-ink mb-1">Your counter (£/day)</label>
                  <input value={counterRate} onChange={e => setCounterRate(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder={`e.g. ${Math.round(Number(b.proposed_day_rate) * 1.1)}`} className="input-field text-[13px] w-full mb-2" />
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
              {b.status === 'confirmed' && <div className="mt-4"><p className="text-xs text-emerald-700 font-medium">Confirmed - payment received.</p><Link href="/talent/before-you-arrive" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0b2f4d] underline"><MapPin size={11}/> Your Before You Arrive pack</Link></div>}
            </div>
          </div>
        </div>})}</div>}
      </div>
    </div>
  )
}
