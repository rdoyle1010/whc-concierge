import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
/** Source with comments stripped: a phrase explained in prose is not a phrase shipped. */
const body = (source: string) => source
  .split('\n').filter(line => !line.trim().startsWith('//')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

const navbar = read('src/components/Navbar.tsx')
const navbarCode = body(navbar)
const footer = read('src/components/Footer.tsx')

// The public navigation was two dropdowns. Careers held Roles, Match and
// Properties; Flexible Work held Agency, Residency and Consultancy.
//
// Two things were wrong with that. Consultancy is not flexible work - it is
// advisers, designers and operators engaged on projects, not shift cover - so
// the label told visitors something untrue about a paid product. And
// Properties, the page a hotel is most likely to want, was two clicks from the
// front door.
//
// Six revenue lines with half of them behind a hover is a discovery problem
// dressed up as tidiness.

// What has changed since, and what has not.
//
// The header carried all nine and two of them led somewhere effectively
// empty: the public Properties directory holds one approved property, ours,
// and Brands reads brand_profiles, which has no advertisers on it yet. A
// header that advertises nine sections and delivers seven teaches a visitor
// the site is thinner than it looks.
//
// So the rule is no longer "every product is in the header". It is that every
// product is reachable from the front page without a hover, in the header or
// the footer, and that anything taken out of the header lands in the footer
// rather than nowhere. That protects the original concern, which was
// discovery, without requiring the header to advertise empty rooms.
test('every product is reachable from the front page', () => {
  const everything = ['/jobs', '/properties', '/brands', '/agency/about', '/residency', '/consultancy', '/academy', '/events', '/intelligence']
  for (const href of everything) {
    const inHeader = navbar.includes(`href: '${href}'`)
    const inFooter = footer.includes(`href: '${href}'`)
    assert.ok(inHeader || inFooter, `${href} is reachable from neither the header nor the footer`)
  }

  // The live revenue lines with something behind them stay at the top.
  //
  // Events and Insight came out on the same reasoning that took Properties
  // and Brands out: Events lists nothing yet, and a header that advertises a
  // season and delivers an empty page teaches a visitor the site is thinner
  // than it looks. Eight names across the top is a proposition; ten is a
  // directory.
  for (const href of ['/jobs', '/agency/about', '/residency', '/consultancy', '/academy']) {
    assert.ok(navbar.includes(`href: '${href}'`), `${href} belongs in the header`)
  }

  // And everything that left it has a home, which is the whole of the
  // difference between shortening a nav and orphaning a page.
  for (const href of ['/properties', '/brands', '/events', '/intelligence']) {
    assert.ok(footer.includes(`href: '${href}'`), `${href} left the header and landed nowhere`)
  }
})

test('consultancy is not filed under flexible work', () => {
  // The specific mislabelling: a consultancy engagement is a project, and
  // calling it flexible staffing misdescribes what is being sold.
  assert.doesNotMatch(navbarCode, /Flexible Work/, 'the mislabelled group is gone')
  assert.doesNotMatch(navbarCode, /publicGroups/, 'and so is the machinery behind it')
})

test('the signed-out nav matches what a member sees after signing in', () => {
  // Somebody should not have to relearn the navigation on the way in.
  //
  // This used to be two hand-maintained arrays checked against each other,
  // which is a rule that holds only while somebody remembers it. They are one
  // list now, so the two cannot drift, and the test asserts the shared source
  // rather than re-comparing two copies.
  assert.match(navbarCode, /const SITE_LINKS = \[/)
  assert.match(navbarCode, /const loggedInSiteLinks = SITE_LINKS/)
  assert.match(navbarCode, /const publicLinks = SITE_LINKS\.map/)
  for (const href of ['/jobs', '/agency/about', '/academy', '/residency', '/consultancy']) {
    assert.ok(navbarCode.includes(`{ href: '${href}', label:`),
      `${href} appears in the one navigation both sides read`)
  }
})

test('the editable labels still decide what the links are called', () => {
  // These names are CMS-editable, and flattening the menu must not quietly
  // hardcode them back.
  for (const label of ['labels.jobs', 'labels.agency', 'labels.residency', 'labels.academy']) {
    assert.ok(navbar.includes(label), `${label} must still come from the website editor`)
  }
})

test('nothing was orphaned on the way out of the menu', () => {
  // /match was reachable only from the Careers dropdown and is not in the
  // sitemap, so flattening the nav would have stranded it entirely.
  assert.match(footer, /href: '\/match'/, '/match needs a home now the dropdown is gone')
})
