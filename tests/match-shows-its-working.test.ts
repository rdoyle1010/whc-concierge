import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { calculateMatchScore } from '../src/lib/matching.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// A hiring director cannot defend "Location: Partial" to a general manager.
// Partial how - twenty miles or two hundred? The matcher knew the answer all
// along: it worked out which skills were found and which were not, how far
// away the person lives, whether the salary clears their expectation - and
// then threw all of it away and kept the number.
const candidate = {
  role_level: 'Therapist',
  location: 'Bath',
  latitude: 51.3811, longitude: -2.3590,
  experience_years: 3,
  services_offered: ['Swedish massage', 'Deep tissue'],
  treatment_skills: ['Swedish massage', 'Deep tissue'],
  qualifications: ['NVQ Level 3'],
  product_houses: ['ESPA'],
  salary_expectation_min: 32000,
  availability_status: 'one_month',
  shift_availability: ['weekdays'],
  transport: 'Own car',
}

const job = {
  required_role_level: 'Senior Therapist',
  location: 'Bristol',
  latitude: 51.4545, longitude: -2.5879,
  min_years_experience: 5,
  required_skills: ['Swedish massage', 'Deep tissue', 'Hot stone'],
  required_qualifications: ['NVQ Level 3', 'CIDESCO'],
  required_brands: ['ESPA', 'Elemis'],
  salary_min: 26000, salary_max: 28000,
  shift_pattern: 'weekends',
}

test('every score a candidate is shown can be opened up', () => {
  const result: any = calculateMatchScore(candidate, job)
  assert.ok(result.evidence, 'the matcher must return its working, not only its verdict')

  // Named skills, not a percentage. "Missing Hot stone" is actionable; "62%"
  // is not.
  assert.deepEqual(result.evidence.treatmentSkills.met, ['Swedish massage', 'Deep tissue'])
  assert.deepEqual(result.evidence.treatmentSkills.missing, ['Hot stone'])
  assert.deepEqual(result.evidence.brands.missing, ['Elemis'])
  assert.deepEqual(result.evidence.qualifications.missing, ['CIDESCO'])
})

test('the factors with no list to show still say something a person can read', () => {
  const result: any = calculateMatchScore(candidate, job)
  for (const key of ['roleLevel', 'experience', 'location', 'salaryFit', 'availability', 'shiftCompatibility', 'transport']) {
    const note = result.evidence[key]?.note
    assert.ok(note && note.length > 8, `${key} must explain itself`)
    assert.match(note, /\.$/, `${key} should read as a sentence`)
  }
  // The specifics, not a restatement of the score.
  assert.match(result.evidence.location.note, /\d+(\.\d+)? miles/)
  assert.match(result.evidence.experience.note, /3 years against the 5/)
  assert.match(result.evidence.salaryFit.note, /below what they are looking for/)
  assert.match(result.evidence.roleLevel.note, /step up/, 'one level below and allowed is a step up, not a shortfall')
})

// A factor the employer never specified must not invent a reason for itself.
test('a factor nobody assessed says so plainly', () => {
  const bare: any = calculateMatchScore(candidate, { ...job, min_years_experience: 0, shift_pattern: null, salary_min: null, salary_max: null })
  assert.match(bare.evidence.experience.note, /No minimum was set/)
  assert.match(bare.evidence.shiftCompatibility.note, /No shift pattern was set/)
  assert.match(bare.evidence.salaryFit.note, /No salary was advertised/)

  // With no level named on either side the gap computes as zero. Reporting
  // that as "already working at this level" would be a reassurance nobody
  // earned.
  const noLevel: any = calculateMatchScore({ ...candidate, role_level: '' }, { ...job, required_role_level: '', job_title: '', title: '' })
  assert.match(noLevel.evidence.roleLevel.note, /does not state a level/)
})

// The evidence is useless sitting in a return value.
test('the breakdown component can open each row', () => {
  const component = read('src/components/MatchBreakdown.tsx')
  assert.match(component, /evidence\?: MatchEvidence \| null/, 'it must accept the working')
  assert.match(component, /aria-expanded=\{isOpen\}/, 'and each row is a real disclosure control')
  assert.match(component, /aria-controls=\{panelId\}/)
  assert.match(component, /Not evidenced/, 'a gap is named, not implied by a short bar')
  // A row with nothing behind it must not pretend to be openable.
  assert.match(component, /const detailFor =/)
  assert.match(component, /\{detail \? \(/)
})

// The score is computed in four places and shown in four places. Any one of
// them dropping the evidence leaves that screen back on faith alone.
test('every screen that shows a score also gets the working', () => {
  for (const site of [
    'src/components/TalentApplicationsWorkspace.tsx',
    'src/app/talent/jobs/page.tsx',
    'src/app/roles/match/page.tsx',
    'src/app/employer/applications/page.tsx',
  ]) {
    assert.match(read(site), /<MatchBreakdown breakdown=\{[^}]+\} evidence=/, `${site} must pass the evidence through`)
  }
  // The employer's copy crosses an API boundary, so it has to be serialised.
  assert.match(read('src/app/api/employer/applications/inbox/route.ts'), /evidence: match\.evidence \|\| null/)
})
