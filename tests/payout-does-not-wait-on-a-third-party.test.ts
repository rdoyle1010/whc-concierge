import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const MIGRATION = 'supabase/migrations/20260904170000_pay_the_therapist_on_time.sql'
const ROUTE = 'src/app/api/agency/review-reminders/route.ts'
const sql = read(MIGRATION)

// The therapist does the shift. The property is happy. The property never gets
// round to reviewing. The therapist's money was then frozen indefinitely by a
// third party's inaction, with nothing on any screen explaining why - and they
// are self-employed, so that is somebody's rent.
test('a property no longer holds a professional’s wages', () => {
  const body = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.enforce_agency_review_before_payout'), sql.indexOf('-- payout_ready_at has to agree'))
  assert.ok(!/employer_review_completed_at IS NULL/i.test(body), 'the property’s review must not block a payout')
  assert.match(body, /new\.candidate_review_completed_at IS NULL/, 'the professional’s own review is still asked for')
  assert.match(body, /The property''s review is not required/, 'and the refusal says so')
})

// Requiring the professional's review for ever would be the same fault pointed
// the other way, so it expires.
test('nothing is required at all after seven days', () => {
  const body = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.enforce_agency_review_before_payout'), sql.indexOf('-- payout_ready_at has to agree'))
  assert.match(body, /shift_over <= now\(\) - interval '7 days'/)
  // Anchored on the shift, then on payment, then on the booking - a row with a
  // missing date can never strand a payout for ever.
  assert.match(body, /coalesce\(new\.shift_date::timestamptz, new\.paid_at, new\.created_at\)/)
})

// A booking that may lawfully be paid must not still read as not ready.
test('the ready flag agrees with the rule that releases the money', () => {
  assert.match(sql, /v_candidate_done IS NOT NULL\n      OR \(v_shift_over IS NOT NULL AND v_shift_over <= now\(\) - interval '7 days'\)/)
  assert.match(sql, /coalesce\(v_booking\.dispute_status, ''\) <> 'open'/, 'an open dispute still holds it')
  assert.match(sql, /v_booking\.paid_at IS NOT NULL/, 'and money must have been taken first')
  // One place decides what ready means, rather than two that can drift.
  assert.match(sql, /PERFORM public\.refresh_agency_review_gate\(b\.id\)/)
})

// People already stranded behind a review that never came should not have to
// wait for somebody to notice them.
test('payments already stuck are released', () => {
  assert.match(sql, /UPDATE public\.agency_bookings\nSET payout_ready_at = coalesce\(payout_ready_at, now\(\)\)/)
  assert.match(sql, /coalesce\(shift_date::timestamptz, paid_at, created_at\) <= now\(\) - interval '7 days'/)
})

// The trade only works if the reviews still arrive.
test('both sides are chased, for the reason that is actually true of each', () => {
  const route = read(ROUTE)
  assert.match(route, /Your review releases your payment/, 'the professional is told what their review does')
  assert.match(route, /It does not hold up their payment/, 'and the property is told it does not hold anything up')
  assert.match(route, /what the next property reads before booking them/, 'so the reason given is the real one')
})

// A nudge that arrives every night is nagging, and nagging gets muted.
test('it nudges three times and then stops', () => {
  const route = read(ROUTE)
  assert.match(route, /const REMINDER_GAP_HOURS = 48/)
  assert.match(route, /const WINDOW_DAYS = 8/)
  assert.match(route, /review_reminder_last_at\.is\.null,review_reminder_last_at\.lt\.\$\{gapCutoff\}/)
  assert.match(route, /\.neq\('payout_status', 'paid'\)/, 'and a settled booking is never chased')
  assert.match(sql, /ADD COLUMN IF NOT EXISTS review_reminder_last_at timestamptz/)
})

// Nobody is holding a session at half past nine at night.
test('the chase runs itself', () => {
  const job = read('netlify/functions/agency-review-reminders.mts')
  assert.match(job, /schedule: '30 9 \* \* \*'/, 'when a spa manager is at a desk')
  assert.match(job, /x-whc-internal-secret/)
  assert.match(read(ROUTE), /isInternalApiRequest\(req\)/)
  assert.match(read(ROUTE), /account\?\.role !== 'admin'/, 'and an administrator can run it by hand')
})
