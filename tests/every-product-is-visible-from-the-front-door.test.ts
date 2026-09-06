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

test('every product is one click from the front door', () => {
  for (const href of ['/jobs', '/properties', '/agency/about', '/residency', '/consultancy', '/academy', '/intelligence']) {
    assert.ok(navbar.includes(`href: '${href}'`),
      `${href} must be a top-level link, not buried in a menu`)
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
  const flat = /const publicLinks = \[/
  assert.match(navbar, flat)
  for (const href of ['/jobs', '/properties', '/agency/about', '/academy', '/residency', '/consultancy', '/intelligence']) {
    assert.ok(navbar.includes(`{ href: '${href}', label:`),
      `${href} appears in both navigations`)
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
