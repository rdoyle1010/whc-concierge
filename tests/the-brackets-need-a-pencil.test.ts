import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { splitPlaceholders, fieldName, placeholdersIn, hasPlaceholder } from '../src/lib/documents/placeholders'

test('a sentence splits into its words and its blanks', () => {
  const segments = splitPlaceholders('Escalate to [duty manager contact] within [escalation time].')
  assert.deepEqual(segments.map(s => s.kind), ['text', 'field', 'text', 'field', 'text'])
  assert.equal((segments[1] as any).label, 'duty manager contact')
  assert.equal((segments[3] as any).label, 'escalation time')
})

test('the same blank anywhere is the same field, so it is typed once', () => {
  // Two form fields sharing a name in a PDF share a value. [property name]
  // appears on every page of every document, and a buyer typing it nine times
  // is a buyer who stops after three.
  assert.equal(fieldName('Property name'), fieldName('property name'))
  assert.equal(fieldName('Duty manager contact'), 'f_duty_manager_contact')
  assert.equal(fieldName('  muster  point '), 'f_muster_point')
})

test('a stray bracket cannot swallow a paragraph', () => {
  const long = `[${'x'.repeat(200)}]`
  assert.equal(hasPlaceholder(long), false, 'over the length cap, so it stays as prose')
  assert.equal(hasPlaceholder('a line that opens [ and never closes'), false)
  assert.equal(hasPlaceholder('across\n[a line\nbreak]'), false)
  assert.equal(hasPlaceholder('[fine]'), true)
})

test('text with no blanks comes back whole', () => {
  const segments = splitPlaceholders('Nothing to complete here.')
  assert.deepEqual(segments, [{ kind: 'text', text: 'Nothing to complete here.' }])
})

test('every blank in a document is listed once, counted, in reading order', () => {
  const found = placeholdersIn({
    property: '[property name]',
    purpose: 'To protect stock at [property name].',
    steps: [
      { name: 'Escalate', action: 'Tell [duty manager contact].', standard: 'Within [escalation time].' },
    ] as any,
    commonFailures: ['Nobody calls [duty manager contact].'],
  })

  assert.deepEqual(found.map(f => f.label), ['property name', 'duty manager contact', 'escalation time'])
  assert.equal(found[0].count, 2, 'counted every time it appears')
  assert.equal(found[1].count, 2)
  assert.equal(found[2].count, 1)
})

test('a document with nothing to complete lists nothing', () => {
  assert.deepEqual(placeholdersIn({ purpose: 'All stated.', steps: [] as any }), [])
})

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('the PDF is generated, never printed, so the blanks are real fields', () => {
  const pdf = body('src/lib/documents/document-pdf.tsx')
  assert.match(pdf, /TextInput/, 'without form fields this is just a printed page')
  assert.match(pdf, /name=\{blank\.name\}/, 'every blank in the document gets a field')

  // Shared names are the point: one typed value fills every mention.
  assert.match(pdf, /name="f_property_name"/)
  assert.match(pdf, /name="f_owner_role"/)

  // A signature that can be typed is worth nothing to anybody asking who
  // signed a document, so names and dates are fields and signatures are not.
  assert.match(pdf, /name="f_learner_name"/)
  assert.match(pdf, /name="f_trainer_name"/)
  const signOff = pdf.slice(pdf.indexOf('Learner signature'), pdf.indexOf('Revision history'))
  assert.doesNotMatch(signOff, /TextInput name="f_learner_signature"/)
  assert.match(signOff, /styles\.signLine/)
})

test('an unwritten or unfinished document is never handed over as a PDF', () => {
  const route = body('src/app/api/admin/documents/[id]/pdf/route.ts')
  assert.match(route, /adminRequestUser/)
  assert.match(route, /Unauthorised/)
  assert.match(route, /Nothing has been written into that one yet/)
  assert.match(route, /missingFromSop/)
  assert.match(route, /it still needs/)
  // Filed under the reference, because two files called the same thing in one
  // folder is a filing system that has stopped working.
  assert.match(route, /\$\{row\.reference\}\.pdf/)
})

test('the shop lists documents by name, not only pack counts', () => {
  const list = body('src/components/StandardsList.tsx')
  assert.match(list, /sellableCatalogue\(\)\.filter/, 'the whole catalogue is listed, ready or not')
  assert.match(list, /Ready today/)
  assert.match(list, /In preparation/)
  assert.match(list, /ready to send today/)
  // Searchable by the three things a buyer knows.
  assert.match(list, /item\.title\.toLowerCase\(\)\.includes\(needle\)/)
  assert.match(list, /item\.reference\.toLowerCase\(\)\.includes\(needle\)/)
  assert.match(list, /item\.department\.toLowerCase\(\)\.includes\(needle\)/)

  const catalogue = body('src/components/StandardsCatalogue.tsx')
  assert.match(catalogue, /<StandardsList available=\{available\} unavailable=\{unavailable\} prices=\{prices\}/)
})

test('the library says how much each document asks the property to fill in', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  assert.match(route, /blanks: placeholdersIn/)

  // Both directions matter. Nothing to complete on a procedure that turns on
  // a fact about one building means the drafter stated something it could not
  // know, which is the failure this whole library is built to avoid, and a
  // silent zero looks exactly like a tidy document.
  const page = body('src/app/admin/documents/page.tsx')
  assert.match(page, /row\.blanks > 0/)
  assert.match(page, /for the property to fill in/)
  assert.match(page, /a fact about a building it/)
})
