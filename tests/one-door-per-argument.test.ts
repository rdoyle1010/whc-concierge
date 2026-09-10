import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_SLIDE_CTAS, slideCta } from '../src/lib/hero-slide-cta'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// Every hero slide carried the same button: Post a Role. Five different
// arguments, five different people being spoken to, and one door out of all of
// them - so a therapist reading "Precision matching, not guesswork" was invited
// to post a job, and four of the five revenue lines had no way in from the
// front page at all.
test('each slide sends you somewhere its own copy has earned', () => {
  const carousel = body('src/components/HeroCarousel.tsx')
  assert.match(carousel, /slideCta\(slide, current/)
  assert.doesNotMatch(carousel, /href=\{content\.hero\.primaryHref\}/, 'the same door on every slide is the bug')

  assert.equal(DEFAULT_SLIDE_CTAS.length, 5)
  const hrefs = DEFAULT_SLIDE_CTAS.map(cta => cta.href)
  assert.deepEqual(hrefs, ['/register/employer', '/register/talent', '/residency', '/academy', '/consultancy'])
  assert.equal(new Set(hrefs).size, hrefs.length, 'five slides, five destinations')
})

// A slide may name its own button, and until it does the position decides.
test('a slide can name its own button, and needs both halves to do it', () => {
  const fallback = { label: 'Post a role', href: '/register/employer' }
  assert.deepEqual(
    slideCta({ ctaLabel: 'Meet the brands', ctaHref: '/brands' }, 0, fallback),
    { label: 'Meet the brands', href: '/brands' },
  )
  // A label with no link is a button that goes nowhere; a link with no label
  // is a button nobody can read. Either way the default is better.
  assert.deepEqual(slideCta({ ctaLabel: 'Meet the brands' }, 2, fallback), DEFAULT_SLIDE_CTAS[2])
  assert.deepEqual(slideCta({ ctaHref: '/brands' }, 3, fallback), DEFAULT_SLIDE_CTAS[3])
  assert.deepEqual(slideCta(undefined, 4, fallback), DEFAULT_SLIDE_CTAS[4])
  // Past the defaults, the hero's own button is the honest answer.
  assert.deepEqual(slideCta(undefined, 7, fallback), fallback)
})

// Every default has to lead somewhere real.
test('every slide button leads to a page that exists', () => {
  const routes = new Set<string>()
  const collect = (dir: string) => {
    const entries = readdirSync(join(process.cwd(), dir))
    if (entries.includes('page.tsx')) routes.add(dir.replace('src/app', '').replace(/\/\([^)]*\)/g, '') || '/')
    for (const entry of entries) {
      const rel = `${dir}/${entry}`
      if (statSync(join(process.cwd(), rel)).isDirectory()) collect(rel)
    }
  }
  collect('src/app')
  for (const cta of DEFAULT_SLIDE_CTAS) {
    assert.ok(routes.has(cta.href), `${cta.href} has no page behind it`)
    assert.ok(cta.label.length > 3, `${cta.href} needs a readable label`)
  }
})

// And she can change any of them without asking anybody.
test('the buttons are editable in the website editor', () => {
  const admin = body('src/app/admin/website/page.tsx')
  assert.match(admin, /hero\.slides\.' \+ index \+ '\.ctaLabel/)
  assert.match(admin, /hero\.slides\.' \+ index \+ '\.ctaHref/)
  assert.match(read('src/lib/site-content.ts'), /ctaLabel: text\.optional\(\), ctaHref: link\.optional\(\)/)
})
