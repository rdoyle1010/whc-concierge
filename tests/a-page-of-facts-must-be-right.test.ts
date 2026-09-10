import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INDUSTRY_GROUPS, TOTAL_BODIES } from '../src/lib/industry-bodies'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// A reference page earns its place by being right. One wrong fact, one dead
// link or one body quietly described as a partner and the whole page stops
// being worth reading - and it is exactly the sort of page that gets written
// once and never checked again.

test('every organisation is complete and reachable', () => {
  assert.ok(INDUSTRY_GROUPS.length >= 4)
  assert.ok(TOTAL_BODIES >= 8)
  const seen = new Set<string>()
  for (const group of INDUSTRY_GROUPS) {
    assert.ok(group.id && group.title && group.intro, `${group.id} needs a title and an intro`)
    assert.ok(group.bodies.length > 0, `${group.title} has no entries`)
    for (const body of group.bodies) {
      assert.ok(body.name, 'every entry needs a name')
      assert.match(body.url, /^https:\/\//, `${body.name} must link over https`)
      // Not a placeholder, not a stub: both paragraphs have to say something.
      assert.ok(body.what.length > 80, `${body.name} needs a real description`)
      assert.ok(body.whyItMatters.length > 80, `${body.name} needs a real reason to click`)
      assert.ok(body.tags.length > 0, `${body.name} needs at least one tag`)
      assert.ok(!seen.has(body.url), `${body.url} is listed twice`)
      seen.add(body.url)
    }
  }
})

test('the four organisations we were asked for are all there', () => {
  const urls = INDUSTRY_GROUPS.flatMap(group => group.bodies.map(body => body.url))
  for (const url of ['https://www.babtac.com/', 'https://www.spa-uk.org/', 'https://www.spa-well.com/', 'https://europeanspamagazine.com/']) {
    assert.ok(urls.includes(url), `${url} is missing`)
  }
})

test('nobody is implied to be a partner', () => {
  // Inclusion is not endorsement in either direction, and saying so protects
  // both sides. A directory that blurs the line is a directory nobody trusts.
  const page = read('src/app/good-to-know/page.tsx')
  assert.match(page, /not affiliated with any of them/)
  assert.match(page, /nothing here is a recommendation/)
  assert.match(page, /from the organisation&apos;s own published material/)
})

test('an outbound link cannot be used against us', () => {
  const page = read('src/app/good-to-know/page.tsx')
  assert.match(page, /rel="noreferrer noopener"/, 'external links open safely or not at all')
  assert.match(page, /target="_blank"/)
})

test('the page can actually be found', () => {
  assert.match(read('src/components/Footer.tsx'), /href: '\/good-to-know'/,
    'a reference page nobody can navigate to helps nobody')
  assert.match(read('src/app/sitemap.ts'), /\$\{BASE\}\/good-to-know`/)
})

test('a founding brand is told a price exists before it is charged one', () => {
  // Saying it now, while it is generous, is cheaper than saying it later when
  // it is an invoice.
  const apply = read('src/app/brands/apply/page.tsx')
  assert.match(apply, /complimentary for our founding houses/)
  assert.match(apply, /Later brands will be a paid listing/)
})
