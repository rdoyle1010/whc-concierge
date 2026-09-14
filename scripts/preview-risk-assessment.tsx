import { writeFileSync } from 'node:fs'
import { renderPlanPdf } from '../src/lib/documents/plan-pdf'
import { riskAssessment } from '../src/lib/documents/risk-assessment-plans'
import { RISK_ASSESSMENTS } from '../src/lib/documents/risk-assessments'
import { factsInPlan } from '../src/lib/documents/plan-types'

// Render one risk assessment to a PDF on disk, to look at before shipping it.
// See scripts/preview-document-pdf.tsx for how to build it.

const index = Number(process.argv[3] || 0)
const template = RISK_ASSESSMENTS[index]
if (!template) {
  console.error(`No assessment at ${index}. There are ${RISK_ASSESSMENTS.length}.`)
  process.exit(1)
}

const document = riskAssessment(template)
const buffer = await renderPlanPdf(document)
writeFileSync(process.argv[2], buffer)

const raw = buffer.toString('latin1')
console.log(`${document.reference}: ${buffer.length} bytes, ${factsInPlan(document)} to complete`)
console.log(`form: ${raw.includes('/AcroForm') ? 'yes' : 'NO'}, fields: ${(raw.match(/\/Widget/g) || []).length}`)
