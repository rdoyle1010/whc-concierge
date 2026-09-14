import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES, attachmentPath,
  attachmentsForSlugs, extensionFor, readableSize, type Attachment,
} from '../src/lib/documents/attachments'
import { slugsInOrders } from '../src/lib/documents/entitlement'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const file = (over: Partial<Attachment> = {}): Attachment => ({
  id: 'one',
  name: 'Compliance register',
  description: null,
  storagePath: 'abc/register.xlsx',
  fileName: 'register.xlsx',
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  sizeBytes: 120000,
  packSlugs: ['pool-safety'],
  isLive: true,
  sortOrder: 0,
  ...over,
})

test('a file reaches the people who bought the pack it is in, and nobody else', () => {
  const register = file()
  const riskOnly = file({ id: 'two', packSlugs: ['risk-assessments'] })
  const orphan = file({ id: 'three', packSlugs: [] })

  const mine = attachmentsForSlugs([register, riskOnly, orphan], ['pool-safety'])
  assert.deepEqual(mine.map(entry => entry.id), ['one'])

  // Two packs, and the file is in one of them: still theirs.
  assert.equal(attachmentsForSlugs([riskOnly], ['pool-safety', 'risk-assessments']).length, 1)

  // In no pack at all reaches nobody, which is the point of the warning on
  // the admin screen rather than a quiet success.
  assert.equal(attachmentsForSlugs([orphan], ['pool-safety', 'risk-assessments']).length, 0)

  // Nothing bought, nothing owned. An empty entitlement must never fall
  // through to everything.
  assert.equal(attachmentsForSlugs([register, riskOnly], []).length, 0)
})

test('only a pack purchase carries a file, not a single document', () => {
  // A single document order has no pack slug, and a file belongs to a pack as
  // a whole. Reading a null slug as a match would hand a workbook to somebody
  // who bought one procedure for thirty-nine pounds.
  const slugs = slugsInOrders([
    { pack_slug: 'pool-safety' },
    { pack_slug: null },
    {},
  ])
  assert.deepEqual(slugs, ['pool-safety'])
})

test('what may be sold as a file, and what may not', () => {
  for (const type of [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'text/csv',
  ]) assert.ok(ALLOWED_ATTACHMENT_TYPES.has(type), `${type} should be allowed`)

  // Nothing executable and nothing that renders in a browser. A pack is a
  // set of working files, not a place to host whatever will upload.
  for (const type of [
    'text/html', 'image/svg+xml', 'application/x-msdownload',
    'application/javascript', 'application/zip', '',
  ]) assert.equal(ALLOWED_ATTACHMENT_TYPES.has(type), false, `${type} should be refused`)

  assert.equal(MAX_ATTACHMENT_BYTES, 60 * 1024 * 1024)
})

test('a storage path cannot escape its bucket or collide with another', () => {
  const nasty = attachmentPath('../../etc/passwd')
  assert.equal(nasty.includes('..'), false)
  assert.equal(nasty.split('/').length, 2)

  // Two uploads of the same name are two files, not one overwriting the other.
  assert.notEqual(attachmentPath('register.xlsx'), attachmentPath('register.xlsx'))
  assert.ok(attachmentPath('Register 2026.XLSX').endsWith('register-2026.xlsx'))
})

test('sizes and extensions read as a person would say them', () => {
  assert.equal(readableSize(400), '400 bytes')
  assert.equal(readableSize(2048), '2 KB')
  assert.equal(readableSize(3 * 1024 * 1024), '3.0 MB')
  assert.equal(extensionFor('text/csv', 'anything'), 'csv')
  assert.equal(extensionFor(null, 'notes.rtf'), 'rtf')
})

test('the download checks entitlement against their own orders, never the URL', () => {
  const route = body('src/app/api/standards/file/route.ts')

  // The id in the URL selects a file out of what they own. It must never be
  // the thing that decides whether they own it.
  assert.ok(route.includes('attachmentsForSlugs'))
  assert.ok(route.includes('loadAttachments(true'), 'only live files are downloadable')
  assert.ok(/403/.test(route), 'a file outside their packs is refused')
  assert.ok(!/pack_slug.*searchParams|searchParams.*pack/i.test(route),
    'the pack must not come from the query string')

  // A sixty megabyte workbook streamed through a function the host kills at
  // twenty-six seconds is a download that fails for the largest files only.
  assert.ok(route.includes('createSignedUrl'))
})

test('a file cannot go live with no pack, and the file follows the row', () => {
  const route = body('src/app/api/admin/standards-files/route.ts')

  assert.ok(route.includes('Choose at least one pack before making it live'))
  assert.ok(route.includes('MAX_ATTACHMENT_BYTES'))
  assert.ok(route.includes('ALLOWED_ATTACHMENT_TYPES.has(file.type)'))

  // The upload cleans up after itself. A file in the bucket with no row is a
  // file nobody can reach and nobody can find to delete.
  const insertAt = route.indexOf("from('standards_attachments').insert")
  const removeAt = route.indexOf('.remove([path])')
  assert.ok(insertAt > 0 && removeAt > insertAt, 'a failed row removes the file again')

  // And the delete goes the other way: the row first, so a buyer never meets
  // a listed file that 404s.
  const deleteRow = route.indexOf("from('standards_attachments').delete()")
  const deleteFile = route.indexOf('.remove([row.storage_path])')
  assert.ok(deleteRow > 0 && deleteFile > deleteRow, 'the row goes before the file')
})

test('a buyer sees the files they paid for, not only the PDFs', () => {
  for (const page of ['src/app/my-documents/page.tsx', 'src/components/BuyerLibrary.tsx']) {
    const source = body(page)
    assert.ok(source.includes('/api/standards/file?'), `${page} offers the download`)
    assert.ok(source.includes('Also included'), `${page} names the section`)
  }

  // Owning a file and no documents is a real state: a bundle of nothing but a
  // register. The empty shelf must not hide it.
  const mine = body('src/app/my-documents/page.tsx')
  assert.ok(mine.includes('documents.length === 0 && files.length === 0'))
})
