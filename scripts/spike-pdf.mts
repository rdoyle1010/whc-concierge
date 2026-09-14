import { writeFileSync } from 'node:fs'
import { renderDocumentPdf } from '../src/lib/documents/document-pdf'
import { documentFromDraft } from '../src/lib/documents/assemble'
import { QUARTER_ONE_DRAFTS } from '../src/lib/documents/quarter-one'

async function main() {
  const ref = 'RTL-STOCK-TRANSFER-SOP-309'
  const doc = documentFromDraft(
    { reference: ref, title: 'Stock Transfer Between Locations', department: 'RETAIL TEAM', version: '0.1', kind: 'sop' },
    QUARTER_ONE_DRAFTS[ref] as any,
  ) as any
  const buf = await renderDocumentPdf(doc)
  writeFileSync(process.argv[2], buf)
  const text = buf.toString('latin1')
  console.log('bytes', buf.length)
  console.log('AcroForm:', text.includes('/AcroForm'))
  console.log('widgets:', (text.match(/\/Widget/g) || []).length)
  for (const n of ['f_property_name', 'f_duty_manager_contact', 'f_learner_name', 'f_transfer_reconciliation_window']) {
    console.log(' ', n, text.includes(n))
  }
}
main().catch(e => { console.error(e); process.exit(1) })
