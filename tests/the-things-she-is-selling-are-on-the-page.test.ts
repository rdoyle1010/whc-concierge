import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const navbar = body('src/components/Navbar.tsx')
const home = body('src/app/page.tsx')
const footer = body('src/components/Footer.tsx')

// These two were moved to the footer on the grounds that both list almost
// nothing, and put back on better grounds: they are what she is selling. A
// hotel deciding whether to be listed and a product house deciding whether to
// advertise both arrive at the top of the page, and a surface being actively
// sold cannot live only in a footer.
test('the things she sells are at the top of the page', () => {
  for (const href of ['/properties', '/brands']) {
    assert.match(navbar, new RegExp(`href: '${href}'`), `${href} is what she is selling and belongs in the header`)
  }
  // And still in the footer, which is where the full map lives.
  for (const href of ['/properties', '/brands']) {
    assert.match(footer, new RegExp(`href: '${href}'`))
  }
})

// A header link sends somebody to a directory, and a directory argues for
// itself only once it is full. The proposition has to be argued somewhere
// that works on day one.
test('the proposition is argued on the homepage, not only linked', () => {
  assert.match(home, /function SellingBand\(\)/)
  assert.match(home, /<SellingBand \/>/, 'defined and not rendered is the oldest bug there is')
  assert.match(home, /For properties/)
  assert.match(home, /For product houses/)
  // A way in for each, and a way to find out what it costs before committing.
  for (const href of ['/register/employer', '/advertise', '/pricing', '/brands']) {
    assert.ok(home.includes(`'${href}'`), `the band offers no route to ${href}`)
  }
})

// Nothing here may quote how many properties or brands are on the platform.
// That number is one and nearly zero, and saying it would undo the argument
// the copy is making.
test('the selling band counts nothing', () => {
  const start = home.indexOf('function SellingBand()')
  const band = home.slice(start, home.indexOf('function FeaturedPlacementsSection'))
  assert.ok(start > 0)
  assert.doesNotMatch(band, /\.length/, 'no count of anything reaches this copy')
  assert.doesNotMatch(band, /\bjoin(ed)? (us|the) \d|\d+ (properties|brands|hotels)\b/i)
})

// What made the header look crowded was never the count. Nine long uppercase
// labels at wide tracking, spanning the full width, with "Browse Roles"
// wrapping onto two lines.
test('the header is calmer without hiding anything', () => {
  assert.match(navbar, /whitespace-nowrap/, 'no label wraps onto a second line')
  assert.match(navbar, /tracking-\[0\.11em\]/, 'tighter than the 0.16em that made nine labels span the width')
  assert.doesNotMatch(navbar, /gap-8/, 'and closer together')
  assert.match(navbar, /label: 'Roles'/, 'Browse Roles was the label that wrapped')

  // Still no dropdowns. That decision stands.
  assert.doesNotMatch(navbar, /publicGroups|Flexible Work/)
})
