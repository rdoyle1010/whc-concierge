import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  journeyPacks, journeyPrice, departmentPacks, tierPacks, packBySlug,
  SINGLE_DOCUMENT_PRICE, COMPLETE_LIBRARY_PRICE, JOURNEY_PACK_CEILING,
} from '../src/lib/documents/pricing'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { LIBRARY_PLAN } from '../src/lib/documents/library-plan'
import { JOURNEY_STAGES } from '../src/lib/documents/journey'
import { ownedReferences } from '../src/lib/documents/stock'
import { PRICE_KEYS } from '../src/lib/documents/price-overrides'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('the stages cover the build plan once, and nothing twice', () => {
  const packs = journeyPacks()
  assert.equal(packs.length, JOURNEY_STAGES.length)

  const seen = new Map<string, number>()
  for (const pack of packs) {
    assert.ok(pack.count > 0, `${pack.name} is empty`)
    for (const entry of sellableCatalogue()) {
      if (pack.includes(entry.reference)) seen.set(entry.reference, (seen.get(entry.reference) || 0) + 1)
    }
  }
  assert.equal(seen.size, LIBRARY_PLAN.length, 'every procedure is in a stage')
  assert.deepEqual([...new Set(seen.values())], [1], 'and in exactly one')
})

test('the flagship suites are in no stage pack at all', () => {
  // The risk assessment suite is seven hundred and fifty and the safety
  // operating procedure four hundred and ninety-five, each on its own
  // argument. A stage pack at a third of its parts would hand both over
  // inside a six hundred and fifty pound pack with forty-eight other
  // documents, which is not a discount, it is undercutting your own flagship
  // with your own shop.
  const suites = sellableCatalogue().filter(entry => !LIBRARY_PLAN.some(p => p.reference === entry.reference))
  assert.ok(suites.length >= 17, 'the suites exist')
  for (const pack of journeyPacks()) {
    for (const entry of suites) {
      assert.equal(pack.includes(entry.reference), false, `${entry.reference} is inside ${pack.name}`)
    }
  }
  // They are in the complete library, which is the top of the ladder.
  const complete = tierPacks().find(pack => pack.slug === 'the-complete-library')
  for (const entry of suites) assert.ok(complete!.includes(entry.reference))
})

test('no single pack swallows the library', () => {
  // Management was a hundred and ninety-eight of four hundred and sixty:
  // forty-one per cent in one pack, at one price, covering both the booking
  // system configuration and the accident reporting procedure. That is not an
  // arrangement, it is a pile with a label on it.
  for (const pack of journeyPacks()) {
    assert.ok(pack.count < LIBRARY_PLAN.length * 0.3,
      `${pack.name} holds ${pack.count} of ${LIBRARY_PLAN.length}`)
  }
  // And both halves are real. A "behind the scenes" group of one is a
  // heading doing no work.
  assert.ok(journeyPacks().filter(pack => pack.group === 'visit').length >= 4)
  assert.ok(journeyPacks().filter(pack => pack.group === 'behind').length >= 4)
  assert.ok(journeyPacks().some(pack => pack.slug === 'journey-training'), 'training is its own pack')
})

test('a stage never costs more than its parts, and they never undercut the library', () => {
  for (const pack of journeyPacks()) {
    assert.ok(pack.price <= pack.count * SINGLE_DOCUMENT_PRICE,
      `${pack.name} costs more than buying its ${pack.count} documents singly`)
    assert.ok(pack.price <= JOURNEY_PACK_CEILING, `${pack.name} is above the ceiling`)
    assert.ok(pack.price >= SINGLE_DOCUMENT_PRICE, `${pack.name} is cheaper than one document`)
  }

  // If all six were cheaper than the complete library, the library would be
  // the worst way to buy everything, and the page would be arguing with
  // itself in front of the buyer.
  const everyStage = journeyPacks().reduce((sum, pack) => sum + pack.price, 0)
  assert.ok(everyStage > COMPLETE_LIBRARY_PRICE,
    `every stage costs ${everyStage}, the library ${COMPLETE_LIBRARY_PRICE}`)

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

test('the shop leads with the categories and keeps departments underneath', () => {
  // This used to assert two sections, by stage of the visit above behind the
  // scenes. That split asked a buyer to decide which half of the business
  // their problem lived in before it would show them a price, and the stage
  // half was the confusing one: nobody arrives asking for departure. One grid
  // now, in the order people ask for things.
  const catalogue = body('src/components/StandardsCatalogue.tsx')
  assert.ok(catalogue.includes('categoryPacks'))
  assert.doesNotMatch(catalogue, /stage\.group === '(visit|behind)'/, 'the split is gone')
  assert.ok(catalogue.indexOf('id="packs"') < catalogue.indexOf('id="departments"'),
    'the categories come first')
  assert.ok(catalogue.includes('departmentPacks'), 'and departments are still buyable')

  const page = body('src/app/standards/page.tsx')
  assert.ok(page.includes("href: '#packs'"), 'Ways to buy points at them')
  assert.ok(!page.includes("price: 'From £"), 'the price is worked out, not typed')
})
