import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PUBLIC_CACHE_TAGS } from '../src/lib/public-cache'

// Why the site was slow, and the rule that keeps it fast without going stale.
//
// Nearly every public page was set to `revalidate = 60`. That is not a caching
// policy, it is an apology for not having one: nothing dropped a cached page
// when its content changed, so the window had to be short enough that a new
// advert appeared within a minute. On a busy site nobody notices. On a quiet
// one it means the cache is stale on practically every visit, and the person
// who notices hardest is the owner, because she is the one reloading a page she
// has just changed.
//
// The windows are now an hour and an edit drops the cache. That trade is only
// safe in one direction: if a page caches for an hour and nothing can drop it,
// a published change is invisible for an hour, which is far worse than a slow
// page. So the rule this file holds is a pairing, not a number.

const APP = join(process.cwd(), 'src/app')
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) => read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

// The public pages whose content comes from the database and changes when
// somebody edits it. Marketing pages whose copy lives in the repository are not
// here: a deploy is their invalidation.
// /brands/[slug] is deliberately absent. It reads the session to decide what to
// hide, so it must stay dynamic: a cached copy would be one member's unlocked
// view served to everybody. Its brand row is cached and tagged all the same,
// because that part is identical for every reader.
const CACHED_ON_DATA: Array<{ page: string; reads: string; tag: string }> = [
  { page: 'src/app/page.tsx', reads: 'src/app/page.tsx', tag: PUBLIC_CACHE_TAGS.jobs },
  { page: 'src/app/jobs/page.tsx', reads: 'src/lib/public-roles-server.ts', tag: PUBLIC_CACHE_TAGS.jobs },
  { page: 'src/app/roles/page.tsx', reads: 'src/lib/public-roles-server.ts', tag: PUBLIC_CACHE_TAGS.jobs },
  { page: 'src/app/properties/page.tsx', reads: 'src/app/properties/page.tsx', tag: PUBLIC_CACHE_TAGS.properties },
  { page: 'src/app/properties/[id]/page.tsx', reads: 'src/app/properties/[id]/page.tsx', tag: PUBLIC_CACHE_TAGS.properties },
  { page: 'src/app/brands/page.tsx', reads: 'src/app/brands/page.tsx', tag: PUBLIC_CACHE_TAGS.brands },
  { page: 'src/app/blog/page.tsx', reads: 'src/app/blog/[slug]/page.tsx', tag: PUBLIC_CACHE_TAGS.blog },
  { page: 'src/app/blog/[slug]/page.tsx', reads: 'src/app/blog/[slug]/page.tsx', tag: PUBLIC_CACHE_TAGS.blog },
]

test('a page cached for a long time reads through a tagged cache', () => {
  // revalidateTag only reaches pages that rendered from tagged cached data.
  // A page with a long window and an untagged read cannot be dropped at all, so
  // an edit waits out the whole window. Confirmed against
  // node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md:
  // "revalidateTag invalidates data with specific tags across all pages that
  // use those tags."
  for (const { page, reads, tag } of CACHED_ON_DATA) {
    const window = body(page).match(/export const revalidate = (\d+)/)
    assert.ok(window, `${page} should declare a revalidate window`)
    const seconds = Number(window[1])
    if (seconds <= 120) continue // a short window is its own invalidation

    const source = body(reads)
    assert.match(source, /unstable_cache\(/,
      `${page} caches for ${seconds}s but ${reads} reads the database untagged, so an edit waits ${Math.round(seconds / 60)} minutes`)

    // Inside a `tags: [...]` option, not merely somewhere in the file. The
    // first version of this checked the whole source, and the cache KEY for
    // /properties is 'public-properties-v4' - which contains the tag name. So
    // deleting the tag left the check passing, which is the failure mode this
    // whole file exists to prevent, reproduced in the check itself.
    const name = Object.entries(PUBLIC_CACHE_TAGS).find(([, v]) => v === tag)![0]
    const tagged = [...source.matchAll(/tags:\s*\[([^\]]*)\]/g)].some(m =>
      m[1].includes(`PUBLIC_CACHE_TAGS.${name}`) || m[1].includes(`'${tag}'`))
    assert.ok(tagged,
      `${page} caches for ${seconds}s and its read carries no '${tag}' tag, so nothing can drop it`)
  }
})

test('every tag something caches under is dropped somewhere', () => {
  // A tag that is only ever written is decoration. This walks the whole of src
  // rather than naming the write paths, because the failure mode is somebody
  // adding a cached read and no invalidation, which naming files would hide.
  const all = sourceFiles(join(process.cwd(), 'src')).map(f => readFileSync(f, 'utf8')).join('\n')
  for (const [name, tag] of Object.entries(PUBLIC_CACHE_TAGS)) {
    const readsIt = new RegExp(`tags: \\[[^\\]]*PUBLIC_CACHE_TAGS\\.${name}`).test(all)
    if (!readsIt) continue
    const dropsIt = new RegExp(`revalidatePublic\\([^)]*PUBLIC_CACHE_TAGS\\.${name}`).test(all)
    assert.ok(dropsIt, `something caches under '${tag}' and nothing ever drops it, so that content goes stale for the whole window`)
  }
})

