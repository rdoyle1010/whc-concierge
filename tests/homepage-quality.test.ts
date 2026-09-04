import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('homepage renders one prioritised hero image instead of every slide', () => {
  const source = read('src/components/HeroCarousel.tsx')
  assert.match(source, /src=\{slide\.image\.url\}/)
  assert.match(source, /fetchPriority=\{current === 0 \? 'high' : 'auto'\}/)
  assert.doesNotMatch(source, /slides\.map\(\(item, index\)[\s\S]*?<img/)

  // This used to require a hand-rolled `new window.Image()` preload of the next
  // slide. The intent was right and the effect was nil: it fetched the raw
  // original from storage while the carousel renders the resized /_next/image
  // variant, so it downloaded megabytes the carousel never used and warmed no
  // cache it reads. Requiring it back would be requiring the waste.
  assert.doesNotMatch(source, /new window\.Image\(\)/, 'the manual preload fetched a file the carousel never uses')
})

test('public navigation icon buttons have accessible names and states', () => {
  const navigation = read('src/components/Navbar.tsx')
  const notifications = read('src/components/NotificationBell.tsx')
  assert.match(navigation, /aria-label=\{mobileOpen \? 'Close navigation menu' : 'Open navigation menu'\}/)
  assert.match(navigation, /aria-label="Open account menu"/)
  assert.match(navigation, /aria-expanded=\{profileOpen\}/)
  assert.match(notifications, /aria-label=\{unreadCount/)
  assert.match(notifications, /aria-expanded=\{open\}/)
})

test('homepage mockup heading does not skip a heading level', () => {
  const source = read('src/components/homepage-mockups/RoleListingMockup.tsx')
  assert.match(source, /<h3/)
  assert.doesNotMatch(source, /<h4/)
})

// The footer is a light band now, so the failure mode inverted: white text
// on it is invisible. The link columns were exactly that for one render,
// because they are declared in a helper above the <footer> element.
test('footer copy uses readable public-site contrast', () => {
  const source = read('src/components/Footer.tsx')
  const footer = source.slice(source.indexOf('<footer className='))
  assert.match(footer, /bg-\[#f1f1f1\]/, 'the footer band is light grey')
  assert.doesNotMatch(footer, /text-white\//, 'no faded white text on a light band')
  assert.match(source, /block text-\[12px\] text-secondary hover:text-ink/, 'the link columns must be ink, not white')
  assert.match(footer, /text-secondary/)
})

test('site icon follows the uploaded brand logo', () => {
  const source = read('src/app/layout.tsx')
  // DEFAULT_LOGO moved to site-content-values.ts so client components can read
  // it without pulling zod into every page. The rule is unchanged: the site
  // icon follows the brand logo.
  const brand = read('src/lib/site-content-values.ts')
  assert.match(source, /icons: \{ icon: logo\.url, apple: logo\.url \}/)
  assert.match(source, /export async function generateMetadata/)
  assert.doesNotMatch(source, /icon: '\/favicon\.ico'/)
  assert.match(brand, /url: '\/images\/whc-logo-charcoal\.jpg'/)
})

// Every query on the homepage collapses to an empty list on error, so the page
// composes around missing data. The client that runs them did not:
// createAdminClient throws when its configuration is missing and sat outside
// the try, so the one failure the busiest page on the site could not survive
// was the one nobody had guarded. It rendered an error screen instead of
// dropping a panel.
test('the homepage survives its database being unreachable', () => {
  const page = read('src/app/page.tsx')
  const calls = [...page.matchAll(/const admin = createAdminClient\(\)/g)]
  for (const call of calls) {
    const before = page.slice(Math.max(0, call.index! - 400), call.index!)
    assert.match(before, /try \{/, 'every admin client must be created inside a try')
  }
  assert.match(page, /admin = createAdminClient\(\)\n  \} catch \{/, 'and the failure must return empty rather than throw')
})
