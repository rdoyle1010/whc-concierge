import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_VISIBILITY, VISIBILITY_COPY, isTalentVisibility,
  visibilityColumns, visibilityFrom, type TalentVisibility,
} from '../src/lib/talent-visibility'
import { presentCandidateForEmployer, candidateNameForEmployer } from '../src/lib/private-mode'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// Registration wrote profile_visible: true and left Private Career Mode off,
// so a therapist was fully discoverable by name from the second she signed
// up, never asked and never told. In an industry where every spa director
// knows every other spa director, that is the single thing professionals say
// they are afraid of, done silently, by default.
test('a new account is private until she says otherwise', () => {
  assert.equal(DEFAULT_VISIBILITY, 'private')

  const columns = visibilityColumns('private')
  assert.equal(columns.profile_visible, false)
  assert.equal(columns.stealth_mode, true)
  assert.equal(columns.private_mode, true)
  assert.equal(columns.private_hide_photo, true)

  const init = body('src/app/api/register/init/route.ts')
  assert.match(init, /\.\.\.visibilityColumns\(visibility\)/)
  // The old unconditional publication must be gone, not merely overridden.
  assert.doesNotMatch(init, /profile_visible: true,\s*\n\s*\}, \{ onConflict: 'user_id' \}\)/)
  // A malformed body must not be the thing that publishes somebody.
  assert.match(init, /isTalentVisibility\(body\.visibility\) \? body\.visibility : DEFAULT_VISIBILITY/)
})

test('anything that is not one of the three answers is private', () => {
  for (const rubbish of ['visible', 'PRIVATE', '', null, undefined, true, 1, {}]) {
    assert.equal(isTalentVisibility(rubbish), false, `${String(rubbish)} should not be accepted`)
  }
  for (const good of ['private', 'discreet', 'open']) {
    assert.equal(isTalentVisibility(good), true)
  }
})

// Private must mean private in every route that looks, not most of them.
// Different routes read different columns: search checks profile_visible and
// stealth_mode, the employer directory checks only profile_visible, the brief
// builder only stealth_mode. One column set false is one route away from a
// leak.
test('private satisfies every filter the platform actually uses', () => {
  const columns = visibilityColumns('private')
  // As the search route filters.
  assert.equal(columns.profile_visible !== false && columns.stealth_mode !== true, false)
  // As the employer directory filters (profile_visible true or null).
  assert.equal(columns.profile_visible === true, false)
  // As the brief builder filters (stealth_mode false or null).
  assert.equal(columns.stealth_mode === false, false)
})

// Discreet is the one this market actually wants, and it was built and never
// offered. It has to be findable and anonymous at the same time.
test('discreet is findable by skill and anonymous by name', () => {
  const columns = visibilityColumns('discreet')
  assert.equal(columns.profile_visible, true, 'she has to be findable or it is just private')
  assert.equal(columns.stealth_mode, false)
  assert.equal(columns.private_mode, true)

  // And the shared presenter must honour it: name shortened, photograph and
  // CV withheld, current employer never shown.
  const shown = presentCandidateForEmployer({
    full_name: 'Alexandra Whitmore-Hunt',
    profile_image_url: 'https://example.com/a.jpg',
    cv_url: 'https://example.com/cv.pdf',
    current_employer: 'The Grand',
    current_employer_visible: true,
    ...columns,
  })
  assert.equal(shown.full_name, 'Alexandra W.')
  assert.equal(shown.profile_image_url, null)
  assert.equal(shown.cv_url, null)
  assert.equal(shown.current_employer, null)
  assert.equal(candidateNameForEmployer({ full_name: 'Alexandra Whitmore-Hunt', ...columns }), 'Alexandra W.')

  // Until she accepts an introduction, at which point it is hers to give.
  const revealed = presentCandidateForEmployer({ full_name: 'Alexandra Whitmore-Hunt', ...columns }, true)
  assert.equal(revealed.full_name, 'Alexandra Whitmore-Hunt')
})

test('open is open, and says so', () => {
  const columns = visibilityColumns('open')
  assert.equal(columns.profile_visible, true)
  assert.equal(columns.private_mode, false)
  const shown = presentCandidateForEmployer({ full_name: 'Alexandra Whitmore-Hunt', ...columns })
  assert.equal(shown.full_name, 'Alexandra Whitmore-Hunt')
})

// Reading the answer back must survive Postgres nulls. `null = false` is null,
// not true, so a column nobody has written has to be read deliberately.
test('reading the setting back never guesses wrong in the dangerous direction', () => {
  for (const state of ['private', 'discreet', 'open'] as TalentVisibility[]) {
    assert.equal(visibilityFrom(visibilityColumns(state)), state, `${state} did not survive the round trip`)
  }
  assert.equal(visibilityFrom(null), 'private', 'no profile is not permission to publish')
  assert.equal(visibilityFrom(undefined), 'private')
  // An account from before any of this existed: visible, private_mode never
  // written. That genuinely is open - it is what employers have been seeing -
  // and calling it anything else would misreport her exposure to her.
  assert.equal(visibilityFrom({ profile_visible: true, stealth_mode: null, private_mode: null }), 'open')
  // Either kill switch alone is enough to be private.
  assert.equal(visibilityFrom({ profile_visible: false, private_mode: null }), 'private')
  assert.equal(visibilityFrom({ profile_visible: true, stealth_mode: true }), 'private')
})

// The choice belongs on the form, not three screens later in a settings page
// only the worried go looking for.
test('she is asked before the account exists, and can change it after', () => {
  const form = body('src/app/register/talent/page.tsx')
  assert.match(form, /name="visibility"/)
  assert.match(form, /useState<TalentVisibility>\(DEFAULT_VISIBILITY\)/)
  assert.match(form, /visibility,/, 'the answer has to reach the server')

  const privacy = body('src/app/talent/privacy/page.tsx')
  assert.match(privacy, /<VisibilityControl \/>/)
})

// Telling somebody she is private when she is not is the worst outcome this
// route has, so it reads the row back rather than trusting the write.
test('the change is confirmed from the database, not from the request', () => {
  const route = body('src/app/api/talent/visibility/route.ts')
  assert.match(route, /const actual = visibilityFrom\(saved\)/)
  assert.match(route, /if \(actual !== body\.visibility\)/)
  assert.match(route, /status: 401/)

  const control = body('src/components/VisibilityControl.tsx')
  assert.match(control, /if \(!res\.ok\) \{ setError/, 'a failed save must not look like a saved one')
})

// Written for her, not for the database.
test('each answer is described in what it does', () => {
  for (const state of ['private', 'discreet', 'open'] as TalentVisibility[]) {
    const copy = VISIBILITY_COPY[state]
    assert.ok(copy.label.length > 0 && copy.detail.length > 30)
    assert.doesNotMatch(copy.detail, /stealth_mode|profile_visible|private_mode|column|database/i)
  }
  assert.match(VISIBILITY_COPY.discreet.detail, /introduction/i)
  assert.match(VISIBILITY_COPY.private.detail, /nobody can find you/i)
})
