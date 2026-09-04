import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import {
  normaliseShareCode, isValidShareCode, checkUrlFor, hasBeenChecked, needsRecheck,
} from '../src/lib/right-to-work'
import { parseLanguageSkills, LANGUAGES, FLUENCY_LEVELS } from '../src/lib/languages'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Share codes are shown with spaces on gov.uk and people copy them across.
test('a share code is accepted however it was copied', () => {
  assert.equal(normaliseShareCode(' w9a 4b7 2kx '), 'W9A4B72KX')
  assert.ok(isValidShareCode('w9a 4b7 2kx'))
  assert.ok(isValidShareCode('W9A4B72KX'))
  for (const bad of ['', 'W9A4B72K', 'W9A4B72KXY', 'W9A-4B7-2K!', 'not a code']) {
    assert.equal(isValidShareCode(bad), false, `${bad} should be refused`)
  }
  assert.match(checkUrlFor('w9a 4b7 2kx'), /shareCode=W9A4B72KX/)
})

// The distinction the whole design rests on: a professional supplying a code is
// not evidence of anything until somebody has opened the Home Office page and
// recorded what it said.
test('supplying a code is not the same as having been checked', () => {
  assert.equal(hasBeenChecked({ right_to_work_share_code: 'W9A4B72KX' }), false)
  assert.equal(hasBeenChecked({ right_to_work_status: 'approved' }), false, 'a status with no date is not a check')
  assert.equal(hasBeenChecked({ right_to_work_status: 'approved', right_to_work_verified_at: '2026-09-03T10:00:00Z' }), true)
})

// Time-limited permission has to be re-checked before it lapses or the
// statutory excuse goes with it.
test('permission that is about to expire is flagged in time', () => {
  const now = new Date('2026-09-03T00:00:00Z')
  assert.equal(needsRecheck({ right_to_work_expiry_date: '2026-09-20' }, now), true)
  assert.equal(needsRecheck({ right_to_work_expiry_date: '2027-06-01' }, now), false)
  assert.equal(needsRecheck({ right_to_work_expiry_date: '2026-08-01' }, now), true, 'already lapsed still needs looking at')
  assert.equal(needsRecheck({}, now), false)
  assert.equal(needsRecheck({ right_to_work_expiry_date: 'nonsense' }, now), false)
})

// The column is jsonb, so a row could hold an older shape, a partial write, or
// something typed by hand in the SQL editor.
test('only languages and fluencies the platform defines are rendered', () => {
  const parsed = parseLanguageSkills([
    { code: 'fr', fluency: 'fluent' },
    { code: 'xx', fluency: 'fluent' },
    { code: 'ar', fluency: 'invented' },
    { code: 'fr', fluency: 'native' },
    'nonsense',
    null,
  ])
  assert.deepEqual(parsed.map(l => l.code), ['fr'], 'unknown codes, unknown fluencies and duplicates are dropped')
  assert.equal(parsed[0].label, 'French')
})

test('languages are listed strongest first', () => {
  const parsed = parseLanguageSkills([
    { code: 'es', fluency: 'conversational' },
    { code: 'en', fluency: 'native' },
    { code: 'fr', fluency: 'professional' },
  ])
  assert.deepEqual(parsed.map(l => l.code), ['en', 'fr', 'es'])
})

test('the language list is long enough to be useful and short enough to fill in', () => {
  assert.ok(LANGUAGES.length >= 25 && LANGUAGES.length <= 60, `${LANGUAGES.length} languages`)
  assert.ok(FLUENCY_LEVELS.every(level => level.hint), 'every fluency needs plain wording')
})

// Nationality is a protected characteristic. Putting it on a profile that
// properties browse builds a discrimination route into the product, and the
// platform supplying the filter is facilitating it - not only the property
// using it. This is the guard against it arriving later by accident.
test('nationality is not collected anywhere', () => {
  const dir = new URL('../supabase/migrations/', import.meta.url)
  const sql = readdirSync(dir).filter(f => f.endsWith('.sql'))
    .map(f => readFileSync(new URL(f, dir), 'utf8')).join('\n')
  assert.ok(
    !/add column[^;]*\bnationality\b/i.test(sql),
    'nationality must not be a column on any profile',
  )
  const languages = read('src/lib/languages.ts')
  assert.match(languages, /protected characteristic/, 'the reason must travel with the code')
})

// Storing a document and marking it verified is not a check and gives no
// statutory excuse. The share code is a real one.
test('right to work records the check, not a document', () => {
  const lib = read('src/lib/right-to-work.ts')
  assert.match(lib, /gov\.uk\/view-right-to-work/, 'the checker needs the page the result is on')
  assert.match(lib, /statutory excuse/, 'why this is not a document upload must be written down')
  const migration = read('supabase/migrations/20260903120000_share_codes_and_languages.sql')
  for (const column of ['right_to_work_share_code', 'right_to_work_checked_by', 'right_to_work_check_outcome', 'cv_language', 'language_skills']) {
    assert.ok(migration.includes(column), `${column} must be created`)
  }
})

// A share code submission has no document to upload. Requiring one before the
// method is known rejected the very check this work exists to allow - the form
// accepted it and the server refused it.
test('a share code is accepted without a document', () => {
  const route = read('src/app/api/verification/route.ts')
  const guard = route.slice(route.indexOf('const rightToWorkUrl ='))
  const refusal = guard.slice(0, guard.indexOf('Please upload evidence'))
  assert.match(refusal, /method !== 'share_code'/, 'the document is only required where a document is the method')
  // And the code itself has to be real, or an empty box would pass as a check.
  assert.match(route, /if \(!isValidShareCode\(shareCode\)\)/, 'a share code submission must carry a valid code')
})

// A column the screen reads but the query never asked for reads as empty, which
// looks exactly like a professional who supplied nothing.
test('every right-to-work column the screens read is selected', () => {
  const talent = read('src/app/api/verification/route.ts')
  const admin = read('src/app/api/admin/verification/route.ts')
  for (const column of ['right_to_work_method', 'right_to_work_share_code', 'right_to_work_dob']) {
    assert.ok(talent.includes(`${column},`) || talent.includes(`${column}'`), `${column} must be selected for the talent form`)
    assert.ok(admin.includes(column), `${column} must be selected for the admin queue`)
  }
  assert.ok(admin.includes('right_to_work_check_outcome'), 'the admin queue shows the last outcome recorded')
})

// Languages and the CV language are written through the profile route, which
// only writes columns it has been told about.
test('languages and the CV language can actually be saved', () => {
  const route = read('src/app/api/profile/update/route.ts')
  const allowed = route.slice(route.indexOf('ALLOWED_COLUMNS'), route.indexOf('])', route.indexOf('ALLOWED_COLUMNS')))
  for (const column of ['language_skills', 'cv_language']) {
    assert.ok(allowed.includes(`'${column}'`), `${column} must be writable`)
  }
  // The quoted form is a column entry; the word alone appears in the comment
  // above the list explaining why it is deliberately absent.
  assert.ok(!allowed.includes("'nationality'"), 'nationality must never become writable')
})
