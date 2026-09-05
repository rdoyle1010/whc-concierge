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
  // This asserted the old subdomain, because for a long time that was the
  // only one Resend had verified. mail.talenthousecollective.co.uk is
  // verified now, so somebody who signed up to Talent House hears from
  // Talent House rather than from a company they have never heard of.
  //
  // The point of the test is unchanged: an unverified sending domain is
  // rejected outright by Resend, and a From address is not something to
  // change on a hunch.
  assert.match(TRANSACTIONAL_FROM, /mail\.talenthousecollective\.co\.uk/)
  assert.match(read('src/lib/send-email.ts'), /process\.env\.EMAIL_FROM/,
    'and there must be a way back that does not need a deploy')
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

// The log was built for email and only ever covered email. Texts went nowhere:
// a failed SMS printed to a serverless console and was gone within days, so
// "did they get the interview text?" had no answer.
test('texts are recorded alongside emails, in the same place', () => {
  const lib = read('src/lib/send-email.ts')
  assert.match(lib, /export async function recordSms/)
  assert.match(lib, /channel: 'sms'/)
  const sms = read('src/lib/sms.ts')
  // Every exit from both senders, not only the happy one.
  const sent = (sms.match(/status: 'sent'/g) || []).length
  const failed = (sms.match(/status: 'failed'/g) || []).length
  const skipped = (sms.match(/status: 'skipped'/g) || []).length
  assert.ok(sent >= 2 && failed >= 4 && skipped >= 4,
    `both senders must record every outcome (sent ${sent}, failed ${failed}, skipped ${skipped})`)
})

// A text must never fail because the thing recording it did.
test('logging can never break a send', () => {
  const sms = read('src/lib/sms.ts')
  const logger = sms.slice(sms.indexOf('async function log('), sms.indexOf('export function smsConfigured'))
  assert.match(logger, /catch \{/, 'the recorder swallows its own failures')
})

// Eighteen kinds of email run through one shared helper across thirteen routes.
// Converting that one function was the difference between logging a third of
// what the platform sends and logging nearly all of it.
test('the shared email helper is logged', () => {
  const emails = read('src/lib/emails.ts')
  assert.match(emails, /sendTransactionalEmail/)
  assert.ok(!/api\.resend\.com/.test(emails), 'no direct provider call left in the shared helper')
})

// "What did we send this person, and did it arrive" needs one place to look.
test('there is one page showing everything sent', () => {
  const page = read('src/app/admin/messages-sent/page.tsx')
  assert.match(page, /Messages we sent/)
  // Never attempted and rejected are different problems with different fixes,
  // so they are never collapsed into one status.
  assert.match(page, /Never sent/)
  assert.match(page, /message log table has not been created yet/,
    'an empty list before the migration would read as "we have never sent anything"')
  assert.match(read('src/components/DashboardShell.tsx'), /admin\/messages-sent/, 'and it is reachable')
})

// `if (userEmail) await alertAdminOfSignup(...); await sendWelcomeEmail(...)`
// reads as one guarded statement and is two. The guard covered only the alert,
// so a sign-up with no address on it told Rebecca nothing while still calling
// the welcome sender with an empty string. Neither registration route may
// carry a guard shaped like that again.
test('a guard on one line does not silently cover two statements', () => {
  for (const route of ['src/app/api/register/talent/route.ts', 'src/app/api/register/employer/route.ts']) {
    for (const line of read(route).split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('if (')) continue
      // A braced body is unambiguous however many statements it holds; only an
      // unbraced one can quietly leave the next statement outside the guard.
      const body = trimmed.slice(trimmed.indexOf(')', trimmed.lastIndexOf('(')) + 1).trim()
      if (!body || body.startsWith('{')) continue
      assert.ok(
        !/;\s*\S/.test(body),
        `${route} hides a second statement behind a one-line if: ${trimmed}`,
      )
    }
  }
})

