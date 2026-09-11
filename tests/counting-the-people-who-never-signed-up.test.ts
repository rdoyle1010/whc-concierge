import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deviceFrom, looksLikeBot, visitorHash } from '../src/app/api/track-visit/route'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const SALT = 'a-secret'

// Every number on this platform describes somebody who registered. The most
// useful number at launch is the other one.
test('the same person is one visitor today and a stranger tomorrow', () => {
  const parts = { ip: '81.2.3.4', agent: 'Mozilla/5.0 Safari', salt: SALT }
  const today = visitorHash({ ...parts, day: '2026-09-11' })
  const again = visitorHash({ ...parts, day: '2026-09-11' })
  const tomorrow = visitorHash({ ...parts, day: '2026-09-12' })

  assert.equal(today, again, 'the same visit twice in a day is one person')
  assert.notEqual(today, tomorrow, 'a hash that survives the night is a tracking identifier')

  // Two different people on the same day are two people.
  assert.notEqual(today, visitorHash({ ...parts, ip: '81.2.3.5', day: '2026-09-11' }))
  // And the salt is doing work: without it the hash is a lookup table away
  // from being an address.
  assert.notEqual(today, visitorHash({ ...parts, day: '2026-09-11', salt: 'different' }))
  assert.doesNotMatch(today, /81\.2\.3\.4/)
})

test('a crawler is not a person looking at the website', () => {
  for (const agent of ['Googlebot/2.1', 'curl/8.4.0', 'python-requests/2.31', 'HeadlessChrome/120', '']) {
    assert.equal(looksLikeBot(agent), true, `${agent || 'an empty agent'} should not be counted`)
  }
  assert.equal(looksLikeBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Safari'), false)
  assert.equal(looksLikeBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120 Safari'), false)
})

test('what they were on is read from the browser, not guessed', () => {
  assert.equal(deviceFrom('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari'), 'mobile')
  assert.equal(deviceFrom('Mozilla/5.0 (Linux; Android 14) AppleWebKit Chrome Mobile Safari'), 'mobile')
  assert.equal(deviceFrom('Mozilla/5.0 (iPad; CPU OS 17_0) Safari'), 'tablet')
  assert.equal(deviceFrom('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'), 'desktop')
})

// The cookie banner has a Decline button. If visit counting needed a cookie,
// that button would have to switch it off - and it does not, because there is
// nothing on the visitor's device to decline.
test('counting visitors sets nothing on anybody s device', () => {
  const route = body('src/app/api/track-visit/route.ts')
  assert.doesNotMatch(route, /cookies\(\)|setCookie|Set-Cookie/, 'a cookie here would make the Decline button a lie')
  const beacon = body('src/components/TrackVisit.tsx')
  assert.doesNotMatch(beacon, /localStorage|document\.cookie/)
})

// A referring URL can carry somebody's search terms; the host is the whole of
// the useful part.
test('only the referring host is kept, and never the query string', () => {
  const route = body('src/app/api/track-visit/route.ts')
  assert.match(route, /url\.host/)
  assert.doesNotMatch(route, /referrer_host: body\.referrer/)
  // The path is stored without its query string for the same reason: a reset
  // link carries its token there.
  assert.match(route, /body\.path\.split\('\?'\)\[0\]/)
})

// A failed beacon must never surface anything to somebody reading a page.
test('a blocked or broken beacon is silence, not an error', () => {
  const route = body('src/app/api/track-visit/route.ts')
  const handler = route.slice(route.indexOf('export async function POST'))
  const returns = handler.match(/return [^\n]+/g) || []
  assert.ok(returns.length >= 4, `expected several ways out, found ${returns.length}`)
  for (const line of returns) {
    assert.match(line, /return noContent\(\)/, `a way out of this route that is not silent: ${line}`)
  }
  assert.doesNotMatch(route, /status: 4\d\d|status: 5\d\d/, 'this route has no failure to report')
  assert.match(route, /catch \{\s*return noContent\(\)/)
})

// Admin pages and API calls are not visitor interest, and a magic link's page
// is not either.
test('the count is of the public website', () => {
  const route = body('src/app/api/track-visit/route.ts')
  assert.match(route, /path\.startsWith\('\/admin'\)/)
  assert.match(route, /path\.startsWith\('\/api\/'\)/)
  // And of people. A crawler filter that exists but is never called is a
  // filter that counts Googlebot as a hotel director.
  const handler = route.slice(route.indexOf('export async function POST'))
  assert.match(handler, /if \(looksLikeBot\(agent\)\) return noContent\(\)/)
})

// The table arrives with a migration she has to run. Until it does, the
// screen has to say so rather than showing zeroes.
test('before the migration runs, the screen says so rather than reading nobody came', () => {
  const api = body('src/app/api/admin/visitors/route.ts')
  assert.match(api, /unavailable: true/)
  const page = body('src/app/admin/visitors/page.tsx')
  assert.match(page, /stats\?\.unavailable/)
  assert.match(page, /not switched on yet/)
})

test('the visits table collapses a refresh rather than counting it again', () => {
  const migration = read('supabase/migrations/20260911120000_who_is_actually_looking.sql')
  assert.match(migration, /create unique index if not exists site_visits_unique_idx/)
  assert.match(migration, /on public\.site_visits\(day, visitor_hash, path\)/)
  // Nobody but the service role reads it.
  assert.match(migration, /revoke all on table public\.site_visits from anon, authenticated/)
  assert.match(migration, /enable row level security/)

  const route = body('src/app/api/track-visit/route.ts')
  assert.match(route, /onConflict: 'day,visitor_hash,path', ignoreDuplicates: true/)
})

// This fires on every page a visitor opens. An auth round trip in front of a
// number that only needs to be roughly right is the kind of thing that makes
// a website feel slow for no return at all.
test('the beacon does not ask Supabase who the visitor is', () => {
  const route = body('src/app/api/track-visit/route.ts')
  assert.doesNotMatch(route, /getRequestUser|auth\.getUser/)
  assert.match(route, /cookie\.name\.startsWith\('sb-'\)/)
  assert.match(route, /signed_in: signedIn/)
})
