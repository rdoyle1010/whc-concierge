import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CV_MODEL, cvReadingConfigured } from '../src/lib/cv-read'
import { PRODUCT_HOUSES, QUALIFICATIONS, ROLE_LEVELS, SYSTEMS } from '../src/lib/constants'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const lib = body('src/lib/cv-read.ts')
const route = body('src/app/api/admin/profile-build/route.ts')
const review = body('src/components/CvReadingReview.tsx')

// An automated decision about somebody's employment is a regulated thing. A
// suggestion a person reads, corrects and approves is not one, and that
// distinction is the whole design rather than a nicety.
test('reading a CV writes nothing', () => {
  const readBlock = route.slice(route.indexOf("action === 'read_cv'"), route.indexOf("action === 'apply_reading'"))
  assert.doesNotMatch(readBlock, /\.update\(|\.insert\(|\.upsert\(/, 'reading must not touch the profile')
  assert.match(readBlock, /return NextResponse\.json\(\{ success: true, reading: result\.reading \}\)/)

  // The write is a separate action, behind a separate button.
  assert.match(route, /action === 'apply_reading'/)
  assert.match(review, /onClick=\{onSave\}/, 'saving is a button somebody presses')
  assert.match(review, /Nothing is saved until you press the button/i)
})

// The matching engine is deterministic and can tell somebody why they scored
// what they scored. Nothing here may quietly replace it.
test('nothing here decides anything about a candidate', () => {
  for (const file of ['src/lib/cv-read.ts', 'src/app/api/admin/profile-build/route.ts']) {
    const source = body(file)
    assert.doesNotMatch(source, /match_score|shortlist|reject|suitab/i,
      `${file} strays from reading a CV into judging a person`)
  }
})

// The vocabulary is the point. Free text would be unmatchable, and a value
// outside the taxonomy makes somebody quietly unfindable rather than visibly
// wrong.
test('the reader may only choose from our own vocabulary', () => {
  assert.match(lib, /enum: \[\.\.\.PRODUCT_HOUSES\]/)
  assert.match(lib, /enum: \[\.\.\.SYSTEMS\]/)
  assert.match(lib, /enum: \[\.\.\.QUALIFICATIONS\]/)
  assert.match(lib, /enum: \[\.\.\.ROLE_LEVELS, null\]/)
  // And filtered again on the way back, because the schema constrains shape
  // and shape is not the risk.
  assert.match(lib, /pick\(raw\?\.product_houses, PRODUCT_HOUSES\)/)
  assert.match(lib, /pick\(raw\?\.systems_experience, SYSTEMS\)/)
  assert.match(lib, /pick\(raw\?\.qualifications, QUALIFICATIONS\)/)
  assert.match(lib, /ROLE_LEVELS\.includes\(raw\?\.role_level\)/)
  // The taxonomies it filters against are the real ones.
  assert.ok(PRODUCT_HOUSES.includes('Carol Joy London'))
  assert.ok(SYSTEMS.includes('Book4Time'))
  assert.ok(QUALIFICATIONS.includes('CIDESCO'))
  assert.ok(ROLE_LEVELS.includes('Director of Spa'))
})

// An invented qualification on somebody's professional profile is the worst
// thing this can produce, and it is worse than an empty field.
test('the instructions forbid inventing anything', () => {
  assert.match(lib, /Take nothing from anywhere but the CV/i)
  assert.match(lib, /Prefer nothing to a guess/i)
  assert.match(lib, /worse than an empty field/i)
  assert.match(lib, /British English/i)
})

// A stray 2015 read as a duration puts somebody at the top of every
// experience filter on the platform.
test('a nonsense number of years is refused', () => {
  const normalise = lib.slice(lib.indexOf('function normalise'))
  assert.match(normalise, /years >= 0 && years <= 60/)
  assert.match(normalise, /Number\.isFinite\(years\)/)
})

// An administrator looking at a queue needs an answer, not a stack trace.
test('every failure comes back as a sentence', () => {
  assert.match(lib, /\{ ok: false; error: string \}/)
  assert.doesNotMatch(lib.slice(lib.indexOf('export async function readCv')), /throw /)
  assert.match(lib, /AuthenticationError[\s\S]{0,200}Netlify/)
  assert.match(lib, /RateLimitError/)
  assert.match(lib, /stop_reason === 'refusal'/)
  // A deployment with no key says so rather than failing oddly.
  assert.equal(typeof cvReadingConfigured(), 'boolean')
  assert.match(route, /cvReadingConfigured\(\)/)
})

// Word is what spa professionals actually send, so it is read rather than
// refused. What cannot be read is named as such, with a way round it, because
// a reader that quietly returns nothing from a file it never understood is
// worse than one that says so.
test('an unreadable file is named as one, with a way round it', () => {
  assert.match(route, /endsWith\('\.pdf'\)/, 'PDFs still go to the reader as documents')
  assert.match(route, /await wordText\(bytes\)/, 'and Word is extracted rather than turned away')
  assert.match(route, /Paste the text in below, or ask them for a PDF/i)
  // Pasted text remains the fallback for anything else somebody was sent.
  assert.match(route, /kind: 'text', text: pasted/)
})

// The profile is still not visible. A draft somebody corrected is not the
// same as its owner saying yes to being seen.
test('saving the draft does not publish anybody', () => {
  const applyBlock = route.slice(route.indexOf("action === 'apply_reading'"))
  assert.match(applyBlock, /\.\.\.visibilityColumns\('private'\)/)
})

test('the model is named explicitly rather than left to a default', () => {
  assert.equal(CV_MODEL, 'claude-opus-5')
  assert.match(lib, /model: CV_MODEL/)
  assert.match(lib, /max_tokens: \d+/)
})

// Seeing that ESPA is not ticked is how somebody remembers to ask about it.
// A list of only what was found cannot do that.
test('the review shows the whole vocabulary, not just what was found', () => {
  assert.match(review, /all=\{\[\.\.\.PRODUCT_HOUSES\]\}/)
  assert.match(review, /all=\{\[\.\.\.SYSTEMS\]\}/)
  assert.match(review, /all=\{\[\.\.\.QUALIFICATIONS\]\}/)
  // And what the CV did not say is surfaced rather than left as silence.
  assert.match(review, /What the CV does not say/i)
  assert.match(lib, /gaps/)
})
