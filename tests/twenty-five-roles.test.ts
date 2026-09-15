import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ROLE_REGISTER } from '../src/lib/documents/roles/register'
import { JOB_DESCRIPTION_PLANS, jobDescription } from '../src/lib/documents/job-description-plans'
import { missingFromPlan, PLAN_KIND_LABEL } from '../src/lib/documents/plan-types'
import { PLAN_KINDS } from '../src/lib/documents/render-pdf'
import { isValidReference } from '../src/lib/documents/reference'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { packBySlug, categoryPacks } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('twenty-five roles, each one finished and correctly referenced', () => {
  assert.equal(ROLE_REGISTER.length, 25)
  for (const plan of JOB_DESCRIPTION_PLANS) {
    const document = plan.build()
    assert.ok(isValidReference(document.reference), `${document.reference} is not a house reference`)
    assert.deepEqual(missingFromPlan(document), [], `${document.reference} is not finished`)
  }
  const references = ROLE_REGISTER.map(role => role.reference)
  assert.equal(new Set(references).size, 25, 'a reference is used twice')
  for (const reference of references) {
    assert.match(reference, /-JD-\d{3}$/, `${reference} is not filed as a job description`)
  }
})

test('the library validates a job description rather than waving it through', () => {
  // missingFor falls through to an empty array for a kind it does not know,
  // so a kind missing from this set reports itself ready and gets signed off
  // by name and by date with nothing in it. That is how documents with no
  // steps came to carry signatures.
  assert.ok(PLAN_KINDS.has('job-description'))
  assert.equal(PLAN_KIND_LABEL['job-description'], 'Job Description')

  const empty = { ...jobDescription(ROLE_REGISTER[0]), sections: [], summary: '' }
  const missing = missingFromPlan(empty as any)
  assert.ok(missing.includes('a summary'))
  assert.ok(missing.includes('at least one section'))
})

test('the database will accept the kind the code writes', () => {
  const sql = body('supabase/migrations/20260914250000_every_kind_the_code_can_write.sql')
  assert.match(sql, /'job-description'/, 'the constraint would reject every one of these on import')
})

test('a duty list is not a job description', () => {
  // The shape is the argument. A duty list alone is useless three times over:
  // at interview there is nothing to assess against, at appraisal nothing to
  // measure against, and at a tribunal nothing to show the person was told
  // what the job was.
  for (const role of ROLE_REGISTER) {
    const headings = jobDescription(role).sections.map(section => section.heading)
    for (const needed of ['Purpose of the role', 'Where it sits', 'What good looks like',
      'How the role is measured', 'Essential', 'Desirable', 'Working conditions', 'Acceptance']) {
      assert.ok(headings.includes(needed), `${role.reference} has no "${needed}"`)
    }
    assert.ok(role.duties.length >= 2, `${role.reference} has its duties in one flat list`)
    assert.ok(role.measuredBy.length >= 3, `${role.reference} names too few measures to appraise against`)
    assert.ok(role.whatGoodLooksLike.length >= 3, `${role.reference} says too little about what good looks like`)
    assert.ok(role.essential.length >= 2, `${role.reference} has no real bar`)
    assert.ok(role.purpose.length > 60, `${role.reference} has no real statement of purpose`)
  }
})

test('nothing that belongs to one property is invented', () => {
  // Pay, hours and notice belong to a contract. A plausible figure typed into
  // a document that sits beside one is a liability, not a convenience.
  for (const role of ROLE_REGISTER) {
    const document = jobDescription(role)
    const terms = document.sections.find(section => section.heading === 'Terms to complete')!
    assert.ok(terms.table?.fillable, `${role.reference} does not leave the terms to be filled in`)
    for (const row of terms.table!.rows) {
      assert.equal(row[1], '', `${role.reference} has invented a value for ${row[0]}`)
    }
    const text = JSON.stringify(document)
    assert.doesNotMatch(text, /£\s?\d/, `${role.reference} states a salary`)
    assert.doesNotMatch(text, /[—–]/, `${role.reference} contains a dash the readiness check forbids`)
    assert.doesNotMatch(text, /\b(seamless|vibrant|world-class|passionate|dynamic|elevate)\b/i,
      `${role.reference} uses banned marketing language`)
  }
})

test('every role names who it answers to, so the set reads as a structure', () => {
  // The value of a suite over a form is the joins. A role reporting to
  // nothing, or to somebody who is not in the pack and not marked as a
  // property decision, is a gap in the chart.
  const titles = new Set(ROLE_REGISTER.map(role => role.title))
  for (const role of ROLE_REGISTER) {
    assert.ok(role.reportsTo.trim().length > 0, `${role.reference} reports to nobody`)
    assert.ok(role.responsibleFor.trim().length > 0, `${role.reference} does not say who reports to it`)
    const known = titles.has(role.reportsTo) || role.reportsTo.includes('[')
      || [...titles].some(title => role.reportsTo.startsWith(title))
    assert.ok(known, `${role.reference} reports to "${role.reportsTo}", which is neither in the pack nor a property decision`)
  }
})

test('they are on the shop, priced, and in the catalogue', () => {
  const catalogue = new Set(sellableCatalogue().map(entry => entry.reference))
  for (const role of ROLE_REGISTER) {
    assert.ok(catalogue.has(role.reference), `${role.reference} is not sellable`)
  }

  const pack = packBySlug('job-descriptions')
  assert.ok(pack, 'the pack does not resolve')
  assert.equal(pack!.count, 25)
  assert.ok(pack!.price > 0)
  for (const role of ROLE_REGISTER) {
    assert.ok(pack!.includes(role.reference), `${role.reference} is not in its own pack`)
  }

  // Second on the shop, behind risk assessments. It is the set a property
  // needs before it can hire anybody, and there was nothing there at all.
  const slugs = categoryPacks().map(entry => entry.slug)
  assert.equal(slugs[1], 'job-descriptions', `job descriptions are at position ${slugs.indexOf('job-descriptions')}`)
})

test('one press brings them into the library with the rest', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  assert.match(route, /JOB_DESCRIPTION_PLANS/, 'Bring the library up to date does not include them')
  assert.match(route, /Nobody is appointed to a role that has not been described/,
    'they land with no reason for being in the tier they are in')
})
