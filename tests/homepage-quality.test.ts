import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('homepage renders one prioritised hero image instead of every slide', () => {
  const source = read('src/components/HeroCarousel.tsx')
  assert.match(source, /src=\{slide\.image\.url\}/)
  assert.match(source, /fetchPriority=\{current === 0 \? 'high' : 'auto'\}/)
  assert.match(source, /new window\.Image\(\)/)
  assert.doesNotMatch(source, /slides\.map\(\(item, index\)[\s\S]*?<img/)
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

test('footer copy uses readable public-site contrast', () => {
  const source = read('src/components/Footer.tsx')
  assert.match(source, /bg-\[#1c1b1a\]/)
  assert.match(source, /text-white\/65/)
  assert.match(source, /text-white\/60/)
  assert.doesNotMatch(source, /text-white\/20/)
})

test('site icon follows the uploaded brand logo', () => {
  const source = read('src/app/layout.tsx')
  const brand = read('src/lib/site-content.ts')
  assert.match(source, /icons: \{ icon: logo\.url, apple: logo\.url \}/)
  assert.match(source, /export async function generateMetadata/)
  assert.doesNotMatch(source, /icon: '\/favicon\.ico'/)
  assert.match(brand, /url: '\/images\/whc-logo-charcoal\.jpg'/)
})
