import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  employerFeatureAccess,
  talentFeatureAccess,
  hasActiveFeaturedAccess,
  FEATURED_PREMIUM_GRANDFATHER_UNTIL,
} from '../src/lib/feature-access'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Talent Search and Analytics were locked in the sidebar only. The padlock
// greyed the menu item out, but the pages and the APIs behind them never
// checked a tier, so a direct URL, an old bookmark or the mobile app reached
// the full feature on a free account. These hold the gate shut.

const PREMIUM_ROUTES = [
  'src/app/api/employer/candidates/route.ts',
  'src/app/api/employer/analytics/applicant-skills/route.ts',
  'src/app/api/mobile/analytics/route.ts',
  'src/app/api/private-approach/route.ts',
]

test('every premium employer route refuses a free account server-side', () => {
  for (const route of PREMIUM_ROUTES) {
    const source = read(route)
    assert.match(source, /isPremium\(/, `${route} must check the tier where the data is served`)
    assert.match(source, /status: 402/, `${route} must answer 402 so the client can offer the upgrade`)
    assert.match(source, /upgradeHref: '\/employer\/billing'/, `${route} must say where to upgrade`)
  }
})

test('premium routes select the columns the tier check depends on', () => {
  // isPremium reads membership_tier, featured_employer and featured_until.
  // Selecting a narrower row would make every caller look like a free
  // account, which fails closed but silently locks out paying customers.
  for (const route of PREMIUM_ROUTES) {
    assert.match(read(route), /PREMIUM_COLUMNS/, `${route} must select the premium columns`)
  }
})

test('both premium pages are gated by a server layout, not by the page', () => {
  for (const gate of ['src/app/employer/candidates/layout.tsx', 'src/app/employer/analytics/layout.tsx']) {
    const source = read(gate)
    assert.match(source, /checkEmployerPremium/)
    assert.match(source, /if \(premium\) return children/, `${gate} must refuse to render children when locked`)
    assert.match(source, /UpgradePanel/, `${gate} should sell the feature rather than hide it`)
  }
})

test('the tier rules themselves still lock free and open paid', () => {
  const free = employerFeatureAccess({ membership_tier: 'free' })
  assert.equal(free.employer_talent_search.state, 'locked')
  assert.equal(free.employer_analytics.state, 'locked')

  for (const tier of ['pro', 'group']) {
    const paid = employerFeatureAccess({ membership_tier: tier })
    assert.equal(paid.employer_talent_search.state, 'included', `${tier} should include Talent Search`)
    assert.equal(paid.employer_analytics.state, 'included', `${tier} should include Analytics`)
  }

  // Standard is a paid tier but deliberately does not carry the premium two.
  assert.equal(employerFeatureAccess({ membership_tier: 'standard' }).employer_analytics.state, 'locked')
})

test('an expired Featured Employer window unlocks nothing at all', () => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString()
  assert.equal(
    employerFeatureAccess({ membership_tier: 'free', featured_employer: true, featured_until: yesterday }).employer_analytics.state,
    'locked',
  )
})

// Featured is a visibility product bought once; Pro is the subscription that
// carries the tools. Featured used to carry them too, so a single payment
// bought what Pro sells - but windows already running were paid for under
// those terms and have to keep working until they lapse.
test('a Featured window bought before the change keeps the premium tools', () => {
  const cutoff = Date.parse(FEATURED_PREMIUM_GRANDFATHER_UNTIL)
  const beforeChange = new Date(cutoff - 86_400_000).toISOString()
  const access = employerFeatureAccess({ membership_tier: 'free', featured_employer: true, featured_until: beforeChange })
  assert.equal(access.employer_analytics.state, 'included')
  assert.equal(access.employer_talent_search.state, 'included')
})

test('a Featured window bought after the change is visibility only', () => {
  const cutoff = Date.parse(FEATURED_PREMIUM_GRANDFATHER_UNTIL)
  const afterChange = new Date(cutoff + 86_400_000).toISOString()
  const access = employerFeatureAccess({ membership_tier: 'free', featured_employer: true, featured_until: afterChange })
  assert.equal(access.employer_analytics.state, 'locked', 'Featured must no longer carry Analytics')
  assert.equal(access.employer_talent_search.state, 'locked', 'Featured must no longer carry Talent Search')
  // The visibility half of the product is untouched: it is still active.
  assert.equal(hasActiveFeaturedAccess({ featured_employer: true, featured_until: afterChange }), true)
})

test('a subscription still carries the tools whatever Featured does', () => {
  const cutoff = Date.parse(FEATURED_PREMIUM_GRANDFATHER_UNTIL)
  const afterChange = new Date(cutoff + 86_400_000).toISOString()
  for (const tier of ['pro', 'group']) {
    const access = employerFeatureAccess({ membership_tier: tier, featured_employer: true, featured_until: afterChange })
    assert.equal(access.employer_talent_search.state, 'included', `${tier} must keep Talent Search`)
    assert.equal(access.employer_analytics.state, 'included', `${tier} must keep Analytics`)
  }
})

test('the grandfather cutoff covers the longest Featured window that could predate it', () => {
  // Featured runs 30 or 365 days. The cutoff has to sit at least a year
  // ahead of the change, or an annual window bought the day before it would
  // be treated as a new purchase and lose access it paid for.
  const cutoff = Date.parse(FEATURED_PREMIUM_GRANDFATHER_UNTIL)
  assert.ok(Number.isFinite(cutoff), 'the cutoff must be a real date')
  assert.ok(cutoff - Date.now() <= 366 * 86_400_000, 'the cutoff must not keep granting the tools indefinitely')
})

test('Interview Ready stays locked at zero credits and limited above it', () => {
  assert.equal(talentFeatureAccess({ interview_ready_credits: 0 }).talent_interview_ready.state, 'locked')
  const withCredits = talentFeatureAccess({ interview_ready_credits: 3 }).talent_interview_ready
  assert.equal(withCredits.state, 'limited')
  assert.match(withCredits.label || '', /3 credits left/)
})
