import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CONSULTANCY_SPECIALISMS, ENGAGEMENT_TYPES, isFeatured, missingForPublication,
  parseEngagementTypes, parseProjects, parseSpecialisms, projectClientLabel,
} from '../src/lib/consultancy'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Most serious consultancy work is under NDA. A consultant who cannot name the
// client would otherwise have to leave their best project out entirely, so the
// property type stands in for the name - but the name must never travel with it.
test('a confidential client is never named', () => {
  const project = parseProjects([{ title: 'Pre-opening', client: 'The Savoy', confidential: true }])[0]
  assert.equal(projectClientLabel(project), 'Confidential - The Savoy',
    'the descriptor a consultant typed is shown, and it is on them to keep it generic')
  const named = parseProjects([{ title: 'Retail reset', client: 'The Grand', confidential: false }])[0]
  assert.equal(projectClientLabel(named), 'The Grand')
  assert.equal(projectClientLabel(parseProjects([{ title: 'X' }])[0]), 'Private client')
})

// Resolved on the server, so a confidential engagement cannot be read out of
// the response by anyone who opens the network tab.
test('the public API resolves client labels before sending them', () => {
  const route = read('src/app/api/consultancy/public/route.ts')
  assert.match(route, /client: projectClientLabel\(project\)/,
    'the raw client field must not leave the server')
  assert.ok(!route.includes('is_live, approval_status,'), 'internal state is not part of the public shape')
  const columns = route.slice(route.indexOf('const columns'), route.indexOf('\n\n', route.indexOf('const columns')))
  for (const hidden of ['approval_notes', 'view_count', 'enquiry_count']) {
    assert.ok(!columns.includes(hidden), `${hidden} is the consultant's business, not the public's`)
  }
})

// jsonb, so a row could hold an older shape or something typed by hand.
test('only projects with a title survive, and never more than twelve', () => {
  const parsed = parseProjects([
    { title: 'Real project', outcome: 'Utilisation up 14 points' },
    { client: 'No title here' },
    'nonsense', null, 42,
  ])
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].outcome, 'Utilisation up 14 points')
  assert.equal(parseProjects(Array.from({ length: 40 }, (_, i) => ({ title: `P${i}` }))).length, 12)
  assert.deepEqual(parseProjects('not an array'), [])
})

test('specialisms and engagement types outside the taxonomy are dropped', () => {
  const specialisms = parseSpecialisms(['Retail strategy & buying', 'Making things up', 'Retail strategy & buying'])
  assert.deepEqual(specialisms, ['Retail strategy & buying'], 'unknown values and duplicates go')
  assert.deepEqual(parseEngagementTypes(['project', 'invented', 'project']), ['project'])
  assert.ok(CONSULTANCY_SPECIALISMS.length >= 12, 'the list has to cover the work properties actually buy')
  assert.ok(ENGAGEMENT_TYPES.every(type => type.hint), 'every engagement type needs plain wording')
})

// An empty entry in a showcase directory damages the consultant as much as the
// platform. This is the check behind the publish button, and behind the route.
test('a listing cannot go public until there is something to show', () => {
  const missing = missingForPublication({})
  for (const field of ['Practice or trading name', 'Headline', 'At least one specialism', 'At least one project']) {
    assert.ok(missing.some(item => item.includes(field.split(' ')[0])), `${field} must be required`)
  }
  const ready = missingForPublication({
    practice_name: 'Doyle Spa Consulting',
    headline: 'Pre-opening and commercial turnaround',
    summary: 'A'.repeat(130),
    specialisms: ['Pre-opening & mobilisation'],
    projects: [{ title: 'A real project' }],
  })
  assert.deepEqual(ready, [])
  // A one-word summary is not a summary.
  assert.ok(missingForPublication({
    practice_name: 'X', headline: 'Y', summary: 'Short',
    specialisms: ['Pre-opening & mobilisation'], projects: [{ title: 'P' }],
  }).some(item => item.includes('summary')))
})

