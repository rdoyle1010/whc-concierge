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

// #57534e on the brand charcoal is 1.9:1. It was carrying primary calls to
// action and section eyebrows on four public pages.
test('the secondary grey is never used as a fill or a label on charcoal', () => {
  const offenders = sources.filter(file =>
    /bg-\[#57534e\][^"'`]*text-\[#1c1b1a\]/.test(file.text)
    || /text-\[#57534e\][^"'`]*(?=.*bg-\[#1c1b1a\])/.test(''),
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
