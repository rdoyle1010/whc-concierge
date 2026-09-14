import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isLifeSafety, LIFE_SAFETY_WARNING, LIFE_SAFETY_CONFIRMATION } from '../src/lib/documents/safety'
import { LIBRARY_PLAN } from '../src/lib/documents/library-plan'
import { DRAFT_MODEL } from '../src/lib/documents/draft'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const draft = body('src/lib/documents/draft.ts')
const route = body('src/app/api/admin/documents/route.ts')
const page = body('src/app/admin/documents/page.tsx')

// Her own build plan says it: life safety before elegance. A drafted
// procedure is a starting structure for every document in the library. For
// these it is only ever that, because the evacuation route, the muster point
// and the plant room are facts about one building.
test('the documents that decide whether somebody gets hurt are marked', () => {
  for (const title of [
    'Fire Evacuation Procedure', 'Pool Safety Operating Procedure',
    'COSHH Chemical Storage and Handling', 'Guest Collapse and Medical Emergency',
    'Biohazard and Blood Spillage Response', 'Lone Working After Close',
  ]) {
    assert.ok(isLifeSafety({ title }), `${title} must be treated as life safety`)
  }

  // Every pool document, whatever it is called. A commercial pool is
  // regulated from the first day it opens.
  assert.ok(isLifeSafety({ title: 'Towel Restocking', department: 'POOL TEAM' }))

  // Not everything. A test that flags the whole library protects nothing.
  assert.ok(!isLifeSafety({ title: 'Retail Display Standards', department: 'RETAIL TEAM' }))
  assert.ok(!isLifeSafety({ title: 'Rebooking Conversation', department: 'RECEPTION TEAM' }))

  const flagged = LIBRARY_PLAN.filter(entry => isLifeSafety(entry))
  assert.ok(flagged.length > 30, 'too few, and something is being missed')
  assert.ok(flagged.length < LIBRARY_PLAN.length / 3, 'flagging everything is the same as flagging nothing')
})

// Signing one of these off is a separate statement, not the same button.
test('a life safety document takes an explicit confirmation', () => {
  const approve = route.slice(route.indexOf("action === 'approve'"), route.indexOf("action === 'unapprove'"))
  assert.match(approve, /isLifeSafety\(row\) && body\.competentPersonChecked !== true/)
  assert.match(approve, /status: 409/)
  assert.match(approve, /competent person has checked it against the actual premises/)

  // Refused before the write, not after it.
  assert.ok(approve.indexOf('competentPersonChecked') < approve.indexOf("status: 'approved'"))

  // And the screen actually asks, rather than sending the flag regardless.
  assert.match(page, /async function signOff\(row: Row\)/)
  assert.match(page, /if \(row\.lifeSafety\)/)
  assert.match(page, /competentPersonChecked: true/)
  assert.match(page, /window\.confirm\(/)
  // Every approve goes through signOff. Said as what the buttons do, rather
  // than as a regex trying to prove a negative about the whole file.
  assert.doesNotMatch(page, /onClick=\{\(\) => act\('approve'/, 'no button approves directly')
  assert.doesNotMatch(page, /onClick=\{async \(\) => \{ if \(await act\('approve'/, 'nor the one in the reading view')
  assert.match(page, /onClick=\{\(\) => signOff\(row\)\}/)
  assert.match(page, /if \(await signOff\(reading\.row\)\)/)

  const gate = page.slice(page.indexOf('async function signOff'), page.indexOf('if (reading) {'))
  assert.equal((page.match(/act\('approve'/g) || []).length, 2, 'two approve calls, and both are in signOff')
  assert.equal((gate.match(/act\('approve'/g) || []).length, 2)

  assert.ok(LIFE_SAFETY_CONFIRMATION.includes('competent person'))
  assert.ok(LIFE_SAFETY_WARNING.includes('never be issued'))
})

// A placeholder is honest. An invented fact is not, and in a fire procedure
// it is dangerous.
test('a draft never invents a fact about a building', () => {
  assert.match(draft, /Never invent a fact about a specific building/)
  assert.match(draft, /no muster points, no named people/)
  assert.match(draft, /placeholder in square brackets/)
  assert.match(draft, /A placeholder is honest\. An invented fact is not\./)
  assert.match(draft, /Do not cite legislation by name or section/)

  // And the life safety prompt says it a second time, specifically.
  assert.match(draft, /you do not know this one/)
})

// A step with an action and no standard is a description, not a procedure.
test('the shape it must produce is the shape that can be audited', () => {
  assert.match(draft, /required: \['name', 'action', 'standard'\]/)
  assert.match(draft, /a step with an action and no standard is a description, not a procedure/)
  assert.match(draft, /"Done promptly" is not a standard/)
})

// A drafted document is never a signed off one, whatever it contains.
test('drafting never approves anything', () => {
  const block = route.slice(route.indexOf("action === 'draft'"), route.indexOf("action === 'delete'"))
  assert.match(block, /status: 'draft'/)
  assert.doesNotMatch(block, /status: 'approved'/)
  assert.match(block, /That one is signed off\./, 'and it refuses to redraft over a sign-off')

  // The fields an assessor checks first are ours, not the model's. A model
  // inventing a review date would be inventing the one field they look at.
  for (const field of ['reference: row.reference', 'reviewBy:', 'issued:', "version: row.version"]) {
    assert.ok(block.includes(field), `${field} must be set here rather than drafted`)
  }
  assert.ok(block.indexOf('...result.draft') > block.indexOf('reviewBy:'),
    'our fields must not be overwritable by the draft')
})

test('drafting fits inside the ceiling the host enforces', () => {
  assert.equal(DRAFT_MODEL, 'claude-sonnet-5')
  const declared = Number(route.match(/maxDuration = (\d+)/)?.[1])
  assert.ok(declared > 0 && declared <= 26)
  const timeout = Number(draft.match(/CALL_TIMEOUT_MS = (\d+)/)?.[1])
  assert.ok(timeout <= (declared - 6) * 1000)
  assert.match(draft, /maxRetries: 0/)
})
