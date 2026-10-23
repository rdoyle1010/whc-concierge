import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { poolNop, poolEap, POOL_PLAN_ENTRIES } from '../src/lib/documents/pool-plans'
import { missingFromPlan, factsInPlan } from '../src/lib/documents/plan-types'
import { isValidReference } from '../src/lib/documents/reference'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { packBySlug, POOL_SAFETY_PACK_PRICE, SINGLE_DOCUMENT_PRICE } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const plans = [poolNop(), poolEap()]

test('both plans are complete enough to be signed off', () => {
  for (const plan of plans) {
    assert.deepEqual(missingFromPlan(plan), [], `${plan.reference} is incomplete`)
    assert.ok(isValidReference(plan.reference), `${plan.reference} is not in the house format`)
    assert.ok(plan.sections.length >= 10, `${plan.reference} has only ${plan.sections.length} sections`)
    // Named plainly, because an assessor expects to see it, and carrying the
    // jurisdiction warning because these are written to United Kingdom
    // practice and are sold to spas that may not be in it.
    if (plan.kind === 'nop') {
      assert.ok((plan.legalFramework || []).length >= 10, 'the framework must be named')
    }
  }
})

test('a fact about one building is never stated for them', () => {
  // The whole reason these exist as fillable documents. A plausible bather
  // load, a plausible depth or a plausible muster point would be believed,
  // trained against and produced to an assessor, and it would be wrong.
  for (const plan of plans) {
    for (const section of plan.sections) {
      for (const fact of section.facts || []) {
        assert.ok(!fact.value, `${plan.reference} states a value for "${fact.label}"`)
      }
      // Nor who does what in a rescue. That is a decision about one team and
      // one rota, and a printed answer is one nobody has agreed to.
      for (const action of section.actions || []) {
        assert.equal(action.by, '', `${plan.reference} names who does "${action.name}"`)
      }
    }
  }

  // And there is a great deal to complete, which is the document rather than
  // a shortcoming of it.
  // A spa-wide operating procedure asks thousands of things, because a spa is
  // thousands of facts and none of them are ours.
  assert.ok(factsInPlan(poolNop()) > 1000, 'a NOP that asks little is a NOP that invented a lot')
})

