import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { rightToWorkVerified, candidateBadges } from '../src/lib/verification-badges'
import { generateRecoveryCodes, hashRecoveryCode, normaliseRecoveryCode } from '../src/lib/mfa-recovery'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Two-step verification is enforced everywhere. Without a way back in, that
// means a lost phone permanently destroys somebody's access to their
// applications, their Agency earnings and their Residency bookings.
test('losing a phone does not mean losing the account', () => {
  const challenge = read('src/app/mfa-challenge/page.tsx')
  assert.ok(challenge.includes('recovery'), 'the challenge screen must offer a recovery route')
  assert.ok(challenge.includes('/contact'), 'and a way to reach a human')
  const route = read('src/app/api/auth/mfa-recovery/route.ts')
  assert.ok(route.includes("action === 'issue'"), 'codes must be issuable')
  assert.ok(route.includes('unenroll'), 'redeeming a code must remove the authenticator')
  assert.ok(route.includes('enforceRateLimit'), 'redemption must be rate limited')
})

test('recovery codes are unguessable, single-use and never stored in the clear', () => {
  const codes = generateRecoveryCodes()
  assert.equal(codes.length, 10)
  assert.equal(new Set(codes).size, 10, 'codes must be distinct')
  for (const code of codes) {
    assert.match(code, /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/, 'no ambiguous characters')
  }
  // Typed back in lower case, without the dash, it still works.
  assert.equal(
    hashRecoveryCode(codes[0], 'user-1'),
    hashRecoveryCode(codes[0].toLowerCase().replace('-', ''), 'user-1'),
  )
  // Salted per user, so the same code on two accounts does not collide.
  assert.notEqual(hashRecoveryCode(codes[0], 'user-1'), hashRecoveryCode(codes[0], 'user-2'))
  assert.equal(normaliseRecoveryCode(' ab-cde fgh ij '), 'ABCDEFGHIJ')
  const store = read('supabase/migrations/20260901220000_mfa_recovery_codes.sql')
  assert.ok(store.includes('code_hash'), 'only hashes are stored')
  assert.ok(!store.includes('code text NOT NULL'), 'a plain-text code column must not exist')
})

test('enrolment hands the codes over while the person is still there', () => {
  const component = read('src/components/AuthenticatorSecurity.tsx')
  assert.ok(component.includes('issueRecoveryCodes'), 'codes must be issued at enrolment')
  assert.ok(component.includes('Save these now'), 'and shown, once')
  assert.ok(component.includes('unenroll'), 'an abandoned enrolment must be cleared, not left to block the next one')
})

// The admin writes 'approved'; three readers compared against 'verified'. So
// nobody has ever held the badge, and because Agency Ready depends on it,
// that composite was unreachable for every professional on the platform.
test('right to work is read the same way it is written', () => {
  assert.equal(rightToWorkVerified({ right_to_work_status: 'approved' }), true)
  assert.equal(rightToWorkVerified({ right_to_work_status: 'verified' }), true)
  assert.equal(rightToWorkVerified({ right_to_work_status: 'pending' }), false)
  assert.equal(rightToWorkVerified({ right_to_work_status: null }), false)
  assert.equal(rightToWorkVerified({}), false)

  const admin = read('src/app/api/admin/verification/route.ts')
  assert.ok(admin.includes("'approved'"), 'the admin route still writes approved')
  assert.ok(
    !/right_to_work_status === 'verified'/.test(read('src/lib/verification-badges.ts')),
    'the badge must not compare against a value nothing writes',
  )
  assert.ok(read('src/app/api/agency/directory/route.ts').includes('rightToWorkVerified'))
})

test('Agency Ready is reachable', () => {
  const badges = candidateBadges({
    whc_verified: true,
    right_to_work_status: 'approved',
    has_insurance: true,
    insurance_expiry_date: '2030-01-01',
    hourly_rate: 25,
    latitude: 53.8,
  }, [])
  assert.ok(badges.some(badge => badge.key === 'right_to_work'), 'right to work badge must render')
  assert.ok(badges.some(badge => badge.key === 'agency_ready'), 'Agency Ready must be attainable')
})

test('the employer sees verification on the screens where they decide', () => {
  assert.ok(read('src/app/api/employer/applications/inbox/route.ts').includes('whc_verified'))
  assert.ok(read('src/app/api/employer/candidates/route.ts').includes('right_to_work_status'))
})

// job_alerts_enabled has no default, so it is NULL for every account ever
// created. Settings showed NULL as ON; the sender required a literal true.
test('job alerts reach the people who were told they had them on', () => {
  const route = read('src/app/api/job-alerts/route.ts')
  assert.ok(
    route.includes('job_alerts_enabled.is.null'),
    'an unset preference must mean on, matching what the settings page shows',
  )
  assert.ok(route.includes('createNotification'), 'alerts must appear in-app, as the settings page promises')
})

test('every path that puts a role on the market fires its alerts', () => {
  for (const path of [
    'src/app/api/stripe/webhook/route.ts',            // paid
    'src/app/api/mobile/employer/jobs/manage/route.ts', // included allowance
    'src/app/api/admin/listings/route.ts',             // admin makes it live
  ]) {
    assert.ok(read(path).includes('triggerJobAlerts'), `${path} must fire job alerts`)
  }
})

// The review_received type existed, had an icon in two components and was
// accepted by the notifications API, and no code path ever created one.
test('being reviewed tells the person they have been reviewed', () => {
  const route = read('src/app/api/reviews/route.ts')
  assert.ok(route.includes("'review_received'"), 'a review must notify the person reviewed')
  assert.ok(route.includes('/properties/'), 'and link somewhere that actually shows it')
})

test('the notification bell exists inside the dashboards, not only on the public site', () => {
  const shell = read('src/components/DashboardShell.tsx')
  assert.ok(shell.includes('NotificationBell'), 'the signed-in shell must carry the bell')
  assert.ok(shell.includes('viewerId'), 'and know who is looking at it')
})

// "Reopen record" nulled archived_at, which the talent side read as the
// definition of a completed placement - so the placement vanished from the
// professional's history and reappeared as an offer to complete the hire,
// re-sending congratulations and rejection emails to everyone.
test('the employer tidying their own records cannot rewrite the professional history', () => {
  assert.ok(read('src/app/api/talent/hired/route.ts').includes(".not('hired_at', 'is', null)"))
  assert.ok(!read('src/app/api/talent/hired/route.ts').includes(".not('archived_at', 'is', null)"))
  const completeHire = read('src/app/api/employer/applications/complete-hire/route.ts')
  assert.ok(
    completeHire.includes('application.hired_at || application.archived_at'),
    'a hire that has happened must never be completed twice',
  )
})

// The checkout redirect has always carried ?success=true and this page never
// read it, so an employer paid and landed on a list with no confirmation - and
// often a role still reading "pending payment".
test('paying for a role says so, and a stuck role has a way forward', () => {
  const page = read('src/app/employer/jobs/page.tsx')
  assert.ok(page.includes('useSearchParams'), 'the page must read the checkout redirect')
  assert.ok(page.includes('Payment received'), 'and confirm the payment')
  assert.ok(page.includes('Complete payment'), 'a pending_payment role must have a route forward')
})

// Locking candidate_profiles down to own-row-or-admin broke the page a hiring
// manager reaches from the URL printed on a certificate.
test('a certificate check names the person who earned it', () => {
  const page = read('src/app/verify/[code]/page.tsx')
  assert.ok(
    !page.includes("from('candidate_profiles')"),
    'the public page must not query a table it cannot read',
  )
  assert.ok(page.includes('/api/certificates/verify'), 'it must go through the service-role API')
})
