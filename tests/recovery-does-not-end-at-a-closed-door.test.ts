import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// Resetting a password sent everybody to /login, including the people /login
// refuses.
//
// The login route rejects an administrator outright and tells them to use
// /admin. So a new administrator reset her password, was dropped on a page
// that rejected her, read the rejection as "the new password did not work",
// and reset it again. Four times, in front of her business partner.
//
// The identical dead end was found and fixed on the sign-in path already - the
// comment explaining it is still in the login route. It was left standing on
// the recovery path, which is the one people reach when they are already
// locked out and least able to cope with a wrong turn.

test('a reset sends an administrator to the door that will open', () => {
  const page = read('src/app/reset-password/page.tsx')
  assert.match(page, /SIGN_IN_PAGES/, 'the destination must be chosen, not assumed')
  assert.match(page, /admin: '\/admin'/, 'and an administrator goes to /admin')
  assert.match(page, /profile\?\.role === 'admin'/, 'decided from the role while a session still exists')
  assert.doesNotMatch(page, /router\.push\('\/login'\)/, '/login must not be hardcoded as the destination')
  assert.match(page, /href=\{signInPage\}/, 'and the button must agree with the redirect')
})

test('an administrator can start a reset from the page they sign in on', () => {
  // There was no way to reset from /admin/login at all, so somebody locked out
  // had to find /forgot-password unaided, and that page then returned them to
  // /login, which refuses them.
  const adminLogin = read('src/app/admin/login/page.tsx')
  assert.match(adminLogin, /\/forgot-password\?role=admin/, 'the admin sign-in page must offer a reset')

  const forgot = read('src/app/forgot-password/page.tsx')
  assert.match(forgot, /role'\) === 'admin'/, 'and the reset page must notice who it is helping')
  assert.match(forgot, /reset-password\$\{isAdmin \? '\?role=admin' : ''\}/, 'carrying the hint through the emailed link')
  assert.match(forgot, /href=\{signInPage\}/, 'so every way out leads somewhere that will let them in')
})

test('the login route still refuses admins, which is why all of the above matters', () => {
  // If this ever stops being true the fixes above are harmless, but the test
  // above would be asserting something with no reason behind it. Pin the
  // premise so the next person can see why the routing exists.
  const login = read('src/app/api/auth/login/route.ts')
  assert.match(login, /Administrators sign in at talenthousecollective\.co\.uk\/admin, not here\./)
})
