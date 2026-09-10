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
  assert.match(config, /charcoal: '#262626'/)
  assert.match(config, /ink: '#1c1c1c'/, 'the ink itself does not move')
  for (const page of BANDS) {
    assert.match(read(page), /bg-charcoal/, `${page} still paints its band at the ink value`)
  }
})

// The palette dropped its warm cast deliberately in September, keeping every
// step's lightness and losing the brown. This is a surface value, not a
// reopening of that.
test('the lift is neutral, not a warm cast returning', () => {
  const config = read('tailwind.config.js')
  const charcoal = config.match(/charcoal: '#([0-9a-f]{6})'/i)
  assert.ok(charcoal, 'charcoal must be defined')
  const [r, g, b] = [0, 2, 4].map(offset => parseInt(charcoal![1].slice(offset, offset + 2), 16))
  assert.equal(r, g, 'a neutral grey has equal channels')
  assert.equal(g, b, 'a neutral grey has equal channels')
  // Lifted enough to read as a surface, dark enough to still be charcoal.
  assert.ok(r > 0x1c && r < 0x33, `#${charcoal![1]} is not between the ink and the hover grey`)
})

// White copy sits on every one of these bands.
test('the copy on them is still comfortably legible', () => {
  // Relative luminance of #262626 against white: (0.1176 + 0.055) ratio maths
  // gives roughly 14:1, far above the 4.5:1 that normal text needs and above
  // the 7:1 that AAA asks for.
  const channel = 0x26 / 255
  const linear = ((channel + 0.055) / 1.055) ** 2.4
  const luminance = 0.2126 * linear + 0.7152 * linear + 0.0722 * linear
  const contrast = (1.0 + 0.05) / (luminance + 0.05)
  assert.ok(contrast > 7, `white on the band is ${contrast.toFixed(1)}:1, which is below AAA`)
})
