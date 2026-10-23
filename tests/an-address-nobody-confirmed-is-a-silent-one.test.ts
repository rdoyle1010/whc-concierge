import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/account/confirm-email/route.ts')
const banner = body('src/components/ConfirmEmailBanner.tsx')

// Holding an account at the door until the address is confirmed loses real
// people: they sign up, land on a "check your email" page, the message sits in
// promotions, and they never come back. The door is open instead, and the
// address is confirmed from inside - which only works if the asking never
// turns into blocking.
test('the banner asks and never blocks', () => {
  assert.doesNotMatch(banner, /router\.push|redirect|window\.location/, 'confirming is not a gate')
  assert.doesNotMatch(banner, /inset-0|fixed |backdrop/, 'this is a banner, not an overlay')
  // Everything underneath it carries on working.
  assert.match(banner, /if \(state !== 'unconfirmed'\) return null/)
})

// A banner that appears because a request timed out is worse than no banner.
test('a failed check shows nothing rather than an accusation', () => {
  assert.match(banner, /catch\(\(\) => \{/)
  assert.match(banner, /useState<'checking' \| 'confirmed' \| 'unconfirmed'>\('checking'\)/)
  assert.match(banner, /body\.confirmed \? 'confirmed' : 'unconfirmed'/)
})

// The outcome is read from the answer, not assumed from the request having
// finished. A send that failed and a send that worked must not look the same.
test('the send reports what actually happened', () => {
  assert.match(banner, /if \(!res\.ok\) \{ setError/)
  assert.match(banner, /setSent\(true\)/)
  // The error has somewhere to be seen.
  assert.match(banner, /\{error && /)
})

test('only a signed-in person can send themselves a link, and not many', () => {
  assert.match(route, /getRequestUser\(req\)/)
  assert.match(route, /status: 401/)
  // Rate limited per account rather than per address, so nobody can use their
  // own account to post mail at somebody else.
  assert.match(route, /enforceRateLimit\(req, 'confirm-email'/)
  assert.match(route, /key: user\.id/)
  assert.match(route, /status: 429/)
  // The address is read from the account, never taken from the request.
  assert.doesNotMatch(route, /body\.email|body\?\.email/)
})

test('an already-confirmed account is not sent another link', () => {
  assert.match(route, /if \(account\?\.email_confirmed_at\) return NextResponse\.json\(\{ confirmed: true \}\)/)
})

// Every send goes through the logged sender, so "did they get it" ends in a
// row rather than a guess.
test('the confirmation email is logged like every other', () => {
  assert.match(route, /sendTransactionalEmail\(/)
  assert.match(route, /kind: 'verification'/)
  assert.match(route, /if \(!sent\.ok\)/, 'a failed send must not report success')
})

// Null is not false. An account whose check never answered is not an account
// with a bad address, and listing it as one sends her chasing ghosts.
test('admin separates unconfirmed from unknown', () => {
  const accounts = body('src/lib/onboarding-accounts.ts')
  assert.match(accounts, /confirmed: boolean \| null/)
  assert.match(accounts, /confirmed: account \? Boolean\(account\.email_confirmed_at/)
  assert.match(accounts, /catch \{[\s\S]{0,160}confirmed: null/)

  const page = body('src/app/admin/onboarding/page.tsx')
  assert.match(page, /account\.emailConfirmed === false/)
  assert.doesNotMatch(page, /!account\.emailConfirmed\b/, 'null would be caught by a falsy check')
})
