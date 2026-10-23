import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { presentCandidateForEmployer } from '../src/lib/private-mode'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// Where somebody works now is the most sensitive line on a profile: a
// therapist quietly looking is risking her job by answering it. It is off
// until she turns it on, and Private Career Mode overrides her answer, because
// being identified by your employer's name instead of your own is not
// anonymity.

const candidate = (extra: Record<string, unknown>) => ({
  full_name: 'Alexandra Whitmore-Hunt',
  current_employer: 'The Dorchester Spa, London',
  ...extra,
})

test('an employer never sees it unless she opted in', () => {
  assert.equal(presentCandidateForEmployer(candidate({})).current_employer, null,
    'silence is not consent')
  assert.equal(presentCandidateForEmployer(candidate({ current_employer_visible: false })).current_employer, null)
  assert.equal(
    presentCandidateForEmployer(candidate({ current_employer_visible: true })).current_employer,
    'The Dorchester Spa, London',
  )
})

test('Private Career Mode overrides her answer', () => {
  const shown = presentCandidateForEmployer(candidate({ current_employer_visible: true, private_mode: true }))
  assert.equal(shown.current_employer, null,
    'an anonymous professional must not be identifiable by her employer instead')
  // And it comes back once she has accepted this employer's introduction.
  const revealed = presentCandidateForEmployer(candidate({ current_employer_visible: true, private_mode: true }), true)
  assert.equal(revealed.current_employer, 'The Dorchester Spa, London')
})

test('the flag itself never leaves the server', () => {
  const shown = presentCandidateForEmployer(candidate({ current_employer_visible: true }))
  assert.equal(shown.current_employer_visible, undefined,
    'whether she opted in is her business, not the employer’s')
})

test('the decision lives in one place', () => {
  // The whole reason this function exists is that anonymisation was honoured
  // in two routes and forgotten in three. A second copy of this rule would
  // repeat that exactly.
  const lib = body('src/lib/private-mode.ts')
  assert.match(lib, /current_employer_visible === true && !isPrivate/)
  const api = body('src/app/api/employer/candidates/route.ts')
  assert.doesNotMatch(api, /current_employer_visible === true/,
    'the route must not re-decide what the presenter already decided')
})

test('she has somewhere to say it, and the choice is beside the field', () => {
  const profile = read('src/app/talent/profile/page.tsx')
  assert.match(profile, /Where you work now/)
  assert.match(profile, /Let properties see where I work now/)
  assert.match(profile, /Off by default/, 'the default has to be stated, not assumed')
  assert.match(profile, /current_employer_visible:!!profile\.current_employer_visible/, 'and it must actually save')
  assert.match(read('src/app/api/profile/update/route.ts'), /'current_employer','current_employer_visible'/)
})

test('the card shows what was already being fetched', () => {
  // Verified status, insurance, right to work, product houses, availability,
  // qualifications and review score were all selected by the API and rendered
  // by nothing, so a spa director could not tell a checked twenty-year head
  // therapist from an empty profile without opening both.
  const card = body('src/app/employer/candidates/page.tsx')
  for (const field of ['c.whc_verified', 'c.has_insurance', 'c.right_to_work_status', 'c.product_houses', 'c.availability_status', 'c.qualifications', 'c.review_score', 'c.current_employer']) {
    assert.ok(card.includes(field), `the card must show ${field}`)
  }
})

test('an unfinished profile says so instead of looking broken', () => {
  const card = body('src/app/employer/candidates/page.tsx')
  assert.match(card, /has not finished their profile yet/)
  // And a missing headline falls back rather than leaving a blank line.
  assert.match(card, /c\.headline \|\| c\.role_level \|\| 'Spa and wellness professional'/)
})
