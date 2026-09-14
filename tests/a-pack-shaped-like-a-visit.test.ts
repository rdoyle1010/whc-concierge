import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  journeyPacks, journeyPrice, departmentPacks, tierPacks, packBySlug,
  SINGLE_DOCUMENT_PRICE, COMPLETE_LIBRARY_PRICE, JOURNEY_PACK_CEILING,
} from '../src/lib/documents/pricing'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { JOURNEY_STAGES } from '../src/lib/documents/journey'
import { ownedReferences } from '../src/lib/documents/stock'
import { PRICE_KEYS } from '../src/lib/documents/price-overrides'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('the six stages cover the library once, and nothing twice', () => {
  const packs = journeyPacks()
  assert.equal(packs.length, JOURNEY_STAGES.length)

  const seen = new Map<string, number>()
  for (const pack of packs) {
    assert.ok(pack.count > 0, `${pack.name} is empty`)
    for (const entry of sellableCatalogue()) {
      if (pack.includes(entry.reference)) seen.set(entry.reference, (seen.get(entry.reference) || 0) + 1)
    }
  }
  assert.equal(seen.size, sellableCatalogue().length, 'every document is in a stage')
  assert.deepEqual([...new Set(seen.values())], [1], 'and in exactly one')
})

test('a stage never costs more than its parts, and six never undercut the library', () => {
  for (const pack of journeyPacks()) {
    assert.ok(pack.price <= pack.count * SINGLE_DOCUMENT_PRICE,
      `${pack.name} costs more than buying its ${pack.count} documents singly`)
    assert.ok(pack.price <= JOURNEY_PACK_CEILING, `${pack.name} is above the ceiling`)
    assert.ok(pack.price >= SINGLE_DOCUMENT_PRICE, `${pack.name} is cheaper than one document`)
  }

  // If all six were cheaper than the complete library, the library would be
  // the worst way to buy everything, and the page would be arguing with
  // itself in front of the buyer.
  const six = journeyPacks().reduce((sum, pack) => sum + pack.price, 0)
  assert.ok(six > COMPLETE_LIBRARY_PRICE, `six stages cost ${six}, the library ${COMPLETE_LIBRARY_PRICE}`)

  // A tiny stage is priced off its parts rather than off the ceiling, down to
  // the floor of one document: a share of two documents rounds below the
  // price of one, and a pack cheaper than a single procedure out of it is a
  // pack that makes the single price look like a con.
  assert.ok(journeyPrice(2) < 2 * SINGLE_DOCUMENT_PRICE)
  assert.equal(journeyPrice(2), SINGLE_DOCUMENT_PRICE)
  assert.equal(journeyPrice(40), 54500)
  assert.equal(journeyPrice(1000), JOURNEY_PACK_CEILING)
  // And she can move the ceiling without touching the code.
  assert.equal(journeyPrice(1000, { journey: 60000 }), 60000)
  assert.ok(PRICE_KEYS.some(key => key.key === 'journey'), 'the ceiling is hers to change')
})

test('a stage a buyer paid for still resolves, and so does every pack ever sold', () => {
  // A slug is written into an order, and that order is the buyer's
  // entitlement for as long as they have an account. Renaming or dropping one
  // takes documents away from somebody who paid for them.
  for (const pack of [...journeyPacks(), ...departmentPacks(), ...tierPacks()]) {
    assert.ok(packBySlug(pack.slug), `${pack.slug} no longer resolves`)
  }

  const arrival = journeyPacks().find(pack => pack.slug === 'journey-arrival')
  assert.ok(arrival)
  const owned = ownedReferences([{ pack_slug: 'journey-arrival' }])
  assert.equal(owned.size, arrival!.count)

  // Departments are still sold and still owned. Somebody who bought Reception
  // in March must not lose it because the shop changed shape in September.
  assert.ok(ownedReferences([{ pack_slug: departmentPacks()[0].slug }]).size > 0)
})

test('the shop leads with the visit and keeps departments underneath', () => {
  const catalogue = body('src/components/StandardsCatalogue.tsx')
  assert.ok(catalogue.includes('journeyPacks'))
  assert.ok(catalogue.indexOf('id="stages"') < catalogue.indexOf('id="departments"'),
    'the stages come first')
  assert.ok(catalogue.includes('departmentPacks'), 'and departments are still buyable')

  const page = body('src/app/standards/page.tsx')
  assert.ok(page.includes("href: '#stages'"), 'Ways to buy points at them')
  assert.ok(!page.includes("price: 'From £"), 'the price is worked out, not typed')
})
