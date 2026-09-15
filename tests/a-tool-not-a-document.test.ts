import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'
import { TOOLS, toolBySlug } from '../src/lib/documents/tools/registry'
import { departmentPacks, journeyPacks, tierPacks } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

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
    match[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'"))

const formulasIn = (sheet: string) =>
  [...sheet.matchAll(/<f>([\s\S]*?)<\/f>/g)].map(match =>
    match[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'))

test('every tool opens as a spreadsheet, with the sheets it claims', () => {
  for (const tool of TOOLS) {
    const file = tool.build()
    assert.equal(file.subarray(0, 2).toString('latin1'), 'PK', `${tool.slug} is not a zip`)
    const parts = open(file)
    const names = sheetNamesIn(parts.get('xl/workbook.xml')!)
    assert.equal(names.length, tool.sheets, `${tool.slug} says ${tool.sheets} sheets and has ${names.length}`)
    // A file that opens as a repair prompt costs more trust than a missing one.
    for (let index = 1; index <= names.length; index += 1) {
      assert.ok(parts.has(`xl/worksheets/sheet${index}.xml`), `${tool.slug} sheet${index} has no part`)
      assert.ok(parts.get('[Content_Types].xml')!.includes(`/xl/worksheets/sheet${index}.xml`))
      assert.ok(parts.get('xl/_rels/workbook.xml.rels')!.includes(`worksheets/sheet${index}.xml`))
    }
  }
})

test('every formula points at a sheet that exists and computes something', () => {
  for (const tool of TOOLS) {
    const parts = open(tool.build())
    const names = new Set(sheetNamesIn(parts.get('xl/workbook.xml')!))
    let formulas = 0
    for (const [path, xml] of parts) {
      if (!path.startsWith('xl/worksheets/')) continue
      for (const formula of formulasIn(xml)) {
        formulas += 1
        for (const [, quoted] of formula.matchAll(/'([^']+)'!/g)) {
          assert.ok(names.has(quoted), `${tool.slug}: ${formula} points at ${quoted}`)
        }
        for (const [, bare] of formula.matchAll(/(?:^|[^A-Za-z0-9_'!"])([A-Za-z][A-Za-z0-9_.]*)!\$?[A-Z]/g)) {
          assert.ok(names.has(bare), `${tool.slug}: ${formula} points at ${bare}`)
        }
        assert.ok(!formula.includes('#REF'), `${tool.slug}: ${formula}`)
      }
    }
    assert.ok(formulas > 100, `${tool.slug} has only ${formulas} formulas, so it is a form rather than a tool`)
  }
})

test('nothing in a costing model is pre-filled with a plausible number', () => {
  // A blank is obviously unfinished. A plausible figure gets believed, and
  // then a menu gets priced off it.
  const parts = open(toolBySlug('tool-treatment-costings')!.build())
  const setup = [...parts.entries()].find(([path]) => path.startsWith('xl/worksheets/'))
  assert.ok(setup)
  for (const [path, xml] of parts) {
    if (!path.startsWith('xl/worksheets/')) continue
    // Numeric constants in an input column would be exactly that fault. The
    // only numbers the file should carry are inside formulas.
    const constants = [...xml.matchAll(/<c[^>]*t="n"[^>]*><v>([^<]+)<\/v>/g)].map(match => match[1])
    assert.deepEqual(constants, [], `${path} ships with typed numbers in it`)
  }
})

test('a tool slug cannot take a pack checkout', () => {
  const packSlugs = new Set([...departmentPacks(), ...journeyPacks(), ...tierPacks()].map(pack => pack.slug))
  for (const tool of TOOLS) {
    assert.ok(!packSlugs.has(tool.slug), `${tool.slug} collides with a pack`)
    assert.match(tool.slug, /^tool-/)
    assert.ok(tool.pricePence >= 100, `${tool.slug} has no price`)
    assert.ok(tool.blurb.length > 20 && tool.detail.length > 120, `${tool.slug} is not described well enough to sell`)
  }
})

test('a tool is delivered only to the person who bought it', () => {
  const route = body('src/app/api/standards/tool/route.ts')
  assert.match(route, /slugsInOrders\(orders \|\| \[\]\)\.includes\(tool\.slug\)/,
    'entitlement comes from their own orders')
  assert.match(route, /status: 403/)
  // The slug in the URL says which tool. It must never say whether they may
  // have it.
  assert.ok(route.indexOf('slugsInOrders') < route.indexOf('tool.build()'),
    'the file is built after the check, not before')
  assert.match(route, /spreadsheetml\.sheet/)

  const checkout = body('src/app/api/standards/checkout/route.ts')
  assert.match(checkout, /amountPence: tool\.pricePence/, 'priced from the registry, never from the page')

  for (const page of ['src/app/my-documents/page.tsx']) {
    assert.ok(body(page).includes('/api/standards/tool?slug='), `${page} offers it`)
  }
  assert.ok(body('src/components/StandardsTools.tsx').includes('BuyButton packSlug={tool.slug}'))
})
