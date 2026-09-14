import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildWorkbook, cellRef, sheetRef, safeSheetName } from '../src/lib/documents/xlsx'
import { reportingWorkbook } from '../src/lib/documents/finance/workbook'
import { FINANCE_REGISTER } from '../src/lib/documents/finance/register'
import { COMPUTED, DASHBOARD_SOURCES, SETUP_FIELDS } from '../src/lib/documents/finance/computed'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

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

test('the workbook opens, and every formula points somewhere real', () => {
  const buffer = reportingWorkbook()
  assert.ok(buffer.length > 10000, 'suspiciously small')
  // A zip, and the first thing in it is what a reader looks for.
  assert.equal(buffer.subarray(0, 2).toString('latin1'), 'PK')

  const dir = mkdtempSync(join(tmpdir(), 'wb-'))
  const path = join(dir, 'pack.xlsx')
  writeFileSync(path, buffer)

  // Opened by a real spreadsheet reader rather than inspected as bytes. A
  // workbook that parses here and not in Excel is still possible; a workbook
  // that fails here would certainly have failed there.
  const report = execFileSync('python3', ['-c', `
import openpyxl, json, re, sys, warnings
warnings.filterwarnings('ignore')
w = openpyxl.load_workbook(${JSON.stringify(path)})
names = set(w.sheetnames)
bad = []
formulas = 0
for name in w.sheetnames:
    s = w[name]
    for row in s.iter_rows():
        for cell in row:
            v = cell.value
            if not isinstance(v, str) or not v.startswith('='):
                continue
            formulas += 1
            for ref in re.findall(r"'([^']+)'!", v):
                if ref not in names:
                    bad.append(name + ': ' + ref)
            for ref in re.findall(r"([A-Za-z][A-Za-z ]*)!\\$?[A-Z]", v):
                r = ref.strip()
                if r and r not in names and not r.startswith('IFERROR'):
                    bad.append(name + ': ' + r)
print(json.dumps({'sheets': w.sheetnames, 'formulas': formulas, 'bad': bad}))
`], { encoding: 'utf8' })

  const parsed = JSON.parse(report.trim().split('\n').pop() || '{}')
  assert.deepEqual(parsed.bad, [], 'formulas point at sheets that do not exist')
  assert.ok(parsed.formulas > 200, `only ${parsed.formulas} formulas: the workbook is not computing much`)

  // Read me, Setup, Dashboard and a tab for every report that has measures.
  assert.ok(parsed.sheets.includes('Read me'))
  assert.ok(parsed.sheets.includes('Setup'))
  assert.ok(parsed.sheets.includes('Dashboard'))
  assert.ok(parsed.sheets.length >= 18, `only ${parsed.sheets.length} sheets`)
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
  const seen = new Set(DASHBOARD_SOURCES.map(source => source.measure))
  assert.equal(seen.size, 15, 'a measure appears twice')
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
