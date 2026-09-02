'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Lock, Check } from 'lucide-react'

// What someone sees where the sign-in or registration form would be. It is a
// waiting list, not an apology: anyone who reaches this page went looking for
// an account, which makes them the most valuable visitor on the site and the
// one person who should never be sent away with a link.
//
// The email goes to the same double opt-in newsletter as every other signup,
// so the list stays one list and consent is recorded the same way.

export default function DoorsClosed({ audience }: { audience: 'talent' | 'employer' | 'both' }) {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const line = {
    talent: 'Professional accounts open shortly.',
    employer: 'Property and brand accounts open shortly.',
    both: 'Accounts open shortly.',
  }[audience]

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending'); setError('')
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), company: honeypot }),
      })
      const json = await response.json().catch(() => null)
      if (!response.ok) { setState('error'); setError(json?.error || 'Something went wrong. Please try again.'); return }
      setState('done'); setEmail('')
    } catch {
      setState('error'); setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="public-page">
      <Navbar />
      <main id="main-content" className="pt-[76px]">
        <section className="mx-auto max-w-3xl px-6 py-20 lg:px-8 lg:py-28">
          <span className="inline-flex items-center gap-2 border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
            <Lock size={11} /> Opening soon
          </span>
          <h1 className="section-heading mt-5">The platform is built. We are choosing who comes in first.</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-8 text-secondary">
            {line} Talent House Collective is opening with a small group of properties and professionals, so the first
            matches are real ones rather than an empty marketplace. Join the list and you will be among the first in.
          </p>

          {state === 'done' ? (
            <p role="status" className="mt-8 inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
              <Check size={15} /> Almost there. Check your email and confirm, and you will hear from us first.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-8 max-w-md">
              <label htmlFor="doors-email" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Be first to know
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="doors-email" type="email" required autoComplete="email" value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Your email address" className="input-field flex-1"
                />
                <button type="submit" disabled={state === 'sending'} className="btn-primary shrink-0 disabled:opacity-50">
                  {state === 'sending' ? 'Joining...' : 'Join the list'}
                </button>
              </div>
              {/* Bots fill every field they find; people never see this one. */}
              <input
                type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
                value={honeypot} onChange={event => setHoneypot(event.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              {error && <p role="alert" className="mt-2 text-[12px] text-red-600">{error}</p>}
              <p className="mt-2 text-[11px] leading-5 text-muted">
                One email when we open, and the occasional piece of industry insight. Unsubscribe in a click.
              </p>
            </form>
          )}

          <div className="mt-12 border-t border-border pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Open to explore now</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['Browse roles', '/jobs', 'The live roles on the platform today.'],
                ['The Academy', '/academy', 'Courses, certificates and the toolkit.'],
                ['Intelligence', '/intelligence', 'What the spa market is actually paying.'],
              ].map(([label, href, note]) => (
                <Link key={href} href={href} className="group border border-border bg-white p-4 transition-colors hover:border-secondary">
                  <p className="text-[13px] font-medium text-ink">{label}</p>
                  <p className="mt-1 text-[12px] leading-5 text-muted">{note}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
