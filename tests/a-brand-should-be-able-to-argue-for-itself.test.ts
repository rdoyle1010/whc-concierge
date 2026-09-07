import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanBrandSlug, cleanEmail, normaliseBrand, secureImageUrl, validateBrand } from '../src/lib/brand-profiles'

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

// A directory where every entry is written by its subject is a brochure rack.
// The page carries three voices now: the commercial case, our own verdict, and
// the people who will actually have to work with the house every day.

test('the page carries three voices, not one', () => {
  const page = body('src/app/brands/[slug]/page.tsx')
  // Talent House, not Wellness House: the product carries one brand, and it is
  // the one the reader signed up to. The other test in this suite enforces it.
  assert.match(page, /Why Talent House loves it/,
    'our own verdict is the only reason anybody trusts the rest of the page')
  assert.match(page, /Why therapists love working on it/,
    'a brand the team resents never gets retailed, whatever the margin looks like')
  assert.match(page, /why_we_love_it/)
  assert.match(page, /why_therapists_love_it/)
})

test('a page that persuades gives the reader something to do', () => {
  const page = body('src/app/brands/[slug]/page.tsx')
  assert.match(page, /Who to talk to/)
  assert.match(page, /contact_email/)
  assert.match(page, /BrandEnquiryForm/)

  const form = body('src/components/BrandEnquiryForm.tsx')
  assert.match(form, /\/api\/brands\/enquire/)
  // Bots fill in every field they find; a person never sees this one.
  assert.match(form, /aria-hidden="true"/)
})

test('an enquiry reaches the brand, not just us', () => {
  const api = body('src/app/api/brands/enquire/route.ts')
  assert.match(api, /administratorEmails\(\)/)
  assert.match(api, /brand\.contact_email/,
    'a lead sitting in our inbox waiting to be forwarded is slower than the brand website')
  // The brand is read from the database, so a posted name cannot put words in
  // somebody else's mouth in an email we send.
  assert.match(api, /\.from\('brand_profiles'\)/)
  assert.match(api, /if \(!brand \|\| !brand\.is_published\)/)
  assert.match(api, /rateLimit\('brand-enquire'/)
  assert.match(api, /trim\(body\.company, 200\)/)
  // Everything printed into the email is escaped: this is a stranger's text
  // going into HTML we send to ourselves and to a partner.
  assert.match(api, /const escape =/)
})

test('a brand can apply, and the application is already most of the page', () => {
  const page = body('src/app/brands/apply/page.tsx')
  for (const field of ['usp', 'why_spas', 'why_therapists_love_it', 'how_to_sell', 'director_quote', 'hero_ingredients', 'signature_treatments', 'notable_partners']) {
    assert.ok(page.includes(field), `the application must ask for ${field}, or an administrator retypes somebody else's argument`)
  }
  assert.match(page, /Nothing is published without your approval/)

  const api = body('src/app/api/brands/apply/route.ts')
  assert.match(api, /rateLimit\('brand-apply'/)
  assert.match(api, /brand_applications/)

  // Turning one into a page must produce a draft. An application is a pitch,
  // and a pitch goes live when somebody has read it, not when it arrives.
  const admin = body('src/app/api/admin/brands/route.ts')
  assert.match(admin, /convert_application/)
  assert.match(admin, /is_published: false/)
  assert.match(admin, /A brand already lives at/, 'two brands cannot share an address')
})

test('an enquiry is never readable through the anon key', () => {
  const migration = read('supabase/migrations/20260907200000_a_brand_page_that_sells.sql')
  for (const table of ['brand_enquiries', 'brand_applications']) {
    assert.match(migration, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`))
  }
  // A named person at a named property saying what they are thinking of buying
  // must not be public. No SELECT policy is granted on either table, and an
  // RLS-enabled table with no policy denies everyone.
  assert.doesNotMatch(migration, /CREATE POLICY[^;]*brand_enquiries/)
  assert.doesNotMatch(migration, /CREATE POLICY[^;]*brand_applications/)
})

test('a brand deck is more than one picture', () => {
  const page = body('src/app/brands/[slug]/page.tsx')
  assert.match(page, /brand\.gallery\.map/)
  const admin = body('src/app/admin/brands/page.tsx')
  assert.match(admin, /uploadToGallery/)
  assert.match(admin, /multiple/, 'choosing twelve images one at a time is not a feature')
})

test('a broken picture never reaches a brand page', () => {
  const brand = normaliseBrand({
    slug: 'x', name: 'X',
    gallery: ['https://ok.example/a.jpg', 'http://insecure.example/b.jpg', 'javascript:alert(1)', ''],
  })
  assert.deepEqual(brand.gallery, ['https://ok.example/a.jpg'])
})

test('a contact address is an address', () => {
  assert.equal(normaliseBrand({ slug: 'x', name: 'X', contact_email: ' Hello@Brand.COM ' }).contact_email, 'hello@brand.com')
  assert.equal(normaliseBrand({ slug: 'x', name: 'X', contact_email: 'not-an-address' }).contact_email, null)
})
