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
  // A sentinel, not a nullable enum: declaring both a type union and a list
  // of allowed values is rejected by the validator outright.
  assert.match(lib, /enum: \[\.\.\.ROLE_LEVELS, 'Unknown'\]/)
  assert.doesNotMatch(lib, /type: \['string', 'null'\], enum:/, 'a nullable enum is refused by the API')
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

  // Numbered once each. A renumbering that leaves two rules sharing a number
  // is an instruction somebody skims past.
  const rules = (lib.match(/^\d+\. /gm) || []).map(line => line.trim())
  assert.deepEqual(rules, [...new Set(rules)], `duplicate rule numbers: ${rules.join(' ')}`)
})

// The bio is the exception to "prefer nothing to a guess", and it has to be
// stated as one or the model takes the general instruction and returns
// nothing. That is what happened on the first real CV: everything else came
// back filled in and the bio was blank.
test('the bio is always written when there is anything to write', () => {
  assert.match(lib, /Always write the bio when the CV holds any career history/i)
  assert.match(lib, /The bio is the one exception/i)
  assert.match(lib, /most expensive field on a profile to leave blank/i)
  // And when it genuinely cannot be written, that is said rather than left as
  // an empty box somebody has to guess the reason for.
  assert.match(lib, /too thin to summarise, say so in gaps/i)
})

// An employer's name is not an address. "The Savoy" does not make somebody
// London-based, and a wrong location is worse than none on a platform that
// matches on travel distance.
test('a location is never inferred from an employer', () => {
  assert.match(lib, /Never infer one from an employer's name/i)
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

// The host kills a synchronous function at twenty-six seconds. A number in
// the code larger than the number that is enforced does not raise the
// ceiling, it just hides the fact that the read is still being killed.
test('the work is cut to fit the time it is actually given', () => {
  const route = body('src/app/api/admin/profile-build/route.ts')
  const declared = Number((route.match(/export const maxDuration = (\d+)/) || [])[1])
  assert.ok(declared >= 20 && declared <= 26,
    `maxDuration is ${declared}: above the host ceiling it is fiction, below twenty a CV will not finish`)

  // And the call abandons itself before the host does, so there is time left
  // to answer with a sentence rather than an error page.
  const timeout = Number((lib.match(/const CALL_TIMEOUT_MS = (\d+)/) || [])[1])
  assert.ok(timeout > 0 && timeout < declared * 1000,
    'the model call must give up before the function is killed')
  assert.match(lib, /\{ timeout: CALL_TIMEOUT_MS \}/)
  assert.match(lib, /APIConnectionTimeoutError/)
  assert.match(lib, /Paste the text into the box below instead/)

  // The input and the output are both bounded, because an unbounded worst
  // case is what decides whether this returns at all.
  assert.match(lib, /const MAX_CV_CHARS = \d+/)
  assert.match(lib, /slice\(0, MAX_CV_CHARS\)/)
  assert.match(lib, /max_tokens: MAX_OUTPUT_TOKENS/)
})

test('the model is named explicitly rather than left to a default', () => {
  assert.equal(CV_MODEL, 'claude-opus-5')
  assert.match(lib, /model: CV_MODEL/)
  assert.match(lib, /max_tokens: MAX_OUTPUT_TOKENS/, 'the output cap is named rather than left open')
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

// The treatments are the whole point of the matching, and they were being
// written only to treatment_skills. services_offered is the column the
// engine reads, so a profile could be filled in and still match nothing.
test('the treatments reach the column the matching actually reads', () => {
  const adminRoute = body('src/app/api/admin/profile-build/route.ts')
  assert.match(adminRoute, /services_offered: list\(reading\.treatment_skills/)
  assert.match(adminRoute, /treatment_skills: list\(reading\.treatment_skills/)
})

// A CV holds far more than a name and a role level, and every field left for
// somebody to type by hand is a field that does not get typed.
test('the reader covers what a CV can actually answer', () => {
  for (const field of ['business_skills', 'languages', 'current_employer']) {
    assert.match(lib, new RegExp(`${field}:`), `${field} is not read`)
    assert.match(lib, new RegExp(`'${field}'`), `${field} is not required in the schema`)
  }
  // And each one is correctable before it is saved.
  const review = body('src/components/CvReadingReview.tsx')
  assert.match(review, /business_skills: split/)
  assert.match(review, /languages: split/)
  assert.match(review, /current_employer: v/)
})

// What a CV genuinely cannot answer should be said, not silently absent.
test('the screen says what a CV will never contain', () => {
  const review = body('src/components/CvReadingReview.tsx')
  assert.match(review, /Photographs, insurance, right to work, rates and availability are not on a CV/i)
})
