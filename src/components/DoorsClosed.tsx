'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, ArrowRight } from 'lucide-react'

// What stands where sign-in and registration would be while the doors are
// shut. It is not a holding page and it does not apologise: anyone who reaches
// it went looking for an account, which makes them the most valuable visitor
// on the site and the last person who should be handed a shrug.
//
// Every protected route funnels here. The middleware sends an unauthenticated
// visitor from /talent/... or /employer/... to /login carrying the role they
// were heading for, so the page can speak to the person who actually arrived
// rather than to an average of everybody.
//
// The email goes to the same double opt-in newsletter as every other signup,
// so the list stays one list and consent is recorded the same way.

type Audience = 'talent' | 'employer' | 'both'

const COPY: Record<Audience, {
  eyebrow: string
  heading: string
  intro: string
  points: [string, string][]
  cta: string
}> = {
  talent: {
    eyebrow: 'Opening soon',
    heading: 'Spa recruitment is about to work properly. Be first through the door.',
    intro:
      'Talent House Collective matches you on what you can actually do - your treatments, your brands, your qualifications, the hours you want - rather than on how well you word a CV. We are opening with a small group of properties so the first matches are real ones.',
    points: [
      ['You are found on your skills', 'Treatments, product houses, systems and certifications, in the format properties actually search on.'],
      ['Roles that genuinely fit', 'You appear for work that matches your experience, your availability and how far you will travel.'],
      ['First access', 'The list opens before the platform does. Members on it come in ahead of everyone else.'],
    ],
    cta: 'Join the list',
  },
  employer: {
    eyebrow: 'Opening soon',
    heading: 'Stop reading CVs. Start seeing the people who fit the brief.',
    intro:
      'Search on treatments, product houses, systems, qualifications and confirmed availability, then see the professional properly before you make an offer. Talent House Collective is opening with a small group of properties, and we are choosing them now.',
    points: [
      ['Search the brief, not the inbox', 'Filter on the things that decide a hire: brands trained on, treatments performed, systems used.'],
      ['Real availability', 'Professionals set the exact days and hours they will work before they appear as available to you.'],
      ['A place in the first group', 'Founding properties shape how the platform works and are listed first when it opens.'],
    ],
    cta: 'Request early access',
  },
  both: {
    eyebrow: 'Opening soon',
    heading: 'The next level of spa and wellness recruitment opens shortly.',
    intro:
      'One platform where properties search on the things that decide a hire, and professionals are found for what they can genuinely do. We are opening with a small group on both sides so the first matches are real ones rather than an empty marketplace.',
    points: [
      ['Matched on substance', 'Treatments, brands, systems, qualifications and real availability - not keywords in a CV.'],
      ['A small first group', 'Opening deliberately narrow so the platform works from day one.'],
      ['First access', 'The list opens before the platform does.'],
    ],
    cta: 'Join the list',
  },
}

function Panel({ audience }: { audience?: Audience }) {
  const params = useSearchParams()
  // The middleware puts the role on the URL when it bounces someone out of a
  // portal, so a hotel director who typed /employer/dashboard reads hotel copy.
  const fromUrl = params.get('role')
  const resolved: Audience =
    audience && audience !== 'both' ? audience
    : fromUrl === 'talent' || fromUrl === 'employer' ? fromUrl
    : audience || 'both'
  const copy = COPY[resolved]

  // Someone bounced out of the admin area is almost certainly staff, and
  // sending them to a waiting list they have no use for is a dead end.
  const wasHeadingToAdmin = (params.get('redirect') || '').startsWith('/admin')

  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

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
    <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-24">
      <p className="public-eyebrow">{copy.eyebrow}</p>
      <h1 className="section-heading mt-4 max-w-3xl">{copy.heading}</h1>
      <p className="mt-6 max-w-2xl text-[15px] leading-8 text-secondary">{copy.intro}</p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="order-2 lg:order-1">
          <dl className="space-y-6">
            {copy.points.map(([title, text]) => (
              <div key={title} className="border-t border-border pt-5">
                <dt className="text-[14px] font-semibold text-ink">{title}</dt>
                <dd className="mt-1.5 text-[13px] leading-6 text-secondary">{text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 lg:order-2">
          <div className="border border-border bg-white p-7">
            {state === 'done' ? (
              <div role="status">
                <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <Check size={16} /> Almost there.
                </p>
                <p className="mt-3 text-[13px] leading-6 text-secondary">
                  Check your email and confirm, and you will be among the first told when we open.
                </p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <p className="text-[14px] font-semibold text-ink">Be first in</p>
                <p className="mt-1.5 text-[12px] leading-5 text-secondary">
                  One email when we open, and the occasional piece of industry insight worth reading. Unsubscribe in a click.
                </p>
                <label htmlFor="doors-email" className="sr-only">Your email address</label>
                <input
                  id="doors-email" type="email" required autoComplete="email" value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Your email address" className="input-field mt-5"
                />
                <button type="submit" disabled={state === 'sending'} className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 disabled:opacity-50">
                  {state === 'sending' ? 'Joining...' : <>{copy.cta} <ArrowRight size={14} /></>}
                </button>
                {/* Bots fill every field they find; people never see this one. */}
                <input
                  type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
                  value={honeypot} onChange={event => setHoneypot(event.target.value)}
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                />
                {error && <p role="alert" className="mt-3 text-[12px] text-red-600">{error}</p>}
              </form>
            )}
          </div>

          {wasHeadingToAdmin && (
            <p className="mt-4 text-[12px] leading-5 text-muted">
              Looking for the staff area?{' '}
              <Link href="/admin-sign-in" className="font-semibold text-ink underline">Sign in here</Link>.
            </p>
          )}
        </div>
      </div>

      <div className="mt-14 border-t border-border pt-8">
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
  )
}

export default function DoorsClosed({ audience }: { audience: Audience }) {
  return (
    <div className="public-page">
      <Navbar />
      <main id="main-content" className="pt-[76px]">
        {/* useSearchParams needs a boundary; the panel is the whole page, so
            the fallback is a plain block rather than a skeleton nobody sees. */}
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Panel audience={audience} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
