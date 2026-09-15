import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  parsePublicPagesContent, cloneDefaultPublicPagesContent,
  PAGE_NAMES, PAGE_PATHS, PAGE_SECTIONS, PUBLIC_PAGE_SLUGS,
} from '../src/lib/public-page-content'

// Her photographs kept reverting to stock and nothing said why.
//
// Stored page content was validated strictly, and on any failure thrown away
// in favour of the code defaults. That was survivable for as long as the shape
// never changed. The moment six pages and a list of questions were added to
// the schema, every draft and every published version saved before that
// stopped validating - so every read returned the defaults, and the owner
// watched her pictures turn back into stock photographs each time she opened
// the screen. She reported it as "these are old photos", which is exactly what
// it looked like from the outside.
//
// Adding a field must never be able to erase somebody's work.

test('content saved before a field existed survives the field being added', () => {
  const saved: any = cloneDefaultPublicPagesContent()
  saved.pages.properties.hero.heading = 'Her heading'
  saved.editorialBand[0].url = 'https://example.com/her-photograph.jpg'

  // A version from before the newer pages and the questions existed.
  delete saved.pages.about
  delete saved.pages.contact
  delete saved.pages['agency-cover']
  delete saved.faq

  const parsed = parsePublicPagesContent(saved)
  assert.equal(parsed.pages.properties.hero.heading, 'Her heading',
    'her wording was discarded because a different page was missing')
  assert.equal(parsed.editorialBand[0].url, 'https://example.com/her-photograph.jpg',
    'her photograph was discarded, which is the bug she reported')

  // And the missing pieces are filled in rather than left undefined.
  assert.ok(parsed.pages.about.hero.heading)
  assert.ok(parsed.faq.length)
})

test('an empty or unreadable value still falls back cleanly', () => {
  for (const nonsense of [null, undefined, '', 'not json', 42, []]) {
    const parsed = parsePublicPagesContent(nonsense)
    assert.ok(parsed.pages.properties.hero.heading, `${String(nonsense)} produced no usable content`)
  }
})

test('a stored list wins outright rather than being merged', () => {
  // Merging arrays element by element would resurrect a question she had
  // deleted, which is a worse failure than losing the edit: it comes back and
  // she cannot work out why.
  const saved: any = cloneDefaultPublicPagesContent()
  saved.faq = [{ title: 'Only this one', items: [{ question: 'Q', answer: 'A' }] }]
  delete saved.pages.about

  const parsed = parsePublicPagesContent(saved)
  assert.equal(parsed.faq.length, 1, 'deleted questions came back')
  assert.equal(parsed.faq[0].title, 'Only this one')
})

test('every page has a name and a path, in one place', () => {
  // There were two copies of these, and the one on the Pictures screen was
  // typed loosely enough that adding six pages to the other went unnoticed.
  for (const slug of PUBLIC_PAGE_SLUGS) {
    assert.ok(PAGE_NAMES[slug], `${slug} has no name`)
    assert.ok(PAGE_PATHS[slug]?.startsWith('/'), `${slug} has no path`)
  }
  for (const file of ['src/app/admin/website/pages/page.tsx', 'src/app/admin/images/page.tsx']) {
    const source = readFileSync(file, 'utf8')
    assert.match(source, /const pageNames = PAGE_NAMES/, `${file} keeps its own copy of the names`)
    assert.match(source, /const pagePaths = PAGE_PATHS/, `${file} keeps its own copy of the paths`)
  }
})

test('the Pictures screen offers a picture only where one is shown', () => {
  // Same rule as the page editor. Two admin screens disagreeing about whether
  // a page has a hero photograph is how somebody uploads one and then cannot
  // find it.
  const source = readFileSync('src/app/admin/images/page.tsx', 'utf8')
  assert.match(source, /if \(sections\.heroImage\)/)
  assert.match(source, /if \(sections\.blocks\)/)

  const withPictures = PUBLIC_PAGE_SLUGS.filter(slug => PAGE_SECTIONS[slug].heroImage)
  assert.equal(withPictures.length, 5, 'five pages carry photographs; the rest are wording only')
})

test('a rejected save says which field', () => {
  // "Some page fields are invalid" names nothing, so the only way to find out
  // was to change one thing at a time and press save again.
  const route = readFileSync('src/app/api/admin/public-pages/route.ts', 'utf8')
  assert.match(route, /strict\.error\.issues\[0\]/)
  assert.match(route, /That could not be saved: /)
})

test('a save is repaired rather than refused, because a refused save loses the upload', () => {
  // This is the part that actually cost her the photographs, and it is worth
  // being precise about the mechanism. A rejected save saves nothing at all.
  // So while her open editor held a version from before six pages were added,
  // every picture she uploaded was refused and dropped, the live site went on
  // serving the last thing that had published, and the message named no field.
  // From where she was standing the site simply kept showing old photographs.
  const route = readFileSync('src/app/api/admin/public-pages/route.ts', 'utf8')
  assert.match(route, /function parseSubmittedContent/)
  assert.match(route, /const repaired = parsePublicPagesContent\(content\)/,
    'a submission older than the schema must be filled in, not thrown away')
  assert.match(route, /const parsed = parseSubmittedContent\(body\.content\)/)

  // Both branches write the repaired content, so a publish cannot store one
  // shape and a draft another.
  const writes = route.match(/JSON\.stringify\(parsed\.data\)/g) || []
  assert.ok(writes.length >= 3, 'draft and published must both write the checked content')

  // Still refused when it is genuinely unreadable, and still says where.
  assert.match(route, /That could not be saved: /)
})
