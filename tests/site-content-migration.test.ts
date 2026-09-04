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

// Two rounds were lost to a panel that held a picture but stayed hidden
// behind a separate on/off setting. The picture is now the switch, and the
// backdrop must never gate on the mode again.
test('a panel picture is shown whenever one is set, whatever the mode', async () => {
  const { readFileSync } = await import('node:fs')
  const source = readFileSync(new URL('../src/components/PanelBackdrop.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /mode === 'brand'/, 'the backdrop must not hide a picture behind the mode')
  assert.match(source, /const backdrop = creative \|\| panel\.image\.url/)
  assert.match(source, /if \(!backdrop\) return null/)
})

// The panel copy sits on top of the backdrop, so the copy needs its own
// stacking context or the picture paints straight over the words.
test('every panel that carries a backdrop positions its copy above it', async () => {
  const { readFileSync } = await import('node:fs')
  for (const file of ['src/app/page.tsx', 'src/app/login/page.tsx', 'src/app/register/talent/page.tsx']) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8')
    const index = source.indexOf('<PanelBackdrop')
    assert.ok(index > -1, `${file} should render a PanelBackdrop`)
    const after = source.slice(index, index + 400)
    assert.match(after, /<div className="relative/, `${file} must position the panel copy above the backdrop`)
  }
})
