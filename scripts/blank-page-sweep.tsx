import { writeFileSync, mkdirSync } from 'node:fs'
import { renderPlanPdf } from '../src/lib/documents/plan-pdf'
import { HIRING_PLANS } from '../src/lib/documents/hiring-plans'
import { POLICY_PLANS } from '../src/lib/documents/policy-plans'
import { JOB_DESCRIPTION_PLANS } from '../src/lib/documents/job-description-plans'
import { CHECKLIST_PLANS } from '../src/lib/documents/checklist-plans'
import { RISK_ASSESSMENT_PLANS } from '../src/lib/documents/risk-assessment-plans'
import { FINANCE_PLANS } from '../src/lib/documents/finance-plans'
import { POOL_PLANS } from '../src/lib/documents/pool-plans'
import { GUIDE_PLANS } from '../src/lib/documents/guide/plans'

// Render every plan to disk so a sweep can look for blank pages.
//
// A blank page is invisible in the source and unmistakable in the file. One
// turned up on page three of the question bank: the sections after a contents
// page overflowed by a few points, the overflow took a page of its own, and
// the next part break jumped past it. Nothing in any test could have seen it.

const ALL = [
  ...POOL_PLANS, ...GUIDE_PLANS, ...RISK_ASSESSMENT_PLANS, ...CHECKLIST_PLANS,
  ...FINANCE_PLANS, ...JOB_DESCRIPTION_PLANS, ...POLICY_PLANS, ...HIRING_PLANS,
]

const out = process.argv[2]
mkdirSync(out, { recursive: true })
for (const plan of ALL) {
  writeFileSync(`${out}/${plan.reference}.pdf`, await renderPlanPdf(plan.build()))
}
console.log(`${ALL.length} plans rendered into ${out}`)
