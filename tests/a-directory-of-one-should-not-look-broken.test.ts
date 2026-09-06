import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const page = read('src/app/consultancy/page.tsx')

// One practice in a three-column grid sat stranded on the left with two empty
// columns beside it. A consultant deciding whether to list looks at that and
// does not think "selective", they think "nobody is here and nothing works".
//
// The directory is the shop window for a paid Featured placement, so a page
// that reads as broken is not a cosmetic problem: it is the reason somebody
// does not list.

test('the layout answers to how many practices there actually are', () => {
  assert.match(page, /filtered\.length === 1/, 'a single practice must not be laid out as one of three')
  assert.match(page, /filtered\.length === 2 \? 'md:grid-cols-2'/, 'two should share the row')
  assert.match(page, /md:grid-cols-2 xl:grid-cols-3/, 'and the third column appears only at three')
})

test('a practice with no logo still has a mark', () => {
  // An empty square is worse than initials, and a consultancy that has not got
  // round to uploading a logo is the likeliest kind to be browsing.
  assert.match(page, /function monogram/, 'there must be a fallback mark')
  assert.match(page, /\|\| 'C'/, 'and it must survive a nameless practice without rendering nothing')
})

test('the wide card earns the room it takes', () => {
  // Given the whole width, it should say more rather than stretch the same
  // three lines across it.
  assert.match(page, /profile\.summary/, 'the fuller description is shown when there is space for it')
  assert.match(page, /wide \? 5 : 3/, 'and more specialisms')
  assert.match(page, /View the practice/, 'with somewhere obvious to go next')
})

test('the directory keeps to the public-page rules', () => {
  // Public marketing pages carry no drop shadows on this platform, and the
  // neutral palette is warm white and #f1f1f1 only. Readiness enforces both;
  // this pins them at the point they are easiest to break by eye.
  assert.doesNotMatch(page, /shadow-(sm|md|lg|xl)/, 'no card drop shadows on a public page')
  assert.doesNotMatch(page, /#fafafa|#f7f7f7/i, 'no off-palette greys')
})

// Consultancy was the one that got noticed, but it was never the only one.
// Residency lists into two columns and has exactly one specialist; Properties
// lists into three. The same single item, the same empty columns beside it.
//
// These two keep their cards and change only their grid. Consultancy earned a
// redesigned card because it is the page selling a paid Featured placement and
// the one actually looked at; restructuring two complex cards that nobody has
// laid eyes on is how you turn one visible fault into three invisible ones.
test('no public directory strands a single listing', () => {
  const residency = read('src/app/residency/page.tsx')
  assert.match(residency, /filtered\.length === 1 \? 'max-w-3xl mx-auto'/,
    'one specialist must read as a column, not as half a broken grid')

  const properties = read('src/app/properties/page.tsx')
  assert.match(properties, /properties\.length === 1 \? 'max-w-xl mx-auto'/,
    'one property must not sit alone against two empty columns')
  assert.match(properties, /properties\.length === 2 \?/,
    'and two must not leave a third column hanging')
})
