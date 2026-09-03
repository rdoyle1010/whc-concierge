import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { TRANSACTIONAL_FROM } from '../src/lib/send-email'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// "Martin signed up and did not get an email - why?" was unanswerable. A
// failure went to console.error inside a serverless function: unread, and gone
// within days.
test('every transactional send is recorded, including the ones that fail', () => {
  const lib = read('src/lib/send-email.ts')
  for (const outcome of ["'sent'", "'failed'", "'skipped'"]) {
    assert.ok(lib.includes(outcome), `${outcome} has to be a recorded outcome`)
  }
  // Never attempted and rejected by the provider are different problems with
  // different fixes, and both are invisible without this.
  assert.match(lib, /RESEND_API_KEY is not set on this deployment/)
  assert.match(lib, /No address on the account/)
})

// A provider's own words are the diagnosis. "Domain is not verified" and "you
// can only send to your own address in test mode" need different actions.
test('the provider error is kept verbatim', () => {
  const lib = read('src/lib/send-email.ts')
  assert.match(lib, /body\?\.message \|\| body\?\.error/)
})

// The log must never be the reason an email fails.
test('a broken log never blocks a send', () => {
  const lib = read('src/lib/send-email.ts')
  const recorder = lib.slice(lib.indexOf('async function record'), lib.indexOf('export async function sendTransactionalEmail'))
  assert.match(recorder, /catch \{/, 'recording is wrapped')
  assert.ok(!/throw/.test(recorder), 'and never throws')
})

// Registration is where the question came from, so both welcomes go through it.
test('both registration welcomes are logged', () => {
  for (const route of ['src/app/api/register/talent/route.ts', 'src/app/api/register/employer/route.ts']) {
    const source = read(route)
    assert.match(source, /sendTransactionalEmail/, `${route} must use the logged sender`)
    assert.ok(!/api\.resend\.com/.test(source), `${route} must not call the provider directly any more`)
  }
  assert.match(read('src/app/api/newsletter/confirm/route.ts'), /sendTransactionalEmail/)
})

// Resend verifies domains. Sending from one it has not verified is rejected,
// which is exactly the silent failure this work exists to stop.
test('email is sent from the verified domain', () => {
  assert.match(TRANSACTIONAL_FROM, /mail\.wellnesshousecollective\.co\.uk/)
  assert.match(read('src/lib/send-email.ts'), /not verified yet/, 'the reason must travel with the address')
})

// The answer has to be visible where the question is asked.
test('the admin user drawer shows what was sent to that person', () => {
  const page = read('src/app/admin/users/page.tsx')
  assert.match(page, /Emails we sent/)
  assert.match(page, /action: 'email_log'/)
  // An empty list before the table exists reads as "nothing was sent", which is
  // the wrong answer to the question being asked.
  assert.match(page, /email log table has not been created yet/)
})

// A text saying "you have a new update" tells the person who runs the platform
// nothing. The member-privacy rewrite is right for members and useless here.
test('the admin alert says who signed up, without a full identity', () => {
  const lib = read('src/lib/admin-alerts.ts')
  assert.match(lib, /rawSms/, 'it must bypass the rewrite that strips names')
  assert.match(lib, /Hannah F\./, 'the shortening rule is written down with an example')
  // A property is announced by name; shortening one would produce nonsense.
  assert.match(lib, /kind === 'employer'\s*\n?\s*\?/, 'properties are not shortened')
  const sms = read('src/lib/sms.ts')
  assert.match(sms, /Only for messages to WHC's own operators/, 'the raw sender must say what it is for')
})

// An alert that quietly does nothing is worse than no alert - it gets trusted.
test('a sign-up alert falls back to email rather than failing silently', () => {
  const lib = read('src/lib/admin-alerts.ts')
  assert.match(lib, /sendTransactionalEmail/, 'no Twilio means email, not silence')
  assert.match(lib, /admin_alert_email/)
})

// Somebody who has just created an account must not see an error because a
// text message did not send.
test('an alert can never fail a registration', () => {
  const lib = read('src/lib/admin-alerts.ts')
  const body = lib.slice(lib.indexOf('export async function alertAdminOfSignup'))
  assert.match(body, /try \{/, 'the whole thing is wrapped')
  assert.match(body, /Registration succeeded/, 'and the reason is written down')
  for (const route of ['src/app/api/register/talent/route.ts', 'src/app/api/register/employer/route.ts']) {
    assert.match(read(route), /alertAdminOfSignup\(/, `${route} must raise the alert`)
  }
})
