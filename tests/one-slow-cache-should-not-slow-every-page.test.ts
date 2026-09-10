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

// Five minutes, not an hour. A newly published advert appearing on /roles an
// hour later is not acceptable on a jobs board, and those list pages inherit
// this number rather than declaring their own.
test('the root layout stays short enough for a jobs board', () => {
  const layout = read('src/app/layout.tsx')
  const match = layout.match(/export const revalidate = (\d+)/)
  assert.ok(match, 'the root layout must declare a revalidate')
  assert.ok(Number(match[1]) <= 300, 'a new advert must not wait longer than five minutes to appear')
})
