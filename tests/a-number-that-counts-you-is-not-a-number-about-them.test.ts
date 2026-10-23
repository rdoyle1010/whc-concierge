import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  countableHost, isOwnHost, returnLegLabel, STAFF_COOKIE, staffCookieSkips, typicalDay,
} from '../src/lib/visit-counting'

// "Most people who are not me have visited on mobile, not online. I'm not
// really sure what data I'm getting from this."
//
// She was right to distrust it. Who Is Looking said 142 people in thirty days
// and 75 of them on desktop, and three separate things were wrong with that.
//
// The word "people". A visitor is a hash that rotates every night, which is a
// deliberate privacy property - nobody can be followed from one day to the
// next - and it means somebody who comes back on five days is five of that
// 142. The figure was always visits.
//
// Her own browser. Admin pages were excluded from counting, but everything
// else she touched while testing was not: the homepage, the jobs board, the
// login screen, a talent dashboard. Someone opening her own website every day
// on a laptop was a large share of the desktop total, which is exactly the
// distortion she spotted.
//
// And builds. A Netlify deploy preview turned up in "where they came from" as
// a hex string, which is how we know preview deploys were writing to the
// production table and being counted as people.
//
// The rule this file holds: a number about strangers must not quietly contain
// the person reading it.

const read = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const BEACON = 'src/app/api/track-visit/route.ts'
const API = 'src/app/api/admin/visitors/route.ts'
const PAGE = 'src/app/admin/visitors/page.tsx'
const MARKER = 'src/app/api/admin/counting-me/route.ts'

test('a build is not a visitor', () => {
  assert.equal(countableHost('talenthousecollective.co.uk'), true)
  assert.equal(countableHost('www.talenthousecollective.co.uk'), true)
  assert.equal(countableHost('talenthousecollective.co.uk:443'), true, 'a port is not a different website')
  assert.equal(countableHost('TalentHouseCollective.co.uk'), true)

  // The exact referrer that gave this away.
  assert.equal(countableHost('6aa908cbfddd040009f71caf--whc-concierge.netlify.app'), false)
  assert.equal(countableHost('whc-concierge.netlify.app'), false)
  assert.equal(countableHost('localhost'), false, 'next dev holds the same service-role key')
  assert.equal(countableHost(''), false)
  assert.equal(countableHost(null), false)

  const beacon = body(BEACON)
  assert.match(beacon, /countableHost\(req\.headers\.get\('host'\)\)/,
    'the check has to run in the beacon, not merely exist')
})

test('the person who builds the website is left out of her own numbers', () => {
  assert.equal(staffCookieSkips('off'), true)
  assert.equal(staffCookieSkips('on'), false, 'opting back in has to actually work')
  assert.equal(staffCookieSkips(undefined), false, 'an ordinary visitor is counted')
  assert.equal(staffCookieSkips(''), false)

  const beacon = body(BEACON)
  assert.match(beacon, /staffCookieSkips\(req\.cookies\.get\(STAFF_COOKIE\)\?\.value\)/)

  // Marked from the admin shell, so it covers her whole browser rather than
  // only the screen she happened to be on.
  const shell = body('src/components/DashboardShell.tsx')
  assert.match(shell, /role !== 'admin'/)
  assert.match(shell, /\/api\/admin\/counting-me/)
})

test('the marker never overrules a choice she has already made', () => {
  const marker = body(MARKER)
  // PUT runs on every admin page load. Writing unconditionally would mean
  // switching the setting back on lasted until the next admin screen.
  const put = marker.slice(marker.indexOf('export async function PUT'), marker.indexOf('export async function POST'))
  assert.match(put, /existing !== 'on' && existing !== 'off'/,
    'a setting that the next page load resets is not a setting')

  // And it is admin-guarded, in every direction. A cookie that switches off
  // visitor counting must not be settable by a visitor.
  for (const handler of ['GET', 'PUT', 'POST']) {
    const start = marker.indexOf(`export async function ${handler}`)
    assert.ok(start >= 0, `${handler} is missing`)
    const segment = marker.slice(start, start + 220)
    assert.match(segment, /await adminRequestUser\(\)/, `${handler} is not behind the admin guard`)
  }
})

