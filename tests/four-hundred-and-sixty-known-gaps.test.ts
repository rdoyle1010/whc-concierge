import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LIBRARY_PLAN, plannedByTier, departments, TIER_LABEL } from '../src/lib/documents/library-plan'
import { isValidReference } from '../src/lib/documents/reference'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/admin/documents/route.ts')
const page = body('src/app/admin/documents/page.tsx')

// A register with its gaps known is a plan. The same number of unwritten
// documents nobody has listed is an intention.
//
// Four hundred and sixty became four hundred and fifty three. Seven left the
// drafted plan: five were rewritten as real checklists, where they belonged
// all along, and two were duplicates of checklists the suite already
// contained. A number in a test is only worth pinning if moving it has to be
// argued for, which is what this comment is.
test('the whole library is a register before it is a set of drafts', () => {
  assert.equal(LIBRARY_PLAN.length, 453)
  assert.equal(departments().length, 14)

  const counted = plannedByTier('day-1').length + plannedByTier('month-1').length + plannedByTier('quarter-1').length
  assert.equal(counted, LIBRARY_PLAN.length, 'every document belongs to a tier')
  assert.equal(plannedByTier('day-1').length, 332, 'the ones needed before the first guest')

  for (const tier of ['day-1', 'month-1', 'quarter-1'] as const) {
    assert.ok(TIER_LABEL[tier].length > 5, 'a tier a person can read, not a slug on screen')
  }
})

// The first version of the reference pattern rejected four hundred and fifty
// one of these. It would have refused to approve almost the whole library,
// one document at a time, months from now, with nothing to suggest the
// validator rather than the document was wrong.
test('every planned reference passes the validator', () => {
  const rejected = LIBRARY_PLAN.filter(entry => !isValidReference(entry.reference))
  assert.deepEqual(rejected.map(entry => entry.reference), [],
    'the pattern is checked against the library that exists, not one imagined')

  // The shapes that broke it, kept as the cases they are.
  for (const reference of [
    'FIN-CASH-DISCREPANCY-CLOSE-SOP-317',
    'MAINT-CONTRACTOR-PERMIT-SOP-348',
    'ASSET-REGISTER-TAG-SOP-349',
    'REC-OPEN-CHK-001',
  ]) {
    assert.ok(isValidReference(reference), `${reference} is a real reference and must validate`)
  }
  assert.ok(!isValidReference('REC-OPEN-CHK'), 'still rejects a reference with no number')
  assert.ok(!isValidReference('rec-open-chk-001'), 'still rejects the wrong case')
})

// No document may be listed twice. The reference is what a client files it
// under and what other documents point at.
test('nothing is counted twice', () => {
  const references = LIBRARY_PLAN.map(entry => entry.reference)
  assert.equal(new Set(references).size, references.length)

  // The ten that were: their document number had fallen into the title
  // column, which hid them from a plain duplicate check and inflated both the
  // cover total and the first-quarter tier.
  for (const entry of LIBRARY_PLAN) {
    assert.ok(!entry.title.includes('|'), `a reference is still stuck in a title: ${entry.title}`)
    assert.ok(entry.department, `${entry.reference} has no department`)
  }
  assert.equal(plannedByTier('quarter-1').length, 9, 'nineteen was nine plus ten counted twice')
})

// An import must never be able to undo an approval, and it has to be safe to
// press twice because somebody will.
test('importing the plan cannot touch what is already there', () => {
  // Bounded at the next action rather than at the id guard: the tier and
  // collect blocks moved in between, and they write, so the slice was
  // checking code that is not the import.
  const block = route.slice(route.indexOf("action === 'import_plan'"), route.indexOf("action === 'draft_tier'"))
  assert.ok(block.length > 200, 'the import block was not found')
  assert.match(block, /already\.has\(entry\.reference\)/, 'anything already held keeps its content')

  // It may now fill a blank tier, and nothing else.
  //
  // Skipping an existing row entirely was right for content and wrong for a
  // blank: the worked example was added before the import, so the import
  // passed over it and left it with no tier, which made it invisible under
  // every tier filter while the counter above said one document was written.
  // Filling a blank is not overwriting. Touching any of these would be.
  assert.doesNotMatch(block, /\.upsert\(|\.delete\(/, 'an import replaces and removes nothing')
  const updates = block.match(/\.update\(\{[\s\S]*?\}\)/g) || []
  assert.equal(updates.length, 1, 'exactly one write to an existing row, and it is the tier')
  for (const field of ['document:', 'status:', 'approved_by', 'approved_at', 'approved_version', 'version:', 'title:']) {
    assert.ok(!updates[0].includes(field), `an import must never write ${field} on a row that already exists`)
  }
  assert.match(updates[0], /tier: planned\.tier/)
  assert.match(block, /The whole plan is already in the library/)

  // Four hundred and sixty rows in one statement is a request that does not
  // finish inside the platform's own time limit.
  assert.match(block, /at \+= 100/)
  assert.match(block, /Imported \$\{added\} and then stopped/, 'a partial import says how far it got')

  // Empty on purpose, and the completeness check keeps an empty one from
  // being signed off.
  assert.match(block, /document: \{\}/)
})

// Four hundred and sixty is not a list anybody scrolls.
// A cap on a list is a display decision. A cap on the thing the summary is
// calculated from is a wrong number on screen with nothing to suggest it: a
// library of four hundred and sixty reported itself as three hundred planned,
// and every tier total underneath was a subset of the wrong set.
test('the counts are calculated over the whole library', () => {
  const get = route.slice(route.indexOf('export async function GET'), route.indexOf('export async function POST'))
  const limit = Number(get.match(/\.limit\((\d+)\)/)?.[1])
  assert.ok(limit >= LIBRARY_PLAN.length * 2,
    `a limit of ${limit} cannot summarise a library of ${LIBRARY_PLAN.length}`)

  // The bodies stay behind, because four hundred and sixty procedures is a
  // payload nobody needs to render a list.
  assert.match(get, /const \{ document, \.\.\.rest \} = row/)
  assert.match(route, /action === 'read'/, 'and one is fetched when it is opened')
  assert.match(page, /async function open\(row: Row\)/)
})

test('the library is worked a stage at a time', () => {
  // It used to be a tier at a time: before the first guest, first thirty days,
  // first quarter. That answers a question a property asks once, while it is
  // opening, and never again. Where in a guest's visit a document is used is
  // the question everybody asks afterwards.
  assert.match(page, /const \[stage, setStage\]/)
  assert.match(page, /const \[kind, setKind\]/)

  // Written and finished are not the same thing, and the screen has to say so.
  // A draft that came back with no steps was stored as written, so the library
  // reported nothing left to write while a dozen documents could not be signed
  // off, and she met them one at a time by pressing the button and being
  // refused.
  assert.match(page, /Written, not finished/)
  assert.match(page, /only === 'incomplete'/)
  assert.match(page, /row\.written && row\.missing\.length > 0/)
  assert.match(page, /Not written yet/)
  assert.match(page, /Still to write/)
  assert.match(page, /disabled=\{!row\.written \|\| opening === row\.id\}/, 'an empty draft has nothing to read')
  assert.match(page, /visible\.slice\(0, 60\)/)
  assert.match(page, /Showing 60 of \{visible\.length\}/, 'and it says when it is showing a subset')
})
