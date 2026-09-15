import { test } from 'node:test'
import assert from 'node:assert/strict'
import { POOL_PLAN_ENTRIES } from '../src/lib/documents/pool-plans'
import { RISK_ASSESSMENT_ENTRIES } from '../src/lib/documents/risk-assessment-plans'
import { GUIDE_ENTRIES } from '../src/lib/documents/guide/plans'
import { CHECKLIST_ENTRIES } from '../src/lib/documents/checklist-plans'
import { FINANCE_ENTRIES } from '../src/lib/documents/finance-plans'
import { JOB_DESCRIPTION_ENTRIES } from '../src/lib/documents/job-description-plans'
import { POLICY_ENTRIES } from '../src/lib/documents/policy-plans'
import { HIRING_ENTRIES } from '../src/lib/documents/hiring-plans'
import {
  POOL_INDEX, RISK_ASSESSMENT_INDEX, GUIDE_INDEX, CHECKLIST_INDEX,
  FINANCE_INDEX, JOB_DESCRIPTION_INDEX, POLICY_INDEX, HIRING_INDEX, REGISTER_INDEX,
} from '../src/lib/documents/catalogue-index'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { LIBRARY_PLAN } from '../src/lib/documents/library-plan'

// The titles in the browser, the documents on the server.
//
// catalogue-index is written by scripts/build-catalogue-index.ts and is the
// only list a client component is allowed to read, because reading the plan
// modules instead pulled every finished document into a public chunk with it.
// A generated file is a list kept in two places, which drifts. This is what
// stops it: add a document to a register, forget to regenerate, and the run
// fails here rather than six weeks later on a shop missing a product.

const PAIRS: [string, readonly unknown[], readonly unknown[]][] = [
  ['pool', POOL_PLAN_ENTRIES, POOL_INDEX],
  ['risk assessments', RISK_ASSESSMENT_ENTRIES, RISK_ASSESSMENT_INDEX],
  ['guides', GUIDE_ENTRIES, GUIDE_INDEX],
  ['checklists', CHECKLIST_ENTRIES, CHECKLIST_INDEX],
  ['finance', FINANCE_ENTRIES, FINANCE_INDEX],
  ['job descriptions', JOB_DESCRIPTION_ENTRIES, JOB_DESCRIPTION_INDEX],
  ['policies', POLICY_ENTRIES, POLICY_INDEX],
  ['hiring', HIRING_ENTRIES, HIRING_INDEX],
]

for (const [name, fromRegister, fromIndex] of PAIRS) {
  test(`the ${name} index matches the register`, () => {
    assert.deepEqual(
      fromIndex, fromRegister,
      `catalogue-index is stale for ${name}. Run: npx tsx scripts/build-catalogue-index.ts`,
    )
  })
}

test('the catalogue is the build plan plus the registers, once each', () => {
  const catalogue = sellableCatalogue()
  assert.equal(catalogue.length, LIBRARY_PLAN.length + REGISTER_INDEX.length)
  assert.equal(new Set(catalogue.map(entry => entry.reference)).size, catalogue.length)
})

test('the index carries listing fields and nothing else', () => {
  // A generated file grows by accident. The moment somebody adds a field that
  // holds a sentence of the document, the leak is back, wearing a new name.
  const allowed = ['reference', 'title', 'department', 'tier', 'why']
  for (const entry of REGISTER_INDEX) {
    assert.deepEqual(Object.keys(entry).sort(), [...allowed].sort())
  }
})
