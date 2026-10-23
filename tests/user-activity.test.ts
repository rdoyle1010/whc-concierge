import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// auth.users.last_sign_in_at was the only engagement signal there was, and it
// answers a different question badly: a session lasts weeks, so somebody who
// signed in once in July and has used the platform every day since still reads
// as a single visit in July.
test('there is a record of use, not only of signing in', () => {
  const sql = read('supabase/migrations/20260903130000_user_activity.sql')
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_activity/)
  assert.match(sql, /PRIMARY KEY \(user_id, day\)/, 'one row per person per day')
  assert.match(read('src/components/DashboardShell.tsx'), /\/api\/activity\/ping/, 'and something that writes it')
})

// A laptop left running overnight is not eight hours of engagement. A number
// that says it is gets trusted once and never again.
test('time on the platform is use, not a tab left open', () => {
  const sql = read('supabase/migrations/20260903130000_user_activity.sql')
  assert.match(sql, /buckets smallint\[\]/, 'distinct blocks, not a wall clock')
  assert.match(sql, /WHEN p_bucket = ANY \(public\.user_activity\.buckets\)/, 'a repeat visit in the same block counts once')

  const shell = read('src/components/DashboardShell.tsx')
  assert.match(shell, /document\.visibilityState !== 'visible'/, 'a background tab is not somebody using the platform')

  const api = read('src/app/api/admin/activity/route.ts')
  assert.match(api, /BUCKET_MINUTES/, 'minutes are derived from the blocks, not from first-to-last')
})

// Read-modify-write from the application loses buckets whenever two tabs ping
// at once, and somebody with the dashboard open twice is the normal case.
test('a heartbeat is one statement, so two tabs cannot lose each other', () => {
  const sql = read('supabase/migrations/20260903130000_user_activity.sql')
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.record_activity/)
  assert.match(sql, /ON CONFLICT \(user_id, day\) DO UPDATE/)
  assert.match(read('src/app/api/activity/ping/route.ts'), /rpc\('record_activity'/)
})

// A per-page trail of your own members is surveillance dressed up as
// analytics, and it is the first thing a subject access request asks for.
test('what somebody was reading is not recorded', () => {
  const sql = read('supabase/migrations/20260903130000_user_activity.sql')
  for (const column of ['path', 'url', 'page_url', 'referrer']) {
    assert.ok(!new RegExp(`\\b${column}\\b`).test(sql), `user_activity must not store ${column}`)
  }
  const ping = read('src/app/api/activity/ping/route.ts')
  assert.ok(!/pathname|req\.headers\.get\('referer'\)/.test(ping), 'the heartbeat must not carry a page')
  assert.match(ping, /surveillance/, 'and the reason is written down where the next person will read it')
})

// A device with a wrong clock must not be able to invent a working day.
test('the clock is the server, not the browser', () => {
  const ping = read('src/app/api/activity/ping/route.ts')
  const bucket = ping.slice(ping.indexOf('const now = new Date()'))
  assert.match(bucket.slice(0, 400), /Europe\/London/, 'counted in UK time')
  assert.ok(!/body\?\.bucket|body\.minute/.test(ping), 'the bucket is never taken from the request')
})

// A failed heartbeat must not put a red banner in front of somebody trying to
// work, and the table arrives with a migration that may not have run yet.
test('activity never breaks the page it is measuring', () => {
  const ping = read('src/app/api/activity/ping/route.ts')
  assert.ok(!/status: 5\d\d/.test(ping), 'the heartbeat never returns an error worth acting on')
  assert.match(read('src/app/admin/activity/page.tsx'), /has not been created yet/,
    'an empty list before the migration would read as "nobody has ever used this"')
  assert.match(read('src/components/DashboardShell.tsx'), /admin\/activity/, 'and the screen is reachable')
})

test('the admin view separates talent, hotels and consultancy', () => {
  const api = read('src/app/api/admin/activity/route.ts')
  for (const workspace of ['talent', 'employer', 'consultant']) {
    assert.ok(api.includes(`person.role === '${workspace}'`), `${workspace} must be counted separately`)
  }
  assert.match(api, /adminRequestUser/, 'admin only')
  assert.match(api, /b\.minutes - a\.minutes/, 'busiest first, which is the question being asked')
})
