'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Check, Zap, MapPin, CalendarDays, Clock3, Banknote } from 'lucide-react'
import { AGENCY_LISTING_TIERS } from '@/lib/constants'

const dayKey = (d: Date) => d.toLocaleDateString('en-CA')
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function calendarWeeks(): Date[][] {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + w * 7 + d)
      week.push(day)
    }
    weeks.push(week)
  }
  return weeks
}

function prettyDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function durationHours(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some(Number.isNaN)) return 0
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60)
}

function addHours(start: string, hours: number) {
  const [h, m] = start.split(':').map(Number)
  const total = Math.min(23 * 60 + 59, h * 60 + m + hours * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function AgencySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [live, setLive] = useState<{ available: boolean; tier: string | null; until: string | null }>({ available: false, tier: null, until: null })
  const [form, setForm] = useState({ hourly_rate: '', phone: '', postcode: '', travel_radius_miles: '', tier: 'basic' as 'basic' | 'featured' })
  const [hasCoords, setHasCoords] = useState(false)
  const [days, setDays] = useState<Record<string, 'available' | 'unavailable'>>({})
  const [windows, setWindows] = useState<Record<string, Array<{ start_time: string; end_time: string }>>>({})
  const [selectedDate, setSelectedDate] = useState(dayKey(new Date()))
  const [availabilityMode, setAvailabilityMode] = useState<'available' | 'unavailable'>('available')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [dayBusy, setDayBusy] = useState<string | null>(null)
  const [referral, setReferral] = useState<{ code: string | null; total: number; converted: number }>({ code: null, total: 0, converted: 0 })
  const [copied, setCopied] = useState(false)
  const [payoutState, setPayoutState] = useState<'loading' | 'not_started' | 'incomplete' | 'active' | 'unavailable'>('loading')
  const [payoutBusy, setPayoutBusy] = useState(false)

  // Stripe Connect payout readiness, shared with Residency - same account,
  // same onboarding endpoint.
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
        body: JSON.stringify({ returnUrl: window.location.origin, returnPath: '/talent/agency/settings' }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) { setError(json.error || 'Could not start payout setup.'); return }
      window.location.href = json.url
    } catch { setError('Could not start payout setup.') } finally { setPayoutBusy(false) }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agency/settings')
        if (res.ok) {
          const j = await res.json()
          const s = j.settings || {}
          setProfileId(s.profile_id || null)
          setLive({ available: Boolean(s.agency_available), tier: s.agency_tier || null, until: s.agency_listed_until || null })
          setForm({
            hourly_rate: s.hourly_rate?.toString() || '',
            phone: s.phone || '',
            postcode: s.postcode || '',
            travel_radius_miles: s.travel_radius_miles?.toString() || '',
            tier: s.agency_tier === 'featured' ? 'featured' : 'basic',
          })
          setHasCoords(Boolean(s.has_coords))
          setReferral({ code: s.referral_code || null, total: s.referral_stats?.total || 0, converted: s.referral_stats?.converted || 0 })
        }
        const avRes = await fetch('/api/agency/availability')
        if (avRes.ok) {
          const av = await avRes.json()
          const map: Record<string, 'available' | 'unavailable'> = {}
          for (const d of av.days || []) map[d.date] = d.available ? 'available' : 'unavailable'
          setDays(map)
          const windowMap: Record<string, Array<{ start_time: string; end_time: string }>> = {}
          for (const w of av.windows || []) (windowMap[w.date] ||= []).push(w)
          setWindows(windowMap)
          const today = dayKey(new Date())
          if (map[today]) setAvailabilityMode(map[today])
          const firstWindow = windowMap[today]?.[0]
          if (firstWindow) {
            setStartTime(firstWindow.start_time.slice(0, 5))
            setEndTime(firstWindow.end_time.slice(0, 5))
          }
        }
      } catch { /* form stays blank */ }
      setLoading(false)
    }
    load()
  }, [])

  function chooseDate(key: string) {
    setSelectedDate(key)
    setAvailabilityMode(days[key] || 'available')
    const w = windows[key]?.[0]
    if (w) {
      setStartTime(w.start_time.slice(0, 5))
      setEndTime(w.end_time.slice(0, 5))
    }
  }

  async function saveDay(state: 'available' | 'unavailable' | 'clear') {
    const key = selectedDate
    if (dayBusy) return
    setDayBusy(key)
    setError('')
    try {
      const res = await fetch('/api/agency/availability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: key, state, startTime, endTime }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not save availability.'); return }
      setDays(current => {
        const copy = { ...current }
        if (state === 'clear') delete copy[key]
        else copy[key] = state
        return copy
      })
      setWindows(current => {
        if (state !== 'available') return { ...current, [key]: [] }
        const nextWindow = { start_time: startTime, end_time: endTime }
        return { ...current, [key]: [nextWindow] }
      })
      setNotice(state === 'available' ? `${prettyDate(key)} saved as available ${startTime}–${endTime}.` : state === 'unavailable' ? `${prettyDate(key)} saved as not available.` : 'Availability cleared.')
    } catch { setError('Could not save availability.') } finally { setDayBusy(null) }
  }

  async function saveDetails(joining: boolean): Promise<boolean> {
    setError('')
    const res = await fetch('/api/agency/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, joining }),
    })
    const j = await res.json()
    if (!res.ok) { setError(j.error || 'Could not save - please try again.'); return false }
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    const ok = await saveDetails(live.available)
    if (ok) { setNotice('Saved.'); setTimeout(() => setNotice(''), 2500); setHasCoords(Boolean(form.postcode)) }
    setSaving(false)
  }

  const handleSubscribe = async () => {
    if (!profileId) return
    setPaying(true)
    try {
      const ok = await saveDetails(true)
      if (!ok) { setPaying(false); return }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agency_listing', candidateId: profileId, tier: form.tier, returnUrl: window.location.origin }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) { setError(j.error || 'Could not start the payment - please try again.'); setPaying(false); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
      setPaying(false)
    }
  }

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div></DashboardShell>

  const selectedDuration = durationHours(startTime, endTime)

  return (
    <DashboardShell role="talent">
      <div className="max-w-3xl">
        <p className="dashboard-eyebrow">Agency register</p>
        <h1 className="dashboard-title">Agency Settings</h1>
        <p className="dashboard-intro mb-6">Be bookable for agency shifts - planned cover and urgent same-day work. You set the rate; properties pay Wellness House Collective, and you receive 100% of the agreed shift rate after the shift. Urgent offers reach you by text.</p>

        {notice && <div role="status" className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
        {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {live.available ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-[14px] font-medium text-green-800">You&apos;re on the agency register{live.tier === 'featured' && <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide bg-green-600 text-white px-2 py-0.5 rounded-full">Featured</span>}</p>
            <p className="text-[12px] text-green-700 mt-0.5">{AGENCY_LISTING_TIERS[(live.tier === 'featured' ? 'featured' : 'basic')].display}{live.until ? ` - renews ${new Date(live.until).toLocaleDateString('en-GB')}` : ''}. Manage the subscription from <Link href="/talent/billing" className="underline">Billing</Link>.</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-surface border border-border rounded-xl mb-6">
            <Zap size={18} className="text-ink mt-0.5 shrink-0" />
            <p className="text-[13px] text-secondary">You&apos;re not on the register yet. Fill in your details below and subscribe from {AGENCY_LISTING_TIERS.basic.display} to start receiving shift offers.</p>
          </div>
        )}

        {/* Connected payouts mean the property's payment reaches the
            professional at the moment it clears, instead of waiting on a WHC
            bank transfer after the shift. */}
        {live.available && payoutState !== 'loading' && payoutState !== 'unavailable' && (
          payoutState === 'active' ? (
            <div className="mb-6 flex items-start gap-3 border border-green-200 bg-green-50 px-5 py-4">
              <Banknote size={18} className="text-green-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] font-medium text-green-800">Payouts are connected</p>
                <p className="text-[12px] leading-5 text-green-700 mt-0.5">Your full agreed shift amount is sent straight to your bank account by Stripe the moment a property pays. Nothing is deducted and nothing waits on a WHC transfer.</p>
              </div>
            </div>
          ) : (
            <div className="mb-6 border border-[#1c1b1a]/25 bg-[#f3f0eb] px-5 py-4">
              <div className="flex items-start gap-3">
                <Banknote size={18} className="text-[#1c1b1a] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[14px] font-medium text-ink">{payoutState === 'incomplete' ? 'Finish connecting your payouts' : 'Get paid the moment a property pays'}</p>
                  <p className="text-[12px] leading-5 text-secondary mt-1">
                    {payoutState === 'incomplete'
                      ? 'Your Stripe payout setup is not finished, so shift money still comes to you by WHC bank transfer after the shift. Complete it and you are paid automatically instead.'
                      : 'Connect your bank account securely through Stripe and your full agreed shift amount is paid to you automatically as soon as the property pays, rather than by a WHC bank transfer after the shift. It takes about two minutes, and your rate and fee do not change.'}
                  </p>
                  <button type="button" onClick={startPayouts} disabled={payoutBusy} className="btn-primary mt-3 text-[12px] disabled:opacity-50">
                    {payoutBusy ? 'Opening Stripe...' : payoutState === 'incomplete' ? 'Continue payout setup' : 'Connect payouts with Stripe'}
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">Your Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="eyebrow block mb-1.5">Hourly Rate (£) *</label><input aria-label="Hourly Rate (£)" type="number" min={1} value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} className="input-field" placeholder="e.g. 25" /><p className="text-[11px] text-muted mt-1">What properties see when they make you an offer.</p></div>
            <div><label className="eyebrow block mb-1.5">Mobile Number *</label><input aria-label="Mobile Number" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="07700 900123" /><p className="text-[11px] text-muted mt-1">Urgent same-day offers are sent by text.</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="eyebrow block mb-1.5">Postcode *</label><input aria-label="Postcode" type="text" value={form.postcode} onChange={e => setForm({ ...form, postcode: e.target.value })} className="input-field" placeholder="SW1A 1AA" /><p className="text-[11px] text-muted mt-1 inline-flex items-center gap-1"><MapPin size={10} />{hasCoords ? 'Location verified - offers show real distance in miles.' : 'Used to work out real distance to each property.'}</p></div>
            <div><label className="eyebrow block mb-1.5">Travel Radius (miles)</label><input aria-label="Travel Radius (miles)" type="number" min={1} value={form.travel_radius_miles} onChange={e => setForm({ ...form, travel_radius_miles: e.target.value })} className="input-field" placeholder="e.g. 15" /><p className="text-[11px] text-muted mt-1">Offers outside this are flagged so you can judge the commute.</p></div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-secondary text-[13px] disabled:opacity-50">{saving ? 'Saving...' : 'Save Details'}</button>
        </div>

        <div className="dashboard-card mb-6">
          <div className="flex items-center gap-2 mb-1"><CalendarDays size={17} className="text-ink" /><h3 className="font-serif text-lg font-semibold">Your Availability</h3></div>
          <p className="text-[12px] text-secondary mb-5">Choose the day, say whether you are available, then add the exact hours you can genuinely work. A property only sees you as available when its entire shift fits inside the hours you have set.</p>

          {!live.available && (
            <div className="mb-5 border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-[13px] font-semibold text-amber-900">Properties cannot see any of this yet</p>
              <p className="mt-1 text-[12px] leading-5 text-amber-800">Your hours are saved, but you are not on the agency register, so you do not appear in any property&apos;s search. Subscribe below and everything you have set here goes live immediately.</p>
            </div>
          )}

          <div className="border border-border bg-white p-5 mb-5">
            <p className="text-[10px] uppercase tracking-[.14em] text-muted font-semibold">Selected day</p>
            <p className="mt-1 text-[24px] font-serif font-semibold text-ink">{prettyDate(selectedDate)}</p>
            <div className="mt-4 max-w-xs"><label className="eyebrow block mb-1">Change date</label><input aria-label="Change date" type="date" value={selectedDate} min={dayKey(new Date())} onChange={e => chooseDate(e.target.value)} className="input-field" /></div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-[11px] font-semibold text-ink mb-2">Can you work this day?</p>
              <div className="inline-flex border border-border bg-surface p-1">
                <button type="button" onClick={() => setAvailabilityMode('available')} className={`px-5 py-2.5 text-[12px] font-semibold transition-colors ${availabilityMode === 'available' ? 'bg-[#1c1b1a] text-white' : 'text-secondary hover:text-ink'}`}>Available</button>
                <button type="button" onClick={() => setAvailabilityMode('unavailable')} className={`px-5 py-2.5 text-[12px] font-semibold transition-colors ${availabilityMode === 'unavailable' ? 'bg-[#1c1b1a] text-white' : 'text-secondary hover:text-ink'}`}>Not available</button>
              </div>
            </div>

            {availabilityMode === 'available' ? (
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex items-center gap-2 mb-3"><Clock3 size={15} className="text-ink"/><p className="text-[11px] font-semibold text-ink">What hours can you work?</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="eyebrow block mb-1">From</label><input aria-label="From" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field" /></div>
                  <div><label className="eyebrow block mb-1">Until</label><input aria-label="Until" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field" /></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEndTime(addHours(startTime, 4))} className="btn-secondary !px-3 !py-2 text-[11px]">4 hours</button>
                  <button type="button" onClick={() => setEndTime(addHours(startTime, 6))} className="btn-secondary !px-3 !py-2 text-[11px]">6 hours</button>
                  <button type="button" onClick={() => { setStartTime('09:00'); setEndTime('17:00') }} className="btn-secondary !px-3 !py-2 text-[11px]">Full day · 09:00–17:00</button>
                  <span className="self-center text-[11px] text-muted">or enter any custom hours</span>
                </div>
                <div className="mt-4 bg-[#f3f0eb] border border-border px-4 py-3">
                  <p className="text-[12px] font-semibold text-ink">You are setting: {startTime}–{endTime}{selectedDuration > 0 ? ` · ${selectedDuration % 1 === 0 ? selectedDuration : selectedDuration.toFixed(1)} hours` : ''}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">Example: if you set 09:00–13:00, you can be matched to a 4-hour shift inside that window. If you set 09:00–17:00, you can be matched to shifts that start and finish within that full window.</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 border-t border-border pt-5"><p className="text-[12px] text-secondary">You will not be shown to properties searching for cover on this date.</p></div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <button type="button" onClick={() => saveDay(availabilityMode)} disabled={!!dayBusy} className="btn-primary text-[12px]">{dayBusy ? 'Saving...' : availabilityMode === 'available' ? 'Save available hours' : 'Save as not available'}</button>
              {days[selectedDate] && <button type="button" onClick={() => saveDay('clear')} disabled={!!dayBusy} className="text-[12px] underline text-muted">Clear this day</button>}
            </div>
            {(windows[selectedDate] || []).map((w, i) => <p key={i} className="mt-3 text-[12px] font-medium text-green-700">Saved: Available {w.start_time.slice(0,5)}–{w.end_time.slice(0,5)}</p>)}
            {days[selectedDate] === 'unavailable' && <p className="mt-3 text-[12px] font-medium text-secondary">Saved: Not available</p>}
          </div>

          <div className="mb-4 border border-border bg-[#f3f0eb] p-4">
            <p className="text-[11px] font-semibold text-ink mb-2">How availability works</p>
            <div className="grid gap-2 text-[11px] leading-5 text-secondary sm:grid-cols-2">
              <p><strong className="text-ink">Available:</strong> set the real start and finish time you could accept work.</p>
              <p><strong className="text-ink">Not available:</strong> you will not receive offers for that date.</p>
              <p><strong className="text-ink">Not set:</strong> the day is unconfirmed and is not treated as available.</p>
              <p><strong className="text-ink">Match rule:</strong> the hotel&apos;s whole requested shift must fit inside your saved window.</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">{WEEKDAY_LABELS.map(l => <div key={l} className="text-center text-[10px] uppercase tracking-wide text-muted">{l}</div>)}</div>
          {calendarWeeks().map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5 mb-1.5">
              {week.map(day => {
                const key = dayKey(day)
                const isPast = key < dayKey(new Date())
                const isToday = key === dayKey(new Date())
                const state = days[key]
                const window = state === 'available' ? windows[key]?.[0] : undefined
                return (
                  <button key={key} type="button" disabled={isPast || dayBusy === key} onClick={() => chooseDate(key)} title={state === 'available' ? (window ? `Available ${window.start_time.slice(0, 5)}–${window.end_time.slice(0, 5)} - tap to edit` : 'Available - tap to edit') : state === 'unavailable' ? 'Not available - tap to edit' : 'Not set - tap to add availability'} className={`relative min-h-[64px] border px-1 py-2 text-[11px] font-medium transition-colors ${isPast ? 'bg-[#f3f0eb] text-gray-300 border-transparent cursor-default' : state === 'available' ? 'bg-green-50 text-green-800 border-green-300' : state === 'unavailable' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-ink border-border hover:border-ink/30'} ${selectedDate === key ? 'ring-2 ring-[#1c1b1a]/20 border-[#1c1b1a]' : ''} ${isToday ? 'font-bold' : ''}`}>
                    <span className="block text-[9px] uppercase tracking-wide opacity-65">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                    <span className="block mt-0.5 text-[13px]">{day.getDate()}</span>
                    <span className="block text-[8px] uppercase opacity-60">{day.toLocaleDateString('en-GB', { month: 'short' })}</span>
                    {window && <span className="block mt-0.5 text-[8.5px] font-semibold tabular-nums text-green-700 whitespace-nowrap">{window.start_time.slice(0, 5)}–{window.end_time.slice(0, 5)}</span>}
                  </button>
                )
              })}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-secondary"><span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 bg-green-50 border border-green-300 inline-block" /> Available</span><span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 bg-red-50 border border-red-200 inline-block" /> Not available</span><span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 bg-white border border-border inline-block" /> Not set</span></div>
        </div>

        {referral.code && (
          <div className="dashboard-card mb-6">
            <h3 className="font-serif text-lg font-semibold mb-1">Refer a Friend</h3>
            <p className="text-[12px] text-secondary mb-3">Know a brilliant therapist? When they join the register with your link and subscribe, you get a <span className="font-medium text-ink">free month</span> on your listing. No limit.</p>
            <div className="flex items-center gap-2"><input readOnly aria-label="Your referral link" value={`https://talent.wellnesshousecollective.co.uk/register/talent?ref=${referral.code}`} className="input-field text-[12px] flex-1" onFocus={e => e.currentTarget.select()} /><button type="button" className="btn-secondary text-[12px] shrink-0" onClick={() => { navigator.clipboard?.writeText(`https://talent.wellnesshousecollective.co.uk/register/talent?ref=${referral.code}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? 'Copied' : 'Copy link'}</button></div>
            {referral.total > 0 && <p className="text-[12px] text-secondary mt-2">{referral.total} friend{referral.total > 1 ? 's' : ''} signed up · {referral.converted} joined the register{referral.converted > 0 ? ' - free months on their way' : ''}.</p>}
          </div>
        )}

        {!live.available && (
          <div className="dashboard-card mb-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold">Join the Register</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(AGENCY_LISTING_TIERS) as Array<keyof typeof AGENCY_LISTING_TIERS>).map(t => {
                const cfg = AGENCY_LISTING_TIERS[t]
                const active = form.tier === t
                return <button key={t} type="button" onClick={() => setForm({ ...form, tier: t })} className={`text-left p-4 rounded-xl border transition-all ${active ? 'border-ink ring-1 ring-ink' : 'border-border hover:border-ink/30'}`}><div className="flex items-center justify-between mb-1"><p className="text-[14px] font-medium text-ink">{cfg.label}</p>{active && <Check size={14} className="text-ink" />}</div><p className="text-[16px] font-semibold text-ink mb-2">{cfg.display}</p><ul className="space-y-1">{cfg.features.map(f => <li key={f} className="text-[11px] text-muted">{f}</li>)}</ul></button>
              })}
            </div>
            <button onClick={handleSubscribe} disabled={paying} className="btn-primary w-full disabled:opacity-50">{paying ? 'Taking you to payment...' : `Subscribe - ${AGENCY_LISTING_TIERS[form.tier].display}`}</button>
            <p className="text-[11px] text-muted text-center">Secure payment via Stripe. Cancel any time. Your listing goes live as soon as payment is confirmed.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
