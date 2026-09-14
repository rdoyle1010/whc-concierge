import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { RISK_ASSESSMENTS } from '../src/lib/documents/risk-assessments'
import { riskAssessment, RISK_ASSESSMENT_ENTRIES } from '../src/lib/documents/risk-assessment-plans'
import { missingFromPlan, hazardsInPlan, factsInPlan } from '../src/lib/documents/plan-types'
import { isValidReference } from '../src/lib/documents/reference'
import { packBySlug, RISK_ASSESSMENT_PACK_PRICE, SINGLE_DOCUMENT_PRICE } from '../src/lib/documents/pricing'
import { sellableCatalogue } from '../src/lib/documents/catalogue'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const documents = RISK_ASSESSMENTS.map(riskAssessment)

test('nothing is scored, because a score is a judgement about one building', () => {
  // The rule this whole document type exists to hold. A pre-scored assessment
  // is a property filing another property's opinion of its own premises, and
  // it is signed by somebody who only read it. There is no field on a Hazard
  // that could carry a score, and this asserts nobody adds one.
  const shape = body('src/lib/documents/plan-types.ts')
  const hazardType = shape.slice(shape.indexOf('export type Hazard'), shape.indexOf('export type PlanTable'))
  for (const forbidden of ['likelihood', 'severity', 'score', 'riskLevel', 'rating']) {
    assert.doesNotMatch(hazardType, new RegExp(`${forbidden}\\??:`, 'i'),
      `a Hazard must not be able to carry a ${forbidden}`)
  }

  const source = body('src/lib/documents/risk-assessments.ts')
  assert.doesNotMatch(source, /likelihood:\s*\d/)
  assert.doesNotMatch(source, /severity:\s*\d/)
})

test('a control is something to tick, never something asserted', () => {
  // Printing "non-slip flooring fitted" on a document for a spa nobody has
  // visited asserts something that may not be true, and the assertion is what
  // gets relied on afterwards.
  const pdf = body('src/lib/documents/plan-pdf.tsx')
  assert.match(pdf, /Controls: tick each one you have seen in place/)
  assert.match(pdf, /styles\.tickBox/)

  for (const document of documents) {
    for (const hazard of hazardsInPlan(document)) {
      assert.ok(hazard.controlsToVerify.length >= 3,
        `${document.reference}: "${hazard.hazard}" offers only ${hazard.controlsToVerify.length} controls`)
      assert.ok(hazard.whoIsAtRisk.trim(), `${document.reference}: "${hazard.hazard}" says nobody is at risk`)
    }
  }
})

test('every area of a spa is covered, and each one is complete', () => {
  assert.equal(RISK_ASSESSMENTS.length, 12)
  assert.equal(documents.reduce((total, doc) => total + hazardsInPlan(doc).length, 0), 45)

  for (const document of documents) {
    assert.deepEqual(missingFromPlan(document), [], `${document.reference} is incomplete`)
    assert.ok(isValidReference(document.reference), `${document.reference} is not in the house format`)
    assert.ok(factsInPlan(document) > 20, `${document.reference} asks almost nothing`)
  }

  // The areas that hurt people. A suite missing any of these is a register
  // with a hole in it, and the hole is where the consequence is.
  const titles = RISK_ASSESSMENTS.map(entry => entry.title.toLowerCase()).join(' | ')
  for (const area of ['pool', 'cold plunge', 'hydrotherapy', 'sauna', 'treatment room', 'changing',
    'plant room', 'gym', 'fire', 'outdoor', 'cleaning']) {
    assert.ok(titles.includes(area), `no assessment covers ${area}`)
  }
})

test('the hazards are led by the hazard, not by one hotel', () => {
  // Her register named three ice plunge pools and a specific terrace. That is
  // that property's document: another spa reading it either deletes half of
  // it or, worse, keeps it.
  const source = body('src/lib/documents/risk-assessments.ts')
  assert.doesNotMatch(source, /\b(Fairmont|Rosewood|Champneys|Ritz[- ]Carlton|Four Seasons)\b/i)
  assert.doesNotMatch(source, /\bIce Plunge Pool [123]\b/)
  assert.doesNotMatch(source, /\bHydrotherapy Pool [12]\b/)
  assert.doesNotMatch(source, /\bMain Pool\b/)

  for (const document of documents) {
    const text = JSON.stringify(document)
    assert.doesNotMatch(text, /[—–]/, `${document.reference} contains a forbidden dash`)
    assert.doesNotMatch(text, /!/, `${document.reference} contains an exclamation mark`)
  }
})

test('the method is stated, and it says walk the area', () => {
  const first = documents[0]
  const method = first.sections[0]
  assert.match(method.heading, /How to complete/)
  assert.ok(method.mustBeChecked)
  const text = [method.intro || '', ...(method.bullets || [])].join(' ')
  assert.match(text, /Do not complete it at a desk|walk the area/i)
  assert.match(text, /1 to 6 is low/)
  assert.match(text, /not exhaustive/)

  // And a sign-off that asks who assessed it and what makes them competent.
  const review = first.sections[first.sections.length - 1]
  assert.match(review.heading, /Review and sign-off/)
  assert.match(JSON.stringify(review.facts), /competence/)
})

test('the suite is sold whole, and priced against what it replaces', () => {
  const pack = packBySlug('risk-assessments')
  assert.ok(pack)
  assert.equal(pack!.price, RISK_ASSESSMENT_PACK_PRICE)
  assert.equal(pack!.count, 12)

  for (const entry of RISK_ASSESSMENT_ENTRIES) {
    assert.ok(pack!.includes(entry.reference))
    assert.ok(sellableCatalogue().some(row => row.reference === entry.reference), 'it must be listable')
  }

  // A property buying one area would buy the area it already worries about,
  // which is never the one that hurts somebody.
  assert.ok(RISK_ASSESSMENT_PACK_PRICE > 12 * SINGLE_DOCUMENT_PRICE)
  // Still inside the two thousand a spa director can approve without a board.
  assert.ok(RISK_ASSESSMENT_PACK_PRICE < 200000)
})

test('a risk assessment carries the wording a risk assessment needs', () => {
  const status = body('src/lib/documents/status.ts')
  assert.match(status, /RISK_ASSESSMENT_DISCLAIMER/)
  assert.match(status, /completed by a competent person/)
  // Both: the general statement about what a template is, and the specific
  // one about what a risk assessment legally requires.
  assert.match(status, /kind === 'risk-assessment'/)

  assert.match(body('src/lib/documents/render-pdf.ts'), /'risk-assessment'/,
    'it must render through the plan renderer, not the procedure one')
})
