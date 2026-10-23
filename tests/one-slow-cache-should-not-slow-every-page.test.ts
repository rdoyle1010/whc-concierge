import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// A route's revalidate is the LOWEST of every cached read in its render. Two
// of these are read in the root layout, so whatever number they carry becomes
// the revalidate of every static page on the site. platform-access was on
// thirty seconds, which meant the whole site re-rendered against the database
// twice a minute and pages that had asked for an hour were ignored.
//
// Nothing is lost by the longer windows: both caches are tagged, and the admin
// routes revalidate those tags the moment the value is written, so a change
// still lands immediately.
const ROOT_LAYOUT_CACHES = [
  { file: 'src/lib/platform-access.ts', tag: 'platform-access' },
  { file: 'src/lib/site-content-server.ts', tag: 'website-content' },
]

test('nothing read in the root layout holds the whole site to a short window', () => {
  for (const cache of ROOT_LAYOUT_CACHES) {
    const source = read(cache.file)
    const match = source.match(/\{ revalidate: (\d+), tags: \['([^']+)'\] \}/)
      || source.match(/\{ revalidate: (\d+), tags: \['([^']+)'\] \}/m)
    assert.ok(match, `${cache.file} must declare a revalidate and a tag`)
    assert.equal(match![2], cache.tag)
    assert.ok(Number(match![1]) >= 3600, `${cache.file} is at ${match![1]}s and would pin every page to it`)
  }
})

test('the tag is what makes a change land, so it has to be revalidated', () => {
  const admin = read('src/app/api/admin/content/route.ts')
  for (const cache of ROOT_LAYOUT_CACHES) {
    assert.match(admin, new RegExp(`revalidateTag\\('${cache.tag}'`), `${cache.tag} must be revalidated on write`)
  }
})

// A newly published advert must reach the public quickly. That was true when
// this file was written and it is still the rule; what has changed is what
// guarantees it.
//
// The guarantee used to be a five-minute ceiling on the root layout, because
// nothing dropped the jobs pages when a role went live, so the only way to make
// one appear was to wait. That ceiling applied to every static page on the site
// - Next takes the lowest revalidate in a segment chain - so the whole site
// re-rendered against the database every five minutes, and on a quiet site that
// is a cold render for most visitors.
//
// The guarantee is now invalidation: every path that puts a role on the market
// calls triggerJobAlerts, which drops the jobs tag first thing. So the window
// may be long, and an advert still appears at once.
//
// The rule this test holds is therefore the promise, not the number: a long
// window is allowed only while that invalidation exists. Delete the drop and
// this fails, which is the point.
test('a new advert reaches the public without waiting for a window', () => {
  const layout = read('src/app/layout.tsx')
  const match = layout.match(/export const revalidate = (\d+)/)
  assert.ok(match, 'the root layout must declare a revalidate')

  if (Number(match[1]) <= 300) return // a short ceiling is its own guarantee

  const trigger = read('src/lib/job-alerts-trigger.ts')
  assert.match(trigger, /revalidatePublic\(PUBLIC_CACHE_TAGS\.jobs\)/,
    `the root layout is at ${match[1]}s, so a published role only appears when publishing drops the jobs cache - and nothing does`)

  // Above the early return, or a deployment without the alert secret publishes
  // a role that nobody sees until the window expires.
  const secretCall = trigger.indexOf('getInternalApiSecret()')
  assert.ok(secretCall > 0)
  assert.match(trigger.slice(0, secretCall), /revalidatePublic/,
    'the drop must not sit behind a condition that can skip it')

  // And taking one down, which matters more than putting one up.
  const status = read('src/app/api/employer/jobs/status/route.ts')
  assert.match(status, /revalidatePublic\(PUBLIC_CACHE_TAGS\.jobs\)/,
    'a filled or closed role must come off the board without waiting either')
})