test('publishing a role drops the pages that show roles', () => {
  // Every path that puts a role on the market calls triggerJobAlerts - there is
  // a readiness check that enforces exactly that - so the invalidation lives
  // there and cannot be forgotten by a new publish path.
  const trigger = body('src/lib/job-alerts-trigger.ts')
  assert.match(trigger, /revalidatePublic\(PUBLIC_CACHE_TAGS\.jobs\)/)

  // Above the secret check, or a deployment with no alert secret publishes a
  // role that stays invisible for the whole window. Sliced at the call rather
  // than at the import, which is at the top of the file and made this pass on
  // an empty string.
  const secretCall = trigger.indexOf('getInternalApiSecret()')
  assert.ok(secretCall > 0, 'the secret check should still be here')
  assert.match(trigger.slice(0, secretCall), /revalidatePublic\(PUBLIC_CACHE_TAGS\.jobs\)/,
    'the cache drop must not sit behind the early return when no secret is set')
})

test('taking a role down is immediate, not eventual', () => {
  // Putting a role up late is a delay. Taking one down late means applications
  // to something that is already filled, so this one matters more.
  const status = body('src/app/api/employer/jobs/status/route.ts')
  const drops = (status.match(/revalidatePublic\(/g) || []).length
  assert.ok(drops >= 3, `filled, closed, reopened and deleted should each drop the cache; found ${drops}`)
})

test('approving a property shows it at once', () => {
  assert.match(body('src/app/api/admin/users/route.ts'), /revalidatePublic\([^)]*PUBLIC_CACHE_TAGS\.properties/)
})

test('an invalidation can never fail the write that caused it', () => {
  // A failed drop means a page is stale for a while. A thrown one would mean
  // the job advert that triggered it reports failure, which is a lost sale.
  const lib = body('src/lib/public-cache.ts')
  assert.match(lib, /try \{[\s\S]*?revalidateTag[\s\S]*?\} catch/,
    'revalidatePublic must swallow its own errors')
})

test('nothing public is still on a one-minute window', () => {
  // The number this whole change was about. A public page on sixty seconds is
  // one that will be re-rendered from scratch for almost every visitor.
  const offenders: string[] = []
  for (const file of sourceFiles(APP)) {
    const rel = file.slice(process.cwd().length + 1)
    if (/\/(talent|employer|admin|hotel|api)\//.test(rel)) continue
    const m = body(rel).match(/export const revalidate = (\d+)/)
    if (m && Number(m[1]) > 0 && Number(m[1]) <= 60) offenders.push(`${rel} (${m[1]}s)`)
  }
  assert.deepEqual(offenders, [],
    `these re-render for nearly every visitor on a quiet site:\n${offenders.join('\n')}`)
})

test('a public page does not read cookies it has no use for', () => {
  // Reading cookies makes a page dynamic. /blog/[slug] used the cookie-aware
  // Supabase client purely to query a public table, so its revalidate setting
  // did nothing and every visit re-rendered the article - a slow page and a
  // setting that lied about it, which is the worse half.
  //
  // The opposite mistake is worse still and is guarded elsewhere: /brands/[slug]
  // genuinely reads the session to decide what to hide, and caching that page
  // would serve one member's unlocked view to the public.
  for (const page of ['src/app/blog/[slug]/page.tsx', 'src/app/jobs/[id]/page.tsx', 'src/app/properties/[id]/page.tsx']) {
    const source = body(page)
    if (!/export const revalidate = (\d+)/.test(source)) continue
    assert.doesNotMatch(source, /createServerSupabaseClient|cookies\(\)/,
      `${page} declares a revalidate window and then reads cookies, which makes the window a dead setting`)
  }
})

test('an invalidation takes effect on the next request, not the one after', () => {
  // The bug this file failed to prevent, the first time it mattered.
  //
  // revalidateTag takes a second argument that decides what "invalid" means,
  // and the difference is invisible at the call site. 'max' marks the tag stale
  // and serves stale-while-revalidate: the NEXT visitor still gets the old page
  // while a fresh one is built behind them. That is right for a cache warming
  // up and wrong for every reason this function is called.
  //
  // A property closed a role, went to look at the board, and the advert was
  // still on it - because "serve the stale copy once more" is precisely what it
  // had just asked us to stop doing. Putting a role up late is a delay. Taking
  // one down late means applications to a role that is already filled.
  //
  // { expire: 0 } expires it immediately, so the next request waits for fresh
  // data. That costs one visitor one render, once, after a change somebody made
  // deliberately.
  const lib = body('src/lib/public-cache.ts')
  assert.match(lib, /revalidateTag\(tag, \{ expire: 0 \}\)/,
    'invalidation must expire immediately, not serve one more stale response')
  assert.doesNotMatch(lib, /revalidateTag\([^)]*'max'\)/,
    "'max' is stale-while-revalidate: the visitor who prompted the change still sees the old page")

  // updateTag() is the documented way to get this, and cannot be used here: it
  // throws outside a Server Action and every caller of this is a route handler.
  // If that ever changes, this comment is the reason it was not used.
  assert.doesNotMatch(lib, /updateTag/)
})

test('every way of taking a role down drops the cache', () => {
  // Closed, filled and deleted all take an advert off the public board, and all
  // three go through this one route. A role that is down must be down.
  const status = body('src/app/api/employer/jobs/status/route.ts')
  for (const action of ["'reopen'", "'delete'", "action === 'filled'"]) {
    assert.ok(status.includes(action), `the status route should still handle ${action}`)
  }
  const drops = (status.match(/revalidatePublic\(PUBLIC_CACHE_TAGS\.jobs\)/g) || []).length
  assert.ok(drops >= 3, `each takedown path must drop the cache; found ${drops}`)

  // And the screen an employer actually presses must reach this route, or none
  // of the above runs at all.
  const screen = body('src/app/employer/jobs/page.tsx')
  assert.match(screen, /\/api\/employer\/jobs\/status/,
    'the employer jobs screen must take roles down through the route that drops the cache')
})
