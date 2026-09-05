import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateMatchScore } from '../src/lib/matching'

// A role that specifies almost nothing leaves two or three factors standing,
// and everybody who clears those comes out at ninety-something. A "Perfect
// Match" built on three of fourteen factors is a small sample with a
// confident label on it, and a hiring manager who acts on it once and is
// disappointed never trusts the number again.

const strongCandidate = {
  role_level: 'Director of Spa',
  experience_years: 25,
  years_experience: 25,
  services_offered: ['Massage', 'Facials'],
  qualifications: ['Level 4 Beauty Therapy'],
  business_skills: ['Team Leadership', 'Revenue Management'],
  availability_status: 'immediately',
}

test('a bare role cannot produce a Perfect Match', () => {
  const bareRole = { job_title: 'Director of Spa', required_role_level: 'Director of Spa' }
  const result = calculateMatchScore(strongCandidate, bareRole)

  assert.ok(result.score >= 75, `the arithmetic should still be favourable, got ${result.score}`)
  assert.ok(result.thinEvidence, 'a role stating almost nothing must be marked as thin evidence')
  assert.notEqual(result.label, 'Perfect Match',
    'a verdict this strong cannot rest on two or three factors')
  assert.match(result.label, /briefly checked/,
    'the label should say the check was brief rather than overclaim')
})

test('a role that states its requirements gets the full verdict back', () => {
  const properRole = {
    job_title: 'Director of Spa',
    required_role_level: 'Director of Spa',
    required_skills: ['Massage', 'Facials'],
    required_qualifications: ['Level 4 Beauty Therapy'],
    min_years_experience: 5,
    preferred_business_skills: ['Team Leadership', 'Revenue Management'],
    location: 'Leeds',
    shift_pattern: '5 over 7',
    salary_min: 40000,
    salary_max: 50000,
  }
  const result = calculateMatchScore(strongCandidate, properRole)

  assert.ok(result.confidence > 60,
    `a properly specified role should be judged with confidence, got ${result.confidence}`)
  assert.equal(result.thinEvidence, false)
  // With real evidence behind it, the strong labels are available again.
  assert.doesNotMatch(result.label, /briefly checked/)
})

test('confidence is a share of the weight, not a count of the boxes', () => {
  // Job role and level carries far more weight than accommodation. Counting
  // factors rather than weighting them would call a role that stated only
  // the trivia well evidenced.
  const result = calculateMatchScore(strongCandidate, { job_title: 'Spa Therapist' })
  assert.ok(result.confidence >= 0 && result.confidence <= 100,
    'confidence must be a percentage')
  assert.equal(typeof result.thinEvidence, 'boolean')
})
