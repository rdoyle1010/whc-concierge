import type { Config } from '@netlify/functions'

// The nightly review chase.
//
// The Agency payout gate used to hold a professional's wages until the
// property had left a review. It no longer does - the money goes out seven
// days after the shift whatever happens - which only works if the reviews are
// actually chased rather than extracted.
//
// Runs at 09:30 UTC, when a spa manager is at a desk rather than asleep, and
// the route itself limits each booking to one nudge every two days inside the
// week after the shift. Authenticates with the internal secret, because there
// is no person here to hold a session.
export default async function handler() {
  const site = process.env.URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || 'https://talenthousecollective.co.uk'
  const secret = process.env.INTERNAL_API_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''

  if (!secret) {
    console.error('[agency review reminders] no internal secret configured; skipping')
    return new Response('missing internal secret', { status: 500 })
  }

  try {
    const response = await fetch(`${site}/api/agency/review-reminders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-whc-internal-secret': secret },
    })
    const body = await response.text()
    if (!response.ok) {
      console.error('[agency review reminders] failed:', response.status, body.slice(0, 500))
      return new Response(body, { status: response.status })
    }
    console.log('[agency review reminders]', body.slice(0, 500))
    return new Response(body, { status: 200 })
  } catch (error: any) {
    console.error('[agency review reminders] threw:', error?.message)
    return new Response('failed', { status: 500 })
  }
}

export const config: Config = { schedule: '30 9 * * *' }
