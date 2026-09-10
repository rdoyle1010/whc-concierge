import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import manifest from '../src/app/manifest'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// Without a manifest, "Add to Home Screen" saves a screenshot of whatever page
// somebody was on, under a truncated page title, and Android never offers to
// install at all.
test('a phone is told what this is before it saves it', () => {
  const web = manifest()
  assert.equal(web.name, 'Talent House Collective')
  // Roughly where Android starts cutting. A truncated name looks like a bug.
  assert.ok((web.short_name || '').length <= 12, 'the short name must survive a home screen')
  assert.equal(web.start_url, '/')
  assert.equal(web.display, 'standalone')
  assert.equal(web.lang, 'en-GB')
})

// The palette, carried past the edge of the page: the splash screen and the
// Android address bar both read these rather than the stylesheet.
test('an installed page is still the right colour', () => {
  const web = manifest()
  assert.equal(web.theme_color, '#1c1c1c', 'the site ink')
  assert.equal(web.background_color, '#f1f1f1', 'the site surface')
  assert.match(read('src/app/layout.tsx'), /export const viewport: Viewport = \{\s*themeColor: '#1c1c1c',/)
})

test('the icons a launcher asks for are all there', () => {
  const web = manifest()
  const sizes = (web.icons || []).map(icon => `${icon.sizes}:${icon.purpose}`)
  assert.ok(sizes.includes('192x192:any'))
  assert.ok(sizes.includes('512x512:any'))
  // Android crops this one to the launcher's shape and guarantees only the
  // middle two thirds, so it has to be drawn for cropping.
  assert.ok(sizes.includes('512x512:maskable'))

  for (const icon of web.icons || []) {
    const file = join(process.cwd(), 'public', String(icon.src))
    assert.ok(existsSync(file), `${icon.src} is declared and missing`)
    assert.ok(statSync(file).size > 500, `${icon.src} is too small to be a real icon`)
  }
})

// iOS ignores transparency, drops the file on white and crops it square, so
// the wide SVG wordmark arrived as three letters on a home screen.
test('the touch icon is the monogram, not the wordmark', () => {
  const layout = read('src/app/layout.tsx')
  assert.match(layout, /apple: '\/icons\/apple-touch-icon\.png'/)
  assert.match(layout, /manifest: '\/manifest\.webmanifest'/)
  assert.ok(existsSync(join(process.cwd(), 'public/icons/apple-touch-icon.png')))
})

// Deliberately absent. The offline half belongs in the native app, and a
// service worker on a site where adverts expire and prices change is the
// fastest route to somebody seeing last week's version of a page.
test('nothing caches the site behind our back', () => {
  assert.equal(existsSync(join(process.cwd(), 'public/sw.js')), false)
  assert.equal(existsSync(join(process.cwd(), 'public/service-worker.js')), false)
  assert.doesNotMatch(read('src/app/layout.tsx'), /serviceWorker/)
})
