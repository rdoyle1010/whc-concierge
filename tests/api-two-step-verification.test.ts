import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isMfaExemptApi } from '../src/proxy'

// Two-step verification was enforced on pages and on bearer tokens, and
// nowhere else. '/api/admin/users' matches none of the middleware's protected
// prefixes - it is neither '/admin' nor does it start with '/admin/' - so
// every API route sat outside the gate, including the ones that hand over
// account approval, revenue, the verification queue and, through /api/files,
// every CV and right-to-work document on the platform.

test('the routes that hold real data are behind the second step', () => {
  const guarded = [
    '/api/admin/users',
    '/api/admin/verification',
    '/api/admin/revenue',
    '/api/admin/agency',
    '/api/admin/retention',
    '/api/files',
    '/api/data-export',
    '/api/account/delete',
    '/api/employer/candidates',
    '/api/agency/directory',
    '/api/messages/conversations',
    '/api/search',
    '/api/cv/analyse',
    '/api/stripe/checkout',
    '/api/verification',
  ]
  for (const route of guarded) {
    assert.equal(isMfaExemptApi(route), false, `${route} must not be exempt`)
  }
})

test('only the routes that genuinely cannot require it are exempt', () => {
  const exempt = [
    // Completing the second step itself, and signing out.
    '/api/auth/login',
    '/api/auth/signout',
    // Signed by Stripe, not by a session.
    '/api/stripe/webhook',
    // Public surfaces with no session, or none that matters.
    '/api/public-stats',
    '/api/contact-notify',
    '/api/newsletter/subscribe',
    '/api/certificates/verify',
    '/api/address-lookup',
    '/api/track-view',
    '/api/register/init',
    '/api/privacy/marketing/withdraw',
  ]
  for (const route of exempt) {
    assert.equal(isMfaExemptApi(route), true, `${route} must stay reachable`)
  }
})

test('an exemption never leaks to a neighbouring path by prefix', () => {
  // '/api/stripe/webhook' is exempt; the rest of /api/stripe is not.
  assert.equal(isMfaExemptApi('/api/stripe/checkout'), false)
  assert.equal(isMfaExemptApi('/api/stripe/webhook'), true)
  // A path that merely begins with the same characters is not a match.
  assert.equal(isMfaExemptApi('/api/authorise-payout'), false)
  assert.equal(isMfaExemptApi('/api/registered-users'), false)
  assert.equal(isMfaExemptApi('/api/newsletters-admin'), false)
})

// The guard has to be wired into the request path, not merely defined.
test('the middleware applies the check to API requests and answers in JSON', () => {
  const source = readFileSync(new URL('../src/proxy.ts', import.meta.url), 'utf8')
  assert.ok(source.includes('isProtected || isGuardedApi'), 'the assurance gate must cover API routes')
  assert.ok(source.includes('mfaRequired: true'), 'an API caller must get JSON, not an HTML redirect')
  assert.ok(source.includes('usesBearerToken'), 'bearer callers must be left to getRequestUser')
})

// Every admin route used to carry its own copy of the guard. Twenty-two
// copies, none of which checked assurance level.
test('no admin route keeps a private copy of the admin check', () => {
  const source = readFileSync(new URL('../src/lib/admin-api-auth.ts', import.meta.url), 'utf8')
  assert.ok(source.includes('adminRequestUser'), 'the shared guard must exist')
  assert.ok(
    source.includes('getAuthenticatorAssuranceLevel'),
    'the shared admin guard must check the assurance level',
  )
  // Fails closed: unlike the page middleware, an unreadable assurance level
  // on an administrator's API must mean no session, not a session.
  assert.ok(source.includes('if (error || !assurance) return null'), 'the admin guard must fail closed')
})
