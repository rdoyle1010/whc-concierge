import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMoney, statedTeamSize, teamScaleVerdict, revenueScaleVerdict, scaleCeiling } from '../src/lib/hard-facts'
import { calculateMatchScore } from '../src/lib/matching'

// The two facts on a leadership profile that are actually facts.
//
// "Largest team managed: 84" and "revenue responsibility: £6.5m" were printed
// on the applications page and counted for nothing in the ranking, so two
// Directors - one who had run sixty people on a £5m book, one who had run four
// on £280k - came out of the matcher with the same score.

const DIRECTOR_ROLE = {
  job_title: 'Director of Spa', required_role_level: 'Director of Spa',
  required_skills: ['Massage'], required_qualifications: ['NVQ Level 3'],
  min_years_experience: 8, team_size: 60,
  commercial_responsibility: 'You will own the full spa P&L, around £5m annually.',
}

const director = (extra: Record<string, unknown> = {}) => ({
  role_level: 'Director of Spa', experience_years: 15,
  treatment_skills: ['Massage'], qualifications: ['NVQ Level 3'],
  business_skills: ['Budgeting'], availability_status: 'immediately',
  has_insurance: true, ...extra,
})

test('a number is only money when it is unmistakably money', () => {
  assert.equal(parseMoney('£1.2m annual spa revenue'), 1_200_000)
  assert.equal(parseMoney('£850k retail and treatment revenue'), 850_000)
  assert.equal(parseMoney('£450,000'), 450_000)
  assert.equal(parseMoney('6.5 million annual revenue'), 6_500_000)
  assert.equal(parseMoney('Owns the treatment and retail P&L, around £2m.'), 2_000_000)
  // The headline figure, not the first one mentioned.
  assert.equal(parseMoney('£2m revenue and a £300k retail target'), 2_000_000)

  // Everything a spa writes that is a number and is not money. A wrong figure
  // here is worse than no figure, because a wrong one is invisible.
  for (const notMoney of [
    'a membership of 40k', 'a team of 12', '40 treatment rooms', 'Joined in 2019',
    '1.5 hours from the property', '12 therapists', 'Grew retention by 40%',
    '85 staff across two sites', 'Responsible for 2000 members', '',
  ]) {
    assert.equal(parseMoney(notMoney), null, `${JSON.stringify(notMoney)} must not read as money`)
  }
})

test('a team size is only a team size when somebody stated one', () => {
  assert.equal(statedTeamSize(84), 84)
  assert.equal(statedTeamSize('12'), 12)
  assert.equal(statedTeamSize(0), null)
  assert.equal(statedTeamSize(null), null)
  assert.equal(statedTeamSize(undefined), null)
  assert.equal(statedTeamSize('nine'), null)
  // A revenue figure typed into the team box.
  assert.equal(statedTeamSize(6_500_000), null)
})

test('silence is never a penalty, on either side', () => {
  // The profile page promises the leadership questions are optional and that
  // skipping them never counts against anybody. This is that promise.
  assert.equal(teamScaleVerdict(director(), DIRECTOR_ROLE).score, -1)
  assert.equal(revenueScaleVerdict(director(), DIRECTOR_ROLE).score, -1)
  // And a role that states nothing cannot judge a candidate who did.
  const bare = { job_title: 'Director of Spa', required_role_level: 'Director of Spa' }
  assert.equal(teamScaleVerdict(director({ team_size_managed: 84 }), bare).score, -1)
  assert.equal(revenueScaleVerdict(director({ revenue_responsibility: '£6.5m' }), bare).score, -1)

  const stated = calculateMatchScore(director({ team_size_managed: 84, revenue_responsibility: '£6.5m annual spa revenue' }), DIRECTOR_ROLE)
  const silent = calculateMatchScore(director(), DIRECTOR_ROLE)
  assert.ok(silent.score >= stated.score - 1, 'leaving the optional fields blank must not lower the score')
  // It lowers confidence instead, which is the honest cost of saying less.
  assert.ok(silent.confidence < stated.confidence, 'saying less should be less certain, not worse')
})

