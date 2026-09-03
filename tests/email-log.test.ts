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
