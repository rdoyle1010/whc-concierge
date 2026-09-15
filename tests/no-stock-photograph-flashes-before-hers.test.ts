import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DEFAULT_PUBLIC_PAGES_CONTENT, PUBLIC_PAGE_SLUGS } from '../src/lib/public-page-content'

// "Still sat behind."
//
// Two screenshots of the same Residency page, seconds apart, with different
// photographs in the hero. Not a cache and not a failed upload: the pages that
// load their content in the browser painted the code's default first and
// swapped to hers a moment later. So every visitor to Residency, Properties
// and Agency saw a stock photograph before the real one, on every load, and
// the owner - reloading the page repeatedly to check her uploads - saw the old
// pictures apparently sitting behind the new ones.
//
// The footer band had exactly this bug and was fixed by emptying its four
// URLs, with a comment beside them explaining why. The page defaults were
// missed and kept twenty.

const PAGES_WITH_PICTURES = [
  'src/app/properties/page.tsx',
  'src/app/residency/page.tsx',
  'src/app/pricing/page.tsx',
  'src/app/coming-soon/page.tsx',
  'src/app/agency/about/page.tsx',
]

test('no photograph ships in the code', () => {
  const defaults = readFileSync('src/lib/public-page-content-values.ts', 'utf8')
  assert.doesNotMatch(defaults, /images\.unsplash\.com/,
    'a stock photograph in the defaults is a stock photograph every visitor sees first')

  // Not just Unsplash. Any address at all in a default image is one that gets
  // painted before hers arrives.
  for (const slug of PUBLIC_PAGE_SLUGS) {
    const page = DEFAULT_PUBLIC_PAGES_CONTENT.pages[slug]
    assert.equal(page.hero.image.url, '', `${slug} ships a hero photograph`)
    for (const [index, block] of page.blocks.entries()) {
      assert.equal(block.image.url, '', `${slug} section ${index + 1} ships a photograph`)
    }
  }
  for (const tile of DEFAULT_PUBLIC_PAGES_CONTENT.editorialBand) {
    assert.equal(tile.url, '', 'the footer band must stay empty too')
  }
})

test('the alt text and the crops survive, because those are the design', () => {
  // Emptying the URLs must not empty the descriptions. Alt text is what a
  // screen reader gets and what the admin screen labels each slot with.
  const withAlt = PUBLIC_PAGE_SLUGS.filter(slug => DEFAULT_PUBLIC_PAGES_CONTENT.pages[slug].hero.image.alt)
  assert.ok(withAlt.length >= 5, 'the descriptions were thrown away with the pictures')

  for (const tile of DEFAULT_PUBLIC_PAGES_CONTENT.editorialBand) {
    assert.ok(tile.alt && tile.label, 'the band lost its labels')
  }
})

test('an empty picture renders nothing, not a broken one', () => {
  // An img with an empty src is not nothing: it draws a broken-image glyph and
  // in some browsers re-requests the page itself. The footer already guarded
  // this; the pages never had to, because they always had a stock photograph
  // to fall back on.
  for (const file of PAGES_WITH_PICTURES) {
    const source = readFileSync(file, 'utf8')
    const images = source.match(/<img\b[^>]*?src=\{(?:cms|b|block)[A-Za-z0-9_.[\]]*\.image\.url\}/g) || []
    for (const tag of images) {
      const at = source.indexOf(tag)
      const before = source.slice(Math.max(0, at - 90), at)
      assert.match(before, /\.image\.url \? $|\.image\.url \?\s*$/,
        `${file} renders an image without checking it has one: ${tag.slice(0, 60)}`)
    }
  }
})
