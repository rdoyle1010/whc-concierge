import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isRealLearnerName, learnerIdsToLookUp, learnerName, lessonProgress } from '../src/lib/academy-learners'

// "I need to see who is doing the course and how far they got."
//
// The admin Academy screen listed sixteen learners and called every one of
// them "Therapist". It looked like sixteen people who had never filled in
// their name. It was one query failing.
//
// candidate_id became nullable when erasure started detaching records instead
// of destroying them. A single null in a PostgREST .in() list rejects the
// whole query, so one deleted account took the name off every other learner.
// The route then discarded that error and fell through to a hard-coded word
// that reads like a job title - so a broken lookup and a nameless account
// produced identical screens, and nothing anywhere said which had happened.
//
// This is the same shape as the picture sweep: a failure that is quietly
// dressed up as data is worse than a failure that shows. The rule this file
// holds is that when the platform cannot answer who someone is, it says so.

const read = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) =>
  read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const ROUTE = 'src/app/api/admin/academy/route.ts'
const PAGE = 'src/app/admin/academy/page.tsx'

test('a learner who cannot be named is not given somebody else’s job title', () => {
  // The four situations must read as four different things on the screen.
  assert.equal(learnerName('c-1', { full_name: 'Amara Oyelowo' }), 'Amara Oyelowo')
  assert.equal(learnerName(null, null), 'Account deleted')
  assert.equal(learnerName('c-1', null), 'Account not found')
  assert.equal(learnerName('c-1', { full_name: '   ' }), 'Name not given')

  const labels = new Set([
    learnerName(null, null),
    learnerName('c-1', null),
    learnerName('c-1', { full_name: '' }),
  ])
  assert.equal(labels.size, 3, 'three different failures must not print as one word')
  for (const label of labels) {
    assert.doesNotMatch(label, /therapist/i, 'a job title read as a name and hid a broken query')
  }

  // And the screen must be able to set a stand-in apart from a real name.
  assert.equal(isRealLearnerName({ full_name: 'Amara Oyelowo' }), true)
  assert.equal(isRealLearnerName({ full_name: ' ' }), false)
  assert.equal(isRealLearnerName(null), false)
})

test('one deleted account does not take the names off everybody else', () => {
  // The exact failure. A null candidate_id must never reach the .in() list.
  const ids = learnerIdsToLookUp([
    { candidate_id: 'c-1' },
    { candidate_id: null },
    { candidate_id: 'c-2' },
    { candidate_id: '  ' },
    { candidate_id: 'c-1' },
  ] as any)
  assert.deepEqual(ids, ['c-1', 'c-2'])
  for (const id of ids) assert.ok(id.trim(), 'a blank id is an invalid uuid and rejects the whole query')

  const route = body(ROUTE)
  assert.match(route, /learnerIdsToLookUp\(/,
    'the route must filter its id list through the guard rather than mapping raw')
  // The same id is read again on award and revoke, and eq('id', null) is a
  // 400 from PostgREST rather than an empty result. Every read of it must be
  // behind a check that it is there at all.
  const flat = route.replace(/\s+/g, ' ')
  for (const [index, read] of [...flat.matchAll(/(?:\.eq\('id', |candidateMap\.get\(|learnerEmails\.get\()enrolment\.candidate_id/g)].entries()) {
    const before = flat.slice(Math.max(0, (read.index ?? 0) - 170), read.index)
    assert.match(before, /enrolment\.candidate_id \?/,
      `read ${index + 1} of candidate_id is not behind a check that it exists`)
  }
})

test('a lookup that fails is reported, not worn as a name', () => {
  const route = body(ROUTE)

  // The original discarded the error: `const { data: candidates } = await ...`.
  assert.match(route, /learnerLookupError/,
    'the error from the learner lookup has to be kept')
  assert.match(route, /learner_lookup_error/,
    'and returned, so the screen can say a name is missing because a query broke')

  const page = body(PAGE)
  assert.match(page, /learner_lookup_error/, 'the admin page must read it')
  assert.match(page, /learnerLookupError &&/, 'and render something when it is set')

  // Nothing anywhere may go back to the fallback that caused this.
  assert.doesNotMatch(route, /'Therapist'/, 'the fallback that started this must not return')
  assert.doesNotMatch(page, /\|\| 'Therapist'/)
})

test('how far they got is counted against the course that exists today', () => {
  // Counting the keys of the progress map was the old sum. A key set to false
  // counted as done, and an index left behind by a shortened course counted
  // too, so a learner could read 6 of 5.
  assert.deepEqual(lessonProgress({ '0': true, '1': true }, 5), { done: 2, total: 5, percent: 40, nextIndex: 2 })
  assert.deepEqual(lessonProgress({ '0': true, '1': false }, 2), { done: 1, total: 2, percent: 50, nextIndex: 1 })
  assert.deepEqual(lessonProgress({ '0': true, '7': true }, 3), { done: 1, total: 3, percent: 33, nextIndex: 1 })
  assert.equal(lessonProgress({ '0': true, '1': true, '2': true }, 3).nextIndex, -1, 'nothing is up next when it is all done')

  // Nonsense in must not throw on an admin screen.
  assert.deepEqual(lessonProgress(null, 4), { done: 0, total: 4, percent: 0, nextIndex: 0 })
  assert.deepEqual(lessonProgress('what', 0), { done: 0, total: 0, percent: 0, nextIndex: -1 })
  assert.deepEqual(lessonProgress(['0'], 1), { done: 0, total: 1, percent: 0, nextIndex: 0 })
})

test('the screen answers the question that was actually asked', () => {
  const page = body(PAGE)

  // Who: a name plus a way to reach them, and a way to find one person.
  assert.match(page, /candidate_email/, 'an address, because candidate_profiles has no email column and she needs one')
  assert.match(page, /setLearnerQuery/, 'sixteen rows is a list; a hundred needs a search')

  // How far: the module they stopped at, not only a fraction.
  assert.match(page, /next_lesson/, 'where somebody stopped is the useful half of "how far"')
  assert.match(page, /How far they have got/)

  // And the one thing on the screen she can act on: enrolled, never opened.
  assert.match(page, /days >= 14/, 'a paid enrolment nobody has opened is the row worth chasing')
})

test('the learner list is sorted on a copy', () => {
  // Sorting the memoised array in place reorders what every other part of the
  // screen reads from, including the counts above the table.
  const page = body(PAGE)
  assert.match(page, /\[\.\.\.filtered\]\.sort\(/,
    'sort mutates; the filtered array must be copied first')
})
