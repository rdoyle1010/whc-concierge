import { writeFileSync } from 'node:fs'
import { renderPlanPdf } from '../src/lib/documents/plan-pdf'
import { completionGuide, trainingGuide } from '../src/lib/documents/guide/plans'

// Render the guide book or the training guide. See preview-document-pdf.tsx
// for how to build it.

const which = process.argv[3] === 'training' ? trainingGuide() : completionGuide()
const buffer = await renderPlanPdf(which)
writeFileSync(process.argv[2], buffer)
console.log(`${which.reference}: ${buffer.length} bytes, ${which.sections.length} sections`)
