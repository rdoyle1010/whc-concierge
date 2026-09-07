'use client'

import { useState } from 'react'
import { Check, Send } from 'lucide-react'

// The act at the end of the argument.
//
// A page that persuades a spa director and then offers her nothing but a
// website link has wasted the persuasion. This asks for the four things a
// brand needs to answer properly - who, where, how big, what they want - and
// nothing else, because every extra field is a reason to close the tab.

export default function BrandEnquiryForm({ brandSlug, brandName }: { brandSlug: string; brandName: string }) {
  const [form, setForm] = useState({
    contact_name: '', contact_email: '', contact_phone: '',
    property_name: '', role_title: '', treatment_rooms: '', message: '',
  })
  // Bots fill in every field they find. A person never sees this one.
  const [company, setCompany] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(current => ({ ...current, [key]: event.target.value }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending'); setError('')
    try {
      const response = await fetch('/api/brands/enquire', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, brand_slug: brandSlug, brand_name: brandName, company }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error || 'Your enquiry could not be sent. Please try again.')
      setState('sent')
    } catch (caught: any) {
      setState('error'); setError(caught.message)
    }
  }

  if (state === 'sent') {
    return (
      <div className="border border-border bg-surface p-7">
        <Check size={20} className="text-accent" />
        <p className="mt-3 text-[15px] font-medium text-ink">Your enquiry is on its way.</p>
        <p className="mt-2 text-[13px] leading-6 text-secondary">
          {brandName} and Talent House both have it. Someone will come back to you directly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border border-border bg-surface p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-accent">Considering this house</p>
      <h2 className="site-heading mt-3 text-[24px] leading-[1.15] tracking-[-.03em]">Ask {brandName} for the full picture.</h2>
      <p className="mt-3 text-[13px] leading-7 text-secondary">
        Treatment menus, wholesale terms, training and opening orders. Tell them a little about your spa and they will
        come back to you directly.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <input required value={form.contact_name} onChange={set('contact_name')} placeholder="Your name" aria-label="Your name" className="input-field" />
        <input required type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="Email" aria-label="Email" className="input-field" />
        <input value={form.property_name} onChange={set('property_name')} placeholder="Spa or property" aria-label="Spa or property" className="input-field" />
        <input value={form.role_title} onChange={set('role_title')} placeholder="Your role" aria-label="Your role" className="input-field" />
        <input value={form.contact_phone} onChange={set('contact_phone')} placeholder="Phone (optional)" aria-label="Phone" className="input-field" />
        <input value={form.treatment_rooms} onChange={set('treatment_rooms')} placeholder="Treatment rooms" aria-label="Treatment rooms" className="input-field" />
      </div>
      <textarea rows={4} value={form.message} onChange={set('message')} placeholder="What would you like to know?" aria-label="What would you like to know?" className="input-field mt-3 resize-y leading-6" />

      <input type="text" value={company} onChange={e => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {error ? <p className="mt-3 text-[12px] text-red-600">{error}</p> : null}

      <button type="submit" disabled={state === 'sending'} className="btn-primary mt-5 inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
        <Send size={13} /> {state === 'sending' ? 'Sending...' : 'Send my enquiry'}
      </button>
    </form>
  )
}
