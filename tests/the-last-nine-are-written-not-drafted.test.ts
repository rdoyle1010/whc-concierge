import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { QUARTER_ONE_DRAFTS } from '../src/lib/documents/quarter-one'
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
  for (const [reference, draft] of Object.entries(QUARTER_ONE_DRAFTS)) {
    const text = JSON.stringify(draft)
    assert.doesNotMatch(text, /[—–]/, `${reference} contains a dash the readiness check forbids`)
    assert.doesNotMatch(text, /\b(seamless|vibrant|world-class|passionate|dynamic|elevate)\b/i,
      `${reference} uses banned marketing language`)
    assert.doesNotMatch(text, /!/, `${reference} contains an exclamation mark`)

    // Five to seven steps, every one with a standard somebody could audit.
    assert.ok(draft.steps.length >= 5 && draft.steps.length <= 7, `${reference} has ${draft.steps.length} steps`)
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
  for (const [reference, draft] of Object.entries(QUARTER_ONE_DRAFTS)) {
    assert.match(JSON.stringify(draft), /\[[^\]]+\]/, `${reference} states no placeholder at all, which is suspicious`)
  }
})

test('writing them is a database update, with nothing left to overwrite', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  const authored = route.slice(route.indexOf("action === 'write_authored'"), route.indexOf("action === 'adopt_batch'"))
  assert.ok(authored.length > 500, 'the write_authored action should have been found')

  // The same rule as every other write in this file: signed off or already
  // written is not ours to touch.
  assert.match(authored, /target\.status === 'approved' \|\| Object\.keys\(target\.document \|\| \{\}\)\.length > 0/)
  assert.match(authored, /leftAlone \+= 1/)
  assert.match(authored, /left alone because they already had content/)
  assert.doesNotMatch(authored, /draftDocument|submitDraftBatch/, 'no model call: that is the entire point')

  // Above the guard that demands a document id, like every other action that
  // is about the library rather than one document.
  assert.ok(route.indexOf("action === 'write_authored'") < route.indexOf("const id = String(body.id"))
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
