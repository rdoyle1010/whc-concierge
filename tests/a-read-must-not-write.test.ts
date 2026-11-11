import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Two rules, both learned from the same audit.
//
// The first: a maintenance route must not do its work on a GET. Seeding,
// migrating and repairing all used to answer GET, which means a browser
// prefetch, a link in a history dropdown or an over-eager extension could fire
// them. src/proxy.ts does block those paths, so none of it was reachable - but
// that list is one array, and the only thing between it and a mass write was
// the verb. /api/fix-null-live was the sharpest case: a GET that set is_live
// true on every job where it was null, i.e. published the lot. It has been
// deleted; the rest are POST.
//
// The second: a page that declares itself canonical must be in the sitemap.
// /platform shipped with a title, a description and a canonical, and nothing
// pointed a crawler at it, so the page written to be sent to an operator
// before a conversation was invisible to search.

const root = process.cwd()

function routeFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) routeFiles(path, found)
    else if (entry.name === 'route.ts') found.push(path)
  }
  return found
}

const WRITES = /\.(insert|update|upsert|delete)\(/
const MAINTENANCE = /\/api\/(seed|run-migration|fix-)[^/]*\//

test('a seed, migration or repair route does not write on a GET', () => {
  const offenders: string[] = []
  for (const file of routeFiles(join(root, 'src/app/api'))) {
    const path = file.replace(`${root}/`, '').replaceAll('\\', '/')
    if (!MAINTENANCE.test(`/${path.replace('src/app/', '')}`)) continue
    const source = readFileSync(file, 'utf8')
    if (/export async function GET/.test(source) && WRITES.test(source)) offenders.push(path)
  }
  assert.deepEqual(offenders, [])
})

test('the route that published every job on a GET is gone', () => {
  assert.equal(existsSync(join(root, 'src/app/api/fix-null-live/route.ts')), false)
})

test('demonstration data is seeded from a script, not an endpoint the proxy blocks', () => {
  // The seed route sat behind BLOCKED_API_ROUTES, so it answered 404 and could
  // never have run. Whoever restores it should know that before they rely on it.
  assert.equal(existsSync(join(root, 'src/app/api/seed/route.ts')), false)
  assert.equal(existsSync(join(root, 'scripts/seed-demo.ts')), true)
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts['seed:demo'], 'tsx scripts/seed-demo.ts')
  assert.equal(pkg.scripts['seed:demo:clear'], 'tsx scripts/seed-demo.ts --clear')
})

test('every page that declares a canonical is in the sitemap', () => {
  const sitemap = readFileSync(join(root, 'src/app/sitemap.ts'), 'utf8')
  const listed = new Set(['/', ...[...sitemap.matchAll(/\$\{BASE\}(\/[a-z0-9\-/]*)/g)].map(m => m[1])])

  // The one deliberate absence, and the sitemap says why in its own comment:
  // /agency renders a signed-in search tool or a skeleton depending on who is
  // asking, so /agency/about is the page offered to search instead.
  const deliberate = new Set(['/agency'])

  const pages: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name === 'page.tsx' || entry.name === 'layout.tsx') pages.push(path)
    }
  }
  walk(join(root, 'src/app'))

  const missing: string[] = []
  for (const file of pages) {
    const canonical = /canonical:\s*'https:\/\/talenthousecollective\.co\.uk(\/[a-z0-9\-/]*)?'/
      .exec(readFileSync(file, 'utf8'))
    if (!canonical) continue
    const route = canonical[1] || '/'
    if (!listed.has(route) && !deliberate.has(route)) missing.push(route)
  }
  assert.deepEqual(missing, [])
})
