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
  assert.match(intake, /form\.get\('company'\)/, 'the honeypot')
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
