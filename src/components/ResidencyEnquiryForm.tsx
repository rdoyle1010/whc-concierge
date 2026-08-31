'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'

export default function ResidencyEnquiryForm({ specialistName, listingId, suggestedDayRate = 0 }: { specialistName: string; listingId: string; suggestedDayRate?: number }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [conversationState, setConversationState] = useState<'checking' | 'none' | 'ready'>('checking')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetch(`/api/residency/conversation?listing=${encodeURIComponent(listingId)}`)
      .then(res => res.ok ? res.json() : { exists: false })
      .then(json => setConversationState(json.exists ? 'ready' : 'none'))
      .catch(() => setConversationState('none'))
  }, [listingId])

  async function startConversation() {
    if (starting) return
    setStarting(true); setError('')
    try {
      const res = await fetch('/api/residency/conversation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        window.location.href = `/login?role=employer&returnTo=${encodeURIComponent(`/residency/${listingId}#enquire`)}`
        return
      }
      if (!res.ok) { setError(json.error || 'Could not start the conversation.'); return }
      setConversationState('ready')
    } catch { setError('Could not start the conversation.') } finally { setStarting(false) }
  }
  const [days, setDays] = useState(5)
  const [dayRate, setDayRate] = useState(Number(suggestedDayRate || 0))

  const therapistTotal = useMemo(() => Math.max(0, days) * Math.max(0, dayRate), [days, dayRate])
  const platformFee = useMemo(() => therapistTotal * 0.10, [therapistTotal])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      listingId,
      propertyName: String(fd.get('propertyName') || '').trim(),
      startDate: String(fd.get('startDate') || ''),
      endDate: String(fd.get('endDate') || ''),
      daysRequired: days,
      proposedDayRate: dayRate,
      accommodationIncluded: fd.get('accommodationIncluded') === 'on',
      travelIncluded: fd.get('travelIncluded') === 'on',
      servicesRequired: String(fd.get('servicesRequired') || '').trim(),
      notes: String(fd.get('notes') || '').trim(),
    }

    setSending(true)
    const res = await fetch('/api/residency/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSending(false)

    if (res.status === 401) {
      window.location.href = `/login?role=employer&returnTo=${encodeURIComponent(`/residency/${listingId}#enquire`)}`
      return
    }
    if (!res.ok) {
      setError(data.error || 'Could not send your residency offer - please try again.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-[14px] font-semibold text-emerald-900">Residency offer sent</p>
        <p className="text-[12px] leading-5 text-emerald-800 mt-1">{specialistName} can accept, counter or decline inside WHC Concierge. If accepted, you&apos;ll confirm the booking and payment on-platform.</p>
      </div>
    )
  }

  // Conversation first, offer second - the form only opens once a private
  // conversation with the specialist exists.
  if (conversationState !== 'ready') {
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-[13px] font-semibold text-ink">Step 1 of 2: start a private conversation</p>
        <p className="text-[12px] leading-5 text-muted mt-1 mb-4">Introduce your property and discuss fit with {specialistName} before sending a formal offer. Identity and contact details stay protected until a booking is confirmed.</p>
        {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
        <button type="button" onClick={startConversation} disabled={starting || conversationState === 'checking'} className="btn-primary w-full text-[13px] disabled:opacity-60">
          {conversationState === 'checking' ? 'Checking...' : starting ? 'Starting...' : 'Start Private Conversation'}
        </button>
        <p className="text-[10.5px] text-muted mt-2">Once started, the structured offer form opens here. No payment is taken at any point before you confirm a booking.</p>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-xl bg-parchment/70 border border-accent/20 p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={17} className="text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-ink">Book securely through WHC Concierge</p>
            <p className="text-[11px] text-muted leading-5 mt-0.5">Your dates, rate and inclusions are recorded here. A 10% platform booking fee is charged to the property only when the residency is accepted and confirmed.</p>
          </div>
        </div>
      </div>

      <div><label className="eyebrow block mb-1.5">Property *</label><input name="propertyName" required placeholder="Hotel, resort or spa" className="input-field text-[13px]" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="eyebrow block mb-1.5">Start Date *</label><input name="startDate" type="date" required className="input-field text-[13px]" /></div>
        <div><label className="eyebrow block mb-1.5">End Date *</label><input name="endDate" type="date" required className="input-field text-[13px]" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="eyebrow block mb-1.5">Working Days *</label><input min={1} max={180} type="number" value={days} onChange={e => setDays(Number(e.target.value))} required className="input-field text-[13px]" /></div>
        <div><label className="eyebrow block mb-1.5">Offer / Day (£) *</label><input min={1} step="1" type="number" value={dayRate || ''} onChange={e => setDayRate(Number(e.target.value))} required className="input-field text-[13px]" /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-border p-3 cursor-pointer"><input name="accommodationIncluded" type="checkbox" className="rounded" /><span className="text-[12px] text-secondary">Accommodation included</span></label>
        <label className="flex items-center gap-2 rounded-xl border border-border p-3 cursor-pointer"><input name="travelIncluded" type="checkbox" className="rounded" /><span className="text-[12px] text-secondary">Travel included</span></label>
      </div>

      <div><label className="eyebrow block mb-1.5">Treatments / Services</label><textarea name="servicesRequired" rows={2} placeholder="What would you like the specialist to deliver?" className="input-field text-[13px]" /></div>
      <div><label className="eyebrow block mb-1.5">Additional Notes</label><textarea name="notes" rows={3} placeholder="Hours, uniform, facilities, expectations or other details..." className="input-field text-[13px]" /></div>

      {therapistTotal > 0 && (
        <div className="rounded-xl border border-border bg-surface/70 p-4 text-[12px]">
          <div className="flex justify-between py-1"><span className="text-muted">Residency value</span><span className="font-medium text-ink">£{therapistTotal.toLocaleString('en-GB')}</span></div>
          <div className="flex justify-between py-1"><span className="text-muted">WHC Concierge fee (10%)</span><span className="font-medium text-ink">£{platformFee.toLocaleString('en-GB')}</span></div>
          <div className="flex justify-between pt-2 mt-1 border-t border-border"><span className="font-semibold text-ink">Estimated property total</span><span className="font-semibold text-ink">£{(therapistTotal + platformFee).toLocaleString('en-GB')}</span></div>
          <p className="text-[10px] text-muted mt-2">No payment is taken when you send this offer.</p>
        </div>
      )}

      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <button type="submit" disabled={sending || days < 1 || dayRate <= 0} className="btn-primary w-full disabled:opacity-50">
        {sending ? 'Sending Offer...' : `Invite ${specialistName.split(' ')[0] || 'Specialist'} to Residency`}
      </button>
      <p className="text-[10px] leading-4 text-muted text-center">Keep the booking on WHC Concierge to retain the agreed terms, secure payment record and eligibility for a verified residency review.</p>
    </form>
  )
}