// The operator alert goes to Rebecca. It has nothing to do with whether the
// person signing up has an email address, and must not be gated on one.
test('the sign-up alert is not gated on the member having an email', () => {
  for (const route of ['src/app/api/register/talent/route.ts', 'src/app/api/register/employer/route.ts']) {
    const source = read(route)
    const helper = source.slice(source.indexOf('async function announceSignup'))
    const alertAt = helper.indexOf('alertAdminOfSignup(')
    const guardAt = helper.indexOf('if (email')
    assert.ok(alertAt !== -1, `${route} must announce the sign-up`)
    assert.ok(guardAt === -1 || alertAt < guardAt, `${route} still gates the alert on an address`)
  }
})

// A missing API key, an unverified sending domain, a rejected send and a spam
// folder all look identical from the outside: nothing arrives. The only way to
// tell them apart used to be registering a fake account and guessing.
test('delivery can be proved without registering a fake account', () => {
  const route = read('src/app/api/admin/delivery-test/route.ts')
  assert.match(route, /adminRequestUser/, 'sending real messages is an admin-only button')
  // Both channels, and a real send rather than a config read dressed up as one.
  assert.match(route, /rawSms\(/, 'the text test sends an actual text')
  assert.match(route, /sendTransactionalEmail\(/, 'the email test sends an actual email')
  // The point is the reason, not a red cross.
  assert.match(route, /TWILIO_ACCOUNT_SID/, 'a missing Twilio config names what to set')
  assert.match(route, /result\.error/, 'the provider gets to say why it refused')
  // A browser response must not carry the sending credentials or the full
  // address of an account.
  assert.ok(!/process\.env\.RESEND_API_KEY\b(?!\))/.test(route.replace('Boolean(process.env.RESEND_API_KEY)', '')),
    'the key itself never leaves the server')
  assert.match(route, /function maskEmail/)

  const panel = read('src/components/DeliveryTestPanel.tsx')
  assert.match(panel, /Send a test/, 'and there is a button to press')
  assert.match(read('src/app/admin/settings/page.tsx'), /<DeliveryTestPanel \/>/, 'wired into settings')
})

// The delivery test fell back to the signed-in administrator's own address,
// so it reported success while the path that actually matters - the alert
// when somebody signs up - had nowhere to send and would have failed in
// silence. An alert that quietly goes nowhere is worse than no alert, because
// it gets trusted.
//
// The lookup has since moved to lib/administrators and gone plural: the
// fallback is now every administrator rather than only the oldest one, so a
// business partner is told about a sign-up too. The guarantee under test is
// unchanged - a configured address wins, and something catches what it misses.
test('a sign-up alert falls back to the administrators, not to nowhere', () => {
  const lib = read('src/lib/admin-alerts.ts')
  assert.match(lib, /alertRecipients\(await config\(ADMIN_EMAIL_KEY\), await administratorEmails\(\)\)/,
    'the configured address wins, and the administrator list catches what it misses')
  assert.match(lib, /for \(const email of recipients\)/,
    'and every recipient is actually sent to, not just the first')

  const admins = read('src/lib/administrators.ts')
  assert.match(admins, /\.eq\('role', 'admin'\)/, 'the list is the administrators, not a guess')
  assert.match(admins, /order\('created_at', \{ ascending: true \}\)/,
    'founder first, for the rare place that can only carry one address')
  assert.doesNotMatch(admins, /\.limit\(1\)/,
    'a second administrator must not be dropped by the query that finds them')
})

// The panel said "Nothing saved to send to" on a button that then delivered
// perfectly well. A status that contradicts its own result teaches you to
// ignore it, and the next time it reports something missing it will be right
// and you will not believe it.
test('the delivery panel names the address a message would really reach', () => {
  const route = read('src/app/api/admin/delivery-test/route.ts')
  assert.match(route, /const emailTo = email \|\| user\.email/, 'the reported destination is the real one')
  assert.match(route, /usingAccountFallback/, 'and it says when that is a fallback rather than a setting')
  const panel = read('src/components/DeliveryTestPanel.tsx')
  assert.match(panel, /your own sign-in address/, 'said plainly, so it is not quietly relied on')
})