test('the beacon still sets nothing on a visitor’s device', () => {
  // The whole reason visit counting can ignore the cookie banner. The staff
  // marker is written by an admin route, never by the public beacon, and that
  // boundary is the point.
  const beacon = read(BEACON)
  assert.doesNotMatch(beacon, /cookies\(\)\.set|jar\.set|Set-Cookie/,
    'the public beacon writing a cookie would make the Decline button a lie')
  assert.match(beacon, /req\.cookies\.get\(STAFF_COOKIE\)/, 'reading one is not setting one')
  assert.equal(STAFF_COOKIE.startsWith('sb-'), false, 'it must not collide with a Supabase auth cookie')
})

test('our own hosts are not a place anybody came from', () => {
  assert.equal(isOwnHost('talenthousecollective.co.uk'), true)
  assert.equal(isOwnHost('talent.wellnesshousecollective.co.uk'), false, 'the old domain 301s here but is a real referral')
  assert.equal(isOwnHost('6aa908cbfddd040009f71caf--whc-concierge.netlify.app'), true)
  assert.equal(isOwnHost('localhost'), true)
  assert.equal(isOwnHost('www.linkedin.com'), false)
  assert.equal(isOwnHost('com.linkedin.android'), false, 'the app is a real source')

  // Rows written before the beacon filtered previews still carry one, so the
  // screen drops them on the way out too.
  const api = body(API)
  assert.match(api, /isOwnHost\(host\)/)
})

test('coming back from Stripe is not somebody discovering the website', () => {
  assert.equal(returnLegLabel('checkout.stripe.com'), 'Came back from Stripe checkout')
  assert.equal(returnLegLabel('CHECKOUT.STRIPE.COM'), 'Came back from Stripe checkout')
  assert.equal(returnLegLabel('www.linkedin.com'), null, 'a real source must not be filed away as a return leg')
  assert.equal(returnLegLabel('www.google.com'), null)

  const api = body(API)
  assert.match(api, /returnLegs: rank\(byReturnLeg/)
  const page = body(PAGE)
  assert.match(page, /Not a source, but worth knowing/)
})

test('a typical day ignores the fortnight before counting existed', () => {
  // Counting switched on part-way through the window. Averaging over the whole
  // thirty days divides by twenty-two days that never had a table to write to
  // and reports a third of the truth.
  const daily = [
    ...Array.from({ length: 22 }, () => ({ visits: 0 })),
    { visits: 18 }, { visits: 6 }, { visits: 31 }, { visits: 22 },
    { visits: 26 }, { visits: 15 }, { visits: 9 }, { visits: 11 },
  ]
  assert.equal(typicalDay(daily), 17, 'the median of the days that actually have numbers')
  assert.ok(typicalDay(daily) > Math.round(138 / 30), 'a thirty-day mean would understate every real day')

  // A genuine quiet day inside the live stretch still counts against her.
  assert.equal(typicalDay([{ visits: 10 }, { visits: 0 }, { visits: 0 }, { visits: 2 }]), 1)
  assert.equal(typicalDay([]), 0)
  assert.equal(typicalDay([{ visits: 0 }, { visits: 0 }]), 0, 'nothing yet is nothing, not a crash')
  assert.equal(typicalDay([{ visits: 7 }]), 7)
})

test('the headline says visits, because that is what it counts', () => {
  const api = body(API)
  assert.match(api, /visits: visitors\.size/)
  assert.doesNotMatch(api, /\bpeople:/, 'the hash rotates nightly; this was never a count of people')

  const page = body(PAGE)
  assert.match(page, /<p className="eyebrow">Visits<\/p>/)
  assert.doesNotMatch(page, /<p className="eyebrow">People<\/p>/)
  // And the screen explains the rotation rather than leaving her to infer it
  // from a number that feels too big.
  assert.match(page, /one person on one day/i)
  assert.match(page, /A typical day/)

  // "Pages read" was unique page-visitor-days, not page views.
  assert.match(page, /Pages opened/)
  assert.match(page, /repeats in a day counted once/)
})

test('she can ask the screen about strangers only', () => {
  // The actual question: are people who are neither me nor already members
  // finding this, and what are they on?
  const api = body(API)
  assert.match(api, /audience'\) === 'strangers'/)
  assert.match(api, /all\.filter\(row => !everSignedIn\.has\(row\.visitor_hash\)\)/)
  // Somebody signed in on one page and signed out on another is not a
  // stranger, and the whole of that day has to come out together.
  assert.match(api, /for \(const row of all\) if \(row\.signed_in\) everSignedIn\.add/)

  const page = body(PAGE)
  assert.match(page, /audience=strangers/)
  assert.match(page, /Only people who never signed in/)
  assert.match(page, /on a phone/, 'the device split is the half of the question she asked out loud')
})
