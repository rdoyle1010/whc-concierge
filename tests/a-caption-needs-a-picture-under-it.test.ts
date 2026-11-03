import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  defaultEditorialBand,
  editorialBandColumns,
  filledEditorialBand,
} from '../src/lib/public-page-content-values.ts'

// The footer strip shipped with four empty slots and drew them anyway: a stone
// box, a dark gradient across the bottom and a white caption sitting on it. On
// every page, because the strip is in the footer. It looked like four pictures
// failing to load rather than four slots waiting to be filled.

test('the strip ships empty, so nothing is drawn until a picture is uploaded', () => {
  assert.equal(defaultEditorialBand.length, 4)
  assert.deepEqual(defaultEditorialBand.map(image => image.url), ['', '', '', ''])
  assert.deepEqual(filledEditorialBand(defaultEditorialBand), [])
})

test('only the slots holding a picture are drawn', () => {
  const band = [
    { url: 'https://example.test/a.jpg', label: 'Spa & wellness' },
    { url: '', label: 'Exceptional properties' },
    { url: '   ', label: 'Wellness environments' },
    { url: 'https://example.test/d.jpg', label: 'Destination hospitality' },
  ]
  assert.deepEqual(
    filledEditorialBand(band).map(image => image.label),
    ['Spa & wellness', 'Destination hospitality'],
  )
})

test('the grid sizes to the pictures there are, so one never sits beside a gap', () => {
  assert.equal(editorialBandColumns(1), 'grid-cols-1')
  assert.equal(editorialBandColumns(2), 'grid-cols-2')
  assert.equal(editorialBandColumns(3), 'grid-cols-2 lg:grid-cols-3')
  assert.equal(editorialBandColumns(4), 'grid-cols-2 lg:grid-cols-4')
})

// The rule is only worth anything where it is actually drawn, and the footer
// draws it. A caption or a gradient that does not sit inside the filtered list
// is a caption that can be drawn over nothing again.
test('the footer draws the strip from the filtered list, not the raw one', () => {
  const footer = readFileSync(new URL('../src/components/Footer.tsx', import.meta.url), 'utf8')
  assert.match(footer, /const bandImages = filledEditorialBand\(editorialImages\)/)
  assert.match(footer, /\{bandImages\.length \? <section/, 'no pictures must mean no strip at all')
  assert.ok(
    !/editorialImages\.map\(/.test(footer),
    'the strip must map over the filtered pictures, never the raw band',
  )
})
