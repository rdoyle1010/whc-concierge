import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { agencyDestinationSplit, agencyResolutionExceedsCollected } from '../src/lib/agency-payouts.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Agency commercial constants keep the property 15% fee and no therapist booking deduction', () => {
  const constants = read('src/lib/constants.ts')
  assert.match(constants, /AGENCY_PLATFORM_FEE_PCT\s*=\s*0\.15/)
  assert.match(constants, /PREFERRED_EMPLOYER_PRICE\s*=\s*15000/)
  assert.match(constants, /basic:\s*\{\s*price:\s*1000/)
  assert.match(constants, /featured:\s*\{\s*price:\s*2000/)
  assert.doesNotMatch(constants, /AGENCY_CANDIDATE_FEE_PCT/)
})

// Fulfilling a checkout moved out of the webhook into a library the webhook
// and the confirm route both call, so the money rule is asserted where it now
// lives - and against both callers, since a rule enforced in one path and not
// the other is not enforced.
test('Agency Stripe fulfilment records the full agreed shift value as therapist payout', () => {
  const fulfilment = read('src/lib/stripe-checkout-fulfilment.ts')
  assert.match(fulfilment, /meta\?\.type === 'agency_booking'/)
  assert.match(fulfilment, /payout_amount:\s*gross/)
  assert.doesNotMatch(fulfilment, /candidateFee/)
  assert.doesNotMatch(fulfilment, /gross\s*-\s*.*0\.05/)
  // Both paths must run this same code rather than a copy of it.
  assert.match(read('src/app/api/stripe/webhook/route.ts'), /fulfilCheckoutSession/)
})

test('Agency talent-facing money wording promises the full agreed shift rate', () => {
  const settings = read('src/app/talent/agency/settings/page.tsx')
  const statement = read('src/app/talent/agency/statement/page.tsx')
  assert.match(settings, /receive 100% of the agreed shift rate/)
  assert.match(statement, /pays you 100% of that agreed shift amount/)
  assert.doesNotMatch(settings, /5% fee/i)
  assert.doesNotMatch(statement, /5% service fee/i)
})

test('Agency database safeguard forces full-rate payout for every open booking', () => {
  const migration = read('supabase/migrations/043_agency_full_rate_payout.sql')
  assert.match(migration, /enforce_agency_full_rate_payout/)
  assert.match(migration, /COALESCE\(NEW\.payout_status, 'pending'\) <> 'paid'/)
  assert.match(migration, /COALESCE\(NEW\.rate, 0\)/)
  assert.match(migration, /COALESCE\(NULLIF\(NEW\.hours, 0\), 8\)/)
})

test('Agency destination charge keeps the professional whole and WHC on its fee alone', () => {
  // The property pays gross + fee exactly as before; the application fee is
  // the WHC fee alone, so the shift money reaching the professional is always
  // 100% of the agreed shift value.
  const split = agencyDestinationSplit(200, 30)
  assert.equal(split.totalPence, 23000)
  assert.equal(split.applicationFeePence, 3000)
  assert.equal(split.professionalPence, 20000)

  for (const [gross, fee] of [[120, 18], [400, 60], [95, 19], [8, 2]]) {
    const row = agencyDestinationSplit(gross, fee)
    assert.equal(row.totalPence, (gross + fee) * 100, `total for £${gross} + £${fee}`)
    assert.equal(row.professionalPence, gross * 100, `professional keeps the full £${gross}`)
    assert.equal(row.applicationFeePence + row.professionalPence, row.totalPence)
  }

  // A fractional rate still splits to whole pence, and the therapist's share
  // is always the charge less the WHC fee.
  const partHour = agencyDestinationSplit(157.5, 24)
  assert.equal(partHour.totalPence, 18150)
  assert.equal(partHour.applicationFeePence, 2400)
  assert.equal(partHour.professionalPence, 15750)

  // Nonsense in, nothing out - never a negative charge or a negative fee.
  const empty = agencyDestinationSplit(Number.NaN, -50)
  assert.equal(empty.totalPence, 0)
  assert.equal(empty.applicationFeePence, 0)
})

test('Agency dispute resolution can never hand out more than was collected', () => {
  assert.equal(agencyResolutionExceedsCollected(230, 30, 200), false)
  assert.equal(agencyResolutionExceedsCollected(230, 0, 230), false)
  assert.equal(agencyResolutionExceedsCollected(230, 230, 0), false)
  assert.equal(agencyResolutionExceedsCollected(230, 100, 200), true)
  assert.equal(agencyResolutionExceedsCollected(230, 231, 0), true)
  assert.equal(agencyResolutionExceedsCollected(0, 1, 0), true)
  // A missing or malformed amount collected is treated as nothing collected.
  assert.equal(agencyResolutionExceedsCollected(Number.NaN, 10, 0), true)
})

test('Agency booking money routes through Connect and never settles on a bare click', () => {
  const checkout = read('src/app/api/stripe/checkout/route.ts')
  assert.match(checkout, /transfer_data:\s*\{\s*destination:\s*payee\.accountId\s*\}/)
  assert.match(checkout, /application_fee_amount:\s*split\.applicationFeePence/)
  assert.match(checkout, /payout_method:\s*payoutMethod/)

  const adminAgency = read('src/app/api/admin/agency/route.ts')
  assert.match(adminAgency, /MIN_PAYOUT_REFERENCE_LENGTH/)
  assert.match(adminAgency, /payout_confirmed_by:\s*user\.id/)
  assert.match(adminAgency, /agencyResolutionExceedsCollected/)

  const webhook = read('src/app/api/stripe/webhook/route.ts')
  assert.match(webhook, /from\('stripe_events'\)/)
  assert.match(webhook, /duplicate key\|already exists/)
})
