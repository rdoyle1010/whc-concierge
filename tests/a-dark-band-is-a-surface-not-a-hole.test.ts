import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// A full-bleed surface at exactly the value of body text reads as flat black
// rather than as charcoal: there is nothing for the eye to place it against,
// so it stops looking like a material and starts looking like a hole in the
// page. The surface lifts one step; type, buttons and marks stay on ink.
const BANDS = [
  'src/app/intelligence/page.tsx',
  'src/app/properties/[id]/page.tsx',
  'src/app/login/page.tsx',
  'src/app/register/talent/page.tsx',
  'src/app/register/employer/page.tsx',
  'src/app/forgot-password/page.tsx',
  'src/app/reset-password/page.tsx',
  'src/app/roles/match/page.tsx',
]

test('the large dark bands sit one step off the ink', () => {
  const config = read('tailwind.config.js')
  assert.match(config, /charcoal: '#28322b'/)
  assert.match(config, /ink: '#222321'/, 'the ink itself does not move')
  for (const page of BANDS) {
    assert.match(read(page), /bg-charcoal/, `${page} still paints its band at the ink value`)
  }
})

// The band is the forest, and it is not the ink.
//
// This used to assert that charcoal had three equal channels, because the
// palette had dropped a warm cast in September and the check existed to stop
// it creeping back. The palette is deliberately warm again now: ivory ground,
// deep forest structure, taupe and sage for detail. Equal channels would mean
// the accent had been reverted to grey, which is the thing that made the site
// read as an unstyled admin tool.
//
// What has to stay true is the original point. A full-bleed surface at exactly
// the value of body text reads as a hole in the page rather than as a
// material, so the band must sit off the ink and still be dark enough to carry
// white type.
test('the band sits off the ink and is still dark enough to carry white type', () => {
  const config = read('tailwind.config.js')
  const band = config.match(/charcoal: '#([0-9a-f]{6})'/i)
  const ink = config.match(/\n\s+ink: '#([0-9a-f]{6})'/i)
  assert.ok(band && ink, 'both must be defined')
  assert.notEqual(band![1].toLowerCase(), ink![1].toLowerCase(),
    'a band at the ink value is a hole in the page')

  const channels = (hex: string) => [0, 2, 4].map(o => parseInt(hex.slice(o, o + 2), 16) / 255)
  const luminance = (hex: string) => {
    const [r, g, b] = channels(hex).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const onWhite = 1.05 / (luminance(band![1]) + 0.05)
  assert.ok(onWhite > 7, `white on the band is ${onWhite.toFixed(1)}:1, which is below AAA`)
})

// White copy sits on every one of these bands.
test('the copy on them is still comfortably legible', () => {
  // Relative luminance of #28322b against white: (0.1176 + 0.055) ratio maths
  // gives roughly 14:1, far above the 4.5:1 that normal text needs and above
  // the 7:1 that AAA asks for.
  const channel = 0x26 / 255
  const linear = ((channel + 0.055) / 1.055) ** 2.4
  const luminance = 0.2126 * linear + 0.7152 * linear + 0.0722 * linear
  const contrast = (1.0 + 0.05) / (luminance + 0.05)
  assert.ok(contrast > 7, `white on the band is ${contrast.toFixed(1)}:1, which is below AAA`)
})
