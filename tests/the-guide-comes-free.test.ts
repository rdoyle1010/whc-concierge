import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { completionGuide, trainingGuide, GUIDE_ENTRIES } from '../src/lib/documents/guide/plans'
import { missingFromPlan, partsOf } from '../src/lib/documents/plan-types'
import { isValidReference } from '../src/lib/documents/reference'
import { statusFor, footerFor } from '../src/lib/documents/status'
import { packBySlug } from '../src/lib/documents/pricing'
import { sellableCatalogue } from '../src/lib/documents/catalogue'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const guides = [completionGuide(), trainingGuide()]

test('both guides are complete and correctly referenced', () => {
  for (const guide of guides) {
    assert.deepEqual(missingFromPlan(guide), [], `${guide.reference} is incomplete`)
    assert.ok(isValidReference(guide.reference), `${guide.reference} is not in the house format`)
    assert.ok(partsOf(guide).length >= 5, `${guide.reference} has only ${partsOf(guide).length} parts`)
    // Each points at the documents it is about, and at the other guide.
    assert.ok(guide.references.length >= 3, `${guide.reference} points at nothing`)
  }
})

test('a guide is not a template, and does not pretend to be', () => {
  // The badge and the footer on every other document say "professional
  // template, review and sign off before use", which is right for a procedure
  // and wrong for the book explaining how to complete one.
  assert.match(statusFor('guide'), /Nothing here needs completing or signing/)
  assert.match(statusFor('training'), /Nothing here needs completing or signing/)
  assert.match(statusFor('nop'), /Professional template/)
  assert.match(footerFor('guide'), /does not form part of your procedures/)
  assert.match(footerFor('sop'), /Professional template/)

  const pdf = body('src/lib/documents/plan-pdf.tsx')
  // No adoption page, no property name box, no framework page. A guide is
  // ours, and asking a property to sign it is asking them to adopt our advice
  // as their own procedure.
  assert.match(pdf, /GUIDE_KINDS\.has\(document\.kind\) \? null : \(/)
  assert.match(pdf, /statusFor\(document\.kind\)/)
  assert.match(pdf, /footerFor\(document\.kind\)/)

  for (const guide of guides) {
    assert.equal(guide.legalFramework, undefined, `${guide.reference} carries a framework it does not need`)
    assert.equal(guide.property, 'Talent House Collective')
  }
})

test('the guides come free with the safety procedure', () => {
  // Free deliberately. A guide that costs extra is a guide the person who
  // needs it most does not buy, and a customer who never completes what they
  // bought does not buy anything else.
  const pack = packBySlug('pool-safety')
  assert.ok(pack)
  for (const entry of GUIDE_ENTRIES) {
    assert.ok(pack!.includes(entry.reference), `${entry.reference} is not in the safety pack`)
    assert.ok(sellableCatalogue().some(row => row.reference === entry.reference))
  }
  assert.equal(pack!.count, 4, 'the two plans and the two guides')
  assert.match(pack!.blurb, /included free/i)
})

test('the guide says the honest things, not the comfortable ones', () => {
  const text = JSON.stringify(completionGuide())

  // The four that a spa most needs told and least wants to hear.
  assert.match(text, /two full days/, 'it has to say how long it really takes')
  assert.match(text, /more dangerous than no procedure at all/)
  assert.match(text, /the one you aspire to rather than the one you run/)
  assert.match(text, /A gap with a date is a plan/)

  // And it tells them what to do when a section does not fit their building,
  // which is the thing a template normally pretends cannot happen.
  assert.match(text, /tell us/)
})

test('the training guide is session plans, not principles', () => {
  const training = trainingGuide()
  // A training guide that requires a trainer to design the training is a
  // training guide nobody uses.
  const sessions = training.sections.filter(section => section.part?.startsWith('C.'))
  assert.ok(sessions.length >= 7, `only ${sessions.length} session plans`)
  for (const session of sessions) {
    assert.ok(session.ownPage, `${session.heading} should print on its own page`)
    assert.ok((session.bullets || []).length >= 6, `${session.heading} is too thin to run from`)
    assert.match(session.heading, /minutes/, 'a session plan has to say how long it takes')
  }

  const text = JSON.stringify(training)
  // Competence, not attendance, is the whole argument of the document.
  assert.match(text, /Competence is not attendance/)
  assert.match(text, /A record where everybody is always competent is a record nobody believes/)
  // And the line that protects a therapist, said out loud in a session.
  assert.match(text, /ending a treatment because of a guest/)
})

test('both guides render through the plan renderer', () => {
  const dispatch = body('src/lib/documents/render-pdf.ts')
  assert.match(dispatch, /'guide', 'training'/)

  // And the admin action adds them alongside the plans they belong to, so
  // she cannot ship the procedure without its instructions.
  const route = body('src/app/api/admin/documents/route.ts')
  assert.match(route, /\[\.\.\.POOL_PLANS, \.\.\.GUIDE_PLANS\]/)
})