test('scale separates two Directors the matcher used to score alike', () => {
  const atScale = calculateMatchScore(
    director({ team_size_managed: 84, revenue_responsibility: '£6.5m annual spa revenue' }), DIRECTOR_ROLE)
  const quarterScale = calculateMatchScore(
    director({ team_size_managed: 4, revenue_responsibility: '£280k annual revenue' }), DIRECTOR_ROLE)

  assert.ok(atScale.score >= 90, `at-scale Director should be a top match, got ${atScale.score}`)
  assert.ok(quarterScale.score <= 60, `quarter-scale Director should not read as strong, got ${quarterScale.score}`)
  assert.ok(atScale.score - quarterScale.score >= 30,
    `the two must be visibly different, got ${atScale.score} and ${quarterScale.score}`)
})

test('a genuine step up is still a good match', () => {
  // Half the scale is a normal thing to hire, and must not be capped.
  const stepUp = calculateMatchScore(
    director({ team_size_managed: 30, revenue_responsibility: '£2.5m annual revenue' }), DIRECTOR_ROLE)
  assert.ok(stepUp.score >= 75, `a half-scale step up should still read strong, got ${stepUp.score}`)
  assert.equal(scaleCeiling(
    teamScaleVerdict(director({ team_size_managed: 30 }), DIRECTOR_ROLE),
    revenueScaleVerdict(director({ revenue_responsibility: '£2.5m annual revenue' }), DIRECTOR_ROLE),
  ), null, 'half scale must not put a ceiling on anything')
})

test('running well beyond the role is a fact for the employer, not a mark against the candidate', () => {
  const verdict = teamScaleVerdict({ team_size_managed: 84 }, { team_size: 6 })
  assert.equal(verdict.score, 100, 'over-scale must not be scored down')
  assert.match(verdict.note, /well beyond/, 'but the employer should be told')
})

test('scale is judged only where the job says whose team it counts', () => {
  // job_listings.team_size is labelled only "Team size". For a therapist post
  // that could as easily be the team they join, so it stays out of the score
  // everywhere but leadership.
  const therapistRole = {
    job_title: 'Beauty Therapist', required_role_level: 'Therapist',
    required_skills: ['Massage'], team_size: 40,
    commercial_responsibility: 'The spa turns over £5m annually.',
  }
  const therapist = {
    role_level: 'Therapist', experience_years: 5, treatment_skills: ['Massage'],
    team_size_managed: 2, revenue_responsibility: '£90k retail revenue', has_insurance: true,
  }
  const result = calculateMatchScore(therapist, therapistRole)
  assert.equal(result.mode, 'permanent')
  // The factor may be computed, but it must carry no weight outside leadership.
  const withoutFacts = calculateMatchScore(
    { ...therapist, team_size_managed: null, revenue_responsibility: null }, therapistRole)
  assert.equal(result.score, withoutFacts.score,
    'team and revenue scale must not move a non-leadership score')
})

test('the explanation cites the number, not just the verdict', () => {
  const result = calculateMatchScore(
    director({ team_size_managed: 84, revenue_responsibility: '£6.5m annual spa revenue' }), DIRECTOR_ROLE)
  assert.match(result.matchExplanation, /led a team of 84/,
    'a hiring manager should see the fact in the sentence')
  assert.match(result.evidence!.teamScale.note!, /84/)
  assert.match(result.evidence!.revenueScale.note!, /£6\.5m/)
})

test('both breakdown factors reach the components that draw them', () => {
  const { readFileSync } = require('node:fs') as typeof import('node:fs')
  for (const file of ['src/components/MatchBreakdown.tsx', 'src/components/JobMatchPanel.tsx']) {
    const source = readFileSync(file, 'utf8')
    assert.ok(source.includes('teamScale'), `${file} must label teamScale, or the bar never renders`)
    assert.ok(source.includes('revenueScale'), `${file} must label revenueScale, or the bar never renders`)
  }
})
