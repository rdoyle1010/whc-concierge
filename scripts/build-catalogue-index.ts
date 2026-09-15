// Regenerates src/lib/documents/catalogue-index.ts.
//
// Run with: npx tsx scripts/build-catalogue-index.ts
//
// Why this file exists is explained at the top of what it writes. In short:
// the browser needs the names of the documents and must not be sent the
// documents. Importing the entry lists from the plan modules sent both.

import { writeFileSync } from 'node:fs'
import { POOL_PLAN_ENTRIES } from '../src/lib/documents/pool-plans'
import { RISK_ASSESSMENT_ENTRIES } from '../src/lib/documents/risk-assessment-plans'
import { GUIDE_ENTRIES } from '../src/lib/documents/guide/plans'
import { CHECKLIST_ENTRIES } from '../src/lib/documents/checklist-plans'
import { FINANCE_ENTRIES } from '../src/lib/documents/finance-plans'
import { JOB_DESCRIPTION_ENTRIES } from '../src/lib/documents/job-description-plans'
import { POLICY_ENTRIES } from '../src/lib/documents/policy-plans'
import { HIRING_ENTRIES } from '../src/lib/documents/hiring-plans'
import type { PlannedDocument } from '../src/lib/documents/library-plan'

const GROUPS: [string, readonly PlannedDocument[]][] = [
  ['POOL_INDEX', POOL_PLAN_ENTRIES],
  ['RISK_ASSESSMENT_INDEX', RISK_ASSESSMENT_ENTRIES],
  ['GUIDE_INDEX', GUIDE_ENTRIES],
  ['CHECKLIST_INDEX', CHECKLIST_ENTRIES],
  ['FINANCE_INDEX', FINANCE_ENTRIES],
  ['JOB_DESCRIPTION_INDEX', JOB_DESCRIPTION_ENTRIES],
  ['POLICY_INDEX', POLICY_ENTRIES],
  ['HIRING_INDEX', HIRING_ENTRIES],
]

const quote = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const row = (entry: PlannedDocument) =>
  `  { reference: ${quote(entry.reference)}, title: ${quote(entry.title)}, `
  + `department: ${quote(entry.department)}, tier: ${quote(entry.tier)}, why: ${quote(entry.why)} },`

const header = `// The names of the documents, without the documents.
//
// GENERATED. Run \`npx tsx scripts/build-catalogue-index.ts\` after changing a
// register, and the test in tests/nothing-paid-in-the-bundle.test.ts will tell
// you if you forget.
//
// The shop lists every title, so the browser needs the titles. It was getting
// them by importing the entry lists out of the plan modules, and each of those
// builds its list from a register that holds the finished text. A generated
// catalogue index was not the point of that import, but a four hundred and
// forty kilobyte chunk containing the hazard prose out of the seven hundred
// and fifty pound risk assessment suite was the result of it: the product,
// readable in the page source, by anyone, for nothing.
//
// So the listing fields are written out here as flat data with no import back
// to the registers, and everything a browser touches reads this. The registers
// stay the source of truth; this is their shadow, and the test keeps the two
// the same shape.

import type { PlannedDocument } from './library-plan'
`

const body = GROUPS.map(([name, entries]) =>
  `\nexport const ${name}: PlannedDocument[] = [\n${entries.map(row).join('\n')}\n]\n`).join('')

const footer = `
/** Everything the registers add to the build plan, in listing order. */
export const REGISTER_INDEX: PlannedDocument[] = [
${GROUPS.map(([name]) => `  ...${name},`).join('\n')}
]
`

writeFileSync('src/lib/documents/catalogue-index.ts', header + body + footer)
console.log(`Wrote ${GROUPS.reduce((total, [, entries]) => total + entries.length, 0)} entries.`)
