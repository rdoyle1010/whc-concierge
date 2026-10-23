import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { QUARTER_ONE_DRAFTS } from '../src/lib/documents/quarter-one'
import { THE_LAST_SIX } from '../src/lib/documents/the-last-six'
import { AUTHORED_DRAFTS } from '../src/lib/documents/authored'
import { LIBRARY_PLAN } from '../src/lib/documents/library-plan'
import { documentFromDraft } from '../src/lib/documents/assemble'
import { missingFromSop, type SopDocument } from '../src/lib/documents/types'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const planned = LIBRARY_PLAN.filter(item => item.tier === 'quarter-1')

// The six that would not sign off. Sent to be drafted again twice, back with
// no steps both times, each one holding a department pack off the shelf on
// its own. Written by hand for the same reason the nine were.
const THE_SIX = [
  'REC-BOOK-CLASS-SOP-054',
  'GYM-PREVENTIVE-MAINT-SOP-260',
  'THER-TOWELWARMER-SOP-360',
  'SYS-PROMO-CODES-SOP-127',
  'SYS-HOLIDAY-HOURS-SOP-132',
  'SEC-CCTV-EVIDENCE-SOP-366',
]

test('there is written content for every document the model could not finish', () => {
  assert.equal(planned.length, 9)
  for (const item of planned) {
    assert.ok(QUARTER_ONE_DRAFTS[item.reference], `${item.reference} has no written content`)
  }
  // And nothing extra, which would be content for a reference that is not in
  // the plan and would therefore never be written anywhere.
  for (const reference of Object.keys(QUARTER_ONE_DRAFTS)) {
    assert.ok(planned.some(item => item.reference === reference), `${reference} is not in the build plan`)
  }
})

test('each one is complete enough to be signed off', () => {
  for (const item of planned) {
    const assembled = documentFromDraft(
      { reference: item.reference, title: item.title, department: item.department, version: '0.1', kind: 'sop' },
      QUARTER_ONE_DRAFTS[item.reference] as any,
    ) as unknown as SopDocument
    const missing = missingFromSop(assembled)
    assert.deepEqual(missing, [], `${item.reference} is missing: ${missing.join(', ')}`)
  }
})

test('each one keeps the house rules the drafter is held to', () => {
  for (const [reference, draft] of Object.entries(AUTHORED_DRAFTS)) {
    const text = JSON.stringify(draft)
    assert.doesNotMatch(text, /[—–]/, `${reference} contains a dash the readiness check forbids`)
    assert.doesNotMatch(text, /\b(seamless|vibrant|world-class|passionate|dynamic|elevate)\b/i,
      `${reference} uses banned marketing language`)
    assert.doesNotMatch(text, /!/, `${reference} contains an exclamation mark`)

    // Enough steps to be a procedure, few enough that somebody follows it,
    // every one with a standard somebody could audit.
    assert.ok(draft.steps.length >= 5 && draft.steps.length <= 12, `${reference} has ${draft.steps.length} steps`)
    for (const step of draft.steps) {
      assert.ok(step.standard.trim().length > 30, `${reference}: "${step.name}" has no real standard`)
    }
    assert.ok(draft.commonFailures.length >= 3, `${reference} needs three ways it goes wrong`)
    assert.ok(draft.definitions.length >= 3, `${reference} needs three definitions`)
  }
})

test('a fact about one building is a placeholder, never invented', () => {
  // The rule the drafter is given, applied to what was written by hand. Each
  // of these needs something only the property knows, and stating it here
  // would be inventing it.
  for (const [reference, draft] of Object.entries(AUTHORED_DRAFTS)) {
    assert.match(JSON.stringify(draft), /\[[^\]]+\]/, `${reference} states no placeholder at all, which is suspicious`)
  }
})

