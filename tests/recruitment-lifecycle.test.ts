import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

function read(path: string) {
  return readFileSync(path, 'utf8')
}

// The cap moved from two rounds to three, deliberately - a director-level
// process routinely runs screen, panel, final. What matters to this test is
// that a cap exists and is checked before anything is written: unbounded
// rounds let a property string somebody along indefinitely with no stage
// ever being the last one.
test('interview pipeline is bounded and requires candidate confirmation', () => {
  const employer = read('src/app/api/employer/applications/interview/route.ts')
  const talent = read('src/app/api/talent/applications/interview/route.ts')
  assert.match(employer, /roundNumber/)
  assert.match(employer, /roundNumber > 3/, 'the number of rounds must be capped')
  assert.match(employer, /Invalid interview round/)
  assert.match(employer, /application_interviews/)
  assert.match(talent, /application_interviews/)
  assert.match(talent, /selected_slot/)
  assert.match(talent, /status:\s*'confirmed'/)
})

test('offer flow requires candidate response and records accepted state', () => {
  const employer = read('src/app/api/employer/applications/offer/route.ts')
  const talent = read('src/app/api/talent/applications/offer/route.ts')
  assert.match(employer, /application_offers/)
  assert.match(talent, /action === 'accept'/)
  assert.match(talent, /'accepted'/)
  assert.match(talent, /'declined'/)
  // The application has to move with the offer, or the professional has
  // accepted a job the pipeline still shows as an open offer. Written as
  // intent rather than as one line of formatting: the call is split across
  // lines now because its error is finally being read.
  assert.match(talent, /from\('applications'\)[\s\S]{0,40}\.update/)
  assert.match(talent, /status: nextApplicationStatus/)
  assert.match(talent, /if \(applicationError\)/, 'a lost update leaves the two sides disagreeing')
})

test('complete hire closes the role and archives the successful placement', () => {
  const route = read('src/app/api/employer/applications/complete-hire/route.ts')
  assert.match(route, /application\.status !== 'accepted'/)
  assert.match(route, /hired_at/)
  assert.match(route, /archived_at/)
  assert.match(route, /status:\s*'filled'/)
  assert.match(route, /sendRoleFilledEmail/)
  assert.match(route, /Privacy & account settings/)
})

test('hired archive can reopen the recruitment record without relisting the vacancy', () => {
  const route = read('src/app/api/employer/hired/route.ts')
  assert.match(route, /reopen_record/)
  assert.match(route, /archived_at:\s*null/)
  assert.doesNotMatch(route, /is_live\s*:\s*true/)
})

test('post-hire platform reviews require a completed placement', () => {
  const route = read('src/app/api/platform-reviews/route.ts')
  assert.match(route, /hired_at/)
  assert.match(route, /platform_experience_reviews/)
  assert.match(route, /reviewer_role/)
  assert.equal(existsSync('supabase/migrations/046_platform_experience_reviews.sql'), true)
})

test('completed talent placements leave active applications and move to the archive', () => {
  const mine = read('src/app/api/applications/mine/route.ts')
  const pipeline = read('src/app/api/talent/applications/pipeline-list/route.ts')
  const archive = read('src/app/api/talent/hired/route.ts')
  const archivePage = read('src/app/talent/hired/page.tsx')
  // hired_at is the fact; archived_at is the EMPLOYER's own filing state,
  // which they can clear from their Hired page. Reading archived_at on the
  // talent side meant "reopen record" silently deleted a placement from the
  // professional's history and pushed it back into their active
  // applications. Both sides now key on hired_at.
  assert.match(mine, /\.is\('archived_at', null\)/)
  assert.match(mine, /\.is\('hired_at', null\)/)
  assert.match(pipeline, /\.is\('archived_at', null\)/)
  assert.match(pipeline, /\.is\('hired_at', null\)/)
  assert.match(archive, /\.not\('hired_at', 'is', null\)/)
  assert.match(archivePage, /PostHireReviews/)
  assert.match(archivePage, /View communication/)
  assert.match(archivePage, /View recruitment history/)
})

