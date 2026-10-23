import { writeFileSync } from 'node:fs'
import { renderPlanPdf } from '../src/lib/documents/plan-pdf'
import { poolNop, poolEap } from '../src/lib/documents/pool-plans'
import { factsInPlan } from '../src/lib/documents/plan-types'

// Render the NOP or the EAP to a PDF on disk, to look at before shipping it.
// See scripts/preview-document-pdf.tsx for why this is not a test and how to
// build it: @react-pdf resolves only through a bundler.

const which = process.argv[3] === 'eap' ? poolEap() : poolNop()
const buffer = await renderPlanPdf(which)
writeFileSync(process.argv[2], buffer)

const raw = buffer.toString('latin1')
console.log(`${which.reference}: ${buffer.length} bytes, ${factsInPlan(which)} facts to complete`)
console.log(`form: ${raw.includes('/AcroForm') ? 'yes' : 'NO'}, fields: ${(raw.match(/\/Widget/g) || []).length}`)
