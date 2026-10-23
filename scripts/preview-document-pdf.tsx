import { writeFileSync } from 'node:fs'
import { renderDocumentPdf } from '../src/lib/documents/document-pdf'
import { documentFromDraft } from '../src/lib/documents/assemble'
import { QUARTER_ONE_DRAFTS } from '../src/lib/documents/quarter-one'

// Render one document to a PDF on disk, to look at before shipping it.
//
// Four faults in the first version of the generator were invisible in the
// code and obvious in the file: the footer reference line never printed, the
// tick boxes were a glyph Helvetica does not carry, words hyphenated in the
// middle of a table, and a row split across a page break printed a role with
// an empty responsibility beside it. None of those are caught by a test that
// reads the source, so the file gets looked at.
//
// It cannot run under tsx: @react-pdf resolves only through a bundler. Build
// it first, then run the bundle.
//
//   node_modules/.bin/esbuild scripts/preview-document-pdf.tsx --bundle \
//     --platform=node --format=esm --packages=external --jsx=automatic \
//     --outfile=./preview.mjs && node ./preview.mjs out.pdf && rm preview.mjs

const REFERENCE = process.argv[3] || 'RTL-STOCK-TRANSFER-SOP-309'

const draft = QUARTER_ONE_DRAFTS[REFERENCE]
if (!draft) {
  console.error(`No written content for ${REFERENCE}. Options: ${Object.keys(QUARTER_ONE_DRAFTS).join(', ')}`)
  process.exit(1)
}

const document = documentFromDraft(
  { reference: REFERENCE, title: REFERENCE, department: 'SPA', version: '0.1', kind: 'sop' },
  draft as any,
) as any

const buffer = await renderDocumentPdf(document)
writeFileSync(process.argv[2], buffer)

const raw = buffer.toString('latin1')
console.log(`${process.argv[2]}: ${buffer.length} bytes`)
console.log(`form: ${raw.includes('/AcroForm') ? 'yes' : 'NO'}, fields: ${(raw.match(/\/Widget/g) || []).length}`)
