import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const FORM = 'src/app/employer/applications/page.tsx'
const ROUTE = 'src/app/api/employer/applications/interview/route.ts'

// "Teams, Friday at 12:11" with no link is not an invitation, it is a riddle.
// The columns for all of this existed and were saved from the first version of
// the form; the form never asked and the email never said. So a property could
// name a format and a time and nothing else, and the candidate was left to
// guess, or to email and ask, or simply not to turn up.
test('an invitation cannot be sent without the detail its format needs', () => {
  const form = read(FORM)
  assert.match(form, /Add the joining link, or they will not know where to go/)
  assert.match(form, /Add the number, and say who is calling whom/)
  assert.match(form, /Add the address they should come to/)
})

// A link and an address are different questions. Asking both at once is how a
// form ends up half filled in.
test('the form asks the question that fits the format', () => {
  const form = read(FORM)
  assert.match(form, /interview\.method==='in_person'\?'Where to come'/)
  assert.match(form, /interview\.method==='phone'\?'Phone number'/)
  assert.match(form, /teams\.microsoft\.com/, 'a Teams link has an example to copy the shape of')
  assert.match(form, /Staff entrance at the rear/, 'and an address example that includes which door')
})

test('who they will meet and what to prepare are asked for', () => {
  const form = read(FORM)
  assert.match(form, /Who they will meet/)
  assert.match(form, /What to prepare/)
  assert.match(form, /contactName:interview\.contactName\.trim\(\)/, 'and actually sent')
  assert.match(form, /preparationRequired:interview\.preparationRequired\.trim\(\)/)
  assert.match(form, /meetingLink:interview\.meetingLink\.trim\(\)/)
  assert.match(form, /venueAddress:interview\.venueAddress\.trim\(\)/)
})

// The email is where most people read an invitation. It carried the times and
// the note and nothing else, so the details could be stored perfectly and the
// candidate would still not have them. The markup now lives in one library
// shared with the "details changed" email, because two copies would drift and
// the one that drifts is the one nobody watches.
test('the invitation email carries the joining details', () => {
  const lib = read('src/lib/interview-briefing.ts')
  for (const field of ['venueAddress', 'meetingLink', 'contactName', 'preparationRequired']) {
    assert.ok(lib.includes(field), `the email must include ${field}`)
  }
  assert.match(lib, /You will meet/)
  assert.match(lib, /To prepare/)
  // And the block has to reach the body, not just be built.
  const route = read(ROUTE)
  assert.match(route, /const detailsHtml = briefingDetailsHtml\(\{/)
  assert.match(route, /detailsHtml,/)
})

// A phone number is not a URL, and an address typed over three lines is not
// one line.
test('the email renders each detail as what it is', () => {
  const lib = read('src/lib/interview-briefing.ts')
  assert.match(lib, /\^https\?:/, 'only a real link is made clickable')
  assert.match(lib, /replace\(\/\\n\/g, '<br>'\)/, 'a multi-line address keeps its lines')
  // Everything a property types reaches a candidate's inbox, so it is escaped.
  // Only the rows built here: the surrounding frame interpolates fragments
  // that were escaped when they were built, and re-escaping those would print
  // the markup rather than render it.
  const rows = lib.slice(lib.indexOf('export function briefingDetailRows'), lib.indexOf('export function briefingDetailsHtml'))
  const unescaped = (rows.match(/\$\{[a-zA-Z][a-zA-Z0-9_.]*/g) || [])
    .filter(hit => !/^\$\{(escapeHtml|label|value)/.test(hit))
  assert.deepEqual(unescaped, [], 'every value a property typed must be escaped before it reaches an inbox')
})

// The candidate looks at their own screen when an email has been lost.
test('the details are on the candidate screen too', () => {
  const hub = read('src/components/ApplicationPipelineHub.tsx')
  for (const column of ['meeting_link', 'venue_address', 'contact_name', 'preparation_required']) {
    assert.ok(hub.includes(column), `${column} must be shown in the app as well`)
  }
})
