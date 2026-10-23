import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
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

test('the other defaults file has no photographs either', () => {
  // This is why the same complaint survived the fix for it. Two files hold
  // defaults. The page defaults were emptied; the website content - which
  // drives the homepage slides and the dark panels - kept eight, so the
  // homepage went on painting stock pictures before hers on every load.
  const site = readFileSync('src/lib/site-content-values.ts', 'utf8').replace(/^\s*\/\/.*$/gm, '')
  assert.doesNotMatch(site, /unsplash/i,
    'the homepage slides and panels must not ship somebody else photography')
})

test('nothing renders a picture it was not given', () => {
  // next/image throws outright on an empty src, and a plain img draws a broken
  // glyph. Neither could happen while there was always a stock photograph to
  // fall back on, which is exactly why emptying the defaults had to come with
  // these guards.
  for (const file of ['src/components/HeroCarousel.tsx', 'src/components/WebsiteEditorPreview.tsx']) {
    const source = readFileSync(file, 'utf8')
    assert.match(source, /image\.url \? \(/, `${file} renders without checking there is a picture`)
  }
})

test('the third defaults file has no photographs either', () => {
  // Two files were emptied and two files were guarded, and the complaint came
  // back a third time - because the course photographs came from somewhere
  // neither test looked at. /academy painted a stock Unsplash picture at first
  // paint and replaced it with hers about three hundred milliseconds later, on
  // every course she had uploaded a photograph for.
  //
  // The lesson, written down for the fourth time: a check that only knows about
  // the places you already found is a check that passes while the bug is live.
  // This one walks the whole academy content tree rather than naming files.
  const files = [
    'src/lib/academy-extras.ts',
    'src/lib/academy-catalog-server.ts',
    'src/app/academy/AcademyBrowser.tsx',
    'src/app/talent/academy/page.tsx',
    'src/app/talent/academy/[slug]/page.tsx',
    ...readdirSync('src/lib/academy-more').filter(name => name.endsWith('.ts')).map(name => `src/lib/academy-more/${name}`),
  ]
  for (const file of files) {
    const body = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')
    assert.doesNotMatch(body, /images\.unsplash\.com/,
      `${file} ships a stock photograph, which is the one every visitor sees first`)
  }
})

test('a course with no photograph draws nothing, not an empty src', () => {
  // Emptying the defaults means displayCourseImage can return an empty string,
  // and an img with an empty src re-requests the page itself. Every course
  // image must be behind a check, and the space behind it must be painted or
  // the card collapses.
  for (const file of ['src/app/academy/AcademyBrowser.tsx', 'src/app/talent/academy/page.tsx', 'src/app/talent/academy/[slug]/page.tsx']) {
    const source = readFileSync(file, 'utf8')
    const tags = source.match(/<img\b[^>]*?src=\{(?:course\.image_url|displayCourseImage\(course\))\}/g) || []
    for (const tag of tags) {
      const before = source.slice(Math.max(0, source.indexOf(tag) - 60), source.indexOf(tag))
      assert.match(before, /&& $/, `${file} renders a course image without checking there is one`)
    }
  }
})
