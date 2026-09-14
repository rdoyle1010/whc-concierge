import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { formatOf, formatSummary, everyAllowedTypeHasAFormat } from '../src/lib/documents/formats'
import { highlights } from '../src/lib/documents/highlights'
import { ALLOWED_ATTACHMENT_TYPES } from '../src/lib/documents/attachments'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { departmentPacks, journeyPacks } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('a file is named by what a buyer would open it in', () => {
  assert.equal(formatOf('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'Excel')
  assert.equal(formatOf('application/pdf'), 'PDF')
  assert.equal(formatOf('application/vnd.openxmlformats-officedocument.presentationml.presentation'), 'PowerPoint')

  // Browsers send an empty or wrong content type often enough that trusting
  // it alone would label a real workbook as "File" on the shop.
  assert.equal(formatOf(null, 'Reporting pack.xlsx'), 'Excel')
  assert.equal(formatOf('', 'Induction manual.docx'), 'Word')
  assert.equal(formatOf('application/octet-stream', 'deck.pptx'), 'PowerPoint')
  assert.equal(formatOf(null, 'mystery'), 'File')
})

test('every type the upload accepts has a name a buyer recognises', () => {
  // A file she is allowed to upload and the shop calls "File" is a file the
  // shop is quietly apologising for.
  assert.ok(everyAllowedTypeHasAFormat(),
    `a permitted type has no format: ${[...ALLOWED_ATTACHMENT_TYPES.keys()].join(', ')}`)
})

test('the summary is the sentence a buyer repeats to whoever holds the budget', () => {
  assert.equal(formatSummary({ PDF: 36, Excel: 1 }), '36 fillable PDFs · 1 Excel workbook')
  assert.equal(formatSummary({ PDF: 1 }), '1 fillable PDF')
  assert.equal(formatSummary({ Excel: 2, PowerPoint: 3 }), '2 Excel workbooks · 3 presentations')
  assert.equal(formatSummary({}), '')
})

test('the shop says what is in a pack before the buy button, not after the payment', () => {
  const panel = body('src/components/PackContents.tsx')
  // Titles, from the same catalogue the packs are priced from, so the panel
  // and the count cannot disagree.
  assert.ok(panel.includes('sellableCatalogue()'))
  assert.ok(panel.includes('formatSummary'))
  // The formats are visible without opening it. Behind a click is where a
  // differentiator goes to be unread.
  const beforeToggle = panel.slice(0, panel.indexOf('{open && ('))
  assert.ok(beforeToggle.includes('formatSummary(counts)'), 'the formats are said whether it is open or not')
})

test('a pack is sold, not filed', () => {
  // The first version printed every title in catalogue order. A reception
  // pack opened with "Aftercare Email Dispatch and Record" and ran to a
  // hundred and five lines of that, which reads as admin rather than as
  // relief. Depth is made by saying a hundred and five, not by printing it.
  const panel = body('src/components/PackContents.tsx')
  assert.ok(panel.includes('highlights(entries)'), 'a chosen handful, not all of them')
  assert.ok(panel.includes('stageSpread') && panel.includes('kindSpread'), 'the shape of the pack')
  assert.ok(panel.includes('and {rest} more'))
  // The full searchable list is already further down the page. Reprinting it
  // inside every card was the wall.
  assert.ok(panel.includes('#every-document'), 'the completist is sent to the list that already exists')
  assert.doesNotMatch(panel, /entries\.map\(/, 'nothing renders every title')
})

test('the handful put in front of a buyer is the part they have been burned by', () => {
  // Nobody buys a pack because it can mark class attendance.
  const chosen = highlights([
    { reference: 'REC-ATTENDANCE-SOP-001', title: 'Class Attendance Marking in Book4Time' },
    { reference: 'REC-BUFFER-SOP-002', title: 'Apply Buffers and Setup Times' },
    { reference: 'REC-EMAIL-SOP-003', title: 'Aftercare Email Dispatch and Record' },
    { reference: 'REC-COMPLAINT-SOP-004', title: 'Guest Complaint Intake and Triage' },
    { reference: 'SEC-BREACH-SOP-005', title: 'Data Breach Response' },
    { reference: 'THER-SCREEN-SOP-006', title: 'Health Screening and Contraindications' },
  ], 3)
  const titles = chosen.map(entry => entry.title)
  assert.equal(titles.length, 3)
  assert.ok(!titles.includes('Class Attendance Marking in Book4Time'), `chose: ${titles.join(', ')}`)
  assert.ok(!titles.includes('Apply Buffers and Setup Times'), `chose: ${titles.join(', ')}`)

  // And it never invents one: every title it offers is really in the pack.
  const entries = [{ reference: 'REC-A-SOP-001', title: 'A' }, { reference: 'REC-B-SOP-002', title: 'B' }]
  assert.deepEqual(highlights(entries, 8).map(e => e.reference).sort(), ['REC-A-SOP-001', 'REC-B-SOP-002'])
})

test('every card on the shop opens, not just one of them', () => {
  // Stage packs, behind-the-scenes packs, departments and her own bundles.
  // A panel on three of four is the fourth one looking like it has nothing
  // in it.
  const shop = body('src/components/StandardsCatalogue.tsx')
  assert.equal((shop.match(/<PackContents/g) || []).length, 4,
    'a pack card somewhere is still saying only how many documents it has')
  assert.ok(shop.includes('references={referencesIn(stage)}'))
  assert.ok(shop.includes('references={referencesIn(pack)}'))
  assert.ok(shop.includes('references={bundle.references}'))
  assert.ok(shop.includes('files={filesFor('), 'the files that come with a pack are named on it')
})

test('what a pack contains is resolvable for every pack on the shop', () => {
  // A panel that renders an empty list is worse than no panel: it reads as a
  // pack with nothing in it.
  const catalogue = new Set(sellableCatalogue().map(entry => entry.reference))
  for (const pack of [...departmentPacks(), ...journeyPacks()]) {
    const inside = [...catalogue].filter(reference => pack.includes(reference))
    assert.ok(inside.length > 0, `${pack.slug} resolves to nothing`)
    assert.equal(inside.length, pack.count,
      `${pack.slug} says ${pack.count} documents and resolves to ${inside.length}`)
  }
})

test('the shop is told about the files without being given them', () => {
  const route = body('src/app/api/standards/route.ts')
  assert.match(route, /files: attachments\.map/)
  assert.match(route, /format: formatOf\(attachment\.contentType, attachment\.fileName\)/)
  // Public and unauthenticated. Names and formats sell the pack; the file is
  // the product.
  assert.doesNotMatch(route, /storagePath|storage_path/, 'the shop must never learn where a file lives')
  assert.match(route, /loadAttachments\(true, admin\)/, 'and only the live ones')
})

test('the reporting pack says it ships a spreadsheet', () => {
  // A one thousand two hundred and fifty pound pack whose strongest claim is
  // that it is a working workbook rather than a picture of one, and the word
  // did not appear on the page.
  const page = body('src/app/standards/page.tsx')
  const pack = page.slice(page.indexOf('financial-reporting') - 3000, page.indexOf('financial-reporting'))
  assert.match(pack, /Excel workbook/)
})

test('she can look at just the spreadsheets', () => {
  const page = body('src/app/admin/standards-files/page.tsx')
  assert.ok(page.includes("useState<Format | 'all'>('all')"))
  assert.ok(page.includes('presentFormats'), 'only the formats actually present are offered')
  assert.ok(page.includes('visible.map('), 'the list respects the filter')
  // A filter that hides everything has to say so, or it reads as data loss.
  assert.ok(page.includes('Nothing in {format}'))
})
