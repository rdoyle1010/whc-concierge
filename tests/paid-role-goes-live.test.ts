import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// A property paid £149 and the listing stayed on "Complete payment".
//
// Job adverts went live from the Stripe webhook and nothing else. Every other
// purchase on this platform is fulfilled twice - once when the browser comes
// back from Stripe, again by the webhook for when the tab never returns - and
// job adverts, the commonest thing anyone buys here, had only the second half.
// So a webhook that was late, refused or pointed at the wrong host took the
// money and published nothing, with no way for the property to say so and
// nothing on the platform that would ever notice.
test('a paid role can go live without the webhook', () => {
  const route = read('src/app/api/employer/jobs/confirm-payment/route.ts')
  assert.match(route, /findPaidSessionForJob/, 'the payment is confirmed with Stripe, not taken on trust')
  assert.match(route, /publishPaidJobPosting/, 'and publishes through the same path the webhook uses')

  const page = read('src/app/employer/jobs/page.tsx')
  assert.match(page, /confirm-payment/, 'the page calls it on the way back from checkout')
  assert.match(page, /Already paid\?/, 'and a role stuck from before has a way out')
})

// Two copies of "publish a paid role" drift, and the one that drifts is the
// one nobody watches.
test('the webhook and the confirm route publish the same way', () => {
  const webhook = read('src/app/api/stripe/webhook/route.ts')
  assert.match(webhook, /publishPaidJobPosting/, 'the webhook uses the shared publish')
  // The inlined copy must be gone, not merely duplicated alongside it.
  const jobBranch = webhook.slice(webhook.indexOf("meta?.type === 'job_posting'"))
  assert.ok(!/is_live: employerApproved/.test(jobBranch.slice(0, 2000)),
    'the webhook must not keep its own copy of the publish')
})

// Publishing a role nobody paid for would be worse than not publishing one
// somebody did.
test('a role is only published against a payment Stripe confirms', () => {
  const lib = read('src/lib/job-posting-fulfilment.ts')
  assert.match(lib, /payment_status === 'paid'/)
  assert.match(lib, /Stripe has not confirmed this payment yet/)
  assert.match(lib, /meta\.type !== 'job_posting'/, 'another kind of checkout must not publish a role')

  const route = read('src/app/api/employer/jobs/confirm-payment/route.ts')
  // The caller says which role. It must not be able to say whose.
  assert.match(route, /job\.employer_id !== employer\.id/, 'only the property that owns the role may confirm it')
  assert.match(route, /getRequestUser/)
  assert.ok(!/body\.sessionId|body\.session_id/.test(route),
    'the session is found in Stripe, never accepted from the request')
})

// Calling it twice - webhook and browser racing, or somebody pressing the
// button again - must not double-charge, double-record or double-alert.
test('confirming twice is safe', () => {
  const route = read('src/app/api/employer/jobs/confirm-payment/route.ts')
  assert.match(route, /alreadyLive/, 'a live role short-circuits rather than republishing')
  // The ledger row is keyed on the Stripe session id, so a second write
  // updates rather than duplicates.
  assert.match(read('src/lib/commercial-fulfilment.ts'), /onConflict: 'stripe_session_id'/)
})

// The paid term, the approval hold and the posted_date stamp all have to
// survive the move out of the webhook, or a role goes live with no date and
// an unapproved property publishes early.
test('the shared publish keeps what the webhook did', () => {
  const lib = read('src/lib/job-posting-fulfilment.ts')
  assert.match(lib, /expires_at: expiresAt/, 'the paid term is honoured')
  assert.match(lib, /posted_date: new Date\(\)\.toISOString\(\)/, 'or the role sorts and displays as undated')
  assert.match(lib, /employerApproved/, 'an unapproved property still waits for approval')
  assert.match(lib, /Payment received - role held for approval/, 'and is told why')
  assert.match(lib, /trackEvent\('job_posted'/, 'the market event is still recorded')
})
