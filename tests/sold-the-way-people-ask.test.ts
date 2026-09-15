import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  categoryPacks, everythingPacks, guestJourneyPack, journeyPacks, packBySlug, departmentPacks, tierPacks,
} from '../src/lib/documents/pricing'
import { sellableCatalogue } from '../src/lib/documents/catalogue'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const RETIRED = [
  'journey-pre-arrival', 'journey-arrival', 'journey-experience',
  'journey-departure', 'journey-post-departure',
]

test('a pack that stops being sold still resolves for the people who bought it', () => {
  // A slug is written into an order and that order is a buyer's entitlement
  // for as long as they have an account. Deleting a pack from the code takes
  // a paid library away from whoever bought it.
  for (const slug of RETIRED) {
    const pack = packBySlug(slug)
    assert.ok(pack, `${slug} no longer resolves, so a buyer lost their library`)
    assert.equal(pack!.retired, true, `${slug} should be marked retired`)
    assert.ok(pack!.count > 0, `${slug} resolves to nothing`)
  }
})

test('the five stages are off the shop', () => {
  const slugs = categoryPacks().map(pack => pack.slug)
  for (const slug of RETIRED) {
    assert.ok(!slugs.includes(slug), `${slug} is still on the shop`)
  }
  const shop = body('src/components/StandardsCatalogue.tsx')
  assert.doesNotMatch(shop, /journeyPacks/, 'the shop reads the categories, not the stages')
  assert.doesNotMatch(shop, /By stage of the visit/)
  assert.doesNotMatch(shop, /Behind the scenes/)
})

test('the whole visit is one pack, and it covers what the five did', () => {
  const journey = guestJourneyPack()
  const stages = journeyPacks().filter(pack => pack.retired)
  const inStages = sellableCatalogue()
    .map(entry => entry.reference)
    .filter(reference => stages.some(stage => stage.includes(reference)))

  assert.ok(inStages.length > 200, `only ${inStages.length} documents across the five stages`)
  for (const reference of inStages) {
    assert.ok(journey.includes(reference), `${reference} was in a stage pack and is in nothing now`)
  }
  assert.equal(journey.count, inStages.length, 'the one pack covers exactly what the five did')

  // And priced so it does not make the library look silly. Five stage packs
  // totalled more than the complete library, which is the arithmetic that
  // told a buyer not to trust the prices.
  const library = everythingPacks().find(pack => pack.slug === 'the-complete-library')!
  assert.ok(journey.price < library.price,
    'a pack of half the library must cost less than all of it')
  const fiveStagesUsedToCost = stages.reduce((total, stage) => total + stage.price, 0)
  assert.ok(journey.price < fiveStagesUsedToCost, 'one pack should cost less than the five it replaces')
})

test('the shop is one grid, in the order somebody asks for things', () => {
  const packs = categoryPacks()
  // Risk assessments first: it is the single most searched thing a spa buys,
  // and it is what an inspector asks for before anything else.
  assert.equal(packs[0].slug, 'risk-assessments')
  assert.ok(packs.length >= 10, `only ${packs.length} categories`)

  // No duplicates, and every one resolves to documents.
  const slugs = packs.map(pack => pack.slug)
  assert.equal(new Set(slugs).size, slugs.length, 'a pack is listed twice')
  for (const pack of packs) {
    assert.ok(pack.count > 0, `${pack.slug} is an empty category`)
    assert.ok(pack.price > 0, `${pack.slug} has no price`)
  }

  // The names people search for are the names on the cards.
  const names = packs.map(pack => pack.name.toLowerCase()).join(' | ')
  for (const word of ['risk assessment', 'financial reporting', 'recruitment', 'training', 'guest journey']) {
    assert.ok(names.includes(word), `nothing on the shop is called "${word}"`)
  }
})

test('the two buy-everything options are kept apart from the categories', () => {
  // Somebody who wants all of it is not comparing categories, and burying the
  // library among eleven packs makes it look like a twelfth.
  const everything = everythingPacks().map(pack => pack.slug)
  assert.deepEqual(everything, ['before-the-first-guest', 'the-complete-library'])
  const categories = categoryPacks().map(pack => pack.slug)
  for (const slug of everything) {
    assert.ok(!categories.includes(slug), `${slug} is in both blocks`)
  }
  assert.ok(body('src/components/StandardsCatalogue.tsx').includes('Or all of it'))
})

test('the new price is hers to change, like every other', () => {
  const overrides = body('src/lib/documents/price-overrides.ts')
  assert.match(overrides, /key: 'guest-journey'/)
  assert.match(overrides, /fallback: GUEST_JOURNEY_PRICE/)
})

test('nothing on the shop points at a section that no longer exists', () => {
  const page = body('src/app/standards/page.tsx')
  const shop = body('src/components/StandardsCatalogue.tsx')
  const targets = new Set([
    ...[...shop.matchAll(/id="([^"]+)"/g)].map(match => match[1]),
    ...[...page.matchAll(/id="([^"]+)"/g)].map(match => match[1]),
    ...[...body('src/components/StandardsList.tsx').matchAll(/id="([^"]+)"/g)].map(match => match[1]),
  ])
  for (const source of [page, shop, body('src/components/StandardsStickyBuy.tsx')]) {
    for (const [, anchor] of source.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(targets.has(anchor), `#${anchor} is linked and nothing has that id`)
    }
  }
})
