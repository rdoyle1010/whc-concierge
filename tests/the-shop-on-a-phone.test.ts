import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const raw = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) =>
  raw(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const page = body('src/app/standards/page.tsx')

// Most people meet this page on a phone. It was built and looked at on a
// desktop, where the prices are a scroll wheel away, and the same page on a
// 390 pixel screen put the first number roughly six screens down: a hero,
// three trust blocks, and six A4 pages photographed at full width. Six
// portrait images at 620 by 877 in a 342 pixel column is 484 pixels each,
// which is nearly four phone screens of pictures on its own.

test('a price is in the first screen, not six screens down', () => {
  const hero = page.slice(0, page.indexOf('id="ways-to-buy"'))
  const heroTop = hero.slice(0, hero.indexOf('See what it costs'))
  // The cheapest document in the library, worked out from the per-kind
  // prices rather than a flat number that applied to a cleaning checklist and
  // a pool emergency plan alike.
  assert.match(heroTop, /formatPrice\(from\)/,
    'the cheapest way in is said before the first button')
  assert.match(heroTop, /formatPrice\(COMPLETE_LIBRARY_PRICE\)/,
    'and the ceiling, so nobody has to guess whether this is a four figure decision')
  assert.match(heroTop, /VAT_NOTE/, 'a price without the VAT position is a price somebody disputes later')
})

test('the six document pages swipe on a phone rather than stacking', () => {
  const gallery = page.slice(page.indexOf('See inside'), page.indexOf('id="ways-to-buy"'))
  assert.match(gallery, /snap-x snap-mandatory/, 'it scrolls one page at a time')
  assert.match(gallery, /overflow-x-auto/)
  // And it is still a grid from small upwards, where there is room for one.
  assert.match(gallery, /sm:grid/)
  assert.match(gallery, /sm:overflow-visible/)
  assert.match(gallery, /w-\[74%\] shrink-0/, 'the next one peeks, or nobody knows to swipe')
  assert.match(gallery, /Swipe to see all/, 'and it says so')
  // Nothing was dropped to make it fit. The pictures are the argument.
  assert.equal((raw('src/app/standards/page.tsx').match(/src: '\/images\/standards\//g) || []).length, 6)
})

test('the price is reachable from anywhere on a fifteen screen page', () => {
  const bar = body('src/components/StandardsStickyBuy.tsx')
  assert.match(bar, /fixed inset-x-0 bottom-0/)
  assert.match(bar, /sm:hidden/, 'a desktop has a scroll wheel and does not need this')
  // Not over the hero, which already carries the price, and not over the
  // footer, which it would otherwise cover.
  assert.match(bar, /window\.scrollY > 700/)
  assert.match(bar, /document\.body\.scrollHeight - 400/)
  assert.match(bar, /aria-hidden=\{!show\}/, 'hidden means hidden to a screen reader too')
  assert.match(bar, /pointer-events-none/, 'and untappable while off screen')
  assert.ok(page.includes('<StandardsStickyBuy from={formatPrice(from)} />'))
})

test('the second hero paragraph waits until there is room for it', () => {
  // A good line, and the third thing said. On a 390 pixel screen that is the
  // difference between a price being visible and being a scroll away.
  const hero = page.slice(0, page.indexOf('See what it costs'))
  assert.match(hero, /hidden max-w-xl text-\[15px\] leading-relaxed text-\[#57544c\] sm:block/)
})

test('the first screen offers a document to open, not a statistic to read', () => {
  // Three numbers in a hairline grid used to sit here: 561 documents, 144
  // pages, 61 hazards. All facts about the seller, and none of them the
  // question a stranger has, which is whether the documents are any good. It
  // is also where "pages of safety procedure" wrapped to four lines inside a
  // 114 pixel column, which is a statistic nobody reads on a phone.
  const hero = page.slice(0, page.indexOf('id="ways-to-buy"'))
  assert.doesNotMatch(hero, /grid-cols-3 gap-px/, 'the hairline stat grid is gone')
  assert.match(hero, /api\/standards\/sample\?reference=/,
    'a complete document can be opened from the first screen')
  assert.match(hero, /Free, now, no sign-up/,
    'and nothing is asked for in exchange, because a form halves the number who see it')
})
