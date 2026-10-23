// What counts as a visit worth counting.
//
// The numbers on Who Is Looking were being read as "how many strangers found
// the website", and they were nothing of the kind. Three separate things were
// quietly in the total: the person who builds the platform browsing her own
// pages all day, deploy previews nobody has ever visited, and a return leg
// from a payment page dressed up as a traffic source.
//
// The decisions live here rather than in the route so they can be tested on
// their own, and so the screen and the beacon agree on what a visit is.

import { SITE_URL } from './site-url'

/**
 * Whether the platform should leave this browser out of the count.
 *
 * Set for anyone who opens an admin page, because somebody testing her own
 * website every day is not a visitor and she was a fifth of her own traffic.
 * 'on' is the deliberate opt back in, so the choice survives the next admin
 * page load rather than being reset by it.
 */
export const STAFF_COOKIE = 'th_count_me'

export function staffCookieSkips(value: string | undefined | null): boolean {
  return value === 'off'
}

/**
 * The live website, and nothing else.
 *
 * A Netlify deploy preview turned up in "where they came from" as a hex
 * string, which is how we know builds were being counted as people. Previews,
 * branch deploys and a laptop running next dev all write to the same table
 * because they all hold the same service-role key.
 */
export function countableHost(host: string | null | undefined): boolean {
  const name = String(host || '').toLowerCase().split(':')[0].trim()
  if (!name) return false
  const canonical = new URL(SITE_URL).host.toLowerCase()
  return name === canonical || name === `www.${canonical}`
}

/** Paths nobody needs counted, and paths that would leak something. */
export function countablePath(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('/api/')) return false
  if (path.startsWith('/admin')) return false
  // A reset link or a magic link carries its token in the query string. The
  // path alone is stored, never the query, but these pages are not visitor
  // interest either.
  if (path.startsWith('/auth/')) return false
  return true
}

// Hosts a visitor passes through and comes back from. Stripe is the obvious
// one: nine people "came from checkout.stripe.com" meant nine people went off
// to pay and returned, which is a good number and the opposite of an
// acquisition source. Listing it beside LinkedIn made both harder to read.
const RETURN_LEGS: Record<string, string> = {
  'checkout.stripe.com': 'Came back from Stripe checkout',
  'billing.stripe.com': 'Came back from the Stripe billing portal',
  'connect.stripe.com': 'Came back from Stripe Connect',
  'pay.stripe.com': 'Came back from a Stripe payment page',
  'accounts.google.com': 'Came back from signing in with Google',
  'appleid.apple.com': 'Came back from signing in with Apple',
}

export function returnLegLabel(host: string): string | null {
  return RETURN_LEGS[host.toLowerCase()] || null
}

/**
 * A referring host that is really us.
 *
 * Preview builds, the Netlify holding address and the old domain that 301s
 * here are all the same website. Counting them as a source inflates the list
 * and hides the handful of places somebody genuinely came from.
 */
export function isOwnHost(host: string): boolean {
  const name = host.toLowerCase()
  return name.includes('talenthousecollective')
    || name.includes('whc-concierge')
    || name.endsWith('.netlify.app')
    || name === 'localhost'
}

/**
 * The middle day, over the days that actually have numbers.
 *
 * A thirty-day average is meaningless while counting has only been on for
 * eight of them - it divides by the twenty-two days before the table existed
 * and reports a third of the truth. The median from the first day with any
 * traffic onwards is the figure a quiet week can be compared against.
 */
export function typicalDay(daily: { visits: number }[]): number {
  const firstReal = daily.findIndex(entry => entry.visits > 0)
  if (firstReal < 0) return 0
  const live = daily.slice(firstReal).map(entry => entry.visits).sort((a, b) => a - b)
  const middle = Math.floor(live.length / 2)
  return live.length % 2 ? live[middle] : Math.round((live[middle - 1] + live[middle]) / 2)
}
