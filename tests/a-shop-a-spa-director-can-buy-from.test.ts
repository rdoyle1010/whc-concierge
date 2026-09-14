import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SINGLE_DOCUMENT_PRICE, DEPARTMENT_PACK_PRICE, DAY_ONE_PACK_PRICE, COMPLETE_LIBRARY_PRICE,
  VAT_REGISTERED, VAT_NOTE, departmentPrice, departmentPacks, tierPacks, packBySlug, formatPrice,
} from '../src/lib/documents/pricing'
import { LIBRARY_PLAN } from '../src/lib/documents/library-plan'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const page = body('src/app/standards/page.tsx')
const catalogue = body('src/components/StandardsCatalogue.tsx')
const api = body('src/app/api/standards/route.ts')
const navbar = body('src/components/Navbar.tsx')
const footer = body('src/components/Footer.tsx')

// A spa director who wants a risk assessment is not going to register for a
// talent platform first. Asking her to is asking somebody to join a club to
// buy a book.
test('the shop is public and reachable', () => {
  assert.doesNotMatch(page, /getRequestUser|adminRequestUser|redirect\('\/login/, 'nothing here requires an account')
  assert.match(navbar, /href: '\/standards'/)
  assert.match(footer, /href: '\/standards'/)
  assert.match(page, /export const metadata/, 'it has to be findable, so it needs its own title and description')
})

// A pack that costs more than its parts is a pack nobody buys twice, and the
// person who works it out tells everybody.
test('a pack never costs more than buying it a document at a time', () => {
  for (const pack of departmentPacks()) {
    assert.ok(pack.price <= pack.count * SINGLE_DOCUMENT_PRICE,
      `${pack.name} costs more as a pack than one at a time`)
    assert.ok(pack.price > 0)
  }
  // The smallest department is five documents, so it prices itself below the
  // flat pack rather than at it.
  assert.equal(departmentPrice(5), 5 * SINGLE_DOCUMENT_PRICE)
  assert.equal(departmentPrice(100), DEPARTMENT_PACK_PRICE)
})

// The numbers were chosen against something. If one is edited, the reason
// should be edited with it.
test('the prices are the ones that were argued for', () => {
  assert.equal(SINGLE_DOCUMENT_PRICE, 3900)
  assert.equal(DEPARTMENT_PACK_PRICE, 29900)
  // Under the two thousand most spa directors can approve without a board.
  assert.ok(DAY_ONE_PACK_PRICE < 200000)
  // Under the two and a half thousand that pulls procurement into the room.
  assert.ok(COMPLETE_LIBRARY_PRICE < 250000)
  assert.ok(COMPLETE_LIBRARY_PRICE > DAY_ONE_PACK_PRICE)
  assert.equal(formatPrice(149500), '£1,495')
})

// She is not VAT registered. A business that is not registered must not charge
// or imply VAT, and a shop page that does is a problem to unwind rather than
// edit.
test('nothing charges or implies a tax she does not collect', () => {
  assert.equal(VAT_REGISTERED, false)
  assert.match(VAT_NOTE, /No VAT is charged/)
  for (const [name, source] of [['the shop', page], ['the catalogue', catalogue]] as const) {
    assert.doesNotMatch(source, /plus VAT|\+ VAT|inc\.? VAT|VAT number|ex VAT/i,
      `${name} implies a tax she does not collect`)
  }
  // One switch, so registering later is a decision rather than an afternoon
  // of finding every place a number was written out by hand.
  assert.match(page, /VAT_NOTE/)
})

// A shop listing four hundred and sixty documents that can deliver one is a
// shop found out on its first order.
test('the shelf says what is actually on it', () => {
  assert.match(api, /\.eq\('status', 'approved'\)/, 'only a signed off document can be sold')
  assert.match(catalogue, /in preparation/)
  assert.match(catalogue, /ready to send today/)

  // Unreachable stock and empty stock are different facts, and only one of
  // them is her fault.
  assert.match(api, /unavailable: true/)
  assert.match(catalogue, /We cannot reach the library just now/)

  // The content is the product, so the catalogue never returns one. Checked
  // against the select itself rather than the whole file, which mentions the
  // word in a table name and in half its comments.
  const selected = api.match(/\.select\('([^']+)'\)/)?.[1] || ''
  assert.ok(selected.length > 0, 'the select was not found')
  assert.ok(!selected.includes('*'), 'a shop must not select everything from the thing it sells')
  assert.ok(!selected.split(',').map(field => field.trim()).includes('document'),
    'the shop must not hand out the thing it sells')
})

// The wording that keeps a template from being mistaken for a completed legal
// document has to be on the page somebody buys from, not only on the document.
test('the shop says what these are and are not', () => {
  assert.match(page, /not a completed assessment/i)
  assert.match(page, /does not discharge any\s+duty/i)
  assert.match(page, /competent person/i)
  assert.match(page, /not small print/i)
})

// The department count on screen is read from the pack rather than worked out
// backwards from a document it happens to contain.
test('a pack knows its own department', () => {
  for (const pack of departmentPacks()) assert.ok(pack.department, `${pack.name} cannot say which department it is`)
  assert.match(catalogue, /readyIn\(pack\.department \|\| ''\)/)
  assert.equal(packBySlug('before-the-first-guest')?.count, LIBRARY_PLAN.filter(e => e.tier === 'day-1').length)
  // Four: the pre-opening suite, the complete library, the pool safety
  // procedure and the risk assessment suite. The last two are priced on their
  // own rather than as departments, because the "never more than its parts"
  // rule would offer a two-document department at seventy-eight pounds, which
  // is the right rule applied to the wrong thing.
  assert.equal(tierPacks().length, 4)
  const risk = packBySlug('risk-assessments')
  assert.ok(risk, 'the risk assessment suite should exist')
  assert.equal(risk!.count, 12)
  assert.ok(!departmentPacks().some(pack => pack.slug === risk!.slug))
  const pool = packBySlug('pool-safety')
  assert.ok(pool, 'the pool safety pack should exist')
  assert.equal(pool!.count, 2)
  assert.ok(!departmentPacks().some(pack => pack.slug === pool!.slug))
})
