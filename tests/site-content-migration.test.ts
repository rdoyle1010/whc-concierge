import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_WEBSITE_CONTENT, parseWebsiteContent } from '../src/lib/site-content'

// The published homepage lives in the database, so it predates every field
// added to the schema afterwards. A new required field would fail the parse
// and silently reset the live site to defaults, losing the admin's work.
// Every addition must therefore carry a default, and this proves it.

function storedBeforeThisRelease() {
  const stored: any = JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT))
  delete stored.brand.logo
  delete stored.panels
  stored.brand.accent = '#0b2f4d'
  stored.brand.ink = '#10283b'
  stored.brand.background = '#FFFFFF'
  stored.brand.surface = '#F5F5F5'
  stored.hero.slides[0].heading = 'A heading the admin actually saved'
  return stored
}

test('content saved before the logo and panel fields existed still parses', () => {
  const parsed = parseWebsiteContent(JSON.stringify(storedBeforeThisRelease()))
  assert.equal(parsed.hero.slides[0].heading, 'A heading the admin actually saved')
})

test('missing logo and panel fields fall back to the shipped defaults', () => {
  const parsed = parseWebsiteContent(JSON.stringify(storedBeforeThisRelease()))
  assert.equal(parsed.brand.logo.url, '/images/whc-logo-charcoal.jpg')
  assert.equal(parsed.brand.logo.fit, 'fill')
  // Both panels must ship inert: turning one on is an explicit admin choice,
  // not something a deploy does to the live homepage.
  assert.equal(parsed.panels.homepageCta.mode, 'brand')
  assert.equal(parsed.panels.authPanel.mode, 'brand')
})

test('a stored navy palette is migrated to the charcoal defaults', () => {
  const parsed = parseWebsiteContent(JSON.stringify(storedBeforeThisRelease()))
  assert.equal(parsed.brand.accent, DEFAULT_WEBSITE_CONTENT.brand.accent)
  assert.equal(parsed.brand.ink, DEFAULT_WEBSITE_CONTENT.brand.ink)
  assert.equal(parsed.brand.background, DEFAULT_WEBSITE_CONTENT.brand.background)
  assert.equal(parsed.brand.surface, DEFAULT_WEBSITE_CONTENT.brand.surface)
})

test('a logo URL cannot break out of the CSS or markup it is written into', async () => {
  const { safeLogoUrl } = await import('../src/lib/site-content')
  assert.equal(safeLogoUrl('/images/mine.png'), '/images/mine.png')
  assert.equal(safeLogoUrl('https://klfsemvrxvgrbuzrqyer.supabase.co/storage/v1/object/public/site-images/a.png'), 'https://klfsemvrxvgrbuzrqyer.supabase.co/storage/v1/object/public/site-images/a.png')
  for (const hostile of ['javascript:alert(1)', '"onload="x', "a') url('b", '//evil.example/x.png', '']) {
    assert.equal(safeLogoUrl(hostile), '/images/whc-logo-charcoal.jpg', `rejected: ${hostile}`)
  }
})
