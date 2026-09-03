import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// The admin list showed "no email on profile" against every professional, and
// it looked as though people had signed up without one. They had not: Supabase
// will not create an account without an email, so every account has one. It
// lives in auth.users, which the browser cannot read, so the list never had it.
test('the admin list can see the address every account already has', () => {
  const route = read('src/app/api/admin/users/route.ts')
  assert.match(route, /action === 'emails'/, 'there must be a way to look them up')
  assert.match(route, /auth\.admin\.getUserById/, 'from auth.users, on the service role')

  const page = read('src/app/admin/users/page.tsx')
  assert.match(page, /action: 'emails'/, 'and the list must ask for them')
})

// Name and email are already required to register. Worth pinning, because the
// belief that they were not is what prompted the change.
test('registering as talent requires a name', () => {
  const route = read('src/app/api/register/talent/route.ts')
  assert.match(route, /if \(!safeProfile\.full_name/, 'a profile with no name must be refused')
})

// Talent is approved on registration and always has been - the approval queue
// is for properties. If this ever flips back, professionals silently stop being
// discoverable until somebody notices a queue nobody is watching.
test('talent goes live without waiting for approval', () => {
  const registration = read('src/lib/registration.ts')
  const talent = registration.slice(0, registration.indexOf('approval_status: \'pending\''))
  assert.match(talent, /approval_status: 'approved'/, 'a professional must not wait in a queue')
})

// A decision reaches somebody who is not looking at the site only by email. The
// right-to-work path always sent one; the certificate path created a bell and
// stopped there, so an uploaded certificate was reviewed in silence.
test('a verification decision reaches the person by email, not only by bell', () => {
  const rightToWork = read('src/app/api/admin/verification/route.ts')
  assert.match(rightToWork, /sendVerificationResultEmail/)
  assert.match(rightToWork, /createNotification/)

  const certificates = read('src/app/api/admin/certificates/route.ts')
  assert.match(certificates, /createNotification/)
  assert.match(certificates, /sendCertificateResultEmail/, 'a certificate decision must email too')

  const emails = read('src/lib/emails.ts')
  assert.match(emails, /export async function sendCertificateResultEmail/)
  // All three outcomes need wording, not just the happy one.
  for (const outcome of ['verified', 'rejected', 'more_information']) {
    assert.ok(emails.includes(`'${outcome}'`), `${outcome} needs its own message`)
  }
})
