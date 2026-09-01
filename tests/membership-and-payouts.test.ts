import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { agencyResolutionExceedsCollected, bookingPaidByConnect, AGENCY_PAYOUT_CONNECT } from '../src/lib/agency-payouts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Featured Talent is a one-off purchase - £9.99 for seven days, £24.99 for
// thirty. The invoice.paid fall-through extended it on EVERY paid invoice for
// the same Stripe customer, so anyone holding any monthly membership had it
// renewed free, every month, forever.
test('a membership invoice no longer renews Featured Talent for free', () => {
  const source = read('src/app/api/stripe/webhook/route.ts')
  assert.ok(
    !/is_featured: true,\s*\n\s*featured_until: monthEnd,\s*\n\s*\}\)\.eq\('stripe_customer_id', customerId\)\.eq\('is_featured', true\)/.test(source),
    'the blanket featured extension must not return',
  )
  // The legitimate branch, which fires only on a featured_profile subscription.
  assert.ok(source.includes("meta.type === 'featured_profile'"), 'the real featured branch must remain')
})

// A professional who bought thirty days of Featured on the 1st and cancelled
// a separate £9.99 membership on the 5th lost twenty-five days she had paid
// for, because the revocation was scoped to the shared Stripe customer.
test('cancelling one purchase does not revoke another', () => {
  const source = read('src/app/api/stripe/webhook/route.ts')
  assert.ok(
    !/update\(\{ is_featured: false, featured_until: null \}\)\.eq\('stripe_customer_id', customerId\)/.test(source),
    'a subscription cancellation must not switch off a separately purchased Featured slot',
  )
})

// A failing card left Interview Ready credits, the Academy discount, agency
// bookability and the Agency Plus fee reduction switched on for the two to
// three weeks Stripe spends retrying.
test('a failing card suspends the benefits it pays for, and paying restores them', () => {
  const source = read('src/app/api/stripe/webhook/route.ts')
  assert.ok(source.includes('membership_past_due: true'), 'a failed payment must suspend paid benefits')
  assert.ok(source.includes('membership_past_due: false'), 'a cleared payment must restore them')
  assert.ok(source.includes('agency_plus_active: false'), 'the Agency Plus fee reduction must be suspended too')
})

// The check read payout_status and the write set it; between the two, a
// second administrator did the same thing and destroyed the first one's bank
// reference - which invites making the same transfer twice with no record.
test('two administrators cannot both record one payout', () => {
  const source = read('src/app/api/admin/agency/route.ts')
  assert.ok(source.includes(".neq('payout_status', 'paid')"), 'the payout write must claim the booking')
  assert.ok(source.includes('409'), 'a losing claim must be reported, not silently overwritten')
})

// On a destination charge the professional is paid at the moment the property
// pays. Refunding without reverse_transfer takes the whole refund out of
// WHC's own balance while they keep the shift money.
test('refunding a Connect booking claws the transfer back', () => {
  for (const path of ['src/app/api/admin/agency/route.ts', 'src/app/api/agency/cases/route.ts']) {
    const source = read(path)
    assert.ok(source.includes('reverse_transfer: true'), `${path} must reverse the transfer`)
    assert.ok(source.includes('refund_application_fee: true'), `${path} must return the platform fee`)
    assert.ok(source.includes('bookingPaidByConnect'), `${path} must decide by the booking's payout model`)
  }
})

test('the payout model is read from the booking, not guessed', () => {
  assert.equal(bookingPaidByConnect({ payout_method: AGENCY_PAYOUT_CONNECT }), true)
  assert.equal(bookingPaidByConnect({ payout_method: 'manual' }), false)
  assert.equal(bookingPaidByConnect({}), false)
  assert.equal(bookingPaidByConnect(null), false)
})

// The destination-charge path was written and then never called: both the web
// and the app send every agency payment to the mobile checkout route, which
// had no Connect support - so every professional waited on a manual transfer
// while WHC held their money.
test('the checkout route the platform actually uses supports Connect', () => {
  const source = read('src/app/api/mobile/agency/checkout/route.ts')
  assert.ok(source.includes('transfer_data'), 'the live checkout must create a destination charge')
  assert.ok(source.includes('application_fee_amount: money.feePence'), 'WHC keeps only its own fee, in pence')
  assert.ok(source.includes('candidatePayoutAccount'), 'Connect must be used only where the account is ready')
  assert.ok(source.includes('payout_method:'), 'the webhook must be told how the money moved')
})

// An administrator could propose a full refund AND the full shift value, both
// parties could sign, and WHC would pay the professional out of its own money
// on top of refunding the property.
test('a resolution can never hand out more than was collected', () => {
  assert.equal(agencyResolutionExceedsCollected(230, 230, 200), true)
  assert.equal(agencyResolutionExceedsCollected(230, 200, 30), false)
  assert.equal(agencyResolutionExceedsCollected(230, 0, 200), false)
  const source = read('src/app/api/admin/agency/cases/route.ts')
  assert.ok(
    source.includes('agencyResolutionExceedsCollected'),
    'the case proposal route must enforce the same invariant as the dispute route',
  )
})

// A half-hour shift collects £x.50; parseInt made a "full refund" £x.
test('refunds are settled in pounds and pence', () => {
  const source = read('src/app/api/admin/agency/route.ts')
  assert.ok(!/parseInt\(String\(body\.refundAmount/.test(source), 'refunds must not be truncated to whole pounds')
  assert.ok(source.includes('Math.round(refundAmount * 100)'), 'the Stripe amount must be integer pence')
})
