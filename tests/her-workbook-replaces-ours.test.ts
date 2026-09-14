import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { replacementWorkbook, type Attachment } from '../src/lib/documents/attachments'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const file = (over: Partial<Attachment> = {}): Attachment => ({
  id: 'one',
  name: 'A file',
  description: null,
  storagePath: 'x/y.xlsx',
  fileName: 'y.xlsx',
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  sizeBytes: 1000,
  packSlugs: ['financial-reporting'],
  isLive: true,
  sortOrder: 0,
  replacesWorkbook: false,
  ...over,
})

test('a spreadsheet only replaces the workbook when it says it does', () => {
  // The compliance register is a spreadsheet, and it lives in packs. A rule
  // that inferred this from the file type would silently withdraw the
  // reporting workbook the first time a register went into the same pack.
  assert.equal(replacementWorkbook([file()]), null, 'a spreadsheet is not automatically the workbook')
  assert.ok(replacementWorkbook([file({ replacesWorkbook: true })]))
})

test('a file that is not live replaces nothing', () => {
  // Half uploaded and already withdrawing the working one is the worst of
  // both: the buyer gets neither.
  assert.equal(replacementWorkbook([file({ replacesWorkbook: true, isLive: false })]), null)
})

test('the generated workbook is offered only when hers is not', () => {
  // Two workbooks in one pack is worse than either alone: the buyer has to
  // decide which is authoritative and will suspect the other disagreed.
  for (const route of ['src/app/api/standards/mine/route.ts', 'src/app/api/standards/library/route.ts']) {
    const source = body(route)
    assert.match(source, /workbook: owned\.has\(FINANCE_REGISTER\[0\]\.reference\) && !replacementWorkbook\(theirFiles\)/,
      `${route} still offers both`)
    // Asked of the files that buyer receives, not of every file on the
    // system, so a bundle buyer whose pack does not carry hers still gets
    // the generated one rather than nothing at all.
    assert.match(source, /filesForOrders\(orders/)
  }
})

test('the download itself stands down, not only the button', () => {
  // A bookmark outlives the button that made it, and serving the generated
  // workbook to somebody who has been given a better one is how two versions
  // of the same numbers get into one building.
  const route = body('src/app/api/standards/workbook/route.ts')
  assert.match(route, /const replacement = replacementWorkbook\(await filesForOrders\(orders, admin\)\)/)
  assert.match(route, /status: 410/)
  assert.ok(route.indexOf('replacementWorkbook') < route.indexOf('reportingWorkbook()'),
    'the check has to come before the file is built')
})

test('she can say which file it is, and only on a spreadsheet', () => {
  const page = body('src/app/admin/standards-files/page.tsx')
  assert.ok(page.includes('replacesWorkbook: draft.replacesWorkbook === true'), 'it is saved')
  assert.ok(page.includes('This is the reporting workbook'))
  assert.ok(page.includes('SPREADSHEET.has(attachment.contentType'), 'not offered on a PDF')

  const route = body('src/app/api/admin/standards-files/route.ts')
  assert.match(route, /replaces_workbook: replacesWorkbook/)
  // And the consequence is said at the point of the decision, not discovered
  // later by a buyer.
  assert.match(route, /the generated one is not offered/)
})

test('the column exists in a migration, not only in the code', () => {
  // A column the code writes and the database does not have is a save button
  // that returns a Postgres error, which is how the last one failed.
  const migrations = body('supabase/migrations/20260914260000_her_workbook_replaces_ours.sql')
  assert.match(migrations, /alter table public\.standards_attachments/)
  assert.match(migrations, /add column if not exists replaces_workbook boolean not null default false/)
})
