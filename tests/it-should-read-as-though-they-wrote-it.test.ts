import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BUILD_QUESTIONS, REQUIRED_QUESTIONS, sanitiseAnswers, unanswered,
  answersToProfile, chosenVisibility,
} from '../src/lib/profile-build-questions'
import { COMPLETION_CHECKS } from '../src/lib/candidate-fields'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/profile-build/route.ts')
const form = body('src/components/ProfileBuildForm.tsx')
const reader = body('src/lib/cv-read.ts')
const migration = read('supabase/migrations/20260913200000_the_questions_a_cv_cannot_answer.sql')

// A CV is a record of what somebody has done. It says nothing about when they
// could start, how far they would travel or how visible they want to be, and
// a built profile kept stopping at eighty per cent with those gaps underneath
// it.
test('the questions are the ones a CV cannot answer', () => {
  const keys = BUILD_QUESTIONS.map(question => question.key)
  for (const key of ['role_level', 'experience_years', 'postcode', 'availability_status', 'visibility']) {
    assert.ok(keys.includes(key), `${key} is not asked`)
  }
  // Not a second copy of the fifteen field form people already declined.
  assert.ok(BUILD_QUESTIONS.length <= 10, 'this is turning back into the form they would not fill in')
  const taps = BUILD_QUESTIONS.filter(question => question.kind === 'choose' || question.kind === 'many').length
  assert.ok(taps >= BUILD_QUESTIONS.length / 2, 'most of it has to be tapping, not typing')
})

// A CV plus these answers has to reach the end. If it cannot, the person is
// handed a profile that says it is unfinished and told somebody built it for
// them, which is the worst of both.
test('a CV and these answers can finish a profile', () => {
  const fromAnswers = answersToProfile(sanitiseAnswers({
    role_level: 'Spa Manager', experience_years: 12, postcode: 'BA1 2LR',
    availability_status: '1_month', travel_availability: 'uk_only', visibility: 'discreet',
  }))
  // What the CV reader supplies, and what the intake supplies, between them.
  const fromCv = {
    full_name: 'A Therapist', headline: 'Spa Manager', bio: 'I have...',
    services_offered: ['Swedish Massage'], qualifications: ['CIDESCO'],
    business_skills: ['Team Leadership'], cv_url: 'talent-documents/cv.pdf',
  }
  const merged = { ...fromCv, ...fromAnswers }
  const unfinished = COMPLETION_CHECKS.filter(([, check]) => !check(merged)).map(([label]) => label)
  assert.deepEqual(unfinished, [], `a complete intake still leaves ${unfinished.join(', ')}`)
})

// A select stores a value and shows a label. Free text arriving where a
// choice was asked for makes somebody quietly unmatchable rather than
// visibly wrong.
test('a choice has to be one of the choices', () => {
  assert.deepEqual(sanitiseAnswers({ role_level: 'Supreme Wizard of Spa' }), {})
  assert.deepEqual(sanitiseAnswers({ role_level: 'Spa Manager' }), { role_level: 'Spa Manager' })
  assert.deepEqual(sanitiseAnswers({ languages: ['English', 'English', ' French '] }).languages, ['English', 'French'])
  assert.equal(sanitiseAnswers({ experience_years: '999' }).experience_years, 60)
  assert.ok(!('note' in sanitiseAnswers({ note: 'not a question we asked' })))
})

// Nothing is stored, and no account is made, on an intake that skipped the
// things the profile cannot be finished without.
test('the required answers are enforced by the server, not only the browser', () => {
  assert.ok(REQUIRED_QUESTIONS.length >= 4)
  assert.ok(unanswered({}).length === REQUIRED_QUESTIONS.length)
  assert.equal(unanswered(sanitiseAnswers({
    role_level: 'Therapist', experience_years: 3, postcode: 'W1', availability_status: 'immediately', visibility: 'open',
  })).length, 0)

  assert.match(route, /const missing = unanswered\(answers\)/)
  assert.match(route, /Still to answer/)
  // Refused before anything is written, not after.
  assert.ok(route.indexOf('const missing = unanswered') < route.indexOf("from('profile_build_requests').insert"))
  assert.match(form, /unanswered\(sanitiseAnswers\(answers\)\)/, 'and said on screen before the upload')
})

// The single thing this market is most afraid of is a current employer
// finding out. It is asked, and it is private unless they said otherwise.
test('how visible they are is their answer, and private when they gave none', () => {
  assert.equal(chosenVisibility({}), 'private')
  assert.equal(chosenVisibility({ visibility: 'nonsense' }), 'private')
  assert.equal(chosenVisibility({ visibility: 'open' }), 'open')
  assert.equal(answersToProfile({ current_employer: 'The Dorchester Spa' }).current_employer_visible, false)
  assert.match(route, /visibilityColumns\(chosenVisibility\(person\.answers\)\)/)
})

// Somebody who already has a profile asked for help with it, not to have
// their own answers replaced by a form they filled in five minutes ago. The
// answers still have to land, though: refusing them outright dropped every
// one for anybody who already had an account.
test('a fresh intake fills the gaps in an existing profile and nothing else', () => {
  assert.match(route, /fillBlankProfileFields\(admin, userId, fields\)/)
  assert.doesNotMatch(route, /if \(record\.created && Object\.keys\(fields\)\.length\)/)
})

// A profile that reads like a recruiter's write-up tells everybody it was
// filled in by somebody else, which is exactly what it must not do.
test('the bio is written as they would write it', () => {
  assert.match(reader, /FIRST PERSON/)
  assert.match(reader, /as though she wrote it/i)
  assert.doesNotMatch(reader, /third person/i)
})

// One jsonb column, because Postgres refuses a whole statement over one
// unknown name and this platform has paid for that three times.
test('adding a question does not need a migration', () => {
  assert.match(migration, /add column if not exists answers jsonb/)
  assert.match(route, /answers,/)
})
