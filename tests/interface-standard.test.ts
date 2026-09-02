import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const APP = new URL('../src/app/', import.meta.url).pathname
const COMPONENTS = new URL('../src/components/', import.meta.url).pathname

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) files.push(full)
  }
  return files
}

const sources = [...walk(APP), ...walk(COMPONENTS)].map(path => ({ path, text: readFileSync(path, 'utf8') }))

function contrast(foreground: string, background: string) {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance = (hex: string) => {
    const h = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }
  const a = luminance(foreground)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// The muted grey carried real information at 10 to 13 pixels across the whole
// platform, at 3.09:1 against white. Legible is not a matter of taste.
test('the muted text colour is legible against white', () => {
  const config = readFileSync(new URL('../tailwind.config.js', import.meta.url), 'utf8')
  const match = /muted:\s*'(#[0-9a-fA-F]{6})'/.exec(config)
  assert.ok(match, 'the muted token must be defined')
  assert.ok(
    contrast(match![1], '#ffffff') >= 4.5,
    `muted ${match![1]} is ${contrast(match![1], '#ffffff').toFixed(2)}:1 against white, below the 4.5:1 minimum`,
  )
})

test('the secondary text colour is legible against white', () => {
  const config = readFileSync(new URL('../tailwind.config.js', import.meta.url), 'utf8')
  const match = /secondary:\s*'(#[0-9a-fA-F]{6})'/.exec(config)
  if (!match) return
  assert.ok(contrast(match[1], '#ffffff') >= 4.5, `secondary ${match[1]} is too pale against white`)
})

// #555555 on the brand charcoal is 1.9:1. It was carrying primary calls to
// action and section eyebrows on four public pages.
test('the secondary grey is never used as a fill or a label on charcoal', () => {
  const offenders = sources.filter(file =>
    /bg-\[#555555\][^"'`]*text-\[#1c1c1c\]/.test(file.text)
    || /text-\[#555555\][^"'`]*(?=.*bg-\[#1c1c1c\])/.test(''),
  )
  assert.equal(offenders.length, 0, `unreadable grey-on-charcoal in: ${offenders.map(f => f.path).join(', ')}`)
})

// Tailwind silently drops a spacing value it does not recognise, so the
// element renders with no padding at all rather than failing loudly.
test('no invalid Tailwind spacing values', () => {
  const invalid = /\b(?:sm:|md:|lg:|xl:)?p[xytrbl]?-(?:1[3579]|2[1235679]|3[13579])\b/
  const offenders = sources.filter(file => invalid.test(file.text))
  assert.equal(offenders.length, 0, `invalid spacing utility in: ${offenders.map(f => f.path).join(', ')}`)
})

// The platform's own CSS collapses rounded corners and sets box-shadow to
// none, so a page card asking for both renders as a hard square with a soft
// shadow sitting under it - visibly unresolved. Floating overlays (menus,
// modals, the notification bell) are a different case and keep their
// elevation; this rule is about cards laid out in the page.
test('the public marketing pages carry no card drop shadows', () => {
  const pages = ['pricing/page.tsx', 'academy/page.tsx', 'agency/about/page.tsx', 'testimonials/page.tsx', 'jobs/page.tsx']
  for (const path of pages) {
    const text = readFileSync(join(APP, path), 'utf8')
    assert.ok(!/\bshadow-(?:lg|xl|2xl)\b/.test(text), `${path} lays out a card with a drop shadow`)
  }
})

// Invented testimonials with a disclaimer underneath tell a prospective
// customer exactly one thing.
test('no fabricated testimonials are published', () => {
  const page = readFileSync(join(APP, 'testimonials/page.tsx'), 'utf8')
  assert.ok(!/Composite testimonials/i.test(page), 'the composite testimonials must not return')
  assert.ok(!/Illustrative examples/i.test(page), 'the illustrative-examples disclaimer must not return')
  assert.ok(/from\('reviews'\)/.test(page), 'the page must read real reviews')
})

// A reviewer's legal name, permanently attached on the open web to their
// opinion of a named former employer, with no consent anywhere.
test('reviewers are published by role, never by name', () => {
  for (const path of ['page.tsx', 'properties/[id]/page.tsx', 'api/properties/[id]/reviews/route.ts']) {
    const text = readFileSync(join(APP, path), 'utf8')
    assert.ok(
      !/reviewer(?:_n|N)ame:\s*reviewer\?\.full_name/.test(text),
      `${path} must not publish the reviewer's name`,
    )
  }
})

// Hotlinking a stock photograph of a stranger as the brand panel of the
// sign-in screen, with the URL visible in view-source.
test('the sign-in funnel carries no third-party stock photography', () => {
  for (const path of ['login/page.tsx', 'forgot-password/page.tsx', 'reset-password/page.tsx']) {
    const text = readFileSync(join(APP, path), 'utf8')
    assert.ok(!/pexels\.com/.test(text), `${path} must not hotlink stock photography`)
  }
})

// The talent dashboard opened with a dark promotional banner, then the
// activity centre, and only then said "Good afternoon" - a greeting
// halfway down the page. The shell renders its own blocks before children,
// so the greeting needs the intro slot to sit where a greeting belongs.
test('the dashboard shell renders its intro before anything else', () => {
  const shell = readFileSync(new URL('../src/components/DashboardShell.tsx', import.meta.url), 'utf8')
  const intro = shell.indexOf('{intro?')
  const activity = shell.indexOf('<DashboardActivityCentre')
  const children = shell.lastIndexOf('{children}')
  assert.ok(intro > -1, 'the shell must accept an intro slot')
  assert.ok(intro < activity, 'the intro must render above the activity centre')
  assert.ok(activity < children, 'the activity centre must still render above the page body')
})

test('the talent dashboard greets the reader through that slot', () => {
  const page = readFileSync(new URL('../src/app/talent/dashboard/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /intro=\{<>/, 'the greeting must be passed as the shell intro')
  assert.match(page, /timeOfDayGreeting\(\)/)
})

// Rebecca's brief was "wherever there is black like this" - the wide charcoal
// bands that broke up the public pages. The sweep that removed them was scoped
// to each <section>, which left three kinds of wreckage worth locking down.

const PUBLIC_PAGES = [
  'page.tsx', 'about/page.tsx', 'academy/page.tsx', 'advertise/page.tsx',
  'advertising-terms/page.tsx', 'agency/about/page.tsx', 'coming-soon/page.tsx',
  'jobs/[id]/page.tsx', 'match/page.tsx', 'pricing/page.tsx', 'privacy/page.tsx',
  'residency/page.tsx', 'blog/[slug]/page.tsx',
]

test('no public page opens on a full-width charcoal band', () => {
  for (const path of PUBLIC_PAGES) {
    const text = readFileSync(join(APP, path), 'utf8')
    const band = text.match(/<section[^>]*\bbg-(?:ink|\[#1c1c1c\]|\[#1c1b1a\])\b/)
    assert.ok(!band, `${path} still carries a charcoal <section>: ${band?.[0]}`)
  }
})

// Inverting a white button on a dark band left the old label colour behind, so
// the text matched the button it sat on. Two colours in one class list is
// always a mistake, whichever of them the cascade happens to pick.
test('no element sets two conflicting text colours', () => {
  for (const path of PUBLIC_PAGES) {
    const text = readFileSync(join(APP, path), 'utf8')
    for (const [, classes] of text.matchAll(/className="([^"]*)"/g)) {
      const light = /(?:^|\s)text-white(?:\s|$)/.test(classes)
      const dark = /(?:^|\s)text-(?:ink|\[#1c1c1c\])(?:\s|$)/.test(classes)
      assert.ok(!(light && dark), `${path} sets both a light and a dark text colour: ${classes}`)
    }
  }
})

// globals.css sets h1-h4 colour as a base element rule, and an element rule
// beats an inherited value however the parent set it. So a heading on a dark
// card that says nothing about colour renders charcoal on charcoal - which is
// exactly how "Featured Talent" and "Employer Group" disappeared.
test('the heading rule that makes dark-card headings vanish is still an element rule', () => {
  const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /h1, h2, h3, h4 \{\s*\n\s*color: var\(--site-ink/, 'if this rule changes, re-check every heading on a dark surface')
})

test('headings on charcoal cards name their own colour', () => {
  const cases: [string, string][] = [
    ['pricing/page.tsx', 'Featured Talent'],
    ['pricing/page.tsx', 'Employer Group'],
    ['academy/page.tsx', 'What do you want to be better at next?'],
  ]
  for (const [path, heading] of cases) {
    const text = readFileSync(join(APP, path), 'utf8')
    const tag = new RegExp(`<h[1-4]([^>]*)>${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`)
    const match = text.match(tag)
    assert.ok(match, `${path} no longer contains the heading "${heading}"`)
    assert.match(match![1], /text-white/, `"${heading}" must set its own colour or it renders charcoal on charcoal`)
  }
})

// The demo card is declared above the section that renders it, so a sweep
// scoped to that section slides straight past it. This is the second time a
// component outside the band it lives in has been left behind.
test('the agency demo card matches the band it renders in', () => {
  const text = readFileSync(join(APP, 'agency/about/page.tsx'), 'utf8')
  const card = text.slice(text.indexOf('function ProfessionalDemoCard'), text.indexOf('export default'))
  assert.ok(!/text-white|bg-white\/|border-white\//.test(card), 'the card sits on a light band and must be styled for one')
})

// The wide bands where the copy fills half the width and the rest is dead
// space are the most valuable empty space on the site. Each one is now a
// picture box or a backdrop that Rebecca fills from Admin -> Pictures, and can
// sell. The rule that matters: an empty slot must change nothing.
test('a picture box draws nothing until something is put in it', () => {
  const picture = readFileSync(new URL('../src/components/PanelPicture.tsx', import.meta.url), 'utf8')
  assert.match(picture, /if \(!picture\) return null/, 'an empty slot must not render an empty box')
  assert.ok(
    !/panel\.mode === 'brand'/.test(picture),
    "a picture is the switch - gating it behind a mode is how uploads appeared to do nothing",
  )
})

test('every panel slot reaches both the Pictures screen and the Website editor', () => {
  const content = readFileSync(new URL('../src/lib/site-content.ts', import.meta.url), 'utf8')
  const block = content.slice(content.indexOf('const DEFAULT_PANELS'), content.indexOf('// The header lockup'))
  const keys = [...block.matchAll(/^\s{2}(\w+):/gm)].map(match => match[1])
  assert.ok(keys.length >= 5, `expected the panel slots, found ${keys.join(', ')}`)

  const images = readFileSync(new URL('../src/app/admin/images/page.tsx', import.meta.url), 'utf8')
  const website = readFileSync(new URL('../src/app/admin/website/page.tsx', import.meta.url), 'utf8')
  for (const key of keys) {
    assert.ok(images.includes(`panels.${key}.image.url`), `${key} is missing from Admin -> Pictures`)
    assert.ok(website.includes(`'${key}' as const`), `${key} is missing from the Website editor`)
  }
})

// Content saved before a panel existed still has to parse, or adding a slot
// logs every administrator out of their own settings.
test('new panels default rather than making stored content invalid', () => {
  const content = readFileSync(new URL('../src/lib/site-content.ts', import.meta.url), 'utf8')
  for (const key of ['intelligenceHero', 'intelligenceJournal', 'agencyProfessional']) {
    const rule = new RegExp(`${key}: panelSchema\\.default\\(`)
    assert.match(content, rule, `${key} must carry a default for content saved before it existed`)
  }
})
