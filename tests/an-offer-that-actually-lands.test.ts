import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LAUNCH_COURSE_SLUGS, launchOfferOpen, launchOfferClosesLabel } from '../src/lib/launch-offers'
import { INDUSTRY_GROUPS } from '../src/lib/industry-bodies'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// An offer you have to remember to redeem is an offer most people never get.
test('the opening month gives what it says it gives', () => {
  assert.deepEqual([...LAUNCH_COURSE_SLUGS], ['carol-joy-london-masterclass', 'consultation-excellence'])
  assert.equal(launchOfferOpen(new Date('2026-09-15T12:00:00Z')), true)
  assert.equal(launchOfferOpen(new Date('2026-08-31T22:59:59Z')), false)
  assert.equal(launchOfferOpen(new Date('2026-09-30T23:00:00Z')), false)
  assert.match(launchOfferClosesLabel(), /30 September 2026/)
})

test('a professional registering this month finds the courses already there', () => {
  const init = body('src/app/api/register/init/route.ts')
  assert.match(init, /launchOfferOpen\(\)/)
  assert.match(init, /grantCourses\(admin, newCandidate\.id, LAUNCH_COURSE_SLUGS/)
  // Nought, not null: a null amount_paid reads as "not paid for" everywhere
  // the Academy checks, and the point of a gift is that it is already paid.
  assert.match(read('src/lib/launch-offers.ts'), /amount_paid: 0/)
  // Idempotent: a retried registration must not wipe progress or double up.
  assert.match(read('src/lib/launch-offers.ts'), /const owned = new Set/)
})

test('a property registering this month finds a listing already paid for', () => {
  const register = body('src/app/api/register/employer/route.ts')
  assert.match(register, /grantOpeningMonthListing\(supabase, userId\)/)

  const publish = body('src/app/api/mobile/employer/jobs/manage/route.ts')
  assert.match(publish, /launch_listing_credits/)
  // The credit is spent before the annual allowance: the allowance renews and
  // the credit does not, so covering a gift with an allowance gives nothing.
  assert.match(publish, /const useCredit = tier === 'Bronze' && credits > 0/)
  assert.match(publish, /const useAllowance = tier === 'Bronze' && !useCredit/)
  // And handed back if the publish itself fails.
  assert.match(publish, /if \(useCredit\) await admin\.from\('employer_profiles'\)\.update\(\{ launch_listing_credits: credits \}\)/)

  // A property that does not know it has one will reach the price and stop.
  assert.match(read('src/app/employer/post-role/page.tsx'), /free Standard \{freeListings===1\?'listing':'listings'\}/)
})

// The codes are the point of the scheme: they are how we find out whose word
// actually moves people, which is worth more than the courses they give away.
test('an ambassador code can only be spent once, by one person', () => {
  const migration = read('supabase/migrations/20260910130000_ambassadors_and_the_opening_month.sql')
  assert.match(migration, /UNIQUE \(code_id, user_id\)/, 'one code, one person, once')
  assert.match(migration, /FOR UPDATE/, 'claiming has to be one statement')
  assert.match(migration, /redemptions_used >= v\.max_redemptions/)
  // Codes and redemptions are never readable from the browser. RLS with no
  // policy denies everyone.
  assert.match(migration, /ALTER TABLE public\.ambassador_codes ENABLE ROW LEVEL SECURITY/)
  assert.doesNotMatch(migration, /CREATE POLICY .* ON public\.ambassador_codes/)
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.claim_ambassador_code/)
})

test('a code for therapists cannot be spent by a property', () => {
  const route = body('src/app/api/ambassador/redeem/route.ts')
  assert.match(route, /const wrongAudience/)
  // A wrong-audience claim releases the place rather than burning one of the
  // ambassador's allocation on somebody's mistake.
  assert.match(route, /ambassador_redemptions'\)\.delete\(\)/)
  assert.match(route, /redemptions_used: used - 1/)
  assert.match(route, /enforceRateLimit\(req, 'ambassador-redeem'/, 'a guessable code is worth guessing')
})

// A code that only works on a page nobody finds is a code nobody redeems.
test('there is somewhere to spend a code', () => {
  for (const page of ['src/app/talent/dashboard/page.tsx', 'src/app/employer/dashboard/page.tsx']) {
    assert.match(read(page), /AmbassadorCodeBox/, `${page} must offer the box`)
  }
  assert.match(read('src/components/DashboardShell.tsx'), /\/admin\/ambassadors/)
})

// A reference page whose whole value is trustworthiness has to have a view,
// or it is a list of links somebody could have found themselves.
test('every governing body gets all three voices', () => {
  for (const group of INDUSTRY_GROUPS) {
    for (const entry of group.bodies) {
      for (const field of ['whyItMatters', 'whyWeRateIt', 'whySpasValueIt'] as const) {
        assert.ok(entry[field] && entry[field].length > 80, `${entry.name} is missing ${field}`)
      }
      assert.ok(entry.url.startsWith('https://'), `${entry.name} must link somewhere real`)
    }
  }
  const page = body('src/app/good-to-know/page.tsx')
  assert.match(page, /Why professionals need it/)
  assert.match(page, /Why Talent House rates it/)
  assert.match(page, /Why spas value it/)
  // A picture when there is one, a drawn monogram when there is not. An empty
  // box reads as unfinished.
  assert.match(page, /function BodyPicture/)
  assert.match(page, /function monogram/)
})
