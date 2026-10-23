import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const FORM = 'src/app/employer/post-role/page.tsx'
const ROUTE = 'src/app/api/employer/jobs/create/route.ts'

/** The fields the form actually puts in its payload. */
function fieldsSentByForm(): string[] {
  const source = read(FORM)
  const start = source.indexOf('const payload=()=>({')
  assert.ok(start !== -1, 'the post-a-role form must build a payload')
  const body = source.slice(start, source.indexOf('\n', start))
  // Only a key at the start of a property, after '{' or ','. Matching every
  // identifier before a colon also catches the middle of a ternary, so
  // `required_brands: x.required_product_houses.length ? y : null` reads as a
  // field named required_product_houses that the route is failing to accept.
  return Array.from(new Set((body.match(/[{,]\s*([a-z_][a-z0-9_]*)\s*:/gi) || [])
    .map(match => match.replace(/^[{,]\s*/, '').replace(/\s*:$/, ''))))
}

/** The fields the create route is willing to accept. */
function fieldsAcceptedByRoute(): Set<string> {
  const source = read(ROUTE)
  const start = source.indexOf('const ALLOWED_FIELDS')
  const list = source.slice(start, source.indexOf('] as const', start))
  const named = (list.match(/'([a-z_][a-z0-9_]*)'/g) || []).map(item => item.slice(1, -1))
  // STORY_FIELDS is spread into the list, so its members count as accepted.
  const storyStart = source.indexOf('const STORY_FIELDS')
  const story = storyStart === -1 ? [] : (source
    .slice(storyStart, source.indexOf(']', storyStart))
    .match(/'([a-z_][a-z0-9_]*)'/g) || []).map(item => item.slice(1, -1))
  return new Set([...named, ...story])
}

// Twice in one day the same shape of bug: the form collects a field, the
// allowlist omits it, the value is dropped in silence, and the failure
// surfaces somewhere far away - as a database constraint error for sector_id,
// and as a Hong Kong role quietly advertised as British for country_code.
//
// An allowlist is the right pattern. What it needs is something checking that
// it actually lists what the form sends, because a missing entry looks exactly
// like a field that was never filled in.
test('every field the post-a-role form sends is accepted by the route', () => {
  const accepted = fieldsAcceptedByRoute()
  // Set on the server from the session, never taken from the request.
  const serverOwned = new Set(['employer_id', 'tier'])
  const dropped = fieldsSentByForm().filter(field => !accepted.has(field) && !serverOwned.has(field))
  assert.deepEqual(dropped, [], 'these are collected from the property and then thrown away before the insert')
})

// sector_id is NOT NULL on job_listings, so dropping it did not degrade the
// listing - it made posting a role impossible, for everybody, with an error
// naming a column nobody outside the codebase has heard of.
test('a role cannot be posted without the sector the database demands', () => {
  const route = read(ROUTE)
  assert.match(route, /'sector_id'/, 'the sector must survive the allowlist')
  assert.match(route, /payload\.sector_id/, 'and be checked before the database sees it')
  assert.match(route, /Choose the door and sector this role sits in before posting it/,
    'the message has to name the thing to do, not the column that failed')
})

// The form hid the door and sector pickers entirely when the taxonomy did not
// load, and skipped the requirement with them - so a required field became an
// invisible one, and the insert failed on a constraint the person posting
// could do nothing about.
test('a missing sector list blocks posting rather than hiding the field', () => {
  const form = read(FORM)
  // The requirement is unconditional now.
  assert.ok(!/if\(doors\.length&&!sectorId\)/.test(form),
    'the sector requirement must not be waived when the list fails to load')
  assert.match(form, /if\(!sectorId\)/)
  assert.match(form, /The sector list could not be loaded/,
    'and says so, instead of failing at the database')
  assert.match(form, /doors\.length===0&&/, 'an empty list is visible on the page')
})

// A five-minute cache of an empty taxonomy turns a momentary blip into five
// minutes during which nobody can post a role.
test('an empty or failed taxonomy is never cached', () => {
  const route = read('src/app/api/sectors/route.ts')
  assert.match(route, /unavailable: true/, 'a failed read is distinguishable from an empty one')
  assert.match(route, /status: 503/)
  assert.match(route, /'no-store'/)
  assert.match(route, /\(doors \|\| \[\]\)\.length/, 'only a taxonomy with doors in it may be cached')
})
