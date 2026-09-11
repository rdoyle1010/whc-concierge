import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const invite = body('src/components/DesktopInvite.tsx')

// Most people find us on a phone and the site works perfectly well on one. A
// profile, though, is photographs and paragraphs, and that is a laptop job.
// So this says so once - and everything stays available to anybody who taps
// past it, because a notice that blocks the phone loses the person it was
// trying to help.
test('the desktop notice suggests, and never withholds anything', () => {
  assert.match(invite, /Carry on here/, 'the way past has to be a real button')
  assert.match(invite, /onClick=\{dismiss\}/)
  // No gate, no overlay across the page, no redirect.
  assert.doesNotMatch(invite, /router\.push|window\.location|inset-0 bg-|backdrop/)
  assert.doesNotMatch(invite, /disabled/)
})

test('it is shown once, on a phone, and never on a desktop', () => {
  assert.match(invite, /max-width: 820px/, 'a desktop visitor is already where we want them')
  assert.match(invite, /localStorage\.getItem\(SEEN_KEY\)/)
  assert.match(invite, /localStorage\.setItem\(SEEN_KEY/)
  // A browser with storage blocked gets nothing, rather than the notice on
  // every single page.
  assert.match(invite, /catch \{[\s\S]{0,200}return\s*\n?\s*\}/)
})

// Two things at the foot of the screen at once is a mess, and the cookie
// banner has first claim on it.
test('it waits for the cookie banner to be answered', () => {
  assert.match(invite, /whc-cookie-consent/)
  assert.match(invite, /if \(seen \|\| !consent\) return/)
  assert.match(invite, /setTimeout\(\(\) => setVisible\(true\), \d+\)/)
})

test('it says the app is coming without promising a date', () => {
  assert.match(invite, /app is on its way/i)
  assert.doesNotMatch(invite, /\b(January|February|March|April|May|June|July|August|September|October|November|December|20\d\d)\b/,
    'a date in this notice is a promise somebody will hold us to')
})

test('it is mounted on the public site rather than one page', () => {
  const layout = body('src/app/layout.tsx')
  assert.match(layout, /<DesktopInvite \/>/)
  assert.match(layout, /<TrackVisit \/>/)
})
