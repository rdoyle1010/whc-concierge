'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Mail, Bell, Users, Database } from 'lucide-react'

type Preferences = {
  marketing_email_status: 'never' | 'pending' | 'confirmed' | 'unsubscribed'
  marketing_sms: boolean
  marketing_phone: boolean
  job_alerts_email: boolean
  application_updates_email: boolean
  booking_updates_email: boolean
  academy_updates_email: boolean
  product_news_email: boolean
  partner_marketing_email: boolean
  share_profile_with_employers: boolean
  share_profile_with_whc_partners: boolean
  allow_anonymised_research: boolean
}

export default function PrivacyPreferences() {
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [marketingWording, setMarketingWording] = useState('')

  async function load() {
    const res = await fetch('/api/privacy/preferences', { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) { setPrefs(data.preferences); setMarketingWording(data.marketingWording || '') }
  }
  useEffect(() => { load() }, [])

  async function save(patch: Partial<Preferences>) {
    if (!prefs) return
    setSaving(true); setMessage('')
    const next = { ...prefs, ...patch }
    const res = await fetch('/api/privacy/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setPrefs(next); setMessage('Preferences saved.') } else setMessage(data.error || 'Could not save preferences.')
    setSaving(false)
  }

  async function requestMarketing() {
    setSaving(true); setMessage('')
    const res = await fetch('/api/privacy/marketing/request', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { await load(); setMessage('Check your email and confirm before marketing is switched on.') }
    else setMessage(data.error || 'Could not send the confirmation email.')
    setSaving(false)
  }

  async function withdrawMarketing() {
    setSaving(true); setMessage('')
    const stop = await fetch('/api/privacy/marketing/withdraw', { method: 'POST' })
    const data = await stop.json().catch(() => ({}))
    if (stop.ok) { await load(); setMessage('Marketing emails have been switched off.') } else setMessage(data.error || 'Could not unsubscribe.')
    setSaving(false)
  }

  if (!prefs) return <div className="skeleton h-56 rounded-xl" />

  const marketingOn = prefs.marketing_email_status === 'confirmed'
  const marketingPending = prefs.marketing_email_status === 'pending'

  return <div className="space-y-6">
    {message && <div className="border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-[13px] text-[#4d4d4d]">{message}</div>}

    <section className="dashboard-card">
      <div className="flex gap-3"><ShieldCheck size={20} className="text-[#111111] mt-0.5"/><div><h2 className="text-[22px]">Privacy & contact preferences</h2><p className="text-[13px] leading-6 text-[#555555] mt-2">Marketing is optional and separate from the service messages needed to run your account, applications, bookings, payments and security. You can change optional preferences at any time.</p></div></div>
    </section>

    <section className="dashboard-card">
      <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><Mail size={19} className="text-[#555555] mt-0.5"/><div><h3 className="text-[19px]">WHC marketing emails</h3><p className="text-[12px] leading-5 text-[#555555] mt-1 max-w-2xl">{marketingWording}</p></div></div><Status value={prefs.marketing_email_status}/></div>
      <div className="mt-5 flex flex-wrap gap-3">{!marketingOn ? <button disabled={saving || marketingPending} onClick={requestMarketing} className="btn-primary disabled:opacity-50">{marketingPending ? 'Confirmation email sent' : 'Opt in by email'}</button> : <button disabled={saving} onClick={withdrawMarketing} className="btn-secondary disabled:opacity-50">Unsubscribe from marketing</button>}</div>
      {marketingPending && <p className="text-[11px] text-[#555555] mt-3">Marketing remains OFF until you click the confirmation link in the email.</p>}
    </section>

    <section className="dashboard-card">
      <div className="flex gap-3 mb-5"><Bell size={19} className="text-[#555555]"/><div><h3 className="text-[19px]">Updates you choose</h3><p className="text-[12px] text-[#555555] mt-1">These are optional preference-based updates, not essential account/security messages.</p></div></div>
      <div className="divide-y divide-[#ececec]">
        <Toggle label="Job alerts" description="Email me about roles that match my profile or saved preferences." checked={prefs.job_alerts_email} onChange={v => save({ job_alerts_email: v })}/>
        <Toggle label="Academy updates" description="Tell me about new WHC learning, courses and professional-development content." checked={prefs.academy_updates_email} onChange={v => save({ academy_updates_email: v })}/>
        <Toggle label="WHC product & feature news" description="Tell me about new paid and free WHC platform features." checked={prefs.product_news_email} onChange={v => save({ product_news_email: v })}/>
      </div>
    </section>

    <section className="dashboard-card">
      <div className="flex gap-3 mb-5"><Users size={19} className="text-[#555555]"/><div><h3 className="text-[19px]">Profile & data sharing</h3><p className="text-[12px] text-[#555555] mt-1">Control optional sharing outside the steps needed to process an application, booking or contract you initiate.</p></div></div>
      <div className="divide-y divide-[#ececec]">
        <Toggle label="Employer discovery" description="Allow verified WHC employers to discover my professional profile outside a direct application." checked={prefs.share_profile_with_employers} onChange={v => save({ share_profile_with_employers: v })}/>
        <Toggle label="WHC commercial partners" description="Allow WHC to share my profile with selected commercial partners outside a direct application or booking. OFF by default." checked={prefs.share_profile_with_whc_partners} onChange={v => save({ share_profile_with_whc_partners: v })}/>
        <Toggle label="Anonymised research & platform improvement" description="Allow anonymised/aggregated information to be used for research and product improvement where it cannot reasonably identify me." checked={prefs.allow_anonymised_research} onChange={v => save({ allow_anonymised_research: v })}/>
      </div>
    </section>

    <section className="dashboard-card bg-[#f7f7f7]">
      <div className="flex gap-3"><Database size={18} className="text-[#555555] mt-0.5"/><div><h3 className="text-[17px]">Essential service communications</h3><p className="text-[12px] leading-5 text-[#555555] mt-1">Account verification, security alerts, application/booking updates, receipts, payment information, legal notices and messages needed to deliver a service are not treated as optional marketing. WHC may still need to send those while your account or transaction is active.</p><p className="text-[11px] text-[#555555] mt-3">Read the <Link href="/privacy" className="underline">Privacy Policy</Link> for the purposes and lawful bases used for each category.</p></div></div>
    </section>
  </div>
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-start justify-between gap-5 py-4 cursor-pointer"><div><p className="text-[13px] font-semibold text-[#1a1a1a]">{label}</p><p className="text-[11px] leading-5 text-[#555555] mt-1 max-w-2xl">{description}</p></div><input type="checkbox" className="mt-1 h-4 w-4" checked={checked} onChange={e => onChange(e.target.checked)}/></label>
}

function Status({ value }: { value: Preferences['marketing_email_status'] }) {
  const labels: Record<string, [string, string]> = { confirmed: ['Confirmed', 'text-green-700 bg-green-50'], pending: ['Awaiting confirmation', 'text-amber-700 bg-amber-50'], unsubscribed: ['Unsubscribed', 'text-[#555555] bg-[#f1f4f6]'], never: ['Off', 'text-[#555555] bg-[#f1f4f6]'] }
  const [label, cls] = labels[value] || labels.never
  return <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[.1em] font-semibold whitespace-nowrap ${cls}`}>{label}</span>
}
