import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// A launch weekend passed with the platform apparently silent.
//
// It was not silent. The talent form posts to /api/register/init and stops
// there, and the alert lived in /api/register/talent - a route that form has
// not called since init took over. So every therapist who joined did so
// without a word reaching anybody. Properties were fine, because their form
// calls /api/register/employer afterwards and that route still alerts, which
// is exactly why the gap was invisible: the alert being tested was the one
// that worked.
//
// This is the sweep rather than the sighting. Whatever route a registration
// form ends on, somebody has to be told.

/** Every route a registration page actually posts to. */
function registrationEndpoints(page: string): string[] {
  const matches = body(page).match(/fetch\('(\/api\/register\/[a-z-]+)'/g) || []
  return matches.map(hit => hit.replace(/^fetch\('/, '').replace(/'$/, ''))
}

const PAGES = ['src/app/register/talent/page.tsx', 'src/app/register/employer/page.tsx']

test('every registration form ends on a route that tells somebody', () => {
  for (const page of PAGES) {
    const endpoints = registrationEndpoints(page)
    assert.ok(endpoints.length, `${page} posts to no registration route at all`)

    // The last route the form calls is where registration actually finishes,
    // and that is the one that has to raise the alert. An earlier step cannot
    // do it: for a property the profile does not exist yet, so an alert there
    // would announce a sign-up that may never be completed.
    const last = endpoints[endpoints.length - 1]
    const route = body(`src/app${last}/route.ts`)
    assert.match(route, /alertAdminOfSignup\(/,
      `${page} finishes at ${last}, which never tells anybody a person just joined`)
  }
})

// The alert was only half of it. The welcome email lived in the same
// abandoned route, so a therapist signed up and heard nothing at all from us:
// no welcome, no orientation, just a confirmation link from a service she had
// never heard of. The quietest possible first impression of a platform whose
// whole argument is that somebody is paying attention.
test('everybody who joins hears from us, not just the operator', () => {
  for (const page of PAGES) {
    const endpoints = registrationEndpoints(page)
    const last = endpoints[endpoints.length - 1]
    const route = body(`src/app${last}/route.ts`)
    assert.match(route, /welcomeEmailHtml\(/,
      `${page} finishes at ${last}, and nobody who joins through it is welcomed`)
    assert.match(route, /kind: 'welcome_(talent|employer)'/)
  }
})

// Two forms, two alerts, and neither of them twice.
test('a property is announced once, when the property actually exists', () => {
  const init = body('src/app/api/register/init/route.ts')
  // init is the first step of both journeys, so it must alert for talent only.
  assert.match(init, /if \(role === 'talent'\) \{[\s\S]{0,120}alertAdminOfSignup\('talent'/)
  assert.doesNotMatch(init, /alertAdminOfSignup\('employer'/,
    'a property has no profile row yet at this point')

  const employer = body('src/app/api/register/employer/route.ts')
  assert.match(employer, /alertAdminOfSignup\('employer'/)
})

// The alert must never be the reason a registration fails.
test('a failed alert never costs somebody their account', () => {
  const init = body('src/app/api/register/init/route.ts')
  assert.match(init, /alertAdminOfSignup\('talent', displayName\)\.catch\(\(\) => \{\}\)/)
})

// And the alert itself must not be the only way she finds out. It was, and
// that is why one broken call read as an empty platform.
test('there is a screen that shows sign-ups whether or not the alert fired', () => {
  const page = body('src/app/admin/onboarding/page.tsx')
  assert.match(page, /\/api\/admin\/onboarding/)
  const api = body('src/app/api/admin/onboarding/route.ts')
  // It reads the accounts themselves rather than a log of messages about them.
  assert.match(api, /recentAccounts\(admin/)
  assert.doesNotMatch(api, /from\('email_log'\)[\s\S]{0,200}accounts =/)
})
