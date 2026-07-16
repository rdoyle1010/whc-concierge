'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Check, Zap, MapPin } from 'lucide-react'
import { AGENCY_LISTING_TIERS } from '@/lib/constants'

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
        }
      } catch { /* form stays blank */ }
      setLoading(false)
    }
    load()
  }, [])

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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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

        {/* Subscription */}
        {!live.available && (
          <div className="dashboard-card mb-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold">Join the Register</h3>
            <div className="grid grid-cols-2 gap-3">
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
