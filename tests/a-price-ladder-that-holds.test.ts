import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  categoryPacks, everythingPacks, departmentPacks, journeyPacks, guestJourneyPack, packBySlug,
  capped, sumSingles, singlePriceFor, cheapestSingle, kindPrices, KIND_PRICE, KIND_PRICE_KEY,
  type Pack, type Prices,
} from '../src/lib/documents/pricing'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { kindOf } from '../src/lib/documents/journey'

// The rule the shop was breaking in public.
//
// Every pack was described as costing roughly a third of its documents bought
// one at a time. Five of the fourteen cost more. The pool safety pack was four
// documents at 495 pounds, and the same four sat at 39 pounds each in the
// searchable list on the same page. A buyer who can do that sum, in front of
// both numbers, does not conclude they have found a discount.
//
// So the rule is enforced in one function and checked here against every pack
// the shop can show or the till can charge, at the default prices and at some
// deliberately awkward ones.

const everyPack = (prices: Prices = {}): Pack[] => [
  ...categoryPacks(prices), ...everythingPacks(prices), ...departmentPacks(prices).map(p => capped(p, prices)),
  ...journeyPacks(prices).map(p => capped(p, prices)), capped(guestJourneyPack(prices), prices),
]

const referencesIn = (pack: Pack) =>
  sellableCatalogue().map(entry => entry.reference).filter(pack.includes)

for (const [name, prices] of [
  ['the prices as written', {}],
  ['a procedure put up to fifty pounds', { 'single-sop': 5000 }],
  ['every kind at a pound', Object.fromEntries(Object.values(KIND_PRICE_KEY).map(key => [key, 100]))],
] as [string, Prices][]) {
  test(`no pack costs more than its own documents, with ${name}`, () => {
    const over = everyPack(prices)
      .filter(pack => pack.count > 0)
      .map(pack => ({ slug: pack.slug, pack: pack.price, parts: sumSingles(referencesIn(pack), prices) }))
      .filter(row => row.parts > 0 && row.pack > row.parts)
    assert.deepEqual(over, [])
  })
}

test('the till charges what the shop showed', () => {
  // packBySlug is what the checkout prices from, and it caps separately. A
  // shop showing one number and a till taking another is a refund.
  for (const pack of [...categoryPacks(), ...everythingPacks()]) {
    assert.equal(packBySlug(pack.slug)?.price, pack.price, pack.slug)
  }
})

test('a procedure is ten pounds and every kind has its own price', () => {
  assert.equal(KIND_PRICE['single-sop'], 1000)
  assert.equal(cheapestSingle(), 1000)
  // Eleven kinds, and no two of the load-bearing ones accidentally equal: a
  // risk assessment priced like a checklist is the fault this replaced.
  assert.equal(kindPrices().length, 11)
  assert.ok(KIND_PRICE['single-ra'] > KIND_PRICE['single-chk'])
  assert.ok(KIND_PRICE['single-nop'] > KIND_PRICE['single-ra'])
})

test('every document in the library has a price', () => {
  for (const entry of sellableCatalogue()) {
    const price = singlePriceFor(entry.reference)
    assert.ok(price > 0, entry.reference)
    assert.ok(Number.isInteger(price), `${entry.reference} is not whole pence`)
  }
})

test('her override wins over the default, for every kind', () => {
  for (const [code, key] of Object.entries(KIND_PRICE_KEY)) {
    const reference = sellableCatalogue().find(entry => kindOf(entry.reference) === code)?.reference
    if (!reference) continue
    assert.equal(singlePriceFor(reference, { [key]: 12345 }), 12345, code)
  }
})

test('the complete library beats assembling it out of departments', () => {
  // The hole this closes: four departments used to be half the library for
  // half the price, which made the two and a half thousand pound option the
  // one nobody should take. A big department is still the best value per
  // document, and that is a bulk deal rather than a leak, because buying the
  // whole shelf that way costs more and delivers less.
  const library = everythingPacks().find(pack => pack.slug === 'the-complete-library')!
  const departments = departmentPacks().map(pack => capped(pack, {}))
  const allSeparately = departments.reduce((total, pack) => total + pack.price, 0)
  const covered = departments.reduce((total, pack) => total + pack.count, 0)
  assert.ok(allSeparately > library.price,
    `every department separately is ${allSeparately}, the library is ${library.price}`)
  assert.ok(covered < library.count, 'and it still does not cover the whole library')
})
