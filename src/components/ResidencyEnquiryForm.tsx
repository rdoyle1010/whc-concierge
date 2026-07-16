'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

// Enquiry form for a residency specialist. This used to be static markup in
// a server component - submitting just reloaded the page with the answers in
// the URL and nothing was ever sent. Now it lands in contact_queries, which
// the admin triages (and replies to by email) from Messages & Enquiries.
export default function ResidencyEnquiryForm({ specialistName, listingId }: { specialistName: string; listingId: string }) {
  const supabase = createClient()
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const property = String(fd.get('property') || '').trim()
    const dates = String(fd.get('dates') || '').trim()
    const message = String(fd.get('message') || '').trim()
    if (!name || !email || !message) { setError('Please fill in your name, email and message.'); return }

    setSending(true)
    const { error: insErr } = await supabase.from('contact_queries').insert({
      name,
      email,
      subject: `Residency enquiry: ${specialistName}`,
      message: `Specialist: ${specialistName} (listing ${listingId})\nProperty: ${property || '-'}\nDates needed: ${dates || '-'}\n\n${message}`,
      type: 'residency_enquiry',
      status: 'open',
    })
    setSending(false)
    if (insErr) { setError('Could not send your enquiry - please try again.'); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-lg p-4">
        <p className="text-[13px] font-medium text-green-800">Enquiry sent</p>
        <p className="text-[12px] text-green-700 mt-1">The Wellness House Collective team will come back to you by email, usually within one working day.</p>
      </div>
    )
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input name="name" required placeholder="Your name" className="input-field text-[13px]" />
      <input name="email" type="email" required placeholder="Your email" className="input-field text-[13px]" />
      <input name="property" placeholder="Property name" className="input-field text-[13px]" />
      <input name="dates" placeholder="Dates needed" className="input-field text-[13px]" />
      <textarea name="message" rows={3} required placeholder="Tell us what you're looking for..." className="input-field text-[13px]" />
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <button type="submit" disabled={sending} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#C9A96E' }}>
        {sending ? 'Sending...' : 'Send Enquiry'}
      </button>
    </form>
  )
}