test('post-hire review workspace stays out of talent active applications', () => {
  const workspace = read('src/components/PostHireReviews.tsx')
  assert.match(workspace, /pathname === '\/talent\/applications'/)
  assert.match(workspace, /PlatformExperienceReview/)
  assert.match(workspace, /counterpartReviewType === 'candidate'/)
  assert.match(workspace, /'professional'\s*:\s*'property'/)
})

// ---------------------------------------------------------------------------
// The spine of the journey, both sides.
// ---------------------------------------------------------------------------

// Each of these is a moment the two sides are meant to start agreeing about
// where a candidate stands. When the write is lost and the route still says
// success, the professional and the property look at different screens saying
// different things, and neither knows the other is wrong.
test('every stage change on the journey is checked before it is reported', () => {
  const stages: Array<[string, string]> = [
    ['src/app/api/employer/applications/offer/route.ts', 'stageError'],
    ['src/app/api/employer/applications/interview/route.ts', 'stageError'],
    ['src/app/api/talent/applications/interview/route.ts', 'stageError'],
    ['src/app/api/talent/applications/offer/route.ts', 'applicationError'],
  ]
  for (const [file, name] of stages) {
    const source = read(file)
    assert.ok(source.includes(`const { error: ${name} }`), `${file} must read the error`)
    assert.ok(source.includes(`if (${name})`), `${file} must act on it`)
  }
})

// A role people have applied to or matched with is a record - of an
// application, a conversation, a hire - and deleting it takes that from them
// to tidy a screen. The database refused it and the raw constraint error was
// shown to the property in an alert box.
test('a role with history is closed, never deleted', () => {
  const route = read('src/app/api/employer/jobs/status/route.ts')
  // Sliced to the delete branch. Asserting on the whole file matched a 409
  // belonging to the reopen path, so the check passed while the refusal
  // itself had been turned into a success.
  const start = route.indexOf("if (action === 'delete')")
  assert.ok(start > -1, 'there must be a delete branch')
  const del = route.slice(start, route.indexOf("const status = action === 'filled'"))
  assert.match(del, /HAS_HISTORY/)
  assert.match(del, /from\('matches'\)/, 'matches are the constraint that refused')
  assert.match(del, /from\('applications'\)/)
  assert.match(del, /\}, \{ status: 409 \}\)/, 'a role with history is refused, not deleted')
  assert.match(del, /\.eq\('employer_id', employer\.id\)/, 'and only ever your own role')

  // No raw database message reaches a person, and no alert box.
  const page = read('src/app/employer/jobs/page.tsx')
  // A database message may go to the console; it may not go to a person. The
  // distinction is the point: "violates foreign key constraint" is useful to
  // whoever wrote the query and useless to a spa director.
  assert.doesNotMatch(page, /alert\('Could not (delete|save)/)
  assert.doesNotMatch(page, /setBanner\([^)]*(saveError|error)\.message/)
  assert.match(page, /console\.error\('Role save failed:', saveError\.message\)/)
  assert.match(page, /action: 'delete'/)
})

// A professional who withdrew rendered as the raw lowercase word in the same
// blue badge as a live applicant, so a property could spend a week chasing
// somebody who had already gone.
test('a withdrawn application does not look like a live one', () => {
  const page = read('src/app/employer/applications/page.tsx')
  assert.match(page, /status==='withdrawn'\?'Withdrawn'/)
  assert.match(page, /status==='withdrawn'\?'bg-\[#e7e7e7\] text-secondary'/)
})

// The Stripe refund is issued before the record is written, and a refund
// cannot be taken back. If the record is lost, the money has gone and the
// platform believes it has not.
test('an issued refund is always recorded, or somebody is told at once', () => {
  const route = read('src/app/api/agency/cases/route.ts')
  assert.match(route, /const \{ error: caseError \}/)
  assert.match(route, /const \{ error: bookingError \}/)
  assert.match(route, /if \(caseError \|\| bookingError\)/)
  assert.match(route, /notifyAdmins\(/)
  assert.match(route, /do not repeat this action/)
})
