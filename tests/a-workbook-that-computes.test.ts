import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'
import { buildWorkbook, cellRef, sheetRef, safeSheetName } from '../src/lib/documents/xlsx'
import { reportingWorkbook } from '../src/lib/documents/finance/workbook'
import { FINANCE_REGISTER } from '../src/lib/documents/finance/register'
import { COMPUTED, DASHBOARD_SOURCES, SETUP_FIELDS } from '../src/lib/documents/finance/computed'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/**
 * Reading the workbook back out, in node.
 *
 * This used to shell out to python and openpyxl, which is installed on the
 * machine this was written on and on no build server anywhere. The test
 * passed locally and took production down: the deploy ran the suite, python
 * had no openpyxl, and the whole build failed on a spreadsheet check.
 *
 * A test that only runs where it was written is not a test, it is a habit. So
 * the zip is opened with the inflate that is already in node, and the parts
 * are read as the XML they are.
 */
function open(file: Buffer): Map<string, string> {
  const parts = new Map<string, string>()
  let at = 0
  while (at + 30 <= file.length && file.readUInt32LE(at) === 0x04034b50) {
    const method = file.readUInt16LE(at + 8)
    const compressed = file.readUInt32LE(at + 18)
    const nameLength = file.readUInt16LE(at + 26)
    const extraLength = file.readUInt16LE(at + 28)
    const name = file.subarray(at + 30, at + 30 + nameLength).toString('utf8')
    const start = at + 30 + nameLength + extraLength
    const raw = file.subarray(start, start + compressed)
    parts.set(name, (method === 8 ? inflateRawSync(raw) : raw).toString('utf8'))
    at = start + compressed
  }
  return parts
}

