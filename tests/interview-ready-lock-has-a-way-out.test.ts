import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { talentFeatureAccess } from '../src/lib/feature-access.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const PAGE = 'src/app/talent/interview-ready/page.tsx'
const ROUTE = 'src/app/api/interview-ready/route.ts'

// The padlock pointed at Billing. Billing's only offer to somebody with no
// subscription was Featured Talent, which grants no Interview Ready credits at
// all - so the one route out of the lock led to the single product that could
// not unlock it. Membership is where Standard and Pro are actually sold.
test('the padlock leads to the page that sells the thing', () => {
  assert.equal(talentFeatureAccess({ interview_ready_credits: 0 }).talent_interview_ready.upgradeHref, '/talent/membership')
  assert.equal(talentFeatureAccess({ interview_ready_credits: 2 }).talent_interview_ready.upgradeHref, '/talent/membership')
  assert.match(read(ROUTE), /upgradeHref: subscriber && tier === 'pro' \? null : '\/talent\/membership'/)
  // And Billing no longer leads with the product that does not include credits.
  const billing = read('src/app/talent/billing/page.tsx')
  assert.match(billing, /href="\/talent\/membership" className="btn-primary/)
  assert.match(billing, /Or feature my profile/, 'Featured stays available, just not as the headline answer')
})

// Somebody on Pro who has spent this month's ten has nothing to buy. Telling
// them to upgrade is useless and slightly insulting.
test('a subscriber at their limit is told when credits return, not sold to', () => {
  const route = read(ROUTE)
  assert.match(route, /More arrive on \$\{new Date\(renewsAt\)/)
  assert.match(route, /More arrive when your membership renews/)
  const page = read(PAGE)
  assert.match(page, /You are already on the highest allowance, so there is nothing to buy/)
  // Standard is not the highest allowance, so it keeps its route to Pro.
  assert.match(page, /const allowanceHref = tier === 'pro' \? null : '\/talent\/membership'/)
})

// Six working-style choices and a pasted job description, then a padlock, is a
// rotten way to find out.
test('the allowance is shown before the form is filled in', () => {
  const page = read(PAGE)
  assert.match(page, /interview_ready_credits,membership_renews_at/, 'the page has to load the allowance to show it')
  assert.match(page, /const outOfCredits = Boolean\(profile\) && credits < 1 && !prep/)
  assert.match(page, /\{outOfCredits && <AllowancePanel/, 'and say so at the top')
  assert.match(page, /disabled=\{preparing \|\| outOfCredits\}/, 'rather than let them press a button that cannot work')
})

// A sentence somebody cannot act on is not an answer.
test('running out gives a button, not a line of red text', () => {
  const page = read(PAGE)
  assert.match(page, /res\.status === 403 && data\.code === 'FEATURE_LOCKED'/)
  assert.match(page, /setLocked\(\{ message: data\.error/)
  assert.match(page, /See membership plans/)
  assert.match(page, /<Link href=\{upgradeHref\}/)
  // The prices are named, because "upgrade" without a number is a shrug.
  assert.match(page, /£9\.99 a month/)
  assert.match(page, /£19\.99 for ten/)
})

// The app hits its own route and must not dead-end differently.
test('the mobile app gets the same destination', () => {
  const mobile = read('src/app/api/mobile/interview-ready/route.ts')
  assert.match(mobile, /upgradeHref: '\/talent\/membership'/)
  assert.match(mobile, /A membership adds credits every month/)
})
