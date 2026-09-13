import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CV_MODEL } from '../src/lib/cv-read'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const intake = body('src/app/api/profile-build/route.ts')
const adminRoute = body('src/app/api/admin/profile-build/route.ts')
const record = body('src/lib/candidate-record.ts')
const reader = body('src/lib/cv-read.ts')
const editor = body('src/components/AdminProfileEditor.tsx')
const section = body('src/components/CollapsibleCheckboxSection.tsx')

// Colin already had an account from an earlier test, so his record was not
// new, so the rule that only wrote answers onto a freshly created record
// dropped every one of them. The card printed his postcode at the top and the
// profile underneath said the postcode was missing.
test('an answer reaches the profile whether or not the account is new', () => {
  assert.doesNotMatch(intake, /if \(record\.created && Object\.keys\(fields\)\.length\)/,
    'answers must not be conditional on the record being new')
  assert.match(intake, /fillBlankProfileFields\(admin, userId, fields\)/)

  // Visibility is the one thing that stays conditional: somebody who was
  // already open chose that, and a fresh intake does not undo it.
  assert.match(intake, /if \(record\.created\)[\s\S]{0,300}visibilityColumns\(chosenVisibility/)
})

// An answer that never reached the profile is invisible, because two screens
// show two different things and nobody compares them.
test('opening the card puts any stranded answers where they belong', () => {
  const profileBlock = adminRoute.slice(adminRoute.indexOf("action === 'profile'"), adminRoute.indexOf("action === 'save_profile'"))
  assert.match(profileBlock, /answersToProfile\(sanitiseAnswers\(request\.answers\)\)/)
  assert.match(profileBlock, /fillBlankProfileFields\(admin, request\.created_user_id, fromAnswers\)/)
  // Before it reads the profile back, or the screen shows the state from
  // before the repair and looks exactly as broken as it did.
  assert.ok(profileBlock.indexOf('fillBlankProfileFields') < profileBlock.indexOf("select('*')"))
})

// A blank field is not somebody's work. A value anybody put there is.
test('filling blanks fills only blanks', () => {
  assert.match(record, /export async function fillBlankProfileFields/)
  assert.match(record, /if \(Array\.isArray\(value\)\) return value\.length === 0/)
  assert.match(record, /if \(blank\(existing\[field\]\) && !blank\(value\)\) patch\[field\] = value/)
  // false is an answer, not an absence.
  assert.match(record, /return false\n  \}/)
  // And a column the table does not have is skipped rather than written.
  assert.match(record, /if \(!\(field in existing\)\) continue/)
})

// The thing that decides whether a CV read returns at all is how fast the
// tokens come out, not how clever the model is. Three reads in a row died
// past eighteen seconds and told an administrator to paste the text in.
test('the CV reader is chosen for speed, because the ceiling is fixed', () => {
  assert.equal(CV_MODEL, 'claude-sonnet-5')
  assert.match(reader, /model: CV_MODEL/)
  const output = Number(reader.match(/const MAX_OUTPUT_TOKENS = (\d+)/)?.[1])
  assert.ok(output > 0 && output <= 2500, 'the worst case output has to fit inside the ceiling')
})

// A profile claiming all sixty treatments, all thirty-nine qualifications and
// forty product houses is not impressive, it is unbelievable, and it makes
// matching worthless for everybody else on the register. One administrator
// opening five sections and pressing the link at the top of each did exactly
// that in about ten seconds.
test('nothing offers to tick the whole taxonomy at once', () => {
  assert.match(section, /allowSelectAll = true/, 'the option exists')
  assert.match(section, /\{allowSelectAll && \(/, 'and it actually hides the control')
  const offers = editor.match(/<CollapsibleCheckboxSection/g) || []
  const off = editor.match(/allowSelectAll=\{false\}/g) || []
  assert.equal(off.length, offers.length, 'every section in the admin editor has it turned off')
  assert.ok(offers.length >= 5)
  // Clearing stays, because undoing it has to be one press.
  assert.match(section, /Clear All/)
})
