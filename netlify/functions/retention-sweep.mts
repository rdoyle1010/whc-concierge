import type { Config } from '@netlify/functions'

// The nightly retention sweep.
//
// src/lib/retention.ts sets the periods - 13 months for behavioural
// analytics, 24 months for applications and messages, 12 months for
// notifications and contact enquiries, 30 days for marketing tokens - and the
// privacy policy states them as facts. Until this function existed, the only
// way to enforce them was for a human to open the admin Retention panel and
// press a button, which is not a retention policy at all; it is an intention.
//
// Runs at 03:15 UTC daily, when nobody is using the platform. Authenticates
// with the internal secret rather than a session, because there is no person
// here to hold one, and the run is recorded against the schedule rather than
// against an administrator who was asleep.
//
// Financial records are never touched. Six years of company and tax law sits
// on those, and they are anonymised at account closure rather than swept on
// age. RETENTION_EXCLUDED in the same file names them.
export default async function handler() {
  const site = process.env.URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || 'https://talenthousecollective.co.uk'
  const secret = process.env.INTERNAL_API_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''

  if (!secret) {
    console.error('[retention sweep] no internal secret configured; skipping')
    return new Response('missing internal secret', { status: 500 })
  }

  try {
    const response = await fetch(`${site}/api/admin/retention`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-whc-internal-secret': secret,
      },
    })

    const body = await response.text()
    if (!response.ok) {
      console.error('[retention sweep] failed', response.status, body.slice(0, 500))
      return new Response(body, { status: response.status })
    }

    console.log('[retention sweep] complete', body.slice(0, 500))
    return new Response(body, { status: 200 })
  } catch (error: any) {
    console.error('[retention sweep] threw', error?.message)
    return new Response(String(error?.message || 'sweep failed'), { status: 500 })
  }
}

export const config: Config = {
  schedule: '15 3 * * *',
}