// A form can be bypassed; the route cannot.
test('the publish check runs on the server as well as the button', () => {
  const route = read('src/app/api/consultancy/mine/route.ts')
  assert.match(route, /if \(wantsLive\)/)
  assert.match(route, /missingForPublication\(update\)/, 'the same rule the form uses')
})

// A lapsed payment must not leave somebody at the top of the directory for ever.
test('a featured placement expires', () => {
  const now = new Date('2026-09-03T00:00:00Z')
  assert.equal(isFeatured({ featured: true, featured_until: '2026-10-01T00:00:00Z' }, now), true)
  assert.equal(isFeatured({ featured: true, featured_until: '2026-08-01T00:00:00Z' }, now), false)
  assert.equal(isFeatured({ featured: false, featured_until: '2027-01-01T00:00:00Z' }, now), false)
  assert.equal(isFeatured({ featured: true }, now), true, 'no end date means it was given, not sold')
})

// The product only works if the directory fills up, and it will not fill up if
// listing costs money. Revenue comes from the ones who want to be seen first.
test('listing is free and only the placement is sold', () => {
  const route = read('src/app/api/consultancy/mine/route.ts')
  assert.ok(!/payment|checkout|stripe|membership_tier/i.test(route), 'nothing about publishing may be gated on paying')
  const checkout = read('src/app/api/commercial/checkout/route.ts')
  assert.match(checkout, /consultancy_featured/, 'the paid slot goes through the shared checkout')
})

// Buying a second month while the first is running must extend it, not restart
// it, or the buyer loses days they already paid for.
test('a second featured month extends rather than restarts', () => {
  const lib = read('src/lib/commercial-fulfilment.ts')
  const branch = lib.slice(lib.indexOf("product === 'consultancy_featured'"))
  const body = branch.slice(0, branch.indexOf("} else if"))
  assert.match(body, /existingUntil && existingUntil > now \? existingUntil : now/)
})

// An open contact form on a public directory is a spray gun unless it is held.
test('enquiries need a real brief and are rate limited', () => {
  const route = read('src/app/api/consultancy/enquiry/route.ts')
  assert.match(route, /message\.length < 30/, 'a two-word enquiry wastes the consultant\'s time')
  assert.match(route, /RATE_LIMIT_MAX/, 'one account cannot message the whole directory at once')
  assert.match(route, /consultancy\.user_id === user\.id/, 'you cannot enquire about your own listing')
  assert.match(route, /eq\('is_live', true\)/, 'a withdrawn listing takes no enquiries')
})

// Every listing sits on a page carrying the platform's name, so an edit to an
// approved listing goes back for review rather than publishing itself.
test('editing an approved listing returns it to review', () => {
  const route = read('src/app/api/consultancy/mine/route.ts')
  assert.match(route, /existing\?\.approval_status === 'approved'/)
  assert.match(route, /approval_status = 'pending'|approval_status: 'pending'/)
})

// The directory had no visible way in: the only route to a listing was a
// sidebar link inside the talent portal, which a consultant reading the public
// page could not see and would not think to look for.
test('a consultant reading the directory can find the way in', () => {
  const page = read('src/app/consultancy/page.tsx')
  const links = page.match(/href="\/talent\/consultancy"/g) || []
  assert.ok(links.length >= 2, 'the invitation appears at the top and again at the end of the list')
  assert.match(page, /Free to list/, 'the price has to be the first thing said, because it is the reason to act')
})

// An empty directory and an over-filtered one look identical and are not the
// same problem: one needs listings, the other needs the filters cleared.
test('an empty directory and an over-filtered one say different things', () => {
  const page = read('src/app/consultancy/page.tsx')
  assert.match(page, /profiles\.length === 0 \?/, 'the two cases are told apart')
  assert.match(page, /The directory is just opening/)
  assert.match(page, /Clear filters/, 'the filtered case offers the way out of it')
})
