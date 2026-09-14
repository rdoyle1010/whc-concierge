import { writeFileSync, mkdirSync } from 'node:fs'
import { renderPlanPdf } from '../src/lib/documents/plan-pdf'
import { CHECKLIST_PLANS } from '../src/lib/documents/checklist-plans'
import { FINANCE_PLANS } from '../src/lib/documents/finance-plans'
import { factsInPlan } from '../src/lib/documents/plan-types'

// Render every checklist and every report to look at before shipping them.
// Bundle it first: @react-pdf cannot resolve under tsx.
//
//   node_modules/.bin/esbuild scripts/preview-checklist-and-report.tsx --bundle \
//     --platform=node --format=esm --packages=external --jsx=automatic --outfile=./preview.mjs \
//     && node ./preview.mjs ./out && rm preview.mjs

const out = process.argv[2] || './out'
mkdirSync(out, { recursive: true })

for (const plan of [...CHECKLIST_PLANS, ...FINANCE_PLANS]) {
  const document = plan.build()
  const buffer = await renderPlanPdf(document)
  writeFileSync(`${out}/${document.reference}.pdf`, buffer)
  const raw = buffer.toString('latin1')
  console.log(
    `${document.reference.padEnd(24)} ${String(buffer.length).padStart(7)} bytes`
    + ` · ${String(factsInPlan(document)).padStart(4)} to complete`
    + ` · fields ${(raw.match(/\/Widget/g) || []).length}`,
  )
}
