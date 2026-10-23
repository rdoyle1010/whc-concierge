import type { Config } from '@netlify/functions'

// The hourly how-to-use-it sweep.
//
// Somebody who signs up and is left alone fills in half a profile and never
// comes back. An hour later they get one email written for the door they came
// in through, with the two or three things that actually make the platform
// work for them - and, while the first fifty places last, the offer to have
// us build the profile for them.
//
// Hourly rather than nightly because an hour after signing up is the point of
// it. The route itself will not send twice: the email_log row of kind
// 'onboarding' is the ledger.
export default async function handler() {
  const site = process.env.URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || 'https://talenthousecollective.co.uk'
  const secret = process.env.INTERNAL_API_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''

  if (!secret) {
    console.error('[onboarding emails] no internal secret configured; skipping')
    return new Response('missing internal secret', { status: 500 })
  }

  try {
    const response = await fetch(`${site}/api/onboarding/sweep`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-whc-internal-secret': secret },
    })
    const body = await response.text()
    if (!response.ok) {
      console.error('[onboarding emails] failed:', response.status, body.slice(0, 500))
      return new Response(body, { status: response.status })
    }
    console.log('[onboarding emails]', body.slice(0, 500))
    return new Response(body, { status: 200 })
  } catch (error: any) {
    console.error('[onboarding emails] threw:', error?.message)
    return new Response('failed', { status: 500 })
  }
}

export const config: Config = { schedule: '15 * * * *' }
