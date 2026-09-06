import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const page = readFileSync(join(process.cwd(), 'src/app/consultancy/page.tsx'), 'utf8')

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
