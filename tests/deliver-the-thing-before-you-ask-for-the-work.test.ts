import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BUILD_CONSENT_WORDING, cvStoragePath, cvTypeAllowed, isBuildStatus } from '../src/lib/profile-build'
import { visibilityColumns } from '../src/lib/talent-visibility'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const intake = body('src/app/api/profile-build/route.ts')
const adminRoute = body('src/app/api/admin/profile-build/route.ts')

// Fourteen people signed up in the first fortnight and not one finished a
// profile. Asking a therapist for fifteen fields in exchange for a promise is
// the wrong way round, so this asks for a CV and hands back something finished.
test('somebody with no account can still get a profile', () => {
  assert.doesNotMatch(intake, /getRequestUser|adminRequestUser|status: 401/,
    'requiring a session removes the only thing this route is for')
  // Fenced the way the other public write routes are.
  assert.match(intake, /enforceRateLimit\(req, 'profile-build'/)
  // The hidden-field check, whatever it is currently called. It was named
  // 'company', which is the one word autofill is certain to recognise.
  assert.match(intake, /form\.get\('thc_hp'\)/, 'the honeypot')
  assert.match(intake, /status: 429/)
})

// A filename is whatever the sender typed. A storage path is not the place to
// find that out.
test('the sender cannot choose where their file lands', () => {
  assert.equal(cvStoragePath('abc-123', 'my cv.pdf'), 'build-requests/abc-123/cv.pdf')
  assert.equal(cvStoragePath('abc-123', 'CV.DOCX'), 'build-requests/abc-123/cv.docx')
  // Traversal, nested paths and a missing extension all land in the same place.
  assert.equal(cvStoragePath('abc-123', '../../../etc/passwd'), 'build-requests/abc-123/cv.pdf')
  assert.equal(cvStoragePath('abc-123', 'nested/dir/cv.pdf'), 'build-requests/abc-123/cv.pdf')
  assert.equal(cvStoragePath('abc-123', 'no-extension'), 'build-requests/abc-123/cv.pdf')
  for (const path of [
    cvStoragePath('abc-123', '../../../etc/passwd'),
    cvStoragePath('abc-123', 'nested/dir/cv.pdf'),
  ]) {
    assert.doesNotMatch(path, /\.\./)
    assert.equal(path.split('/').length, 3)
  }
})

test('a CV is a document, not anything anybody feels like sending', () => {
  assert.equal(cvTypeAllowed('application/pdf'), true)
  assert.equal(cvTypeAllowed('application/vnd.openxmlformats-officedocument.wordprocessingml.document'), true)
  for (const type of ['image/svg+xml', 'text/html', 'application/x-msdownload', 'video/mp4', '', null]) {
    assert.equal(cvTypeAllowed(type), false, `${String(type)} is not a CV`)
  }
  // And the private bucket, never a public one.
  assert.match(intake, /const BUCKET = 'talent-documents'/)
  assert.doesNotMatch(intake, /getPublicUrl/)
})

// A spam check that silently discards a real submission is worse than no
// spam check at all.
//
// The hidden field was labelled "Company", which is precisely what autofill
// exists to complete. A professional with autofill on tripped it, was told her
// CV had arrived, and nothing was saved - on the one page whose entire job is
// capturing CVs.
test('the spam check cannot lose somebody s CV', () => {
  const form = body('src/components/ProfileBuildForm.tsx')
  // Nothing a browser can recognise: no label, no known field word.
  const start = form.indexOf('aria-hidden className="absolute')
  assert.ok(start > 0, 'the hidden field moved; this test needs to follow it')
  // To the end of its own element, not a fixed window: the consent label sits
  // directly underneath and a wide slice reads it as part of the trap.
  const trap = form.slice(start, form.indexOf('</div>', start))
  assert.doesNotMatch(trap, /<label/, 'a labelled hidden field is an invitation to autofill')
  assert.doesNotMatch(trap, /company|name=["'](name|email|phone|address|organisation|organization)["']/i)
  assert.match(trap, /autoComplete="off"/)
  assert.match(trap, /tabIndex=\{-1\}/)

  // And tripping it never discards the request.
  assert.match(intake, /const suspected = Boolean/)
  assert.doesNotMatch(intake, /if \(String\(form\.get\('[a-z_]+'\) \|\| ''\)\.trim\(\)\) return NextResponse\.json\(\{ success: true \}\)/,
    'a tripped check must not return success without writing anything')
  // It is written on the row, where a person sees it and decides.
  assert.match(intake, /admin_note: suspected/)
  // The one thing it suppresses: mail to an address a bot supplied.
  assert.match(intake, /if \(!suspected\) await sendTransactionalEmail/)
})

// A form that swallows a CV and says nothing is worse than no form.
test('both sides are told it arrived', () => {
  assert.match(intake, /alertAdminOfSignup\(/)
  assert.match(intake, /sendTransactionalEmail\(/)
  const form = body('src/components/ProfileBuildForm.tsx')
  assert.match(form, /if \(!res\.ok\) \{ setError/, 'a failed send must not look like a sent one')
})

// She has not seen it yet, so nobody else may either. This is the account we
// created on her behalf: publishing it would be the exact betrayal the
// visibility work was done to prevent.
test('a profile we built is private until its owner has seen it', () => {
  assert.match(adminRoute, /\.\.\.visibilityColumns\('private'\)/)
  const columns = visibilityColumns('private')
  assert.equal(columns.profile_visible, false)
  assert.equal(columns.private_mode, true)
  // And she has agreed to nothing, because nobody has asked her. That was
  // written as `agreed_terms: false` until the column turned out not to exist
  // on this table - the same one word that cost three registrations on the
  // launch weekend. Not writing it is now the correct expression of it, and
  // the acceptance ledger is where an agreement would go if there were one.
  assert.doesNotMatch(adminRoute, /agreed_terms/)
})

// The order matters. Emailing somebody a profile that does not exist yet is
// the failure this queue is shaped to prevent.
test('nothing can be sent before it has been built', () => {
  assert.match(adminRoute, /if \(action === 'open'\)[\s\S]{0,200}if \(!request\.created_user_id\)/)
  assert.match(adminRoute, /if \(action === 'handover'\)[\s\S]{0,200}if \(!request\.created_user_id\)/)
  assert.match(adminRoute, /if \(request\.created_user_id\) return NextResponse\.json\(\{ error: 'This one already has an account/)

  const page = body('src/app/admin/profile-build/page.tsx')
  assert.match(page, /!row\.created_user_id \?/, 'the buttons appear in order')
})

// Signing in as somebody else is the most sensitive action on this platform.
// It is allowed because they asked for it in writing, and only while that
// stays true and stays recorded.
test('signing in as somebody is consented, admin-only and always written down', () => {
  assert.match(adminRoute, /const actor = await adminRequestUser\(\)/)
  assert.match(adminRoute, /if \(!request\.consent_given_at\)[\s\S]{0,140}status: 403/)
  assert.match(adminRoute, /from\('profile_build_access_log'\)\.insert/)

  // No log, no link. An unrecorded sign-in as somebody else is exactly what
  // this is not allowed to be, so the refusal has to come before the URL.
  const openBlock = adminRoute.slice(adminRoute.indexOf("action === 'open'"), adminRoute.indexOf("action === 'handover'"))
  assert.ok(
    openBlock.indexOf('profile_build_access_log') < openBlock.indexOf('success: true, url'),
    'the access is recorded before the link is handed over',
  )
  assert.match(openBlock, /if \(logError\)[\s\S]{0,200}status: 500/)
  assert.doesNotMatch(openBlock, /console\.error\(['"`]Profile build access log failed[\s\S]{0,80}return NextResponse\.json\(\{ success: true/)
})

// The only thing that makes holding a stranger's CV defensible is that they
// asked, in words they actually read, and that those words are kept.
test('the consent is specific, and stored with the request', () => {
  assert.match(BUILD_CONSENT_WORDING, /build my professional profile/i)
  assert.match(BUILD_CONSENT_WORDING, /sign in to my account/i)
  assert.match(BUILD_CONSENT_WORDING, /until I have\s+seen it/i)
  assert.match(intake, /consent_wording: BUILD_CONSENT_WORDING/)
  assert.match(intake, /if \(!consent\)/)

  const form = body('src/components/ProfileBuildForm.tsx')
  assert.match(form, /\{BUILD_CONSENT_WORDING\}/, 'she reads the same words that get stored')
})

test('an unknown status cannot be written', () => {
  assert.equal(isBuildStatus('building'), true)
  assert.equal(isBuildStatus('finished'), false)
  assert.match(adminRoute, /if \(!isBuildStatus\(body\.status\)\)/)
})

// A door nobody can find is not a door.
test('the offer is reachable from where people give up', () => {
  const register = body('src/app/register/talent/page.tsx')
  assert.match(register, /href="\/set-up-my-profile"/)
  const email = body('src/lib/onboarding-email.ts')
  assert.match(email, /\$\{SITE\}\/set-up-my-profile/)
  const sitemap = body('src/app/sitemap.ts')
  assert.match(sitemap, /set-up-my-profile/)
})

// The most useful person in this queue is somebody who already signed up, got
// stuck at ten per cent, and has now asked for help. Refusing her because an
// account exists turns the one request we most want into a dead end.
test('somebody who already has an account is the point, not an error', () => {
  assert.match(adminRoute, /alreadyRegistered\(createError\?\.message\)/)
  assert.match(adminRoute, /findUserByEmail\(admin, request\.email\)/)
  assert.match(adminRoute, /reused = true/)

  // And nothing is written to an account that already exists until we know
  // what it is.
  //
  // This test used to check only that candidate_profiles was untouched on the
  // reuse path. It was. The profiles write ran in front of the guard instead,
  // converted a live property account into a talent one, and locked its owner
  // out of her own dashboard. The test passed and the bug shipped, which is
  // the whole reason to state the invariant as "no write before the check"
  // rather than naming one table and hoping.
  const createBlock = adminRoute.slice(adminRoute.indexOf("action === 'create'"), adminRoute.indexOf("action === 'open'"))
  const guard = createBlock.indexOf('if (reused) {')
  assert.ok(guard > 0, 'the reuse guard is gone')

  const before = createBlock.slice(0, guard)
  assert.doesNotMatch(before, /\.upsert\(|\.insert\(|\.update\(/,
    'nothing may be written to an existing account before the guard reads it')

  // Inside the guard, the role is read first and a non-talent account is
  // refused rather than converted.
  const reuseBlock = createBlock.slice(guard, createBlock.indexOf('reused: true'))
  assert.match(reuseBlock, /select\('role, full_name'\)/)
  assert.match(reuseBlock, /existingRole !== 'candidate'/)
  assert.match(reuseBlock, /status: 409/)
  // A name is filled in only when there is not one already.
  assert.match(reuseBlock, /!String\(existing\.full_name \|\| ''\)\.trim\(\)/)
  assert.doesNotMatch(reuseBlock, /role: 'candidate'[\s\S]{0,80}onConflict/,
    'an existing account must never have its role rewritten')
})

// Supabase phrases this several ways depending on the path it took.
test('every way the database says "that address is taken" is understood', () => {
  const lib = adminRoute.slice(adminRoute.indexOf('function alreadyRegistered'))
  for (const phrase of ['already been registered', 'already registered', 'already exists', 'duplicate key']) {
    assert.ok(lib.includes(phrase), `${phrase} is not recognised`)
  }
})

// Reading writes nothing, so gating it behind account creation only hid the
// useful button behind a step that can fail.
test('a CV can be read before there is an account to save it to', () => {
  const readBlock = adminRoute.slice(adminRoute.indexOf("action === 'read_cv'"), adminRoute.indexOf("action === 'apply_reading'"))
  assert.doesNotMatch(readBlock, /if \(!request\.created_user_id\)/, 'reading must not require an account')
  // Saving still does.
  const applyBlock = adminRoute.slice(adminRoute.indexOf("action === 'apply_reading'"))
  assert.match(applyBlock, /if \(!request\.created_user_id\)/)
})

// Word is what spa professionals actually send. Telling somebody to go and
// convert their own CV is not a feature.
test('a Word CV is read rather than refused', () => {
  assert.match(adminRoute, /async function wordText/)
  assert.match(adminRoute, /extractRawText/)
  assert.match(adminRoute, /endsWith\('\.pdf'\)[\s\S]{0,200}else \{/)
  // And a Word file that genuinely cannot be read says so, with a way round.
  assert.match(adminRoute, /Paste the text in below, or ask them for a PDF/)
  // An empty or near-empty extraction is not a reading.
  assert.match(adminRoute, /text\.length >= 40 \? text : null/)
})

// Somebody who has given a name, an address, written consent and a CV has
// given us an account. Asking an administrator to press a button to agree is
// a step that exists only because the code was written in that order, and it
// is a step that can be forgotten, fail, or be done to the wrong person.
test('the account exists the moment somebody sends their CV', () => {
  assert.match(intake, /createAccountFor\(admin, created\.id/)
  assert.match(intake, /auth\.admin\.createUser/)
  // Private and unapproved by its owner, because she has not seen any of it.
  assert.match(intake, /\.\.\.visibilityColumns\('private'\)/)
  // Through the tolerant write, like every other candidate_profiles seed.
  assert.match(intake, /tolerantUpsert\(admin, 'candidate_profiles'/)
})

// A spam check that trips must not be able to create auth users.
test('a flagged submission gets no account', () => {
  assert.match(intake, /if \(!suspected\) \{[\s\S]{0,200}createAccountFor/)
})

// Her CV is saved either way. An account that did not get made is a button
// away; a lost request is not.
test('a failure to make the account never loses the request', () => {
  const block = intake.slice(intake.indexOf('createAccountFor(admin, created.id'))
  assert.match(block, /\.catch\(/)
  assert.doesNotMatch(block.slice(0, 400), /return NextResponse\.json\(\{ error/)
})

// Converting a property account into a talent one locks its owner out of her
// own dashboard. That has happened here once.
test('an address belonging to a property is left completely alone', () => {
  const helper = intake.slice(intake.indexOf('async function createAccountFor'))
  const guard = helper.indexOf("role !== 'candidate'")
  assert.ok(guard > 0, 'the role guard is gone')
  // Nothing is written to an existing account before the check reads it.
  const before = helper.slice(helper.indexOf('findExistingUser'), guard)
  assert.doesNotMatch(before, /\.upsert\(|\.insert\(|\.update\(/)
  // And the refusal is written where she will read it.
  assert.match(helper, /admin_note: `That address already belongs to a/)
})

// The screen says the order rather than leaving somebody to work it out from
// which buttons happen to be enabled.
test('the four steps are written down, in order', () => {
  const page = body('src/app/admin/profile-build/page.tsx')
  const steps = ['1. Read the CV', '2. Save this to their profile', '3. Open their workspace', '4. Send it to them']
  let last = -1
  for (const step of steps) {
    const at = page.indexOf(step)
    assert.ok(at > last, `${step} is missing or out of order`)
    last = at
  }
})

// A function killed mid-request returns an error page, not JSON. "That did
// not work" is what that looked like on screen: true, and useless.
test('a failure says what actually happened', () => {
  const page = body('src/app/admin/profile-build/page.tsx')
  assert.match(page, /res\.status === 504 \|\| res\.status === 502/)
  assert.match(page, /paste the CV text in instead of using the file/)
  assert.match(page, /\$\{res\.status\}/)

  // And the route is allowed longer than the ten-second default it inherited.
  assert.match(adminRoute, /export const maxDuration = \d+/)
  const seconds = Number((adminRoute.match(/export const maxDuration = (\d+)/) || [])[1])
  assert.ok(seconds >= 30, `a CV read needs more than ${seconds} seconds`)
})
