import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ADMIN_REFUSAL_MESSAGE } from '../src/lib/admin-api-auth'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// Strip comments before asserting. Several of these checks look for the
// absence of a pattern, and the explanation of why it must be absent names it.
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// The public Academy course is the one thing on this platform sold to somebody
// with no account: pay by email, access is sent afterwards. Fulfilment has two
// paths precisely because the webhook alone once took money for days and
// delivered nothing.
//
// The second path required a signed-in session, so the one buyer who cannot
// have one was the one buyer it refused. For a guest, fulfilment was still
// webhook-or-nothing - and the guest fulfilment branch itself discarded the
// errors from both writes that matter, so a failure returned ok, Stripe never
// retried, and nobody was told. Somebody paid and owned nothing, and every
// record on the platform said the sale had completed.

test('a guest can confirm the purchase a guest is allowed to make', () => {
  const route = body('src/app/api/stripe/confirm/route.ts')
  assert.match(route, /GUEST_CHECKOUT_TYPES/,
    'the route must know which checkouts are sold without an account')
  assert.match(route, /'course_public'/,
    'the public Academy purchase is the guest checkout that exists today')
  assert.match(route, /if \(!user && !guestPurchase\) return NextResponse\.json\(\{ error: 'Please sign in again\.' \}, \{ status: 401 \}\)/,
    'a missing session may only refuse a purchase that required one')

  // Whatever is relaxed for guests, the route must still ask Stripe rather
  // than believe the caller, and must still refuse an unpaid session.
  assert.match(route, /stripe\.checkout\.sessions\.retrieve\(sessionId\)/)
  assert.match(route, /payment_status === 'paid'/)
})

test('one buyer cannot claim another buyer’s purchase', () => {
  const route = body('src/app/api/stripe/confirm/route.ts')
  // The ownership check still runs for anybody signed in. A guest session
  // grants nothing to the caller - fulfilment delivers to the email Stripe
  // holds - so there is no ownership to check and nothing to take.
  assert.match(route, /if \(user && buyer && buyer !== user\.id\)/,
    'a signed-in caller must still be checked against the recorded buyer')
  assert.match(route, /This payment belongs to another account/)
})

test('guest fulfilment cannot report a delivery it did not make', () => {
  const fulfilment = body('src/lib/stripe-checkout-fulfilment.ts')
  const branch = fulfilment.slice(
    fulfilment.indexOf("meta?.type === 'course_public'"),
    fulfilment.indexOf("meta?.type === 'course_bundle'"),
  )
  assert.ok(branch.length > 500, 'the guest branch should have been found')

  // The two writes that decide whether the buyer owns anything.
  assert.match(branch, /candError/, 'the learner record insert must check its error')
  assert.match(branch, /enrolError/, 'the enrolment upsert must check its error')
  assert.match(branch, /if \(candError\) throw/)
  assert.match(branch, /if \(enrolError\) throw/)
  assert.match(branch, /retry: true/, 'a failure must ask Stripe to try again')
})

test('a payment taken and not delivered reaches an administrator', () => {
  const fulfilment = body('src/lib/stripe-checkout-fulfilment.ts')
  const branch = fulfilment.slice(
    fulfilment.indexOf("meta?.type === 'course_public'"),
    fulfilment.indexOf("meta?.type === 'course_bundle'"),
  )
  // A guest has no account, no dashboard and no support thread. If nobody is
  // told, nobody finds out until the customer does.
  assert.match(branch, /notifyAdmins\(/,
    'the only person who can put this right has to be told')
})

test('an administrator is told which door was closed', () => {
  // "Unauthorised" is true of all four refusals and useful for none. The
  // owner of the platform, looking at her own screen, could not tell an
  // expired authenticator from a broken page.
  const reasons = Object.keys(ADMIN_REFUSAL_MESSAGE)
  assert.deepEqual(reasons.sort(), ['check-failed', 'not-admin', 'second-step', 'signed-out'])
  for (const [reason, message] of Object.entries(ADMIN_REFUSAL_MESSAGE)) {
    assert.ok(message.length > 20, `${reason} needs a message a person can act on`)
    assert.doesNotMatch(message, /^Unauthorised$/)
  }
  assert.match(ADMIN_REFUSAL_MESSAGE['second-step'], /two-step/i)

  const route = body('src/app/api/admin/academy/route.ts')
  assert.doesNotMatch(route, /error: 'Unauthorised'/,
    'the bare word tells the administrator nothing')
  assert.match(route, /ADMIN_REFUSAL_MESSAGE\[refusal\]/)
})

test('a page that loaded does not keep showing that it failed', () => {
  const page = read('src/app/admin/academy/[slug]/page.tsx')
  const load = page.slice(page.indexOf('const load = useCallback'), page.indexOf('useEffect(() => { load() }'))
  assert.match(load, /setLoading\(true\)[\s\S]{0,400}setError\(''\)/,
    'each attempt must clear the previous failure, or one refused request leaves a red banner over a page that works')
})
