import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getClientIp } from '../src/lib/rate-limit'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function request(headers: Record<string, string>) {
  return new Request('https://talenthousecollective.co.uk/api/auth/login', { headers })
}

// The old getClientIp took the LEFTMOST X-Forwarded-For entry, which is
// whatever the caller wrote. On an edge that appends rather than replaces,
// every rate limit in the codebase was defeatable by rotating one header - so
// the throttle only ever slowed down honest traffic.
test('the caller cannot choose their own rate-limit identity', () => {
  assert.equal(
    getClientIp(request({ 'x-nf-client-connection-ip': '203.0.113.9', 'x-forwarded-for': '1.2.3.4, 203.0.113.9' })),
    '203.0.113.9',
    'the real peer address must win over anything forwarded',
  )
  assert.equal(
    getClientIp(request({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 203.0.113.9' })),
    '203.0.113.9',
    'the rightmost hop is the one the trusted proxy wrote',
  )
  assert.notEqual(
    getClientIp(request({ 'x-forwarded-for': 'attacker-chosen, 203.0.113.9' })),
    'attacker-chosen',
  )
})

test('an unidentifiable caller still gets a stable bucket', () => {
  assert.equal(getClientIp(request({})), 'unknown')
})

// signInWithPassword runs on the server, so Supabase's own per-IP throttle
// sees the Netlify function's address rather than the caller's. Without a
// limit here, credential stuffing against the whole user base had no brake
// anywhere in the path.
test('sign-in is limited by address and by account', () => {
  const source = read('src/app/api/auth/login/route.ts')
  assert.ok(source.includes("'login-ip'"), 'sign-in must be limited per address')
  assert.ok(source.includes("'login-account'"), 'sign-in must also be limited per account')
  assert.ok(source.includes('key: email.toLowerCase()'), 'the account limit must key on the email')
  assert.ok(source.includes('429'), 'a throttled caller must be told to wait')
})

// This endpoint sends a real email through WHC's own domain to any address
// handed to it. A list of victim addresses turned it into a mail-bombing
// service and would burn the sending reputation every transactional email on
// the platform depends on.
test('the newsletter form cannot be used to mail-bomb strangers', () => {
  const source = read('src/app/api/newsletter/subscribe/route.ts')
  assert.ok(source.includes('enforceRateLimit'), 'the newsletter form must be rate limited')
  assert.ok(source.includes("'newsletter-subscribe'"))
})

test('the billed address lookup and the public search are metered', () => {
  assert.ok(read('src/app/api/address-lookup/route.ts').includes('enforceRateLimit'))
  assert.ok(read('src/app/api/search/route.ts').includes('enforceRateLimit'))
})

// Deleting the residency profile first CASCADE-deleted every paid residency
// booking; the anonymise that followed then matched zero rows, succeeded, and
// reported the records as kept. The user was told their financial history was
// preserved for six years while it was being destroyed.
test('erasure anonymises financial records before deleting what they hang off', () => {
  const source = read('src/app/api/account/delete/route.ts')
  const anonymiseResidency = source.indexOf("anonymise('Residency booking records'")
  const deleteResidencyProfile = source.indexOf("step('residency profile'")
  const anonymiseEnrolments = source.indexOf("anonymise('Academy enrolment records'")
  const deleteCandidate = source.indexOf("step('candidate profile'")

  assert.ok(anonymiseResidency > -1 && deleteResidencyProfile > -1)
  assert.ok(
    anonymiseResidency < deleteResidencyProfile,
    'residency bookings must be detached before the profile they cascade from is deleted',
  )
  assert.ok(
    anonymiseEnrolments < deleteCandidate,
    'Academy enrolments must be detached before the candidate profile they cascade from is deleted',
  )
})

test('a failed anonymisation blocks the delete that would destroy the record', () => {
  const source = read('src/app/api/account/delete/route.ts')
  assert.ok(source.includes('Promise<boolean>'), 'anonymise must report whether it worked')
  assert.ok(source.includes('if (residencyOk)'), 'the residency profile delete must be conditional')
  assert.ok(source.includes('if (agencyOk && enrolmentsOk)'), 'the candidate profile delete must be conditional')
})

test('erasure reaches the records that had no foreign key to cascade on', () => {
  const source = read('src/app/api/account/delete/route.ts')
  assert.ok(source.includes("from('contact_queries')"), 'contact enquiries survived deletion entirely')
  assert.ok(source.includes("from('agency_case_messages')"), 'dispute messages kept the person’s user id')
  assert.ok(source.includes("from('agency_cases')"))
})

// The export's own header says no section is capped or truncated. It was
// missing roughly eighteen tables that hold personal data.
test('the data export covers the records it claims to', () => {
  const source = read('src/app/api/data-export/route.ts')
  const required = [
    'reference_requests',      // references written about this person
    'review_requests',
    'contact_queries',
    'commercial_purchases',
    'agency_cases',
    'agency_case_messages',
    'residency_profiles',
    'residency_conversations',
    'residency_applications',
    'agency_availability',
    'blocked_employers',
    'agency_mutual_blocks',
    'referrals',
  ]
  for (const table of required) {
    assert.ok(source.includes(`from('${table}')`), `the export must include ${table}`)
  }
  assert.ok(
    source.includes("eq('target_type', 'candidate')"),
    'decisions employers made about this person are personal data about them',
  )
  assert.ok(source.includes('profile: profile || null'), 'the account’s own profiles row must be exported')
})
