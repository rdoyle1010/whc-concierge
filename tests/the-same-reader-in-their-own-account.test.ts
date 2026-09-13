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

const analyse = body('src/app/api/cv/analyse/route.ts')
const profile = body('src/app/talent/profile/page.tsx')
const adminRoute = body('src/app/api/admin/profile-build/route.ts')

// A professional filling in her own profile was getting a worse reading than
// one an administrator built for her: a narrower reader, on a different
// provider, that added three fields to a word match. There is no version of
// that which is right.
test('a professional reading her own CV gets the reader the queue gets', () => {
  assert.match(analyse, /import \{ cvReadingConfigured, readCv/)
  assert.match(analyse, /readCv\(\{ kind: 'text', text \}\)/)
  assert.match(adminRoute, /readCv\(/, 'and the queue still uses it too')
  assert.doesNotMatch(analyse, /api\.openai\.com/, 'not a second reader on a second provider')
})

// maxDuration = 60 is a number this platform cannot ask for. The host kills a
// synchronous function at twenty-six, so a forty-five second model call could
// not finish even in principle: it timed out on essentially every attempt and
// the screen said "AI was unavailable".
test('the ceiling in the code is the ceiling that is enforced', () => {
  const declared = Number(analyse.match(/maxDuration = (\d+)/)?.[1])
  assert.ok(declared > 0 && declared <= 26, `maxDuration ${declared} is above what the host allows`)
  assert.doesNotMatch(analyse, /AI_TIMEOUT_MS = 45000/)
})

// The headline and the About you are the two fields nobody ever writes, and
// a reading that returns everything except those leaves a profile in exactly
// the state people abandon them in.
test('the reading includes the fields nobody writes for themselves', () => {
  for (const field of ['headline', 'bio', 'currentEmployer', 'location', 'languages', 'hotelBrands', 'gaps']) {
    assert.ok(analyse.includes(field), `the reading drops ${field}`)
  }
  for (const applied of ['headline:keep(c.headline', 'bio:keep(c.bio', 'current_employer:keep(c.current_employer']) {
    assert.ok(profile.includes(applied), `the profile does not apply ${applied}`)
  }
})

// A suggestion fills a blank. It does not correct her.
test('nothing she has already written is replaced', () => {
  assert.match(profile, /const keep=\(mine:any,found:any\)=>String\(mine\?\?''\)\.trim\(\)\?mine:\(found\?\?mine\)/)
  assert.match(profile, /const both=/, 'lists are merged, not swapped')
  assert.match(profile, /Nothing is final until you do/)
})

// A CV saying "French" does not say whether that is conversational or native,
// and putting a claim on somebody's profile that she never made is worse than
// leaving the field empty.
test('fluency is never guessed', () => {
  assert.doesNotMatch(profile, /language_skills:c\.language_skills\|\|\(cvSuggestions/)
  assert.match(profile, /choose your own fluency/)
})
