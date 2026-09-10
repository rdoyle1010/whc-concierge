import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// The four labelled tiles above the footer shipped as four Unsplash
// photographs, and the Footer painted them before fetching the real band - so
// every visitor on every page saw four stock images swap to Rebecca's a moment
// later, which reads as a site that has not finished loading.
test('no page paints a picture it has not been given', () => {
  const values = read('src/lib/public-page-content-values.ts')
  const band = values.slice(values.indexOf('export const defaultEditorialBand'), values.indexOf('export const DEFAULT_PUBLIC_PAGES_CONTENT'))
  assert.doesNotMatch(band, /unsplash/i, 'the fallback band must not ship somebody else photography')
  assert.equal((band.match(/url: ''/g) || []).length, 4, 'all four tiles start empty')
  // The labels and crops are the design and stay.
  assert.match(band, /label: 'Spa & wellness'/)
  assert.match(band, /focalX: 50, focalY: 50/)

  // The tile already renders as a labelled empty box when there is no picture,
  // which is what makes starting empty safe.
  assert.match(read('src/components/Footer.tsx'), /\{image\.url \? <Image/)
})

// no-store meant a cold function call on every page load of the site to fetch
// four image URLs, which is most of the delay before the band settles.
test('published content the whole world shares may be cached for a moment', () => {
  const route = read('src/app/api/public-pages/route.ts').replace(/^\s*\/\/.*$/gm, '')
  assert.match(route, /'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'/)
  assert.doesNotMatch(route, /no-store/)
  // A fetch asking for no-store overrides that header, so the browser would
  // keep nothing however generous the endpoint was.
  const footer = read('src/components/Footer.tsx').replace(/^\s*\/\/.*$/gm, '')
  assert.doesNotMatch(footer, /cache: 'no-store'/)
})

// A property naming four houses is making a statement. One that has ticked
// forty-seven is filling in a form, and at display size that becomes a wall of
// brand names dwarfing the rooms, the team and the treatment menu below it.
test('a long list of brands is a list, not a headline', () => {
  const page = read('src/app/properties/[id]/page.tsx')
  const block = page.slice(page.indexOf('{productHouses.length > 0 &&'), page.indexOf('{services.length > 0 &&'))
  assert.match(block, /productHouses\.length <= 6 \?/, 'the treatment has to depend on how many there are')
  assert.match(block, /font-serif font-semibold/, 'a handful still gets the serif')
  assert.match(block, /<QuietList items=\{productHouses\}/, 'many fall into the page rhythm')
})
