'use client'

import { useEffect, useRef } from 'react'

// Confirms a purchase the moment somebody comes back from Stripe.
//
// Fulfilment used to depend on the webhook alone, so when its URL was wrong
// for several days every purchase took the money and delivered nothing. The
// buyer had no way to say so and the platform had no way to notice. This
// closes that: the browser that just paid tells the platform, and the platform
// checks with Stripe before believing it.
//
// A hook rather than a component, and reading the query string directly rather
// than through useSearchParams, so adding it to a page is one line and needs
// no Suspense boundary around JSX that was fine as it was.
//
// Deliberately quiet. The webhook usually wins the race, in which case this is
// a no-op and the person should see the page they expected rather than a
// banner about plumbing.

export function useConfirmPaymentOnReturn(onDone?: (ok: boolean) => void) {
  // React runs effects twice in development and a return page can be
  // reloaded. The server is idempotent either way; this saves the round trip.
  const attempted = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id') || params.get('membership_session')
    if (!sessionId || !sessionId.startsWith('cs_')) return
    if (attempted.current === sessionId) return
    attempted.current = sessionId

    let active = true
    fetch('/api/stripe/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      keepalive: true,
    })
      .then(res => res.json().catch(() => ({})))
      .then(body => { if (active) onDone?.(Boolean(body?.ok)) })
      .catch(() => { if (active) onDone?.(false) })

    return () => { active = false }
    // Runs once per mount: the session id comes from the URL the page loaded
    // with, and a client-side navigation away from it is not a new payment.
  }, [])
}