const sheetNamesIn = (workbook: string) =>
  [...workbook.matchAll(/<sheet name="([^"]+)"/g)].map(match =>
    match[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"'))

const formulasIn = (sheet: string) =>
  [...sheet.matchAll(/<f>([\s\S]*?)<\/f>/g)].map(match =>
    match[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>'))

test('a cell reference is the one Excel expects', () => {
  assert.equal(cellRef(1, 0), 'A1')
  assert.equal(cellRef(12, 5), 'F12')
  assert.equal(cellRef(3, 26), 'AA3')
  assert.equal(cellRef(3, 51), 'AZ3')

  // A sheet name with a space has to be quoted or the formula is nonsense.
  assert.equal(sheetRef('Setup'), 'Setup')
  assert.equal(sheetRef('Daily trading'), "'Daily trading'")
  // Excel refuses the whole file over a character in a tab name.
  assert.equal(safeSheetName('Profit/loss [2026]'), 'Profit loss  2026')
  assert.ok(safeSheetName('x'.repeat(60)).length <= 31)
})

test('the workbook is a readable zip with the parts a reader looks for', () => {
  const buffer = reportingWorkbook()
  assert.ok(buffer.length > 10000, 'suspiciously small')
  assert.equal(buffer.subarray(0, 2).toString('latin1'), 'PK')

  const parts = open(buffer)
  for (const required of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) {
    assert.ok(parts.has(required), `${required} is missing`)
  }

  // Every sheet declared has a part, a relationship and a content type, or
  // the file opens as a repair prompt rather than as a spreadsheet.
  const names = sheetNamesIn(parts.get('xl/workbook.xml')!)
  assert.ok(names.length >= 18, `only ${names.length} sheets`)
  for (const name of ['Read me', 'Setup', 'Dashboard']) {
    assert.ok(names.includes(name), `${name} is missing`)
  }
  for (let index = 1; index <= names.length; index += 1) {
    assert.ok(parts.has(`xl/worksheets/sheet${index}.xml`), `sheet${index} has no part`)
    assert.ok(parts.get('[Content_Types].xml')!.includes(`/xl/worksheets/sheet${index}.xml`))
    assert.ok(parts.get('xl/_rels/workbook.xml.rels')!.includes(`worksheets/sheet${index}.xml`))
  }
  assert.ok(parts.get('xl/_rels/workbook.xml.rels')!.includes('styles.xml'))
})

test('every formula points at a sheet that exists', () => {
  const parts = open(reportingWorkbook())
  const names = new Set(sheetNamesIn(parts.get('xl/workbook.xml')!))

  let formulas = 0
  const bad: string[] = []
  for (const [path, xml] of parts) {
    if (!path.startsWith('xl/worksheets/')) continue
    for (const formula of formulasIn(xml)) {
      formulas += 1
      // 'Daily trading'!B10 and Setup!$B$5 are the two shapes it writes.
      for (const [, quoted] of formula.matchAll(/'([^']+)'!/g)) {
        if (!names.has(quoted)) bad.push(`${path}: ${quoted}`)
      }
      for (const [, bare] of formula.matchAll(/(?:^|[^A-Za-z0-9_'!])([A-Za-z][A-Za-z0-9_.]*)!\$?[A-Z]/g)) {
        if (!names.has(bare)) bad.push(`${path}: ${bare}`)
      }
      // A reference to nothing is how a spreadsheet opens with errors down a
      // column, which reads as the buyer having broken it.
      assert.ok(!formula.includes('#REF'), `${path}: ${formula}`)
      assert.ok(!formula.includes('{'), `a placeholder survived into a formula: ${formula}`)
    }
  }

  assert.deepEqual(bad, [], 'formulas point at sheets that do not exist')
  assert.ok(formulas > 200, `only ${formulas} formulas: the workbook is not computing much`)
})

test('every computed line names a measure that exists', () => {
  // The builder throws on a name it cannot resolve, so building it at all is
  // the check. This states it, so a future reader knows the guard is load
  // bearing rather than defensive.
  assert.doesNotThrow(() => reportingWorkbook())

  const sheets = new Set(FINANCE_REGISTER.map(entry => entry.sheet))
  for (const source of DASHBOARD_SOURCES) {
    assert.ok(sheets.has(source.sheet), `the dashboard points at a missing sheet: ${source.sheet}`)
  }
  for (const reference of Object.keys(COMPUTED)) {
    assert.ok(FINANCE_REGISTER.some(entry => entry.reference === reference),
      `${reference} has formulas and is not a report`)
  }
})

test('the dashboard is never typed in', () => {
  // A dashboard filled in by hand disagrees with the reports behind it by the
  // third month, and the person who spots it stops trusting both.
  assert.equal(DASHBOARD_SOURCES.length, 15)
  assert.equal(new Set(DASHBOARD_SOURCES.map(source => source.measure)).size, 15)

  const parts = open(reportingWorkbook())
  const names = sheetNamesIn(parts.get('xl/workbook.xml')!)
  const dashboard = parts.get(`xl/worksheets/sheet${names.indexOf('Dashboard') + 1}.xml`)!
  // Fifteen measures across four periods, plus a variance each.
  assert.ok(formulasIn(dashboard).length >= 15 * 5, 'the dashboard is not all references')
})

test('the setup sheet is short enough that somebody fills it in', () => {
  // Everything on the capacity sheet falls out of these. A setup tab of forty
  // fields is a setup tab nobody completes, and then the whole pack reads as
  // broken rather than as unstarted.
  assert.ok(SETUP_FIELDS.length <= 10, `${SETUP_FIELDS.length} constants is too many to ask for`)
  for (const field of SETUP_FIELDS) {
    assert.ok(field.hint.length > 20, `${field.label} has no explanation`)
  }
})

test('the test suite runs where it is deployed, not only where it was written', () => {
  // This file used to shell out to python and openpyxl. It passed on the
  // machine it was written on, and took production down on the next deploy:
  // the build server has no openpyxl, the suite runs before the build, and
  // the whole site failed to ship over a spreadsheet check.
  const source = body('tests/a-workbook-that-computes.test.ts')
  // Built from parts so the check does not match its own source, which is
  // exactly the sort of thing that makes a guard look like it is working.
  const shellsOut = new RegExp(['child', '_process'].join('') + "|" + ['py', 'thon3'].join(''))
  assert.ok(!shellsOut.test(source),
    'this test reaches outside node and may not run where it is deployed')
})

test('the workbook is delivered to the people who bought the pack, and nobody else', () => {
  const route = body('src/app/api/standards/workbook/route.ts')
  assert.ok(route.includes('ownedReferences'), 'entitlement comes from their own orders')
  assert.ok(route.includes('403'))
  assert.ok(!/searchParams.get\('reference'\)/.test(route), 'nothing in the URL decides what they own')
  assert.ok(route.includes('spreadsheetml.sheet'), 'served as a spreadsheet')

  for (const page of ['src/app/my-documents/page.tsx', 'src/components/BuyerLibrary.tsx']) {
    assert.ok(body(page).includes('/api/standards/workbook'), `${page} offers it`)
  }
})
