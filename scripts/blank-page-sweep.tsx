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
// A blank page is invisible in the source and unmistakable in the file. Nine
// were printing across the library, two of them inside the pool operating
// procedure, and nothing in any test could have seen them: the fault was a
// section container taller than a page carrying a page break, and react-pdf
// dealing with that by printing an empty sheet.
//
// Usage:
//   node_modules/.bin/esbuild scripts/blank-page-sweep.tsx --bundle \
//     --platform=node --format=esm --packages=external --jsx=automatic \
//     --outfile=./sweep.mjs && node ./sweep.mjs ./out && rm ./sweep.mjs
//
// Then check the files. A page is empty when it has no text but the footer, no
// form widgets and nothing drawn. The widget count matters: most of what looks
// blank to a text extractor is a continuation of a record sheet, where every
// cell is an empty box to write in and there is no text on the page by design.
// Counting those as faults is how you end up chasing seven pages that were
// never wrong. With pymupdf:
//
//   text = [b for b in page.get_text('blocks') if 'Version 0.1' not in b[4]]
//   empty = not text and not list(page.widgets()) and len(page.get_drawings()) <= 2

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