test('there is written content for the six a redraft could not finish', () => {
  for (const reference of THE_SIX) {
    assert.ok(THE_LAST_SIX[reference], `${reference} has no written content`)
    assert.ok(LIBRARY_PLAN.some(item => item.reference === reference), `${reference} is not in the build plan`)
  }
  assert.equal(Object.keys(THE_LAST_SIX).length, THE_SIX.length)

  // One list, not two. The route writes from this, the button counts from it,
  // and this test reads from it.
  assert.equal(Object.keys(AUTHORED_DRAFTS).length,
    Object.keys(QUARTER_ONE_DRAFTS).length + Object.keys(THE_LAST_SIX).length,
    'a reference is written in two places and one of them is being ignored')
})

test('every hand-written one assembles into something signable', () => {
  for (const [reference, draft] of Object.entries(AUTHORED_DRAFTS)) {
    const item = LIBRARY_PLAN.find(entry => entry.reference === reference)
    assert.ok(item, `${reference} is not in the build plan`)
    const assembled = documentFromDraft(
      { reference, title: item!.title, department: item!.department, version: '0.1', kind: 'sop' },
      draft as any,
    ) as unknown as SopDocument
    const missing = missingFromSop(assembled)
    assert.deepEqual(missing, [], `${reference} is missing: ${missing.join(', ')}`)
  }
})

test('writing them replaces a draft that was never finished', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  const authored = route.slice(route.indexOf("action === 'write_authored'"), route.indexOf("action === 'adopt_batch'"))
  assert.ok(authored.length > 500, 'the write_authored action should have been found')

  // A signature is on one exact version, so approved is never overwritten.
  assert.match(authored, /target\.status === 'approved'/)
  assert.match(authored, /leftAlone \+= 1/)

  // But content is not the test, finished is. The rule used to be "anything
  // with a document in it is not ours to touch", which meant the six that
  // came back with no steps were stored as written and then skipped by this
  // action forever. They could not be drafted and could not be written.
  assert.match(authored, /missingFromSop\(stored as SopDocument\)/)
  assert.doesNotMatch(authored, /Object\.keys\(target\.document \|\| \{\}\)\.length > 0/,
    'having content is not a reason to leave a document unfinished')
  // And it says how many it overwrote, because a count that hides that is
  // the same class of lie as a truncated list.
  assert.match(authored, /replaced/)

  assert.doesNotMatch(authored, /draftDocument|submitDraftBatch/, 'no model call: that is the entire point')

  // Above the guard that demands a document id, like every other action that
  // is about the library rather than one document.
  assert.ok(route.indexOf("action === 'write_authored'") < route.indexOf("const id = String(body.id"))
})

test('the screen never offers to draft a hand-written one again', () => {
  // Pressing redraft on these is what failed twice. The count on that button
  // has to exclude them, or it offers work it cannot do.
  const page = body('src/app/admin/documents/page.tsx')
  assert.match(page, /const redraftable = [\s\S]*?!isAuthored\(row\)/)
  assert.match(page, /authoredShort/)
  // The count comes from the API rather than a second copy of the list here.
  assert.match(page, /body\.authored/)
  assert.doesNotMatch(page, /Write the last nine/, 'the count was wrong the day a tenth was written')
})

test('a document too long for a web request is sent the slower way, not refused', () => {
  const draft = body('src/lib/documents/draft.ts')
  assert.match(draft, /timedOut\?: boolean/)
  assert.match(draft, /timedOut: true/)
  assert.doesNotMatch(draft, /took too long\. Try it again/, 'trying again mostly fails again')

  const route = body('src/app/api/admin/documents/route.ts')
  const single = route.slice(route.indexOf("action === 'draft'"))
  assert.match(single, /result\.timedOut && batchingConfigured\(\)/)
  assert.match(single, /queued: true/)
  // The receipt before the spend, the same rule that cost five paid batches.
  const fallback = single.slice(single.indexOf('result.timedOut'), single.indexOf('queued: true'))
  assert.ok(fallback.indexOf('document_batches') < fallback.indexOf('submitDraftBatch'),
    'a batch that cannot be tracked must not be started')
})
