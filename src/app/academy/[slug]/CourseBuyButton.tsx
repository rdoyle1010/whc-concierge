'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Buying one course, from the page that describes it.
//
// The same guest checkout the Academy list already uses: no account, an email
// address for the receipt and the certificate, and Stripe does the rest. A
// course is the second thing on this platform that sells to a stranger, and
// until now the only way to buy one was to find it on a list.
export default function CourseBuyButton({ slug, title, price }: { slug: string; title: string; price: number }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function buy() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'course_public', courseSlug: slug, email, returnUrl: window.location.origin }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) { setError(json.error || 'Could not start the payment - please try again.'); setBusy(false); return }
      window.location.href = json.url
    } catch {
      setError('Something went wrong - please try again.')
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={() => setOpen(true)} className="btn-primary inline-flex items-center justify-center gap-2">
          Start this course · £{(price / 100).toFixed(0)} <ArrowRight size={14} />
        </button>
        <Link href="/register/talent" className="btn-secondary inline-flex items-center justify-center">Join free for member pricing</Link>
      </div>
    )
  }

  return (
    <div className="border border-border bg-white p-6">
      <label htmlFor="course-buy-email" className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-secondary mb-2">Your email</label>
      <input
        id="course-buy-email"
        type="email"
        value={email}
        onChange={event => { setError(''); setEmail(event.target.value) }}
        placeholder="you@example.com"
        className="input-field"
      />
      <p className="mt-2 text-[12px] text-muted">Your receipt and certificate go here. No account needed.</p>
      {error && <p role="alert" className="mt-3 text-[13px] text-red-600">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={buy} disabled={busy || !email.trim()} className="btn-primary disabled:opacity-50">
          {busy ? 'Taking you to payment...' : `Pay £${(price / 100).toFixed(0)} and start`}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
      </div>
      <p className="sr-only">Buying {title}</p>
    </div>
  )
}
