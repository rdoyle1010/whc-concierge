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
test('the admin sign-in page is reachable when signed out', () => {
  const proxy = read('src/proxy.ts')
  assert.match(proxy, /'\/admin\/login'/, 'the admin sign-in page must be listed as an auth page')
  const authPages = proxy.slice(proxy.indexOf('const AUTH_PAGES'), proxy.indexOf('\n', proxy.indexOf('const AUTH_PAGES')))
  assert.ok(authPages.includes('/admin/login'), `AUTH_PAGES must contain the admin door: ${authPages}`)
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
    /matchesRoutePrefix\(pathname, '\/admin'\)\) loginUrl\.pathname = '\/admin\/login'/,
    'admin paths must redirect to the admin sign-in page',
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
