import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// The lockout, exactly as it happened.
//
// '/admin/login' sits inside the '/admin' prefix, and every path under that
// prefix was treated as protected. So a signed-out administrator asking for
// the admin sign-in page was redirected to '/login' - the member page, which
// has a Talent / Hotel toggle and no admin option. That page then refused the
// account and told her to "use the Admin sign in": the page she had just been
// redirected away from. There was no way in at all, and it read from outside
// like a broken account.
// This test was green while the page was completely unreachable, and that is
// worth more than the test was.
//
// It asserted the door appeared in the proxy's AUTH_PAGES list and called
// that "reachable". It is not the same claim. src/app/admin/layout.tsx guards
// every path beneath /admin on the server, independently of the proxy, and
// knows nothing about AUTH_PAGES. When a sign-in page was put at
// /admin/login, the layout turned signed-out visitors away before the form
// rendered, and this file said it was fine for a fortnight.
//
// Reachability is now asserted the only way it can be: the door is outside
// the guarded prefix, and no layout above it sends a signed-out visitor away.
test('the admin sign-in page is reachable when signed out', () => {
  const proxy = read('src/proxy.ts')
  const door = proxy.match(/matchesRoutePrefix\(pathname, '\/admin'\)\) loginUrl\.pathname = '(\/[a-z0-9/-]+)'/)?.[1]
  assert.ok(door, 'the proxy must name one admin door')

  // The hyphen is load-bearing: '/admin-sign-in' does not match the '/admin'
  // prefix, '/admin/login' does, and that is the whole difference between a
  // door and a wall.
  assert.doesNotMatch(door, /^\/admin\//, `${door} is under the guard and cannot hold the form`)
  assert.match(read('src/app/admin/layout.tsx'), new RegExp(`redirect\\('${door}'\\)`),
    'the admin guard must send a signed-out visitor to the door')

  // An auth page cannot also be protected, whichever prefix it sits under -
  // otherwise the two rules disagree and the protected one wins.
  assert.match(
    proxy,
    /const isProtected = !isAuthPage &&/,
    'a sign-in page must be excluded from the protected set, not merely listed twice',
  )
})

// Sending an administrator to the member sign-in page hands their account to a
// form built to reject it.
test('a signed-out visit to an admin page lands on the admin door', () => {
  const proxy = read('src/proxy.ts')
  const redirect = proxy.slice(proxy.indexOf('if (isProtected && !user)'))
  assert.match(
    redirect.slice(0, 900),
    /matchesRoutePrefix\(pathname, '\/admin'\)\) loginUrl\.pathname = '\/admin-sign-in'/,
    'admin paths must redirect to the admin sign-in page, which sits outside the guard',
  )
})

// The URL a person types from memory.
test('/admin is not a dead end', () => {
  const page = read('src/app/admin/page.tsx')
  assert.match(page, /redirect\(/, '/admin must go somewhere rather than 404')
})

// "This is a Admin account. Please use the Admin sign in." named neither the
// URL nor the article correctly, and pointed at a page with no admin option.
test('a role mismatch names the door, not just the account type', () => {
  const route = read('src/app/api/auth/login/route.ts')
  const mismatch = route.slice(route.indexOf('if (!matchesSelectedLogin)'))
  assert.match(mismatch.slice(0, 1400), /\/admin/, 'an administrator is told where to sign in')
  assert.ok(!/This is a \$\{correctArea\} account\. Please use the \$\{correctArea\} sign in\./.test(route),
    'the old dead-end wording must not come back')
})

// Everything that blocks a sign-in is invisible from outside: role, confirmed
// address, an authenticator on a phone that no longer exists. All three look
// the same to the person locked out and to the person trying to help them.
test('an administrator can diagnose and unlock another account', () => {
  const route = read('src/app/api/admin/account-access/route.ts')
  assert.match(route, /adminRequestUser/, 'admin only, and behind their own two-step challenge')
  for (const signal of ['listFactors', 'mfa_recovery_codes', 'email_confirmed_at', 'last_sign_in_at']) {
    assert.ok(route.includes(signal), `the diagnosis must read ${signal}`)
  }
  assert.match(route, /verdict/, 'and say what is wrong in a sentence, not a field dump')

  // Clearing your own second factor from a page gated on that same factor is
  // how an administrator locks themselves out permanently. Recovery codes are
  // the route for that, and they exist.
  assert.match(route, /found\.userId === actor\.id/, 'an admin must not clear their own two-step here')
  assert.match(route, /admin_audit_log/, 'and every unlock is recorded against who did it')

  // The reset link goes to the account holder's inbox. Handing it to the
  // administrator on screen would make this a takeover, not a reset.
  assert.match(route, /resetPasswordForEmail/)
  assert.ok(!/generateLink/.test(route), 'a reset link must never be shown to the admin running this')

  assert.match(read('src/app/admin/settings/page.tsx'), /<AccountAccessPanel \/>/, 'wired into settings')
})
