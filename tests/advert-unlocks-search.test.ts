import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { employerFeatureAccess, isFeatureLocked } from '../src/lib/feature-access.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const future = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

// A property paid £149 to fill a role and then hit a padlock on the screen
// showing who could fill it. They did not buy an advert, they bought a hire.
test('a live paid advert unlocks Discover Talent', () => {
  const withAdvert = employerFeatureAccess({ membership_tier: 'free', talent_search_until: future })
  assert.equal(isFeatureLocked(withAdvert.employer_talent_search), false)
  assert.equal(isFeatureLocked(withAdvert.employer_analytics), false)
})

// Time-boxed on purpose. Featured Employer used to grant these tools outright
// and it was taken away because one payment bought the same tooling as a Pro
// subscription, so nobody had a reason to subscribe. An unlock that expires
// with the advert keeps the subscription worth buying.
test('the unlock expires with the advert that paid for it', () => {
  const lapsed = employerFeatureAccess({ membership_tier: 'free', talent_search_until: past })
  assert.equal(isFeatureLocked(lapsed.employer_talent_search), true)
  assert.equal(lapsed.employer_talent_search.upgradeHref, '/employer/billing')

  const never = employerFeatureAccess({ membership_tier: 'free' })
  assert.equal(isFeatureLocked(never.employer_talent_search), true)

  // Rubbish in the column must lock rather than unlock.
  const nonsense = employerFeatureAccess({ membership_tier: 'free', talent_search_until: 'not a date' })
  assert.equal(isFeatureLocked(nonsense.employer_talent_search), true)
})

test('a subscription still unlocks it outright', () => {
  for (const tier of ['pro', 'group', 'PRO']) {
    const access = employerFeatureAccess({ membership_tier: tier })
    assert.equal(isFeatureLocked(access.employer_talent_search), false, `${tier} must be premium`)
  }
})

// Three separate gates decide this - the page middleware, the API guard and
// the sidebar. If one disagrees, a property is told a page is unlocked and
// then bounced off it, which is worse than a padlock.
test('every gate agrees about the advert unlock', () => {
  const proxy = read('src/proxy.ts')
  assert.match(proxy, /talent_search_until/, 'the middleware must read it')
  assert.match(proxy, /advertPremium/, 'and honour it')

  // The API guard reads a fixed column list; a column missing there means the
  // guard silently decides "no advert" for everybody.
  assert.match(read('src/lib/employer-premium.ts'), /talent_search_until/)
  assert.match(read('src/components/DashboardShell.tsx'), /talent_search_until/, 'the sidebar too')
})

// Somebody running two roles keeps the tools until the last one lapses, and
// re-publishing a shorter advert must not cut short a window already paid for.
test('a second advert extends the window and never shortens it', () => {
  const lib = read('src/lib/job-posting-fulfilment.ts')
  assert.match(lib, /talent_search_until: searchUntil/)
  assert.match(lib, /existing > new Date\(expiresAt\)\.getTime\(\)/, 'the later of the two wins')
})

// A property that bought an advert before this shipped must not stay locked
// out of what it already paid for.
test('adverts already running are backfilled', () => {
  const sql = read('supabase/migrations/20260904120000_advert_unlocks_talent_search.sql')
  assert.match(sql, /add column if not exists talent_search_until/)
  assert.match(sql, /update public\.employer_profiles/, 'existing live adverts grant it too')
  assert.match(sql, /is_live = true/)
  assert.match(sql, /expires_at > now\(\)/, 'and only ones that have not lapsed')
})
