import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanBrandSlug, normaliseBrand, secureImageUrl, validateBrand } from '../src/lib/brand-profiles'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// A property gets a page that argues for it. A product house, which is the
// business a spa director actually has to be persuaded about, got nothing -
// even though a brand that gives the Academy a masterclass has given us
// something real and should get something back.

test('a draft is invisible until it is finished and published', () => {
  const migration = read('supabase/migrations/20260907190000_a_brand_makes_its_case.sql')
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/)
  assert.match(migration, /USING \(is_published = true\)/,
    'the only public read is a published brand; a draft the public can read is not a draft')
  assert.match(migration, /is_published boolean NOT NULL DEFAULT false/,
    'a brand page must be born as a draft')

  const page = body('src/app/brands/[slug]/page.tsx')
  assert.match(page, /\.eq\('is_published', true\)/,
    'the detail page must not serve a draft even to somebody who guesses the address')
})

test('a half-written page cannot go live', () => {
  // A brand page that makes the brand look worse than no page is the opposite
  // of the deal we offered them.
  const draft = normaliseBrand({ slug: 'x', name: 'X' })
  assert.equal(validateBrand(draft), null, 'a draft may be saved unfinished')

  const publishing = normaliseBrand({ slug: 'x', name: 'X', is_published: true })
  assert.match(String(validateBrand(publishing)), /proposition/)

  const withUsp = normaliseBrand({ slug: 'x', name: 'X', is_published: true, usp: 'A line.' })
  assert.match(String(validateBrand(withUsp)), /case for stocking it/)

  const complete = normaliseBrand({ slug: 'x', name: 'X', is_published: true, usp: 'A line.', why_spas: 'The case.' })
  assert.equal(validateBrand(complete), null)

  assert.match(String(validateBrand(normaliseBrand({ slug: '', name: 'X' }))), /web address/)
  assert.match(String(validateBrand(normaliseBrand({ slug: 'x', name: '' }))), /name/)
})

test('an address is an address and a picture is secure', () => {
  assert.equal(cleanBrandSlug('  Carol Joy London! '), 'carol-joy-london')
  assert.equal(cleanBrandSlug('../../etc/passwd'), 'etc-passwd')
  assert.equal(cleanBrandSlug('---'), '')
  // A page arguing a brand is worth five figures a year cannot serve its logo
  // over plain http and show a mixed-content block at exactly the wrong moment.
  assert.equal(secureImageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg')
  assert.equal(secureImageUrl('http://example.com/a.jpg'), null)
  assert.equal(secureImageUrl('javascript:alert(1)'), null)
  assert.equal(secureImageUrl(''), null)
})

test('the page asks the questions a spa director asks', () => {
  const page = body('src/app/brands/[slug]/page.tsx')
  for (const section of ['The proposition', 'Why a spa stocks it', 'How your therapists sell it']) {
    assert.ok(page.includes(section), `the page must carry "${section}"`)
  }
  assert.match(page, /director_quote/, "the person who runs the house has to be on the page")
  assert.match(page, /<blockquote/)
})

test('the bargain is visible from both sides', () => {
  // A brand gives the Academy a masterclass and gets a page. A page with no
  // route to the course is half of what either side agreed to.
  const page = body('src/app/brands/[slug]/page.tsx')
  assert.match(page, /academy_course_slug/)
  assert.match(page, /\/academy#\$\{brand\.academy_course_slug\}/)
  // And the house named here must be the same string the match score reads,
  // rather than three similar ones.
  assert.match(page, /product_house_name/)
})

test('brands are reachable and administrable', () => {
  assert.match(read('src/components/Navbar.tsx'), /\{ href: '\/brands', label: 'Brands' \}/,
    'a page nobody can navigate to is a page nobody reads')
  assert.match(read('src/components/DashboardShell.tsx'), /href: '\/admin\/brands'/)

  const api = body('src/app/api/admin/brands/route.ts')
  assert.match(api, /adminRequestOutcome/, 'the shared admin guard, not a private copy')
  assert.match(api, /ADMIN_REFUSAL_MESSAGE\[refusal\]/)
  assert.doesNotMatch(api, /error: 'Unauthorised'/)
})

test('a directory of one does not look broken', () => {
  // The same lesson as the Consultancy page: the first brand will be alone on
  // this page for a while, and it has to look deliberate.
  const page = body('src/app/brands/page.tsx')
  assert.match(page, /brands\.length === 1/)
  assert.match(page, /wide=\{brands\.length === 1\}/)
})
