import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const FULFILMENT = 'src/lib/stripe-checkout-fulfilment.ts'
const WEBHOOK = 'src/app/api/stripe/webhook/route.ts'
const CONFIRM = 'src/app/api/stripe/confirm/route.ts'

// Fulfilment lived in the webhook and nowhere else, so the webhook was the
// only thing standing between a payment and a delivery. Its URL was wrong for
// several days, and every purchase in that window took the money and delivered
// nothing: no course access, no agency listing, no featured placement, with no
// way for the buyer to say so and nothing that would ever notice.
test('every payment type is delivered by shared code, not a copy per caller', () => {
  const fulfilment = read(FULFILMENT)
  for (const type of [
    'commercial_product', 'sponsored_ad', 'featured_profile', 'featured_employer',
    'agency_case_adjustment', 'agency_booking', 'course_public', 'course_bundle',
    'course', 'agency_listing', 'employer_registration', 'agency_plus', 'job_posting',
  ]) {
    assert.ok(fulfilment.includes(`'${type}'`), `${type} must be fulfilled by the shared library`)
  }
  // Both callers run it. A second copy is how the two drift, and the one that
  // drifts is the one nobody watches.
  assert.match(read(WEBHOOK), /fulfilCheckoutSession\(supabase, session/)
  assert.match(read(CONFIRM), /fulfilCheckoutSession\(admin, session/)
  // The webhook must no longer carry its own branches.
  assert.ok(!/meta\?\.type === 'course_public'/.test(read(WEBHOOK)),
    'the webhook must not keep a private copy of fulfilment')
})

// The webhook needs Stripe to retry a failure; the browser needs to be told
// something useful. Fulfilment returns the outcome rather than deciding.
test('a failure means retry to Stripe and an explanation to the buyer', () => {
  const fulfilment = read(FULFILMENT)
  assert.match(fulfilment, /retry: true/, 'a failed delivery asks to be retried')
  assert.ok(!/NextResponse/.test(fulfilment), 'fulfilment must not decide what an HTTP response looks like')

  assert.match(read(WEBHOOK), /outcome\.retry\) return await fulfilmentFailed/,
    'the webhook releases its ledger row so Stripe retries')
  assert.match(read(CONFIRM), /Your payment went through but we could not finish setting it up/,
    'the buyer is told their money is safe')
})

// Delivering a purchase nobody made would be worse than the failure this
// fixes.
test('a purchase is only delivered against a payment Stripe confirms', () => {
  const confirm = read(CONFIRM)
  assert.match(confirm, /checkout\.sessions\.retrieve/, 'the session is read from Stripe, never trusted from the caller')
  assert.match(confirm, /payment_status === 'paid'/)
  assert.match(confirm, /getRequestUser/, 'and the caller must be signed in')
  // A session id found in a shared link or a browser history is not proof of
  // purchase.
  assert.match(confirm, /buyer !== user\.id/, 'the payment must belong to the person claiming it')
  assert.match(confirm, /role !== 'admin'/, 'with support as the only exception')
})

// The webhook and the browser race each other on every purchase. Both winning
// must not mean delivering twice.
test('the webhook and the browser cannot both fulfil the same payment', () => {
  const confirm = read(CONFIRM)
  assert.match(confirm, /stripe_events/, 'the same ledger the webhook writes')
  assert.match(confirm, /alreadyFulfilled/, 'a session already applied is a no-op, not a second delivery')
  // And a failure releases the claim, or a transient error would lock the
  // purchase out of ever being retried.
  assert.match(confirm, /delete\(\)\.eq\('event_id', ledgerId\)/)
})

// Without the session id on the way back, the browser has nothing to confirm
// with and the webhook is once again the only path.
test('every checkout returns with its session id', () => {
  const checkout = read('src/app/api/stripe/checkout/route.ts')
  const successUrls = checkout.match(/success_url: `[^`]+`/g) || []
  const missing = successUrls.filter(url => !url.includes('{CHECKOUT_SESSION_ID}'))
  assert.deepEqual(missing, [], 'these send a buyer back with no way to confirm what they paid for')
  assert.match(read('src/app/api/stripe/featured-employer/route.ts'), /\{CHECKOUT_SESSION_ID\}/)
})

// A page a buyer lands on after paying has to actually make the call.
test('the pages people land on after paying confirm the purchase', () => {
  for (const page of [
    'src/app/academy/page.tsx',
    'src/app/talent/academy/page.tsx',
    'src/app/talent/upgrade/page.tsx',
    'src/app/talent/agency/page.tsx',
    'src/app/employer/agency/page.tsx',
  ]) {
    assert.match(read(page), /useConfirmPaymentOnReturn\(\)/, `${page} must confirm on return`)
  }
  const hook = read('src/lib/use-confirm-payment.ts')
  assert.match(hook, /session_id/)
  assert.match(hook, /startsWith\('cs_'\)/, 'only a real Stripe session is worth a round trip')
})
