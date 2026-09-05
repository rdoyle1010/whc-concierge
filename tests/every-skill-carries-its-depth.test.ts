import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { tidyProficiencies, DEFAULT_PROFICIENCY, PROFICIENCY_OPTIONS } from '../src/lib/skill-depth'
import { calculateMatchScore } from '../src/lib/matching'

test('a skill added outside the wizard still gets a depth', () => {
  const kept = tidyProficiencies({ 'Swedish Massage': 'advanced' }, ['Swedish Massage', 'Hot Stone Massage'])
  assert.deepEqual(kept, {
    'Swedish Massage': 'advanced',
    'Hot Stone Massage': DEFAULT_PROFICIENCY,
  })
})

test('a skill removed does not leave its old depth behind', () => {
  // Otherwise a profile slowly accumulates opinions about treatments
  // somebody no longer offers.
  const tidied = tidyProficiencies({ 'Swedish Massage': 'master', 'Reflexology': 'beginner' }, ['Swedish Massage'])
  assert.deepEqual(tidied, { 'Swedish Massage': 'master' })
})

test('rubbish in the column does not become a depth', () => {
  assert.equal(tidyProficiencies(null, []), null)
  assert.equal(tidyProficiencies(['not', 'an', 'object'], []), null)
  assert.deepEqual(tidyProficiencies({ Massage: '' }, ['Massage']), { Massage: DEFAULT_PROFICIENCY })
})

test('the leak was real: no depths means the factor is dropped entirely', () => {
  // The matcher skips a factor it cannot assess rather than scoring it zero.
  // That is merciful, and it also means somebody who never used the wizard
  // had their score built on one factor fewer without being told.
  const role = { job_title: 'Spa Therapist', required_skills: ['Swedish Massage', 'Hot Stone Massage'] }
  const base = {
    role_level: 'Spa Therapist',
    services_offered: ['Swedish Massage', 'Hot Stone Massage'],
    experience_years: 6,
  }

  const withoutDepth = calculateMatchScore(base, role)
  const withDepth = calculateMatchScore(
    { ...base, skill_proficiencies: { 'Swedish Massage': 'master', 'Hot Stone Massage': 'master' } },
    role,
  )

  assert.equal(withoutDepth.breakdown.proficiencyDepth, -1,
    'with no depths recorded the factor is not assessed at all')
  assert.ok(withDepth.breakdown.proficiencyDepth > 0,
    'once depths exist the factor is scored')
  assert.ok(withDepth.confidence > withoutDepth.confidence,
    'and the score is built on more evidence than before')
})

test('the profile page asks the same question the wizard does', () => {
  const page = readFileSync('src/app/talent/profile/page.tsx', 'utf8')
  assert.match(page, /skill_proficiencies/, 'the profile page must record depth')
  assert.match(page, /tidyProficiencies\(profile\.skill_proficiencies, ?depthSkills\)/,
    'and must keep the stored map in step with the selected skills on save')

  // The same four words, so a profile edited in either place reads the same.
  const wizard = readFileSync('src/app/talent/onboarding/page.tsx', 'utf8')
  for (const level of PROFICIENCY_OPTIONS) {
    assert.ok(wizard.includes(`value="${level}"`), `the wizard offers ${level}, so the profile must too`)
  }
})
