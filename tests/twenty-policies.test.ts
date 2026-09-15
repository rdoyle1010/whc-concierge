import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { POLICY_REGISTER } from '../src/lib/documents/policies/register'
import { POLICY_PLANS, policy } from '../src/lib/documents/policy-plans'
import { missingFromPlan } from '../src/lib/documents/plan-types'
import { isValidReference } from '../src/lib/documents/reference'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { packBySlug, categoryPacks } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('twenty policies, each one finished and correctly referenced', () => {
  assert.equal(POLICY_REGISTER.length, 20)
  for (const plan of POLICY_PLANS) {
    const document = plan.build()
    assert.ok(isValidReference(document.reference), `${document.reference} is not a house reference`)
    assert.deepEqual(missingFromPlan(document), [], `${document.reference} is not finished`)
    assert.equal(document.kind, 'policy')
  }
  const references = POLICY_REGISTER.map(entry => entry.reference)
  assert.equal(new Set(references).size, 20, 'a reference is used twice')
  for (const reference of references) {
    assert.match(reference, /-POL-\d{3}$/, `${reference} is not filed as a policy`)
  }
})

test('a policy states a position and a consequence, not a procedure', () => {
  // A policy with no stated consequence is a suggestion, and the first person
  // to test that finds out it was one. A policy with no position is a
  // procedure with the word policy at the top.
  for (const entry of POLICY_REGISTER) {
    assert.ok(entry.position.length >= 3, `${entry.reference} states too little of a position`)
    assert.ok(entry.breach.length >= 3, `${entry.reference} has no real consequence`)
    assert.ok(entry.responsibilities.length >= 3, `${entry.reference} does not say who is accountable`)
    assert.ok(entry.records.length >= 3, `${entry.reference} cannot be evidenced`)
    assert.ok(entry.reviewTriggers.length >= 2, `${entry.reference} is only reviewed annually`)
    assert.ok(entry.rules.length >= 2, `${entry.reference} has its rules in one flat list`)

    const headings = policy(entry).sections.map(section => section.heading)
    for (const needed of ['The position', 'Who is accountable', 'What has to be recorded',
      'When it is breached', 'When this is reviewed', 'Adoption']) {
      assert.ok(headings.includes(needed), `${entry.reference} has no "${needed}"`)
    }
  }
})

test('nothing here pretends to be legal advice or invents a property fact', () => {
  for (const entry of POLICY_REGISTER) {
    const document = policy(entry)
    const text = JSON.stringify(document)
    assert.doesNotMatch(text, /[—–]/, `${entry.reference} contains a dash the readiness check forbids`)
    assert.doesNotMatch(text, /\b(seamless|vibrant|world-class|passionate|dynamic|elevate)\b/i,
      `${entry.reference} uses banned marketing language`)
    // The scope says plainly what this is not.
    assert.match(document.scope, /not legal advice/)
    // And nothing is adopted until a person at the property adopts it.
    const adoption = document.sections.find(section => section.heading === 'Adoption')!
    assert.ok(adoption.table?.fillable)
    for (const row of adoption.table!.rows) {
      assert.equal(row.slice(1).join(''), '', `${entry.reference} has pre-filled its own adoption`)
    }
  }
})

test('the ones nobody else writes are the ones included', () => {
  // A chaperone policy, an under-eighteens policy and a photography policy
  // are each a single page that prevents an allegation nobody can disprove
  // afterwards. Most spas have none of them.
  const titles = POLICY_REGISTER.map(entry => entry.title.toLowerCase()).join(' | ')
  for (const subject of ['chaperone', 'under eighteen', 'pregnancy', 'photography', 'lone working',
    'safeguarding', 'infection', 'incident reporting']) {
    assert.ok(titles.includes(subject), `nothing in the pack covers ${subject}`)
  }
})

test('disciplinary and grievance are deliberately absent, and it is said why', () => {
  // They turn on jurisdiction and on the individual contract, and a template
  // bought off a website is the wrong way to hold one. A pack that quietly
  // included them would be selling the buyer a risk dressed as a convenience.
  const titles = POLICY_REGISTER.map(entry => entry.title.toLowerCase()).join(' | ')
  assert.ok(!titles.includes('disciplinary'), 'a disciplinary procedure has crept into the pack')
  assert.ok(!titles.includes('grievance'), 'a grievance procedure has crept into the pack')

  const register = readFileSync('src/lib/documents/policies/register.ts', 'utf8')
  assert.match(register, /employment adviser/, 'the omission has to be explained, or it reads as a gap')
  const pack = packBySlug('policies')!
  assert.match(pack.detail!, /employment adviser/, 'and said to the buyer, not only in a comment')
})

test('they are on the shop, priced, and in the catalogue', () => {
  const catalogue = new Set(sellableCatalogue().map(entry => entry.reference))
  for (const entry of POLICY_REGISTER) {
    assert.ok(catalogue.has(entry.reference), `${entry.reference} is not sellable`)
  }
  const pack = packBySlug('policies')
  assert.ok(pack, 'the pack does not resolve')
  assert.equal(pack!.count, 20)
  for (const entry of POLICY_REGISTER) {
    assert.ok(pack!.includes(entry.reference), `${entry.reference} is not in its own pack`)
  }
  assert.ok(categoryPacks().some(entry => entry.slug === 'policies'), 'the pack is not on the shop')
})

test('one press brings them into the library with the rest', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  assert.match(route, /POLICY_PLANS/)
  assert.match(route, /A written position an assessor or an insurer asks to see/)
})

test('a title that wraps does not print over itself', () => {
  // "Chaperone and Intimate Treatments Policy" was the first title in this
  // library long enough to wrap, and it printed its second line into its
  // first: nineteen point Times needs more than 21.85 points of advance to
  // clear its own ascenders and descenders. Measured as glyph ink, the
  // overlap was 51.8 square points; at 1.35 it is 7.7, which is the same
  // order as two adjacent letters on one line touching, and that is noise.
  //
  // Asserted here as the leading rather than by rendering, because rendering
  // a PDF in the suite costs seconds on every run to re-prove a number that
  // was already measured. The comment carries the measurement so a future
  // reader does not have to take the constant on trust.
  const pdf = readFileSync('src/lib/documents/plan-pdf.tsx', 'utf8')
  const title = /title: \{[^}]*fontSize: (\d+), lineHeight: ([\d.]+)/.exec(pdf)
  assert.ok(title, 'the title style has moved and this guard no longer checks anything')
  assert.ok(Number(title![2]) >= 1.3,
    `title leading is ${title![2]}, which lets a wrapping title collide with itself`)

  // And the titles that forced it are still in the pack, so the case stays
  // covered rather than quietly disappearing.
  const longest = Math.max(...POLICY_REGISTER.map(entry => entry.title.length))
  assert.ok(longest > 40, 'no title in the pack wraps any more, so this is no longer being exercised')
})
