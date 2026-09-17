import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PUBLIC_PAGES_CONTENT, PAGE_SECTIONS, cloneDefaultPublicPagesContent, parsePublicPagesContent,
} from '../src/lib/public-page-content'

// Changing a default does not change a page that has already been published.
//
// The About founder section was hardcoded prose and a hardcoded picture, so it
// was made editable: the first content block of the page, with the words it
// already said as its defaults. Publishing should therefore have changed
// nothing on screen.
//
// It emptied the section. About had three blank blocks saved against it from
// before it had any, that stored content is perfectly valid, so it wins - and
// the live page went from two paragraphs to a lone LinkedIn button under a grey
// monogram. The defaults were right and never got near the page.
//
// A block with no eyebrow, no heading and no wording is not a section somebody
// wrote. It is a slot nobody has filled, and filling it from the defaults is
// the honest reading. A block with a single word in it is hers and is left
// exactly alone; the way to remove a section deliberately is to untick Show
// section.

function stored(overrides: (content: ReturnType<typeof cloneDefaultPublicPagesContent>) => void) {
  const content = cloneDefaultPublicPagesContent()
  overrides(content)
  return JSON.parse(JSON.stringify(content))
}

test('a section nobody has written gets the wording the page shipped with', () => {
  // Exactly the state the live site was in: valid content, blank blocks.
  const raw = stored(content => {
    for (const block of content.pages.about.blocks) {
      block.eyebrow = ''
      block.heading = ''
      block.text = ''
    }
  })

  const parsed = parsePublicPagesContent(raw)
  const founder = parsed.pages.about.blocks[0]
  const shipped = DEFAULT_PUBLIC_PAGES_CONTENT.pages.about.blocks[0]

  assert.equal(founder.heading, shipped.heading)
  assert.equal(founder.eyebrow, shipped.eyebrow)
  assert.ok(founder.text.includes('Rebecca built her career'), 'the founder story must come back')
  assert.ok(founder.text.includes('\n\n'), 'and keep its paragraph break')
})

test('a section she has written is left exactly alone', () => {
  const raw = stored(content => {
    const block = content.pages.about.blocks[0]
    block.eyebrow = ''
    block.heading = 'Founded by someone else entirely'
    block.text = ''
  })

  const founder = parsePublicPagesContent(raw).pages.about.blocks[0]
  assert.equal(founder.heading, 'Founded by someone else entirely')
  assert.equal(founder.eyebrow, '', 'one typed field makes the whole block hers')
  assert.equal(founder.text, '', 'including the parts she deliberately emptied')
})

test('her photograph is never substituted', () => {
  // An empty picture means none has been uploaded, which is a different
  // statement from empty wording. The monogram is the right answer to it.
  const raw = stored(content => {
    for (const block of content.pages.about.blocks) {
      block.eyebrow = ''; block.heading = ''; block.text = ''
      block.image.url = ''
    }
  })
  assert.equal(parsePublicPagesContent(raw).pages.about.blocks[0].image.url, '')
})

test('hiding a section is how a section is removed', () => {
  // Otherwise the fallback would be a trap: blank the words, and they return.
  const raw = stored(content => {
    const block = content.pages.about.blocks[0]
    block.eyebrow = ''; block.heading = ''; block.text = ''
    block.visible = false
  })
  const founder = parsePublicPagesContent(raw).pages.about.blocks[0]
  assert.equal(founder.visible, false, 'the tickbox is what takes a section off the page')
  assert.ok(founder.heading, 'the wording comes back, and the section still does not render')
})

test('a page only offers the sections it draws', () => {
  // About renders one block. Offering three would put wording and a photograph
  // somewhere nobody can see them, which is the complaint already recorded in
  // the schema against Pricing.
  assert.equal(PAGE_SECTIONS.about.blocks, 1)
  for (const [slug, sections] of Object.entries(PAGE_SECTIONS)) {
    assert.ok(Number.isInteger(sections.blocks), `${slug} must say how many sections it draws`)
  }
})
