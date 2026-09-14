import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { RISK_REGISTER } from '../src/lib/documents/ra/register'
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

const documents = RISK_REGISTER.map(riskAssessment)

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

  for (const file of ['coshh', 'physical', 'people-and-infection']) {
    const source = body(`src/lib/documents/ra/${file}.ts`)
    assert.doesNotMatch(source, /likelihood:\s*\d/, `${file} scores a hazard`)
    assert.doesNotMatch(source, /severity:\s*\d/, `${file} scores a hazard`)
  }
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

test('every hazard category is covered, and each document is complete', () => {
  // Organised by hazard type rather than by area, which is how an inspector
  // reads one and how the frameworks are written. By-area produced the
  // duplication that kills a register: manual handling appeared in five of
  // the twelve, and every copy drifted from every other.
  assert.equal(RISK_REGISTER.length, 13)
  const hazards = documents.reduce((total, doc) => total + hazardsInPlan(doc).length, 0)
  assert.ok(hazards >= 60, `only ${hazards} hazards across the register`)

  for (const document of documents) {
    assert.deepEqual(missingFromPlan(document), [], `${document.reference} is incomplete`)
    assert.ok(isValidReference(document.reference), `${document.reference} is not in the house format`)
    assert.ok(factsInPlan(document) > 20, `${document.reference} asks almost nothing`)
  }

  // The categories a register is judged against. One missing is a register
  // with a hole in it, and the hole is where the consequence is.
  const titles = RISK_REGISTER.map(entry => entry.title.toLowerCase()).join(' | ')
  for (const category of ['substances hazardous to health', 'electrical', 'fire', 'infection control',
    'manual handling', 'slips', 'noise', 'lone working', 'vulnerable persons', 'swimming pool',
    'cold plunge', 'hydrotherapy', 'saunas']) {
    assert.ok(titles.includes(category), `no document covers ${category}`)
  }

  // And every hazard named in the register reaches a document.
  const everyHazard = documents.flatMap(doc => hazardsInPlan(doc)).map(h => h.hazard.toLowerCase()).join(' | ')
  for (const hazard of ['legionella', 'cryptosporidium', 'chlorine gas', 'dermatitis', 'needlestick',
    'expectant mothers', 'display screen', 'repetitive strain', 'discharge to drain', 'first aid provision',
    'lone working', 'violence and aggression', 'working at height']) {
    assert.ok(everyHazard.includes(hazard), `no hazard covers ${hazard}`)
  }
})

test('the hazards are led by the hazard, not by one hotel', () => {
  // Her register named three ice plunge pools and a specific terrace. That is
  // that property's document: another spa reading it either deletes half of
  // it or, worse, keeps it.
  for (const file of ['coshh', 'physical', 'people-and-infection', 'register']) {
    const source = body(`src/lib/documents/ra/${file}.ts`)
    assert.doesNotMatch(source, /\b(Fairmont|Rosewood|Champneys|Ritz[- ]Carlton|Four Seasons)\b/i)
    assert.doesNotMatch(source, /\bIce Plunge Pool [123]\b/)
    assert.doesNotMatch(source, /\bMain Pool\b/)
    // A product range names the spas that use that supplier, not the hazard.
    assert.doesNotMatch(source, /\b(Diversey|Ecolab|ESPA|Elemis|Aromatherapy Associates)\b/i,
      `${file} names a supplier, which makes it a template for that supplier's customers`)
  }

  for (const document of documents) {
    const text = JSON.stringify(document)
    assert.doesNotMatch(text, /[—–]/, `${document.reference} contains a forbidden dash`)
    assert.doesNotMatch(text, /!/, `${document.reference} contains an exclamation mark`)
  }
})

test('the method is stated, and it says walk the area', () => {
  const first = documents[0]
  const method = first.sections[0]
  assert.match(method.part || '', /How to use this assessment/)
  assert.match(method.heading, /Before you start/)
  assert.ok(method.mustBeChecked)
  const text = [method.intro || '', ...(method.bullets || [])].join(' ')
  assert.match(text, /Do not complete it at a desk|walk the area/i)
  assert.match(text, /not exhaustive/)

  // The bands live with the matrix, on the scoring page, where somebody
  // reading a number can see what it means without turning back.
  const scoring = first.sections[1]
  assert.match(scoring.heading, /Scoring/)
  assert.ok(scoring.riskMatrix)
  const scoringText = [scoring.intro || '', ...(scoring.bullets || [])].join(' ')
  assert.match(scoringText, /realistic worst outcome/)
  assert.match(scoringText, /keep the number down/,
    'the way a register ends up all green has to be named')

  // And a sign-off that asks who assessed it and what makes them competent.
  const review = first.sections[first.sections.length - 1]
  assert.match(review.heading, /Who did this/)
  assert.match(JSON.stringify(review.facts), /competence/)

  // And an action plan, which is the only page that shows whether anything
  // happened as a result of the assessment.
  const plan = first.sections[first.sections.length - 2]
  assert.match(plan.heading, /Action plan/)
  assert.ok(plan.table?.fillable)
})

test('the register is colour coded, and the colour is functional', () => {
  // A register printed in black and white is one somebody has to do
  // arithmetic on before they can see where the problem is.
  const pdf = body('src/lib/documents/plan-pdf.tsx')
  assert.match(pdf, /function RiskMatrix/)
  assert.match(pdf, /section\.riskMatrix/)
  assert.match(pdf, /const RISK = \{/)

  // Each band carries its word and its number range as well as its colour, so
  // it still works for somebody who cannot tell red from green.
  assert.match(pdf, /Score \{range\}/)
  assert.match(pdf, /bandName/)

  // The scoring section asks for the matrix, on every document in the suite.
  for (const document of documents) {
    assert.ok(document.sections.some(section => section.riskMatrix),
      `${document.reference} has no risk matrix`)
  }
})

test('the suite is sold whole, and priced against what it replaces', () => {
  const pack = packBySlug('risk-assessments')
  assert.ok(pack)
  assert.equal(pack!.price, RISK_ASSESSMENT_PACK_PRICE)
  assert.equal(pack!.count, RISK_REGISTER.length)

  for (const entry of RISK_ASSESSMENT_ENTRIES) {
    assert.ok(pack!.includes(entry.reference))
    assert.ok(sellableCatalogue().some(row => row.reference === entry.reference), 'it must be listable')
  }

  // A property buying one area would buy the area it already worries about,
  // which is never the one that hurts somebody.
  assert.ok(RISK_ASSESSMENT_PACK_PRICE > RISK_REGISTER.length * SINGLE_DOCUMENT_PRICE)
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
