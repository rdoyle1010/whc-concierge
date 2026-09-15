import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HIRING_REGISTER } from '../src/lib/documents/hiring/register'
import { HIRING_PLANS, hiringDocument } from '../src/lib/documents/hiring-plans'
import { missingFromPlan } from '../src/lib/documents/plan-types'
import { isValidReference } from '../src/lib/documents/reference'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { packBySlug } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('twelve instruments, each one finished and correctly referenced', () => {
  assert.equal(HIRING_REGISTER.length, 12)
  for (const plan of HIRING_PLANS) {
    const document = plan.build()
    assert.ok(isValidReference(document.reference), `${document.reference} is not a house reference`)
    assert.deepEqual(missingFromPlan(document), [], `${document.reference} is not finished`)
  }
  const references = HIRING_REGISTER.map(entry => entry.reference)
  assert.equal(new Set(references).size, 12, 'a reference is used twice')
})

test('these are instruments, not a second copy of the process', () => {
  // The library already holds requisition and approval, interview scheduling,
  // right to work checks, the offer, onboarding scheduling, the probation
  // gate and the leaver process. Selling those twice under a new name would
  // be selling somebody something they already own.
  const existing = sellableCatalogue()
    .filter(entry => /-SOP-/.test(entry.reference))
    .map(entry => entry.title.toLowerCase())
  for (const entry of HIRING_REGISTER) {
    assert.ok(!existing.includes(entry.title.toLowerCase()),
      `${entry.title} duplicates a procedure already in the library`)
  }
  // And each one is actually usable in a room: it carries something to fill
  // in, or a bank of questions to ask.
  for (const entry of HIRING_REGISTER) {
    const sections = hiringDocument(entry).sections
    const usable = sections.some(section => section.table?.fillable)
      || sections.some(section => (section.bullets?.length || 0) >= 4)
    assert.ok(usable, `${entry.reference} is prose with nothing to use`)
    assert.ok(sections.length >= 5, `${entry.reference} has only ${sections.length} sections`)
  }
})

test('a trade test is scored against a scheme written in advance', () => {
  // A trade test scored on impression afterwards is an interview with a couch
  // in it.
  const tests = HIRING_REGISTER.filter(entry => entry.title.startsWith('Trade Test'))
  assert.equal(tests.length, 3, 'therapist, reception and duty management')
  for (const entry of tests) {
    const sections = hiringDocument(entry).sections
    const marking = sections.filter(section => section.table?.fillable)
    assert.ok(marking.length >= 3, `${entry.reference} has too little to score against`)
    // Run the same way for everybody, or it is not evidence of anything.
    const text = JSON.stringify(sections)
    assert.match(text, /same test|same brief|same questions/i, `${entry.reference} does not say to run it consistently`)
    assert.match(text, /adjustment/i, `${entry.reference} does not mention reasonable adjustments`)
  }
  // The therapist test carries the things that end it regardless of score.
  const therapist = hiringDocument(tests.find(entry => entry.title.includes('Therapist'))!)
  assert.match(JSON.stringify(therapist.sections), /Anything here ends it/)
})

test('nothing asks a question that cannot lawfully inform a decision', () => {
  const text = JSON.stringify(HIRING_REGISTER.map(entry => hiringDocument(entry)))
  // The question bank names these as questions to avoid, so they appear. What
  // must not appear is any of them offered as a question to ask.
  const bank = hiringDocument(HIRING_REGISTER.find(entry => entry.title.includes('Question Bank'))!)
  const avoid = bank.sections.find(section => section.heading.includes('avoid'))
  assert.ok(avoid?.table, 'the question bank must name what not to ask, and why')
  assert.match(JSON.stringify(avoid), /discriminatory/i)
  assert.match(JSON.stringify(avoid), /current salary/i, 'asking current salary perpetuates underpayment')

  assert.doesNotMatch(text, /[—–]/, 'a dash the readiness check forbids')

  // The banned words are checked on what these documents offer, not on what
  // they warn against. The advert guide lists "must be passionate" as a
  // phrase that costs you candidates, and a check that cannot tell the
  // difference would force the guide to stop giving the advice.
  for (const entry of HIRING_REGISTER) {
    for (const section of hiringDocument(entry).sections) {
      if (/avoid|cost you|do not|not to/i.test(section.heading)) continue
      assert.doesNotMatch(JSON.stringify(section),
        /\b(seamless|vibrant|world-class|passionate|dynamic|elevate)\b/i,
        `${entry.reference}: "${section.heading}" uses banned marketing language`)
    }
  }
})

test('it is on the shop, priced, and in the catalogue', () => {
  const catalogue = new Set(sellableCatalogue().map(entry => entry.reference))
  for (const entry of HIRING_REGISTER) {
    assert.ok(catalogue.has(entry.reference), `${entry.reference} is not sellable`)
  }
  const pack = packBySlug('recruitment')
  assert.ok(pack, 'the pack does not resolve')
  assert.equal(pack!.count, 12)
  for (const entry of HIRING_REGISTER) {
    assert.ok(pack!.includes(entry.reference), `${entry.reference} is not in its own pack`)
  }

  const route = body('src/app/api/admin/documents/route.ts')
  assert.match(route, /HIRING_PLANS/, 'Bring the library up to date does not include them')
})

test('the shop stops claiming recruitment it does not have', () => {
  // A pack was renamed "Recruitment and HR" and contained fourteen documents
  // that were almost entirely HR. Renaming a thing is not the same as having
  // it, and the shop was making a claim it could not keep.
  const pack = packBySlug('recruitment')!
  assert.ok(pack.name.toLowerCase().includes('recruitment'))
  assert.ok(pack.count >= 12, 'the recruitment pack has to actually be recruitment')
})
