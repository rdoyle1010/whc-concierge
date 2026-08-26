import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateMatchScore } from '../src/lib/matching'

const baseCandidate = {
  role_level: 'Spa Manager',
  experience_years: 8,
  business_skills: ['Team Leadership', 'Budget Management', 'KPI Reporting', 'Staff Training'],
  qualifications: [], product_houses: [], systems_experience: [], services_offered: [],
  profile_completion_score: 90, latitude: 51.5, longitude: -0.1,
}
const baseDirectorJob = {
  job_title: 'Director of Spa', required_role_level: 'Director of Spa', min_years_experience: 5,
  preferred_business_skills: ['Team Leadership', 'Budget Management', 'KPI Reporting'],
  required_skills: [], required_brands: [], required_qualifications: [], required_systems: [],
  latitude: 51.5, longitude: -0.1,
}

test('Spa Manager can be a strong step-up match for Director of Spa', () => {
  const result = calculateMatchScore(baseCandidate, { ...baseDirectorJob, candidate_scope: 'step_up' })
  assert.equal(result.hardStop, false)
  assert.equal(result.progression?.isStepUp, true)
  assert.ok(result.score >= 60, `expected progression match, got ${result.score}`)
  assert.match(result.matchExplanation, /career progression|next career step/i)
})

test('same-level-only employer scope prevents a lower-level application score', () => {
  const result = calculateMatchScore(baseCandidate, { ...baseDirectorJob, candidate_scope: 'same_level' })
  assert.ok(result.score < 45, `same-level scope should remain below application threshold, got ${result.score}`)
})

test('Senior Therapist with leadership evidence can bridge toward Spa Manager', () => {
  const candidate = {
    ...baseCandidate,
    role_level: 'Senior Therapist',
    experience_years: 7,
    business_skills: ['Team Leadership', 'Staff Training', 'Rota Management', 'Upselling & Retail'],
  }
  const job = {
    ...baseDirectorJob,
    job_title: 'Spa Manager', required_role_level: 'Spa Manager', candidate_scope: 'emerging',
    preferred_business_skills: ['Team Leadership', 'Staff Training', 'Rota Management'],
  }
  const result = calculateMatchScore(candidate, job)
  assert.equal(result.hardStop, false)
  assert.equal(result.progression?.bridge, true)
  assert.ok(result.score >= 45, `leadership bridge should remain eligible, got ${result.score}`)
})

test('employer-selected role level overrides an inconsistent job title', () => {
  const receptionist = { ...baseCandidate, role_level: 'Receptionist', experience_years: 4, business_skills: ['Reception & Front of House'] }
  const job = { ...baseDirectorJob, job_title: 'Luxury Guest Experience Lead', required_role_level: 'Receptionist', candidate_scope: 'same_level', preferred_business_skills: ['Reception & Front of House'] }
  const result = calculateMatchScore(receptionist, job)
  assert.ok(result.breakdown.roleLevel >= 90)
})
