import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const MIGRATION = 'supabase/migrations/20260904140000_paid_columns_are_server_only.sql'
const sql = read(MIGRATION)

// Row-level security on these tables says "you may update your own row". It
// says nothing about which COLUMNS, and the publishable key ships in the
// client bundle by design. So any signed-in account could write its own
// record the same way the profile screens legitimately do, and hand itself
// Talent Pro, unlimited Interview Ready credits, a verification badge, a free
// homepage placement, Employer Group at £999 a year, permanent Discover
// Talent, self-approval past vetting, or an advert that never lapses.
//
// The checks that appear to prevent this - the alert about a lapsed paid
// term, the approval gate on the live toggle - were JavaScript in a page.
const guardedList = (table: string) => {
  const start = sql.indexOf(`BEFORE UPDATE ON public.${table}`)
  assert.ok(start > 0, `${table} must be guarded`)
  const args = sql.slice(start, sql.indexOf(');', start))
  return (args.match(/'([a-z_]+)'/g) || []).map(entry => entry.replace(/'/g, ''))
}

test('every column a payment writes is closed to a browser session', () => {
  const candidate = guardedList('candidate_profiles')
  for (const column of [
    'membership_tier', 'interview_ready_credits', 'free_feature_credits',
    'academy_discount_pct', 'is_featured', 'featured_until', 'agency_available',
    'agency_tier', 'agency_listed_until', 'residency_member',
  ]) {
    assert.ok(candidate.includes(column), `candidate_profiles.${column} is bought and must be guarded`)
  }

  const employer = guardedList('employer_profiles')
  for (const column of [
    'membership_tier', 'subscription_tier', 'talent_search_until',
    'featured_employer', 'featured_until', 'annual_job_allowance', 'annual_jobs_used',
  ]) {
    assert.ok(employer.includes(column), `employer_profiles.${column} is bought and must be guarded`)
  }
})

// Verification is the whole proposition. A badge somebody can set on
// themselves is worth less than no badge at all, because it makes the honest
// ones indistinguishable.
test('trust is not self-serve either', () => {
  const candidate = guardedList('candidate_profiles')
  for (const column of ['whc_verified', 'approval_status', 'right_to_work_status', 'review_score', 'review_count']) {
    assert.ok(candidate.includes(column), `candidate_profiles.${column} is earned, not declared`)
  }
  assert.ok(guardedList('employer_profiles').includes('approval_status'), 'a property must not approve itself')
})

// Whatever fulfilment writes onto a profile is, by definition, something
// somebody paid for. If a future product adds a column here and not to the
// guard, this fails rather than shipping a free upgrade.
test('the guard keeps pace with what fulfilment grants', () => {
  const fulfilment = read('src/lib/commercial-fulfilment.ts') + read('src/lib/job-posting-fulfilment.ts')
  const guarded = new Set([...guardedList('candidate_profiles'), ...guardedList('employer_profiles')])
  // Columns assigned inside an update payload, minus the ones that are plain
  // profile content or an audit timestamp rather than an entitlement.
  const ignore = new Set([
    'id', 'user_id', 'updated_at', 'created_at', 'is_live', 'status', 'expires_at',
    'posted_date', 'salary_min', 'salary_max', 'required_role_level', 'job_title',
    'employer_id', 'candidate_id', 'amount_paid', 'currency', 'paid_at',
    // The purchase ledger itself, which has row-level security on and no
    // policy at all, so a browser session cannot read or write it.
    'product_key', 'stripe_session_id', 'stripe_payment_intent', 'amount_pence',
  ])
  const assigned = new Set(
    (fulfilment.match(/^\s*([a-z][a-z0-9_]{3,}):\s/gm) || [])
      .map(entry => entry.trim().replace(':', ''))
      .filter(column => column.includes('_'))
      .filter(column => !ignore.has(column)),
  )
  const unguarded = [...assigned].filter(column => !guarded.has(column) && !/^(on|meta|options|reason|ok|published|held)/.test(column))
  assert.deepEqual(unguarded, [], 'these are granted by a payment but a browser can still set them')
})

// A property must always be able to take its own role down. Only a paid
// fulfilment may put one up, or move the date it runs to.
test('an advert goes live by payment and comes down by choice', () => {
  assert.match(sql, /IF COALESCE\(NEW\.is_live, false\) AND NOT COALESCE\(OLD\.is_live, false\) THEN/)
  assert.match(sql, /NEW\.status = 'active' AND COALESCE\(OLD\.status, ''\) IS DISTINCT FROM 'active'/)
  assert.match(sql, /NEW\.expires_at IS DISTINCT FROM OLD\.expires_at/, 'the paid term cannot be extended by its buyer')
  assert.match(sql, /NEW\.tier IS DISTINCT FROM OLD\.tier/, 'nor the tier upgraded after the fact')
})

// The guard must not fire on the platform's own writes, or every purchase
// stops being deliverable.
test('the guard applies to browser sessions only', () => {
  assert.match(sql, /IN \('authenticated', 'anon'\)/)
  assert.match(sql, /IF NOT private\.is_end_user_session\(\) THEN\n    RETURN true/, 'the service role and migrations pass through')
  assert.match(sql, /private\.is_admin\(\)/, 'and administrators')
  // A column the table does not have must be skipped, not crash every update.
  assert.match(sql, /IF NOT \(old_row \? guarded\) THEN\n      CONTINUE;/)
})

// Reactivating within a paid term is legitimate, so it needs a real route -
// otherwise the guard just breaks a feature.
test('putting a role back up is decided by the server', () => {
  const route = read('src/app/api/employer/jobs/status/route.ts')
  assert.match(route, /'filled', 'closed', 'reopen'/)
  assert.match(route, /paidUntil <= Date\.now\(\)/, 'the paid term is checked where it cannot be stepped around')
  assert.match(route, /approval_status !== 'approved'/)
  assert.match(route, /code: 'TERM_ENDED'/)

  const page = read('src/app/employer/jobs/page.tsx')
  assert.match(page, /action: 'reopen'/)
  // And the raw write it replaced is gone.
  assert.ok(!/update\(\{ is_live: newIsLive/.test(page), 'the browser must not set is_live directly any more')
})
