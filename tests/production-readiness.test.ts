import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createRegistrationProof,
  isOwnedRegistrationDocumentUrl,
  sanitiseEmployerRegistration,
  sanitiseTalentRegistration,
  verifyRegistrationProof,
} from '../src/lib/registration.ts'
import { isInternalApiRequest } from '../src/lib/internal-request.ts'
import { calculateMatchScore } from '../src/lib/matching.ts'

process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-secret'
process.env.INTERNAL_API_SECRET = 'test-internal-secret'

const userId = '00000000-0000-4000-8000-000000000001'
const otherUserId = '00000000-0000-4000-8000-000000000002'

function talentProof() {
  return createRegistrationProof({ userId, role: 'talent', email: 'Talent@Example.com' })
}

test('registration proof verifies for the intended user and role', () => {
  const proof = verifyRegistrationProof(talentProof(), { userId, role: 'talent' })
  assert.equal(proof?.email, 'talent@example.com')
})

test('registration proof rejects a changed signature', () => {
  const token = talentProof()
  assert.equal(verifyRegistrationProof(`${token.slice(0, -1)}x`), null)
})

test('registration proof rejects the wrong user', () => {
  assert.equal(verifyRegistrationProof(talentProof(), { userId: otherUserId }), null)
})

test('registration proof rejects the wrong role', () => {
  assert.equal(verifyRegistrationProof(talentProof(), { role: 'employer' }), null)
})

test('owned document URL accepts the registration user path', () => {
  assert.equal(isOwnedRegistrationDocumentUrl(`/api/files?bucket=talent-documents&path=${userId}%2Fcv.pdf`, userId), true)
})

test('owned document URL rejects another user path', () => {
  assert.equal(isOwnedRegistrationDocumentUrl(`/api/files?bucket=talent-documents&path=${otherUserId}%2Fcv.pdf`, userId), false)
})

test('owned document URL rejects path traversal', () => {
  assert.equal(isOwnedRegistrationDocumentUrl(`/api/files?bucket=talent-documents&path=${userId}%2F..%2Fsecret.pdf`, userId), false)
})

test('talent registration forces ownership and active standard Talent status', () => {
  const row = sanitiseTalentRegistration({ user_id: otherUserId, approval_status: 'pending' }, userId)
  assert.equal(row.user_id, userId)
  assert.equal(row.approval_status, 'approved')
})

test('talent registration strips administrator fields', () => {
  const row = sanitiseTalentRegistration({ is_admin: true, whc_verified: true, subscription_tier: 'free' }, userId)
  assert.equal('is_admin' in row, false)
  assert.equal('whc_verified' in row, false)
  assert.equal('subscription_tier' in row, false)
})

test('talent registration accepts an owned CV URL', () => {
  const cv = `/api/files?bucket=talent-documents&path=${userId}%2Fcv.pdf`
  assert.equal(sanitiseTalentRegistration({ cv_url: cv }, userId).cv_url, cv)
})

test('talent registration rejects a foreign insurance URL', () => {
  const insurance = `/api/files?bucket=talent-documents&path=${otherUserId}%2Finsurance.pdf`
  const row = sanitiseTalentRegistration({ has_insurance: true, insurance_document_url: insurance }, userId)
  assert.equal(row.insurance_document_url, null)
  assert.equal(row.has_insurance, false)
})

test('talent completion score is calculated on the server', () => {
  const row = sanitiseTalentRegistration({ full_name: 'A Person', role_level: 'Therapist', profile_completion_score: 999 }, userId)
  assert.equal(row.profile_completion_score, 25)
})

test('registration proof remains valid long enough to resume signup and expires after 24 hours', () => {
  const now = Date.now
  const token = talentProof()
  Date.now = () => now() + 23 * 60 * 60 * 1000
  try {
    assert.notEqual(verifyRegistrationProof(token), null)
  } finally {
    Date.now = now
  }

  Date.now = () => now() + 25 * 60 * 60 * 1000
  try {
    assert.equal(verifyRegistrationProof(token), null)
  } finally {
    Date.now = now
  }
})

test('employer registration forces the verified auth email', () => {
  const row = sanitiseEmployerRegistration({ contact_email: 'attacker@example.com' }, userId, 'Owner@Example.com')
  assert.equal(row.contact_email, 'owner@example.com')
})

test('employer registration forces pending approval and ownership', () => {
  const row = sanitiseEmployerRegistration({ user_id: otherUserId, approval_status: 'approved' }, userId, 'owner@example.com')
  assert.equal(row.user_id, userId)
  assert.equal(row.approval_status, 'pending')
})

test('employer registration strips protected billing fields', () => {
  const row = sanitiseEmployerRegistration({ preferred_employer: true, stripe_customer_id: 'cus_bad' }, userId, 'owner@example.com')
  assert.equal('preferred_employer' in row, false)
  assert.equal('stripe_customer_id' in row, false)
})

test('internal API request accepts the configured server secret', () => {
  const req = new Request('https://whc.local/api/job-alerts', { headers: { 'x-whc-internal-secret': 'test-internal-secret' } })
  assert.equal(isInternalApiRequest(req), true)
})

test('internal API request rejects an invalid secret', () => {
  const req = new Request('https://whc.local/api/job-alerts', { headers: { 'x-whc-internal-secret': 'wrong' } })
  assert.equal(isInternalApiRequest(req), false)
})

test('treatment role requiring insurance is a hard stop without insurance', () => {
  const result = calculateMatchScore({ role_level: 'Spa Therapist', has_insurance: false }, { job_title: 'Senior Spa Therapist', insurance_required: true })
  assert.equal(result.hardStop, true)
})

test('advertised role family prevents unrelated roles receiving a strong score', () => {
  const result = calculateMatchScore({ role_level: 'Spa Receptionist' }, { job_title: 'Spa Director' })
  assert.equal(result.hardStop, false)
  assert.ok(result.score <= 20)
})
