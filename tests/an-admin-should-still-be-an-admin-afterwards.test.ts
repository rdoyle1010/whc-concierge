import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sanitiseProfileEdit, completionPercent, missingFrom, EDITABLE_FIELDS, COMPLETION_CHECKS } from '../src/lib/candidate-fields'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/admin/profile-build/route.ts')
const page = body('src/app/admin/profile-build/page.tsx')
const editor = body('src/components/AdminProfileEditor.tsx')
const talentProfile = read('src/app/talent/profile/page.tsx')

// The bug this whole screen was rebuilt around: building somebody's profile
// meant opening a magic link that signed her in as them, on the same origin,
// in the same browser. Her own admin session was replaced, so the tab behind
// it answered "Unauthorised" to everything, and the workspace that opened
// belonged to an account she had just made. Two errors, one cause, and
// between them they said nothing about what had happened.
test('building a profile does not sign her in as anybody', () => {
  assert.match(route, /action === 'save_profile'/, 'there is a write she makes as herself')
  assert.match(route, /action === 'profile'/, 'and a read to fill the form from')

  // The link still exists, because a photograph can only be uploaded from
  // their own workspace. It is copied, never followed.
  assert.doesNotMatch(page, /window\.open\(/, 'nothing on this page opens a session as somebody else')
  assert.match(page, /clipboard\.writeText/, 'the link is handed over rather than followed')
  assert.match(page, /signed out of admin/i, 'and what it costs is said before she presses it')
  assert.match(route, /warning: 'That link signs you in as them/, 'said by the server too')
})

// A service-role write has no RLS in front of it. Whatever this list contains
// is written without anything to stop it, so what it does not contain matters
// more than what it does.
test('an administrator filling a form cannot approve, publish or pay anybody', () => {
  const forbidden = [
    'approval_status', 'profile_visible', 'stealth_mode', 'private_mode',
    'is_premium', 'subscription_status', 'user_id', 'id', 'email', 'role',
  ]
  for (const field of forbidden) {
    assert.ok(!EDITABLE_FIELDS.includes(field), `${field} must not be editable from the admin form`)
  }

  const written = sanitiseProfileEdit({
    full_name: 'Colin Rae',
    approval_status: 'approved',
    profile_visible: true,
    stealth_mode: false,
    user_id: 'somebody-else',
    is_premium: true,
  })
  for (const field of forbidden) {
    assert.ok(!(field in written), `${field} reached the row through the sanitiser`)
  }
  assert.equal(written.full_name, 'Colin Rae')

  // And the row the route writes puts them back to private every time, so
  // filling somebody's profile in can never be the thing that publishes them.
  const saveBlock = route.slice(route.indexOf("action === 'save_profile'"))
  assert.match(saveBlock, /visibilityColumns\('private'\)/)
})

// A form that shows ten fields must not blank the other twenty by not
// mentioning them.
test('only what was sent is written', () => {
  const written = sanitiseProfileEdit({ headline: 'Director of Spa' })
  assert.deepEqual(Object.keys(written), ['headline'])
  assert.ok(!('bio' in written), 'an untouched field is left alone, not emptied')

  // An emptied field is still a decision, and is written as one.
  assert.deepEqual(sanitiseProfileEdit({ bio: '   ' }), { bio: null })
})

// Treatments live in two columns and only one of them is read by matching.
// Writing one without the other produces either a profile that looks half
// finished or one that looks complete and matches nothing. It has been both.
test('treatments are written to the column matching reads, and the other one', () => {
  const written = sanitiseProfileEdit({ services_offered: ['Swedish Massage', 'Swedish Massage', ' Hot Stone Massage '] })
  assert.deepEqual(written.services_offered, ['Swedish Massage', 'Hot Stone Massage'], 'trimmed and deduplicated')
  assert.deepEqual(written.treatment_skills, written.services_offered)
})

// A postcode with no location is invisible to everything that searches.
test('a postcode fills the column the rest of the platform reads', () => {
  assert.equal(sanitiseProfileEdit({ postcode: 'BA1 2LR' }).location, 'BA1 2LR')
  // Unless she has said somewhere different, which is hers to keep.
  assert.equal(sanitiseProfileEdit({ postcode: 'BA1 2LR', location: 'Bath' }).location, 'Bath')
})

// Two screens showing two different percentages for one profile is worse than
// neither showing any: she cannot tell whether she has finished.
test('the admin screen counts completion the way their own profile page does', () => {
  for (const [label] of COMPLETION_CHECKS) {
    assert.ok(talentProfile.includes(`'${label}'`) || label === 'Treatments and services',
      `${label} is counted here but not on their own profile page`)
  }
  assert.equal(COMPLETION_CHECKS.length, 10)
  assert.equal(completionPercent({}), 0)
  assert.equal(completionPercent({ full_name: 'A', role_level: 'Therapist' }), 20)
  assert.ok(missingFrom({ full_name: 'A' }).includes('Qualifications'))
})

// A save against a candidate row that does not exist updates nothing and
// reports success, which is the exact shape of failure this platform keeps
// being caught by.
test('there is always a row to write to', () => {
  const saveBlock = route.slice(route.indexOf("action === 'save_profile'"))
  const readBlock = route.slice(route.indexOf("action === 'profile'"), route.indexOf("action === 'save_profile'"))
  for (const block of [saveBlock, readBlock]) {
    assert.match(block, /ensureCandidateProfile\(/, 'the record is created when it is missing')
  }
  assert.match(saveBlock, /if \(!written\.ok\) return NextResponse\.json/, 'a failed write is not reported as a save')
  assert.match(saveBlock, /written\.stripped\.length/, 'and a column that could not be stored is named')
})

// The editor is the form. If it stops sending the fields, everything above is
// a guard on a door nobody walks through.
test('the form covers what a profile is scored on', () => {
  for (const field of ['full_name', 'role_level', 'headline', 'bio', 'experience_years', 'postcode']) {
    assert.ok(editor.includes(`'${field}'`), `the form has no ${field}`)
  }
  for (const field of ['services_offered', 'qualifications', 'product_houses', 'systems_experience', 'business_skills']) {
    assert.ok(editor.includes(`'${field}'`), `the form has no ${field}`)
  }
  assert.match(editor, /save_profile/, 'and it saves through the admin route')
})
