import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Agency commercial constants keep the property 10% fee and no therapist booking deduction', () => {
  const constants = read('src/lib/constants.ts')
  assert.match(constants, /AGENCY_PLATFORM_FEE_PCT\s*=\s*0\.10/)
  assert.match(constants, /PREFERRED_EMPLOYER_PRICE\s*=\s*15000/)
  assert.match(constants, /basic:\s*\{\s*price:\s*1000/)
  assert.match(constants, /featured:\s*\{\s*price:\s*2000/)
  assert.doesNotMatch(constants, /AGENCY_CANDIDATE_FEE_PCT/)
})

test('Agency Stripe fulfilment records the full agreed shift value as therapist payout', () => {
  const webhook = read('src/app/api/stripe/webhook/route.ts')
  assert.match(webhook, /meta\?\.type === 'agency_booking'/)
  assert.match(webhook, /payout_amount:\s*gross/)
  assert.doesNotMatch(webhook, /candidateFee/)
  assert.doesNotMatch(webhook, /gross\s*-\s*.*0\.05/)
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
