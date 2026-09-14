import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { priceIsSane, slugify, PRICE_KEYS } from '../src/lib/documents/price-overrides'
import { departmentPrice, packBySlug, singlePrice, tierPacks, SINGLE_DOCUMENT_PRICE } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('an override changes the price and the default still works without one', () => {
  assert.equal(singlePrice(), SINGLE_DOCUMENT_PRICE)
  assert.equal(singlePrice({ single: 4900 }), 4900)

  // The rule survives an override: a pack never costs more than its parts.
  assert.equal(departmentPrice(3, { single: 4900, department: 29900 }), 14700)
  assert.equal(departmentPrice(100, { single: 4900, department: 29900 }), 29900)

  const pool = packBySlug('pool-safety', { 'pool-safety': 99500 })
  assert.equal(pool?.price, 99500)
  assert.ok(packBySlug('pool-safety')!.price > 0)
})

test('a missing digit cannot become a price', () => {
  // Not a judgement about her pricing: a guard against the zero and the
  // dropped digit. A pack saved at nine pence is a pack somebody buys forty
  // times before anybody notices, and there is no taking it back.
  assert.equal(priceIsSane(0).ok, false)
  assert.equal(priceIsSane(9).ok, false)
  assert.equal(priceIsSane(99).ok, false)
  assert.equal(priceIsSane(-100).ok, false)
  assert.equal(priceIsSane(12.5).ok, false)
  assert.equal(priceIsSane('lots').ok, false)
  assert.equal(priceIsSane(6000000).ok, false, 'sixty thousand pounds is a typo')

  const fine = priceIsSane(75000)
  assert.equal(fine.ok, true)
  assert.equal((fine as any).pence, 75000)
})

test('putting a price back means deleting the override, not retyping it', () => {
  // A default typed back in stops being the default the day the default
  // changes, and nobody notices because the number looks right.
  const route = body('src/app/api/admin/standards-pricing/route.ts')
  const reset = route.slice(route.indexOf("action === 'reset_price'"), route.indexOf("action === 'save_bundle'"))
  assert.match(reset, /\.delete\(\)\.eq\('key', key\)/)
  assert.doesNotMatch(reset, /upsert|price_pence:/)

  // And the screen shows both numbers, so she can see what she changed.
  const page = body('src/app/admin/standards-pricing/page.tsx')
  assert.match(page, /The price in the code is/)
  assert.match(page, /This is the price in the code/)
})

test('a bundle cannot sell what the library cannot deliver', () => {
  const route = body('src/app/api/admin/standards-pricing/route.ts')
  const save = route.slice(route.indexOf("action === 'save_bundle'"), route.indexOf("action === 'delete_bundle'"))

  assert.match(save, /Not in the library/, 'a typo must not create an undeliverable bundle')
  assert.match(save, /Not a pack/)
  assert.match(save, /A bundle with nothing in it/)
  assert.match(save, /priceIsSane/)
  // Off until she says so. A bundle half built and visible is a bundle
  // somebody buys half of.
  assert.match(save, /is_live: body\.isLive === true/)
})

test('a bundle is resolved at read time, so it grows when the library does', () => {
  const server = body('src/lib/documents/pricing-server.ts')
  assert.match(server, /export function referencesInBundle/)
  assert.match(server, /packBySlug\(slug, prices\)/)
  // Storing the references would freeze the bundle on the day it was made,
  // and nobody would notice until a buyer asked where the new documents were.
  assert.doesNotMatch(server, /document_references: references/)

  // And every delivery route resolves them, or a bundle sells and delivers
  // nothing, which is the worse of the two failures.
  for (const file of [
    'src/app/api/standards/mine/route.ts',
    'src/app/api/standards/library/route.ts',
    'src/app/api/standards/download/route.ts',
  ]) {
    assert.match(body(file), /bundleReferenceMap\(admin\)/, `${file} cannot deliver a bundle`)
  }
})

test('the checkout prices from the database, never from the page', () => {
  const checkout = body('src/app/api/standards/checkout/route.ts')
  assert.match(checkout, /loadPrices\(admin\)/)
  assert.match(checkout, /amountPence: bundle\.pricePence/)
  // A bundle she built deliberately wins over a coded pack of the same name.
  assert.ok(checkout.indexOf('loadBundles(true, admin)') < checkout.indexOf('pricePack(packSlug'))
  // And a part-ready bundle is refused with the number, not a vague apology.
  assert.match(checkout, /in that bundle are signed off/)
  assert.doesNotMatch(checkout, /body\.(price|amount|pricePence)/)
})

test('every price on the shop has a key somebody can edit', () => {
  const keys = new Set(PRICE_KEYS.map(entry => entry.key))
  for (const pack of tierPacks()) {
    if (pack.slug === 'before-the-first-guest') assert.ok(keys.has('day-one'))
    if (pack.slug === 'the-complete-library') assert.ok(keys.has('complete'))
    if (pack.slug === 'pool-safety') assert.ok(keys.has('pool-safety'))
    if (pack.slug === 'risk-assessments') assert.ok(keys.has('risk-assessments'))
  }
  assert.ok(keys.has('single'))
  assert.ok(keys.has('department'))

  // Each one carries the reasoning, so changing it is a decision rather than
  // a guess at what the number was for.
  for (const entry of PRICE_KEYS) {
    assert.ok(entry.why.length > 40, `${entry.key} has no reasoning beside it`)
  }
})

test('a bundle name becomes a web address that works', () => {
  assert.equal(slugify('Pool Safety & Risk'), 'pool-safety-risk')
  assert.equal(slugify('  Spaces   Everywhere  '), 'spaces-everywhere')
  assert.equal(slugify('!!!'), '')
})
