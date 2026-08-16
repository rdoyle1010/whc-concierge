'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Check, Zap, MapPin, CalendarDays } from 'lucide-react'
import { AGENCY_LISTING_TIERS } from '@/lib/constants'

// ── Availability calendar helpers ──
const dayKey = (d: Date) => d.toLocaleDateString('en-CA') // YYYY-MM-DD, local
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Six weeks of dates starting from this week's Monday
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

// The therapist's agency home: everything needed to be on the register in
// one place - rate, mobile, location, radius, and the £10/mo subscription.

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
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [dayBusy, setDayBusy] = useState<string | null>(null)
  const [referral, setReferral] = useState<{ code: string | null; total: number; converted: number }>({ code: null, total: 0, converted: 0 })
  const [copied, setCopied] = useState(false)

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
        }
      } catch { /* form stays blank */ }
      setLoading(false)
    }
    load()
  }, [])

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
        const prior = current[key] || []
        const nextWindow = { start_time: startTime, end_time: endTime }
        const alreadyShown = prior.some(w => w.start_time.slice(0, 5) === startTime && w.end_time.slice(0, 5) === endTime)
        return { ...current, [key]: alreadyShown ? prior : [...prior, nextWindow] }
      })
      setNotice(state === 'available' ? `Available ${startTime}–${endTime} saved.` : state === 'unavailable' ? 'Unavailable day saved.' : 'Availability cleared.')
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

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div></DashboardShell>

  return (
    <DashboardShell role="talent">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-serif font-bold text-ink mb-2">Agency Settings</h1>
        <p className="text-[13px] text-gray-500 mb-6">Be bookable for agency shifts - planned cover and urgent same-day work. You set the rate; hotels pay Wellness House Collective, and WHC pays you after the shift (a 5% fee applies). Urgent offers reach you by text.</p>

        {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Listing status */}
        {live.available ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-[14px] font-medium text-green-800">
              You&apos;re on the agency register
              {live.tier === 'featured' && <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide bg-green-600 text-white px-2 py-0.5 rounded-full">Featured</span>}
            </p>
            <p className="text-[12px] text-green-700 mt-0.5">
              {AGENCY_LISTING_TIERS[(live.tier === 'featured' ? 'featured' : 'basic')].display}
              {live.until ? ` - renews ${new Date(live.until).toLocaleDateString('en-GB')}` : ''}. Manage the subscription from <Link href="/talent/billing" className="underline">Billing</Link>.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-[#FDF6EC] border border-border rounded-xl mb-6">
            <Zap size={18} className="text-accent mt-0.5 shrink-0" />
            <p className="text-[13px] text-secondary">You&apos;re not on the register yet. Fill in your details below and subscribe from {AGENCY_LISTING_TIERS.basic.display} to start receiving shift offers.</p>
          </div>
        )}

        {/* Details */}
        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">Your Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Hourly Rate (£) *</label>
              <input type="number" min={1} value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} className="input-field" placeholder="e.g. 25" />
              <p className="text-[11px] text-muted mt-1">What properties see when they make you an offer.</p>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Mobile Number *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="07700 900123" />
              <p className="text-[11px] text-muted mt-1">Urgent same-day offers are sent by text.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Postcode *</label>
              <input type="text" value={form.postcode} onChange={e => setForm({ ...form, postcode: e.target.value })} className="input-field" placeholder="SW1A 1AA" />
              <p className="text-[11px] text-muted mt-1 inline-flex items-center gap-1">
                <MapPin size={10} />{hasCoords ? 'Location verified - offers show real distance in miles.' : 'Used to work out real distance to each property.'}
              </p>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Travel Radius (miles)</label>
              <input type="number" min={1} value={form.travel_radius_miles} onChange={e => setForm({ ...form, travel_radius_miles: e.target.value })} className="input-field" placeholder="e.g. 15" />
              <p className="text-[11px] text-muted mt-1">Offers outside this are flagged so you can judge the commute.</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-secondary text-[13px] disabled:opacity-50">{saving ? 'Saving...' : 'Save Details'}</button>
        </div>

        {/* Availability calendar */}
        <div className="dashboard-card mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={17} className="text-accent" />
            <h3 className="font-serif text-lg font-semibold">Your Availability</h3>
          </div>
          <p className="text-[12px] text-gray-500 mb-4">
            Pick a day, then enter the exact hours you can work. Hotels searching that full time window will see you as confirmed available. Blank days are shown as not confirmed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 rounded-xl bg-surface p-4">
            <div><label className="eyebrow block mb-1">Selected date</label><input type="date" value={selectedDate} min={dayKey(new Date())} onChange={e => setSelectedDate(e.target.value)} className="input-field" /></div>
            <div><label className="eyebrow block mb-1">From</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field" /></div>
            <div><label className="eyebrow block mb-1">Until</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field" /></div>
            <div className="sm:col-span-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => saveDay('available')} disabled={!!dayBusy} className="btn-primary text-[12px]">Save available hours</button>
              <button type="button" onClick={() => saveDay('unavailable')} disabled={!!dayBusy} className="btn-secondary text-[12px]">Mark unavailable</button>
              <button type="button" onClick={() => saveDay('clear')} disabled={!!dayBusy} className="text-[12px] underline text-muted">Clear day</button>
            </div>
            {(windows[selectedDate] || []).map((w, i) => <p key={i} className="sm:col-span-3 text-[12px] text-green-700">Confirmed: {w.start_time.slice(0,5)}–{w.end_time.slice(0,5)} (Europe/London)</p>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAY_LABELS.map(l => <div key={l} className="text-center text-[10px] uppercase tracking-wide text-gray-400">{l}</div>)}
          </div>
          {calendarWeeks().map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5 mb-1.5">
              {week.map(day => {
                const key = dayKey(day)
                const isPast = key < dayKey(new Date())
                const isToday = key === dayKey(new Date())
                const state = days[key]
                const firstOfMonth = day.getDate() === 1 || (wi === 0 && day === week[0])
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isPast || dayBusy === key}
                    onClick={() => { setSelectedDate(key); const w = windows[key]?.[0]; if (w) { setStartTime(w.start_time.slice(0,5)); setEndTime(w.end_time.slice(0,5)) } }}
                    title={state === 'available' ? 'Confirmed availability saved - tap to edit' : state === 'unavailable' ? 'Unavailable - tap to edit' : 'Availability not confirmed - tap to set hours'}
                    className={`relative h-11 rounded-lg text-[12px] font-medium border transition-colors ${
                      isPast ? 'bg-gray-50 text-gray-300 border-transparent cursor-default'
                      : state === 'available' ? 'bg-green-50 text-green-800 border-green-300'
                      : state === 'unavailable' ? 'bg-red-50 text-red-600 border-red-200 line-through'
                      : 'bg-white text-ink border-border hover:border-ink/30'
                    } ${isToday ? 'ring-1 ring-gold' : ''}`}
                  >
                    <span className="block leading-none">{day.getDate()}</span>
                    {(firstOfMonth || day.getDate() === 1) && (
                      <span className="block text-[8px] uppercase text-gray-400 leading-none mt-0.5">{day.toLocaleDateString('en-GB', { month: 'short' })}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-300 inline-block" /> Available</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" /> Unavailable</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-border inline-block" /> Not set</span>
          </div>
        </div>

        {/* Refer a friend */}
        {referral.code && (
          <div className="dashboard-card mb-6">
            <h3 className="font-serif text-lg font-semibold mb-1">Refer a Friend</h3>
            <p className="text-[12px] text-gray-500 mb-3">Know a brilliant therapist? When they join the register with your link and subscribe, you get a <span className="font-medium text-ink">free month</span> on your listing. No limit.</p>
            <div className="flex items-center gap-2">
              <input readOnly value={`https://talent.wellnesshousecollective.co.uk/register/talent?ref=${referral.code}`} className="input-field text-[12px] flex-1"
                onFocus={e => e.currentTarget.select()} />
              <button type="button" className="btn-secondary text-[12px] shrink-0"
                onClick={() => { navigator.clipboard?.writeText(`https://talent.wellnesshousecollective.co.uk/register/talent?ref=${referral.code}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            {referral.total > 0 && (
              <p className="text-[12px] text-gray-500 mt-2">{referral.total} friend{referral.total > 1 ? 's' : ''} signed up · {referral.converted} joined the register{referral.converted > 0 ? ' - free months on their way' : ''}.</p>
            )}
          </div>
        )}

        {/* Subscription */}
        {!live.available && (
          <div className="dashboard-card mb-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold">Join the Register</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(AGENCY_LISTING_TIERS) as Array<keyof typeof AGENCY_LISTING_TIERS>).map(t => {
                const cfg = AGENCY_LISTING_TIERS[t]
                const active = form.tier === t
                return (
                  <button key={t} type="button" onClick={() => setForm({ ...form, tier: t })}
                    className={`text-left p-4 rounded-xl border transition-all ${active ? 'border-ink ring-1 ring-ink' : 'border-border hover:border-ink/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-medium text-ink">{cfg.label}</p>
                      {active && <Check size={14} className="text-ink" />}
                    </div>
                    <p className="text-[16px] font-semibold text-ink mb-2">{cfg.display}</p>
                    <ul className="space-y-1">
                      {cfg.features.map(f => <li key={f} className="text-[11px] text-muted">{f}</li>)}
                    </ul>
                  </button>
                )
              })}
            </div>
            <button onClick={handleSubscribe} disabled={paying} className="btn-primary w-full disabled:opacity-50">
              {paying ? 'Taking you to payment...' : `Subscribe - ${AGENCY_LISTING_TIERS[form.tier].display}`}
            </button>
            <p className="text-[11px] text-muted text-center">Secure payment via Stripe. Cancel any time. Your listing goes live as soon as payment is confirmed.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
