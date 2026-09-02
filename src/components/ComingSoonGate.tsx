'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDialog } from '@/components/useDialog'
import { ArrowRight, Check } from 'lucide-react'

// The first thing anyone meets while the platform is closed, on whatever page
// they land on, and again on the next page until they join the list. Rebecca's
// launch runs on the list, so the list is what the site asks for first.
//
// Deliberately a gate and not a wall. The page is still rendered behind it and
// still in the HTML, so search engines keep reading the site and lifting the
// gate later costs one setting rather than a re-index. It is a soft gate: it
// asks, it does not defend. Nothing behind it is private.
//
// Staff routes are skipped outright - the point of closing the doors is that
// Rebecca keeps working - and so are the portals, because the root layout
// survives a client-side navigation: without this the gate mounted on a public
// page rides along into a signed-in dashboard and locks it.

const SKIP = ['/admin', '/admin-sign-in', '/talent', '/employer', '/hotel']

export default function ComingSoonGate({ logo }: { logo?: { url: string; alt: string } }) {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const [dismissed, setDismissed] = useState(false)
  const skipped = SKIP.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
  const open = !skipped && !dismissed
  // No close handler on purpose - joining the list is the way through - but
  // the focus trap matters: without it Tab walks off behind the gate into a
  // page the visitor can neither see nor use.
  const dialog = useDialog(() => { }, 'gate-heading', { enabled: open })

  if (!open) return null

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
      // Remember on this browser so the gate does not meet them again. A year,
      // because being asked twice reads as a platform that was not listening.
      document.cookie = `thc_joined=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
      setState('done')
    } catch {
      setState('error'); setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#f1f1f1] px-6 py-12">
      <div {...dialog.panelProps} className="w-full max-w-xl">
        {logo?.url && (
          // This is the first thing anyone sees of the brand, and for a launch
          // announcement it is the frame the screenshots sit in.
          <img src={logo.url} alt={logo.alt} className="mb-10 h-11 w-auto object-contain" />
        )}
        <p className="public-eyebrow">Opening soon</p>
        <h2 id="gate-heading" className="section-heading mt-4">
          The next level of spa and wellness recruitment.
        </h2>
        <p className="mt-5 text-[15px] leading-8 text-secondary">
          Properties search on the things that actually decide a hire. Professionals are found for what they can genuinely
          do. We are opening with a small group on both sides, and the list comes first.
        </p>

        {state === 'done' ? (
          <div role="status" className="mt-8 border border-border bg-white p-6">
            <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Check size={16} /> You are on the list.
            </p>
            <p className="mt-3 text-[13px] leading-6 text-secondary">
              One more step: we have sent you an email to confirm. Click the link in it and you will be among the first
              told when we open.
            </p>
            <button type="button" onClick={() => setDismissed(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
              Have a look around <ArrowRight size={14} />
            </button>
          </div>
        ) : (
        <form onSubmit={submit} className="mt-8">
          <label htmlFor="gate-email" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Join the list to continue
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="gate-email" type="email" required autoComplete="email" value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Your email address" className="input-field flex-1"
            />
            <button type="submit" disabled={state === 'sending'} className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 disabled:opacity-50">
              {state === 'sending' ? 'Joining...' : <>Join the list <ArrowRight size={14} /></>}
            </button>
          </div>
          {/* Bots fill every field they find; people never see this one. */}
          <input
            type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
            value={honeypot} onChange={event => setHoneypot(event.target.value)}
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
          {error && <p role="alert" className="mt-3 text-[12px] text-red-600">{error}</p>}
          <p className="mt-3 text-[11px] leading-5 text-muted">
            One email when we open, and the occasional piece of industry insight. Unsubscribe in a click.
          </p>
        </form>
        )}

        <dl className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            ['Matched on substance', 'Treatments, brands, systems and real availability.'],
            ['A small first group', 'Opening narrow so it works from day one.'],
            ['First access', 'The list opens before the platform does.'],
          ].map(([title, text]) => (
            <div key={title} className="border-t border-border pt-4">
              <dt className="text-[12px] font-semibold text-ink">{title}</dt>
              <dd className="mt-1 text-[11px] leading-5 text-secondary">{text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
