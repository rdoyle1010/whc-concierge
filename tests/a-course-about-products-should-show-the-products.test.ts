import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normaliseContent, describeVisual, type ContentVisual } from '../src/lib/academy-course-content'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// The course editor could show a diagram and delete it, and that was all. The
// only image kind the content model had was an empty slot carrying a title and
// a description - a picture of nothing. A brand masterclass about products
// could not show a product.

const withVisual = (visual: unknown) => normaliseContent({
  title: 'Test course',
  modules: [{ title: 'Module one', lessons: [{ title: 'Lesson', body: 'Words.' }], visuals: [visual] }],
  assessment: [{ q: 'Q', options: ['a', 'b'], answer: 0 }],
}).modules[0].visuals

test('a picture survives being saved', () => {
  const visuals = withVisual({
    kind: 'image', title: 'Pure Collagen Spray',
    url: 'https://example.supabase.co/storage/v1/object/public/site-images/academy/spray.jpg',
    alt: 'A bottle of Pure Collagen Spray', caption: 'The £100 hero.',
  })
  assert.equal(visuals.length, 1)
  const image = visuals[0] as Extract<ContentVisual, { kind: 'image' }>
  assert.equal(image.kind, 'image')
  assert.equal(image.title, 'Pure Collagen Spray')
  assert.equal(image.alt, 'A bottle of Pure Collagen Spray')
  assert.equal(image.caption, 'The £100 hero.')
  assert.equal(describeVisual(image), 'Image')
})

test('a picture with no source never reaches a learner', () => {
  // A half-finished upload must be dropped at the door rather than rendered as
  // a broken image in the middle of a paid course.
  assert.equal(withVisual({ kind: 'image', title: 'Missing', url: '' }).length, 0)
  assert.equal(withVisual({ kind: 'image', title: 'Insecure', url: 'http://example.com/a.jpg' }).length, 0)
  assert.equal(withVisual({ kind: 'image', title: 'Nonsense', url: 'javascript:alert(1)' }).length, 0)
})

test('alt text is never empty', () => {
  // It is what a screen reader says and what shows when an image fails.
  const visuals = withVisual({ kind: 'image', title: 'Golden Millet Oil', url: 'https://example.com/oil.jpg' })
  const image = visuals[0] as Extract<ContentVisual, { kind: 'image' }>
  assert.equal(image.alt, 'Golden Millet Oil', 'the title stands in when no alt text was written')
})

test('the courses written before this still render', () => {
  // Thirty course files use the empty slot. Rewriting them all to say the same
  // thing would have risked more than it gained.
  const visuals = withVisual({ kind: 'image_placeholder', title: 'A slot', description: 'Something to add later.' })
  assert.equal(visuals[0].kind, 'image_placeholder')
  assert.equal(describeVisual(visuals[0]), 'Image slot')
})

test('a learner actually sees the picture', () => {
  const renderer = read('src/components/LessonVisual.tsx')
  assert.match(renderer, /visual\.kind === 'image'/)
  assert.match(renderer, /alt=\{visual\.alt \|\| visual\.title\}/, 'never render an image with no alt')
  assert.match(renderer, /<figcaption/, 'a caption belongs to its figure')
})

test('an administrator can put a picture in a module', () => {
  const editor = read('src/app/admin/academy/[slug]/page.tsx')
  assert.match(editor, /addImageToModule/)
  assert.match(editor, /Add a picture/)
  assert.match(editor, /bucket', 'site-images/, 'course pictures belong in the public bucket')
  // Title, caption and alt must all be editable, or the picture arrives
  // captioned "New image" forever.
  assert.match(editor, /Title, shown above the picture/)
  assert.match(editor, /Caption \(optional\)/)
  assert.match(editor, /Alt text, for screen readers/)
  // The section must show even when a module has no visuals yet, or there is
  // nowhere to press.
  assert.match(editor, /No pictures or diagrams in this module yet/)
})

test('the printed manual does not silently drop a picture', () => {
  const pdf = read('src/lib/academy-manual-pdf.tsx')
  assert.match(pdf, /visual\.kind === 'image'/)
  assert.doesNotMatch(pdf, /<Image /, 'a single unreachable image must not fail the whole manual')
})
