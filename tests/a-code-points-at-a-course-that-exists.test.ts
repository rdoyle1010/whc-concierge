import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Picking a course, rather than typing its name and hoping.
//
// A code could always name its own courses. The screen asked for them as slugs
// in a textarea, one per line, which meant knowing that The Perfect
// Consultation is spelled consultation-excellence and typing it correctly.
//
// A slug with a letter wrong is the worst kind of wrong here, because nothing
// fails. The redemption succeeds, the count goes up, the member is told their
// code worked, and their Academy stays empty. There is no error anywhere and
// no reason for anybody to look.
//
// So the courses are offered, and a slug that is not one of them is refused
// where there is still a person to tell.

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

const ROUTE = 'src/app/api/admin/ambassadors/route.ts'
const PAGE = 'src/app/admin/ambassadors/page.tsx'

test('the screen is given the courses to offer', () => {
  const route = body(ROUTE)
  assert.match(route, /getAcademyCatalog\(\)/)
  assert.match(route, /courses: catalogue/)
  assert.match(route, /is_active !== false/,
    'an archived course must not be offered as a reward')
})

test('a slug that is not a course is refused', () => {
  const route = body(ROUTE)
  assert.match(route, /const unknown = slugs\.filter/)
  assert.match(route, /is not a course|are not courses/,
    'and the refusal has to say which one and why')

  // Only when the catalogue actually loaded. A failed read must not start
  // rejecting every code she tries to create.
  assert.match(route, /unknown\.length && known\.size/)
})

test('courses are ticked, not typed', () => {
  const page = body(PAGE)
  assert.doesNotMatch(page, /<textarea[^>]*reward_slugs/,
    'the slug textarea is the thing this replaced')
  assert.match(page, /type="checkbox"/)
  assert.match(page, /selectedSlugs\.includes\(course\.slug\)/)
})

test('the ticks and the value sent cannot disagree', () => {
  // Keeping a separate array of ticked slugs alongside the string that is
  // actually posted is two places for one fact, and they drift the first time
  // somebody switches reward and back.
  const page = body(PAGE)
  assert.match(page, /const selectedSlugs = newCode\.reward_slugs\.split/)
  assert.doesNotMatch(page, /useState<string\[\]>\(\[\]\)[\s\S]{0,80}selectedSlugs/,
    'selected courses must be derived from the field, never stored twice')
})

test('the two reward options say which one lets her choose', () => {
  // "Two Academy courses" and "Named Academy courses" did not, and the
  // difference between them is the entire question somebody is asking at that
  // moment.
  const page = body(PAGE)
  assert.match(page, /label: 'The two opening-season courses'/)
  assert.match(page, /label: 'Courses I pick'/)
})

test('ticking nothing still gives the opening pair', () => {
  // An empty list is not an empty gift. claimCode falls back to the launch
  // courses, so a code created without ticking anything behaves like the
  // simpler option rather than granting silence.
  assert.match(
    body('src/lib/ambassador-codes.ts'),
    /\(claim\.reward_slugs \|\| \[\]\)\.length \? claim\.reward_slugs : \[\.\.\.LAUNCH_COURSE_SLUGS\]/,
  )
})