test('the emergency plan puts one emergency on each page', () => {
  // Somebody reading it has wet hands and about ten seconds. Turning a sheet
  // over to find the rest of a rescue is a design decision with consequences.
  // Every emergency on its own page, and every one of them a list of actions
  // rather than prose. The record sheets are also on their own pages and are
  // tables, which is the other legitimate reason for a page of its own.
  const ownPage = poolEap().sections.filter(section => section.ownPage)
  assert.ok(ownPage.length >= 40, `only ${ownPage.length} pages are on their own`)
  for (const section of ownPage) {
    assert.ok(section.actions?.length || section.table,
      `${section.heading} is on its own page with neither actions nor a table`)
  }
  const emergencies = ownPage.filter(section => section.actions?.length)
  assert.ok(emergencies.length >= 35, `only ${emergencies.length} emergencies have actions`)

  // Rendered in document order, not sorted into inline and own-page. Sorting
  // them put Parts I and J in front of Parts B to H, so the contents page and
  // the document disagreed about where the fire pages were.
  const pdf = body('src/lib/documents/plan-pdf.tsx')
  assert.match(pdf, /section\.ownPage/)
  assert.match(pdf, /groups\.map\(\(group, groupIndex\)/)
  assert.doesNotMatch(pdf, /onOwnPage/, 'filtering the two apart breaks the order')
})

test('the sections that decide whether somebody is hurt are marked as such', () => {
  for (const plan of plans) {
    const checked = plan.sections.filter(section => section.mustBeChecked)
    assert.ok(checked.length >= 4, `${plan.reference} marks only ${checked.length} sections`)
  }
  // Bather load, supervision and the plant room are the three that matter
  // most, and the first page of the EAP is where the alarm and the assembly
  // point live.
  const nopHeadings = poolNop().sections.filter(s => s.mustBeChecked).map(s => s.heading)
  assert.ok(nopHeadings.includes('Maximum bather load'))
  assert.ok(nopHeadings.includes('Supervision'))
  assert.ok(nopHeadings.includes('Chemical handling and plant'))
  assert.ok(poolEap().sections[0].mustBeChecked, 'the alarm and assembly point page must be marked')

  const pdf = body('src/lib/documents/plan-pdf.tsx')
  assert.match(pdf, /must be completed by a person who knows these premises/)
})

test('they keep the house rules', () => {
  for (const plan of plans) {
    const text = JSON.stringify(plan)
    assert.doesNotMatch(text, /[—–]/, `${plan.reference} contains a dash the readiness check forbids`)
    assert.doesNotMatch(text, /\b(seamless|vibrant|world-class|passionate|dynamic|elevate)\b/i)
    assert.doesNotMatch(text, /!/, `${plan.reference} contains an exclamation mark`)
    // No brand, no chemical trade name, no equipment model. A template naming
    // one property's kit is a template for one property.
    assert.doesNotMatch(text, /\b(Fairmont|Rosewood|Champneys|Ritz[- ]Carlton|Four Seasons)\b/i)
  }
})

test('the pool procedure is priced as what it replaces', () => {
  const pack = packBySlug('pool-safety')
  assert.ok(pack, 'the pool safety pack should exist')
  assert.equal(pack!.price, POOL_SAFETY_PACK_PRICE)
  // Two plans, plus the two guides that come free with them.
  assert.equal(pack!.count, 4)

  // Two documents at thirty-nine pounds would misprice it so badly it reads
  // as not being the real thing, and a consultancy charges four figures.
  assert.ok(POOL_SAFETY_PACK_PRICE > 2 * SINGLE_DOCUMENT_PRICE * 5)
  // Still under the five hundred a spa director can usually approve alone.
  assert.ok(POOL_SAFETY_PACK_PRICE <= 50000)

  for (const entry of POOL_PLAN_ENTRIES) {
    assert.ok(pack!.includes(entry.reference))
    assert.ok(sellableCatalogue().some(row => row.reference === entry.reference), 'it must be listable')
  }
})

test('a plan renders through the plan renderer, never the procedure one', () => {
  const dispatch = body('src/lib/documents/render-pdf.ts')
  assert.match(dispatch, /PLAN_KINDS/)
  assert.match(dispatch, /renderPlanPdf/)
  assert.match(dispatch, /renderDocumentPdf/)

  for (const file of ['src/app/api/admin/documents/[id]/pdf/route.ts', 'src/app/api/standards/download/route.ts']) {
    const route = body(file)
    assert.match(route, /renderAnyDocumentPdf\(row\.kind, document\)/, `${file} picks a renderer by hand`)
    assert.match(route, /missingFromPlan/, `${file} checks a plan against the procedure rules`)
  }

  // And on screen, so she is not shown a list of steps that is not there.
  assert.match(body('src/app/admin/documents/page.tsx'), /PLAN_KINDS\.has\(reading\.row\.kind\)/)
})

test('every field in a plan is a form field, because the blanks are the document', () => {
  const pdf = body('src/lib/documents/plan-pdf.tsx')
  assert.match(pdf, /<TextInput name=\{`\$\{fieldName\(fact\.label\)\}_\$\{index\}`\}/)
  assert.match(pdf, /section\.table!\.fillable/)
  assert.match(pdf, /name="f_property_name"/)
  // Names and dates are typed; signatures are not.
  assert.match(pdf, /name="f_completed_name"/)
  assert.match(pdf, /styles\.signLine/)
  const briefing = pdf.slice(pdf.indexOf('The team have read it'))
  assert.doesNotMatch(briefing, /name=\{`brief_r\$\{rowIndex\}c3`\}/, 'a typed signature is worth nothing')
})

test('the emergency plan covers the whole spa, not only the water', () => {
  const headings = poolEap().sections.map(section => section.heading.toLowerCase()).join(' | ')

  // The emergencies a spa actually gets. Heat, cold, exertion and being
  // horizontal for an hour make several of these more likely here than
  // anywhere a guest would otherwise be.
  for (const emergency of [
    'cardiac arrest', 'anaphylaxis', 'heat exhaustion', 'cold water shock', 'fainting', 'seizure',
    'diabetic', 'stroke', 'choking', 'bleeding', 'head, neck or back', 'taken ill during a treatment',
    'needlestick', 'casualty in the water', 'entrapment', 'fire or evacuation', 'chlorine gas',
    'chemical spillage', 'faecal', 'legionella', 'power failure', 'gas leak', 'flood', 'lift entrapment',
    'missing child', 'safeguarding', 'allegation against a member of staff',
  ]) {
    assert.ok(headings.includes(emergency), `no page covers ${emergency}`)
  }

  // And the parts that make a sixty-page plan navigable at speed.
  const parts = new Set(poolEap().sections.map(section => section.part).filter(Boolean))
  assert.ok(parts.size >= 8, `only ${parts.size} parts`)
})

test('the plan names who to call and who leads before it names an emergency', () => {
  const eap = poolEap()
  // Page one. Everything after it assumes somebody knows how to raise the
  // alarm and who takes charge when they do.
  assert.equal(eap.sections[0].heading, 'Before anything else')
  assert.ok(eap.sections[0].mustBeChecked)

  const first = JSON.stringify(eap.sections.slice(0, 4))
  for (const entry of ['How the alarm is raised', 'Assembly point', 'defibrillator', 'isolation point']) {
    assert.ok(first.includes(entry), `the first pages must name the ${entry}`)
  }
  // 999 is the one number we are entitled to state. Every other is theirs.
  assert.match(first, /Emergency services.*999/)
})
