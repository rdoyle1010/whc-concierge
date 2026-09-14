import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { missingFromSop, type SopDocument } from '../src/lib/documents/types'
import { buildReference, isValidReference, topicCode, departmentCode } from '../src/lib/documents/reference'
import { DOCUMENT_STATUS, DOCUMENT_DISCLAIMER, RISK_ASSESSMENT_DISCLAIMER, disclaimersFor } from '../src/lib/documents/status'
import { EXAMPLE_SOP } from '../src/lib/documents/examples'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const sheet = body('src/components/documents/SopSheet.tsx')
const css = read('src/app/globals.css')

// A risk assessment is a legal artefact completed by a competent person who
// knows the premises. A document that presents itself as a finished one
// invites a property to file it and stop thinking, which is the outcome that
// gets somebody hurt and then gets us named in the aftermath.
test('a template never pretends to be a completed document', () => {
  assert.match(DOCUMENT_DISCLAIMER, /not a completed assessment/i)
  assert.match(DOCUMENT_DISCLAIMER, /does not\s+discharge any duty/i)
  assert.match(DOCUMENT_DISCLAIMER, /competent person/i)
  assert.match(DOCUMENT_STATUS, /review, amend and sign off before use/i)

  // A risk assessment carries both. The general statement alone would be
  // technically true and practically inadequate.
  const forRisk = disclaimersFor('risk-assessment')
  assert.equal(forRisk.length, 2)
  assert.ok(forRisk.includes(RISK_ASSESSMENT_DISCLAIMER))
  assert.match(RISK_ASSESSMENT_DISCLAIMER, /not valid until a named competent\s+person has completed, dated and signed it/i)
  assert.match(RISK_ASSESSMENT_DISCLAIMER, /not exhaustive/i)

  // Carried on the document, not only in a library nobody renders.
  assert.match(sheet, /DOCUMENT_STATUS/)
  assert.match(sheet, /disclaimersFor\(document\.kind\)/)
  assert.match(sheet, /Status of this document/)
})

