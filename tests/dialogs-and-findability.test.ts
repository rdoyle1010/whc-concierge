import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const APP = new URL('../src/app/', import.meta.url).pathname
const COMPONENTS = new URL('../src/components/', import.meta.url).pathname
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (entry.endsWith('.tsx')) files.push(full)
  }
  return files
}

const sources = [...walk(APP), ...walk(COMPONENTS)].map(path => ({
  path: path.replace(new URL('../', import.meta.url).pathname, ''),
  text: readFileSync(path, 'utf8'),
}))

// A backdrop that is not a modal: the mobile navigation drawer in the
// dashboard shell is a menu, not a dialog, and closes by navigating.
const NOT_MODALS = new Set(['src/components/DashboardShell.tsx'])

// Twenty-five hand-rolled overlays, none of them announced as a dialog, none
// trapping focus, one with an Escape handler. Every one of them was a dead end
// for anybody navigating by keyboard: Tab walked off behind the panel into the
// page underneath and there was no way back out.
test('every modal overlay behaves like a dialog', () => {
  const offenders = sources
    .filter(file => file.text.includes('fixed inset-0'))
    .filter(file => !NOT_MODALS.has(file.path))
    .filter(file => !file.text.includes('useDialog'))
    .map(file => file.path)
  assert.deepEqual(offenders, [], 'these overlays still open with no way out')
})

test('a dialog is labelled by something, so a screen reader can announce it', () => {
  for (const file of sources.filter(f => f.text.includes('useDialog('))) {
    for (const call of file.text.match(/useDialog\([\s\S]{0,220}?\)\n/g) ?? []) {
      assert.ok(
        /'[a-z0-9-]+-heading'/.test(call) || /label:/.test(call),
        `${file.path} opens a dialog with no accessible name: ${call.trim()}`,
      )
    }
  }
})

// A drawer that opens a confirmation on top of itself is the normal admin
// shape. One Escape press used to close both, so the person dismissing a
// confirmation lost the record behind it.
test('escape closes the dialog on top, not the one underneath', () => {
  const hook = read('src/components/useDialog.ts')
  assert.ok(hook.includes('const stack'), 'nested dialogs need a stack, not a guard at each site')
  assert.ok(hook.includes('isTopmost'), 'only the topmost dialog may react to a key press')
  assert.ok(
    hook.includes('if (stack.length === 0) document.body.style.overflow'),
    'the last dialog out unlocks the page, not the first',
  )
  // The alternative - disabling the dialog underneath - re-runs its effect on
  // close and drags focus to its first field instead of returning it.
  for (const path of ['src/app/admin/users/page.tsx', 'src/app/admin/campaigns/page.tsx']) {
    assert.ok(
      !/enabled:[^}]*&&\s*!show/.test(read(path)),
      `${path} must not disable the dialog underneath`,
    )
  }
})

// There was a generated robots route and a static public/robots.txt. In the
// App Router the static file wins silently, so the reviewed rules were the
// ones nobody was serving.
test('there is exactly one robots source', () => {
  let staticFileExists = true
  try {
    read('public/robots.txt')
  } catch {
    staticFileExists = false
  }
  assert.equal(staticFileExists, false, 'public/robots.txt shadows the generated route')
  const robots = read('src/app/robots.ts')
  assert.ok(robots.includes('sitemap:'), 'robots must point at the sitemap')
  for (const path of ['/admin/', '/talent/', '/employer/', '/api/']) {
    assert.ok(robots.includes(path), `${path} must not be crawled`)
  }
})

// The sitemap listed fourteen static pages and the blog. Every role and every
// property - the only pages on this platform anybody searches for by name -
// was absent, so none of them was ever submitted for indexing.
test('the sitemap lists the pages that earn the traffic', () => {
  const sitemap = read('src/app/sitemap.ts')
  assert.ok(sitemap.includes("from('job_listings')"), 'live roles must be listed')
  assert.ok(sitemap.includes("from('employer_profiles')"), 'approved properties must be listed')
  assert.ok(sitemap.includes("from('blog_posts')"))
  // The filter must match what the role page itself enforces, or the sitemap
  // advertises URLs that answer with a 404.
  assert.ok(sitemap.includes("eq('is_live', true)"))
  assert.ok(sitemap.includes("eq('status', 'active')"))
  assert.ok(sitemap.includes('expires_at'), 'a closed role must drop out')
  assert.ok(sitemap.includes("eq('approval_status', 'approved')"))
  assert.ok(sitemap.includes('export const revalidate'), 'a sitemap built once at deploy goes stale')

  // Pages that existed and were never pointed at.
  for (const path of ['/roles', '/academy', '/intelligence', '/advertise', '/faq', '/how-to-use']) {
    assert.ok(sitemap.includes(`${path}\``), `${path} is live and must be listed`)
  }
})

test('the indexes the commonest queries need exist', () => {
  const sql = read('supabase/migrations/20260901230000_query_indexes.sql')
  for (const expected of [
    'candidate_profiles (user_id)',
    'employer_profiles (user_id)',
    'job_listings (is_live, status, posted_date DESC)',
    'applications (candidate_id, status, created_at DESC)',
    'agency_bookings (candidate_id, status)',
    'messages (recipient_id, created_at DESC)',
    'notifications (user_id, created_at DESC)',
  ]) {
    assert.ok(sql.includes(expected), `missing index on ${expected}`)
  }
  const statements = sql.match(/CREATE INDEX/g) ?? []
  const guarded = sql.match(/CREATE INDEX IF NOT EXISTS/g) ?? []
  assert.equal(
    statements.length,
    guarded.length,
    'every index must be IF NOT EXISTS, so the migration is safe against what is already live',
  )
})

// A box that only says "Search..." makes you guess what it will match, and the
// wrong guess reads as no results rather than as the wrong query.
test('every search box says what it searches', () => {
  const bare: string[] = []
  for (const file of walk(APP).concat(walk(COMPONENTS))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/placeholder="(Search[^"]*)"/g)) {
      const hint = match[1].replace(/[.\s]+$/, '')
      if (hint.toLowerCase() === 'search') bare.push(`${file.split('/src/')[1]}: "${match[1]}"`)
    }
  }
  assert.deepEqual(bare, [], 'a search placeholder has to name what it matches')
})

// Talent and properties are different decisions - a property is a customer, a
// professional is the product - and interleaved by signup date they were
// impossible to tell apart at a glance.
test('the admin user list keeps talent and properties apart', () => {
  const page = read('src/app/admin/users/page.tsx')
  assert.match(page, /lg:grid-cols-2/, 'the two audiences sit side by side')
  assert.match(page, />Talent</, 'the talent column is labelled')
  assert.match(page, /Hotels &amp; employers/, 'the property column is labelled')
  // Separate paging: one shared page number would scroll both columns at once
  // and hide whichever list is longer.
  for (const state of ['talentPage', 'hotelPage']) {
    assert.ok(page.includes(state), `${state} must exist so each column pages on its own`)
  }
})
