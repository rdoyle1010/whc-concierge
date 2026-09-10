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

// One application was enough to read a professional's private life. The detail
// route selected the whole candidate row and stripped a single column, so the
// employer's browser received her phone number, home postcode, exact latitude
// and longitude, work email, right-to-work and insurance document URLs,
// verification notes, Stripe customer ids, and the salary floor she had
// explicitly marked private. The sibling inbox route had always done it
// correctly with an explicit list.

test('the applicant detail route names the fields it will share', () => {
  const route = body('src/app/api/employer/applications/detail/route.ts')
  assert.match(route, /const CANDIDATE_FIELDS = \[/, 'an allow-list, not select(*)')
  assert.doesNotMatch(route, /candidate_profiles'\)\.select\('\*'\)/,
    'select(*) on a candidate row is how twenty columns leaked')
})

test('nothing an employer has no business seeing survives', () => {
  const route = read('src/app/api/employer/applications/detail/route.ts')
  const fields = route.slice(route.indexOf('const CANDIDATE_FIELDS'), route.indexOf('].join'))
  // Never selected at all.
  for (const column of ['phone', 'work_email', 'verification_notes', 'stripe_customer_id',
                        'insurance_document_url', 'right_to_work_document_url', 'blocked_employers',
                        'referral_code', 'approval_notes']) {
    assert.ok(!fields.includes(`'${column}'`), `${column} must never reach an employer`)
  }
  // Selected because matching needs them, then stripped before the response.
  const response = route.slice(route.indexOf('candidate: {'))
  for (const column of ['latitude', 'longitude', 'postcode']) {
    assert.match(response, new RegExp(`${column}: undefined`),
      `${column} is used to compute distance, never to hand over an address`)
  }
})

test('a salary marked private stays private', () => {
  const route = body('src/app/api/employer/applications/detail/route.ts')
  assert.match(route, /salary_expectation_private !== false/)
  assert.match(route, /salary_expectation_min: null, salary_expectation_max: null/)
})

test('the applicant detail route honours anonymity', () => {
  const route = body('src/app/api/employer/applications/detail/route.ts')
  assert.match(route, /presentCandidateForEmployer\(candidate\)/)
})

// A shortlist is employer-initiated and the professional is never told she is
// on one, so nothing about it counts as her having revealed herself.
test('a shortlisted professional keeps the anonymity she chose', () => {
  const route = body('src/app/api/shortlist/route.ts')
  assert.match(route, /presentCandidateForEmployer\(raw\)/)
  assert.match(route, /show_first_name_only/, 'the join must fetch the flag the presenter reads')
})

// The phone was the leak. The web route had always used the helper; the mobile
// twin returned the real name on a swipe that was not yet a match, and named a
// private professional in the notification the property receives.
test('the mobile directory keeps the same promise as the web', () => {
  const route = body('src/app/api/mobile/employer-directory/route.ts')
  assert.match(route, /presentCandidateForEmployer\(candidate\)/, 'the listing itself')
  assert.match(route, /candidateNameForEmployer\(candidate\)/, 'a one-sided swipe stays anonymous')
  assert.match(route, /candidateNameForEmployer\(candidate, true\)/, 'a mutual match reveals, as it should')
  assert.doesNotMatch(route, /candidateName: candidate\.full_name/)

  const fields = route.slice(route.indexOf('const CANDIDATE_FIELDS'), route.indexOf('].join'))
  assert.ok(fields.includes("'stealth_mode'"), 'the guard cannot judge a column nobody fetched')
  assert.ok(fields.includes("'show_first_name_only'"))
})

test('interest and refusal do not identify a private professional', () => {
  const swipes = body('src/app/api/mobile/job-swipes/route.ts')
  assert.match(swipes, /candidateNameForEmployer\(candidate\)/)
  assert.doesNotMatch(swipes, /candidate\.full_name \|\| 'A professional'/)

  const interests = body('src/app/api/mobile/talent-interests/route.ts')
  assert.match(interests, /const candidateName = candidateNameForEmployer\(candidate\)/,
    'declining is not consent to be identified')
  assert.match(interests, /const revealedName = candidateNameForEmployer\(candidate, true\)/,
    'accepting is her choosing to engage')
  assert.match(interests, /\$\{revealedName\} accepted your interest/)
  assert.match(interests, /\$\{candidateName\} declined your interest/)
})
