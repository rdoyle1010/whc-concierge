import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { PAGE_SECTIONS, PUBLIC_PAGE_SLUGS, DEFAULT_PUBLIC_PAGES_CONTENT, DEFAULT_FAQ_SECTIONS, type PublicPageSlug } from '../src/lib/public-page-content'

// An editor box that changes nothing.
//
// The site had grown to around sixty public routes while the page editor still
// covered the five it launched with, so seven marketing pages could only be
// changed by a deploy - including About and Advertise, two of the pages most
// likely to decide whether a stranger takes this seriously.
//
// The failure to avoid while fixing that is the opposite one. A screen full of
// fields the page ignores is worse than no screen: somebody writes something,
// saves it, looks at the page, sees nothing, and concludes the whole editor is
// broken. Nothing on screen would say which fields were real.
//
// So PAGE_SECTIONS records what each page actually renders, the editor offers
// only that, and this test holds the record against the pages themselves.

const PAGE_FILE: Record<PublicPageSlug, string> = {
  properties: 'src/app/properties/page.tsx',
  agency: 'src/app/agency/about/page.tsx',
  residency: 'src/app/residency/page.tsx',
  pricing: 'src/app/pricing/page.tsx',
  'coming-soon': 'src/app/coming-soon/page.tsx',
  about: 'src/app/about/page.tsx',
  advertise: 'src/app/advertise/page.tsx',
  'how-to-use': 'src/app/how-to-use/page.tsx',
  academy: 'src/app/academy/AcademyBrowser.tsx',
  'agency-cover': 'src/app/agency/page.tsx',
  contact: 'src/app/contact/page.tsx',
}

test('every page in the editor is a page that exists', () => {
  for (const slug of PUBLIC_PAGE_SLUGS) {
    assert.ok(existsSync(PAGE_FILE[slug]), `${slug} points at ${PAGE_FILE[slug]}, which is not there`)
  }
})

test('every page reads the wording it is offered', () => {
  // The three fields every page in the editor has. If one of them is not read,
  // somebody can type into it forever and nothing will happen.
  for (const slug of PUBLIC_PAGE_SLUGS) {
    const source = readFileSync(PAGE_FILE[slug], 'utf8')
    for (const field of ['hero.eyebrow', 'hero.heading', 'hero.text']) {
      assert.match(source, new RegExp(field.replace('.', '\\.')),
        `${PAGE_FILE[slug]} never reads ${field}, so that box on the ${slug} editor does nothing`)
    }
  }
})

test('a page is only offered an image or sections when it renders them', () => {
  for (const slug of PUBLIC_PAGE_SLUGS) {
    const source = readFileSync(PAGE_FILE[slug], 'utf8')
    const sections = PAGE_SECTIONS[slug]

    if (sections.heroImage) {
      assert.match(source, /hero\.image/,
        `${slug} offers a hero photograph in the editor but never renders one`)
    } else {
      assert.doesNotMatch(source, /cms\.hero\.image/,
        `${slug} renders a hero photograph but the editor hides the control for it`)
    }

    if (sections.blocks) {
      // Any use at all. The first version of this listed the three ways the
      // pages happened to read blocks and missed coming-soon, which filters
      // them, so it reported a page as broken that was fine. A list of known
      // spellings is not a check, it is a list of known spellings.
      assert.match(source, /\.blocks[.[]/,
        `${slug} offers three sections in the editor but never renders them`)
    } else {
      assert.doesNotMatch(source, /cms\.blocks/,
        `${slug} renders sections but the editor hides the controls for them`)
    }
  }
})

test('the editor only draws the controls a page has', () => {
  const editor = readFileSync('src/app/admin/website/pages/page.tsx', 'utf8')
  assert.match(editor, /PAGE_SECTIONS\[selected\]\.heroImage/)
  // The whole point of this file: a box that takes wording and a photograph
  // and puts them nowhere. A flag could only say "some sections", so About -
  // which renders exactly one - would have offered three.
  assert.match(editor, /page\.blocks\.slice\(0, PAGE_SECTIONS\[selected\]\.blocks\)/)
})

test('the About founder section is editable, and offered once', () => {
  // It was hardcoded prose and a hardcoded path to a file that never existed,
  // so the page showed a grey monogram and no screen on the platform had an
  // upload slot that could fix it.
  assert.equal(PAGE_SECTIONS.about.blocks, 1, 'About renders one section, so it offers one')

  const page = readFileSync('src/app/about/page.tsx', 'utf8')
  assert.match(page, /const founder = cms\.blocks\[0\]/)
  assert.match(page, /<FounderImage url=\{founder\.image\.url\}/, 'the portrait comes from the block')
  assert.doesNotMatch(page, /founder-rebecca\.jpg/, 'and never from a hardcoded file again')

  const image = readFileSync('src/components/FounderImage.tsx', 'utf8')
  assert.match(image, /if \(!url \|\| errored\)/, 'no picture yet must draw the monogram, not a broken image')
})

test('the five new pages start as what the site already said', () => {
  // Defaults lifted from the live pages, so making them editable moved
  // nothing. Her first edit is a change she chose, not a correction of one
  // this shipped.
  const pages = DEFAULT_PUBLIC_PAGES_CONTENT.pages
  assert.equal(pages.about.hero.heading, 'Built for an industry that deserves better.')
  assert.equal(pages.advertise.hero.heading, 'A real placement, with a clear audience and clear terms.')
  assert.equal(pages.academy.hero.heading, 'Learn what luxury spas actually expect from you.')
  assert.equal(pages['agency-cover'].hero.heading, 'Spa professionals on cover when your rota is short.')
  assert.match(pages['how-to-use'].hero.heading, /^One platform\./)

  for (const slug of PUBLIC_PAGE_SLUGS) {
    assert.ok(pages[slug].hero.heading.trim(), `${slug} has no default heading`)
    assert.ok(pages[slug].label.trim(), `${slug} has no label`)
  }
})

test('the questions are editable, and their prices are not typed in', () => {
  // FAQ was left out of the first pass because a list of lists does not fit a
  // hero and three blocks, and squeezing it in would have produced exactly the
  // editor this whole file exists to prevent: three of her twenty-three
  // questions editable and the rest not.
  const page = readFileSync('src/app/faq/page.tsx', 'utf8')
  assert.match(page, /DEFAULT_FAQ_SECTIONS/, 'the page must take its questions from the shared default')
  assert.doesNotMatch(page, /const faqSections: FAQSection\[\] = \[/,
    'the second copy in the page is the thing that would drift')
  assert.match(page, /part=faq/, 'and it must fetch the edited version')

  // One answer quotes what a featured listing costs. Storing that number would
  // mean the FAQ kept quoting it the first afternoon somebody changed a price,
  // which is what the pricing screen exists to prevent.
  assert.match(page, /withLivePrices\(answer\)/)
  const defaults = readFileSync('src/lib/public-page-content-values.ts', 'utf8')
  assert.match(defaults, /\{featured_7day_price\}/)
  assert.doesNotMatch(defaults, /\$\{formatPrice/, 'a price must not be baked into the stored answer')
})

test('every default question has both halves', () => {
  for (const section of DEFAULT_FAQ_SECTIONS) {
    assert.ok(section.title.trim(), 'a group with no heading')
    assert.ok(section.items.length, `${section.title} has no questions`)
    for (const item of section.items) {
      assert.ok(item.question.trim(), `${section.title} has a question with no text`)
      assert.ok(item.answer.trim(), `${item.question} has no answer`)
    }
  }
  const total = DEFAULT_FAQ_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)
  assert.ok(total >= 20, `only ${total} questions survived the move out of the page`)
})