// An unsigned document is obviously unfinished. A pre-signed one is a lie
// that looks tidy.
test('no signature is ever printed for somebody', () => {
  assert.match(sheet, /function Blank\(/)
  assert.match(sheet, /Learner signature/)
  assert.match(sheet, /Trainer signature/)
  // The blank is a rule to write on, never a value.
  assert.match(sheet, /<div className="mt-5 border-b border-\[#1c1c1c\]" \/>/)
  assert.doesNotMatch(sheet, /signature=\{|signedBy/)
})

// An SOP with no review date is an audit finding, every time, in every
// framework. So is one where nobody can say who owns it.
test('the governance an assessor asks for is on the page', () => {
  for (const label of ['Review by', 'Owned by', 'Approved by', 'Written by', 'Version', 'Reference']) {
    assert.ok(sheet.includes(label), `the document control block has no ${label}`)
  }
  // Author and owner are separate rows on purpose: who wrote it and who is
  // accountable for it are different questions and only one gets asked.
  assert.ok(sheet.indexOf('Written by') < sheet.indexOf('Owned by'))
})

// A step with an action and no standard is a description, not a procedure,
// and it is the commonest way a document like this stops being auditable.
test('a document is not issuable until it is complete', () => {
  assert.deepEqual(missingFromSop(EXAMPLE_SOP), [], 'the worked example must itself be issuable')

  const half = { ...EXAMPLE_SOP, reviewBy: '', measuredBy: [] } as SopDocument
  const gaps = missingFromSop(half)
  assert.ok(gaps.includes('a review date'))
  assert.ok(gaps.includes('how it is measured'))

  const unstandardised = {
    ...EXAMPLE_SOP,
    steps: [{ name: 'Do the thing', action: 'Do it', standard: '   ' }],
  } as SopDocument
  assert.ok(missingFromSop(unstandardised).some(gap => /standard for/.test(gap)))
})

// The reference is what every other document points at, what appears in
// training records and audit trails, and what a client files it under. Once
// issued it can never quietly change, so it is built in one place rather than
// assembled in a template where a stray space would go unnoticed.
test('the reference is built and checked, never typed', () => {
  assert.equal(buildReference({ department: 'Reception', title: 'Follow Up', kind: 'sop', sequence: 43 }), 'REC-FOLLOWUP-SOP-043')
  // One whole word rather than two cut in half: this is read aloud and typed
  // into training records.
  assert.equal(buildReference({ department: 'Therapy', title: 'Treatment Room Turnaround', kind: 'sop', sequence: 7 }), 'THR-TREATMENT-SOP-007')
  assert.equal(buildReference({ department: 'Health and Safety', title: 'Manual Handling', kind: 'risk-assessment', sequence: 2 }), 'HSE-MANUAL-RA-002')

  // Filler words eat the character budget and tell nobody anything.
  assert.equal(topicCode('Care of the Guest'), 'CAREGUEST')
  assert.equal(departmentCode('Something Unmapped'), 'SOM')

  assert.ok(isValidReference('REC-FOLLOWUP-SOP-043'))
  assert.ok(!isValidReference('rec-followup-sop-43'))
  assert.ok(!isValidReference('REC FOLLOWUP SOP 043'))
  assert.ok(isValidReference(EXAMPLE_SOP.reference))
})

// These go in a folder on a wall. A table that loses its heading halfway down
// page two is the difference between a document somebody files and one they
// reprint.
test('it is built to print, not only to scroll', () => {
  assert.match(css, /@page \{\s*size: A4;/)
  assert.match(css, /thead \{\s*display: table-header-group;/)
  assert.match(css, /orphans: 3;/)
  assert.match(sheet, /break-inside-avoid/)
  assert.match(sheet, /break-before-page/, 'the sign-off starts a fresh page')
  assert.match(sheet, /max-w-\[210mm\]/)
  // The reference, version and review date repeat at the foot of the document.
  assert.match(sheet, /<footer[\s\S]{0,400}\{document\.reference\}/)
})

// A worked example in a code library naming a real client is a document that
// ends up screenshotted, quoted or indexed with somebody's name on it.
test('the worked example names nobody real', () => {
  const source = read('src/lib/documents/examples.ts')
  for (const name of ['Fairmont', 'Raffles', 'Dorchester', 'Book4Time', 'SpaSoft', 'Mindbody']) {
    assert.ok(!source.includes(name), `the example names ${name}, which is somebody's actual business`)
  }
})

// It has to be better than the document it was modelled on, and these are the
// parts that make it so.
test('it carries what the original template did not', () => {
  assert.ok(EXAMPLE_SOP.whyItMatters.length > 60, 'a procedure nobody understands the purpose of is dropped on the first busy Saturday')
  assert.ok(EXAMPLE_SOP.measuredBy.length >= 3, 'a procedure with no measure is an opinion with numbered steps')
  assert.ok(EXAMPLE_SOP.commonFailures.length >= 3, 'where it goes wrong is what a trainer actually spends the session on')
  for (const section of ['Why this matters', 'How this is measured', 'Where this goes wrong']) {
    assert.ok(sheet.includes(section), `the renderer drops ${section}`)
  }
})

// A document she would send to a hotel printed with a burger menu, a logo and
// a notification bell across the top of page one.
//
// The print rules named a handful of workspace selectors and the dashboard
// header was not among them. A blocklist of chrome is only ever as complete
// as whoever wrote it remembered to be, and every screen added afterwards is
// a new way for it to be wrong.
test('only the document prints', () => {
  const css = read('src/app/globals.css')
  const page = read('src/app/admin/documents/page.tsx')

  assert.match(page, /className="document-print-root/, 'the document says which element it is')
  assert.match(css, /body:has\(\.document-print-root\) \* \{\s*visibility: hidden;/,
    'everything is hidden by default, rather than a list of things being hidden')
  assert.match(css, /body:has\(\.document-print-root\) \.document-print-root,\s*body:has\(\.document-print-root\) \.document-print-root \* \{\s*visibility: visible;/)

  // visibility rather than display, so the document keeps its place instead
  // of being removed along with whatever contains it.
  // Bounded at the rule that follows rather than by a character count: the
  // older blocklist still applies to screens with no document on them, and
  // an arbitrary window swept it up.
  const start = css.indexOf('body:has(.document-print-root)')
  const end = css.indexOf('Screens with no document on them', start)
  assert.ok(start > 0 && end > start, 'the print rules were not found')
  assert.doesNotMatch(css.slice(start, end), /display: none/,
    'two mechanisms fighting is how a document gets hidden by the rule meant to reveal it')
})

// She signed one off and then could not filter to it.
test('a signed off document can be found', () => {
  const page = read('src/app/admin/documents/page.tsx')
  assert.match(page, /<option value="signed">Signed off<\/option>/)
  assert.match(page, /only === 'signed' && row\.status !== 'approved'/)

  // One filter function, used by the list and by the count that explains an
  // empty one. Two copies is how a screen says one thing at the top and
  // another underneath.
  assert.match(page, /const matchesState = \(row: Row\) =>/)
  assert.equal((page.match(/only === 'signed'/g) || []).length, 1)
})
