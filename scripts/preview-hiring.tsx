import { writeFileSync } from 'node:fs'
import { renderPlanPdf } from '../src/lib/documents/plan-pdf'
import { HIRING_PLANS } from '../src/lib/documents/hiring-plans'

// Render one recruitment instrument to disk, to look at before shipping it.
// Usage: tsx scripts/preview-hiring.tsx out.pdf HR-SCORECARD-GDE-904

const reference = process.argv[3]
const found = HIRING_PLANS.find(plan => plan.reference === reference)
if (!found) throw new Error(`No such reference. Have: ${HIRING_PLANS.map(p => p.reference).join(', ')}`)
const buffer = await renderPlanPdf(found.build())
writeFileSync(process.argv[2], buffer)
console.log(`${reference}: ${buffer.length} bytes`)
