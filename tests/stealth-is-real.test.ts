import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { canEmployerDiscoverCandidate } from '../src/lib/discovery.ts'
import { calculateMatchScore } from '../src/lib/matching.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const API = new URL('../src/app/api/', import.meta.url).pathname

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (entry === 'route.ts') files.push(full)
  }
  return files
}

// A member asked whether Stealth Mode is real or marketing. It was real in
// four places and absent in three, which is the answer nobody wants: the
// control worked well enough to be believed and not well enough to be relied
// on.
test('the discovery gate refuses every way of being hidden', () => {
  const none = new Set<string>()
  const base = { id: 'x', approval_status: 'approved', profile_visible: true, stealth_mode: false }

  assert.equal(canEmployerDiscoverCandidate(base, none), true)
  assert.equal(canEmployerDiscoverCandidate({ ...base, stealth_mode: true }, none), false, 'stealth hides')
  assert.equal(canEmployerDiscoverCandidate({ ...base, profile_visible: false }, none), false, 'hidden profile hides')
  assert.equal(canEmployerDiscoverCandidate({ ...base, approval_status: 'pending' }, none), false, 'unapproved hides')
  assert.equal(canEmployerDiscoverCandidate(base, new Set(['x'])), false, 'a block hides')

  // The asymmetry is deliberate and matches the database predicate: nobody is
  // removed from the register by a null they never set.
  assert.equal(canEmployerDiscoverCandidate({ ...base, profile_visible: null }, none), true, 'null means visible')
  assert.equal(canEmployerDiscoverCandidate({ ...base, stealth_mode: null }, none), true, 'null does not hide')
})

// Three routes checked approval, visibility and blocks, and forgot stealth.
// One hand-written copy of a privacy rule per route is how that happens.
test('every route that serves a professional to a property uses the one gate', () => {
  const offenders: string[] = []
  for (const file of walk(API)) {
    const source = readFileSync(file, 'utf8')
    const path = file.split('/src/')[1]
    // Admin sees everybody by design - that is what moderation and safety are.
    if (path.startsWith('app/api/admin/')) continue
    // Everything under /talent serves the professional their own data - their
    // brief, their block list. Nothing there hands a row to a property, and
    // hiding somebody from themselves is not a privacy control.
    if (path.startsWith('app/api/talent/')) continue
    // Routes that manage the block list itself, export a member their own
    // data, or delete an account all touch profile_blocks without ever
    // serving a professional to a property.
    if (/\/(blocks|blocked-employers|data-export|delete)\/route\.ts$/.test(path)) continue
    // What matters is reading a professional's row on behalf of a property.
    if (!/profile_blocks/.test(source)) continue
    if (!/candidate_profiles/.test(source)) continue
    // A route may either call the gate or check stealth itself, but it may not
    // do neither while filtering on the other two flags.
    const usesGate = source.includes('canEmployerDiscoverCandidate')
    const checksStealth = /stealth_mode/.test(source)
    if (!usesGate && !checksStealth) offenders.push(path)
  }
  assert.deepEqual(offenders, [], 'these routes filter on approval and blocks but ignore Stealth Mode')
})

// The sharpest of the three. The whole promise of Stealth Mode is that no
// employer reaches you, and a private approach is exactly an employer
// reaching you - so somebody hiding from a current employer could have been
// messaged by them.
test('a private approach cannot reach somebody in stealth', () => {
  const route = read('src/app/api/private-approach/route.ts')
  assert.match(route, /candidate\.stealth_mode === true/, 'stealth blocks the approach')
  assert.match(route, /stealth_mode'\)/, 'and the column is actually selected, or the check reads undefined')
})

// A control that only applies to future searches protects nobody who has
// already been found, which is everybody who needs it.
test('turning on stealth removes you from shortlists you are already on', () => {
  const route = read('src/app/api/shortlist/route.ts')
  assert.match(route, /canEmployerDiscoverCandidate\(candidate, blockedIds\)/)
  assert.match(route, /approval_status, stealth_mode\)/, 'the join must fetch the flag it filters on')
})

test('the match endpoint does not answer with people it has been told to hide', () => {
  const route = read('src/app/api/match/route.ts')
  assert.match(route, /canEmployerDiscoverCandidate\(c, blockedIds\)/)
})

// "Does the matching actually work, or is it a number?" It is fifteen weighted
// components with three weight profiles, and it has to discriminate.
test('matching separates a real fit from a poor one', () => {
  const job = {
    job_title: 'Senior Spa Therapist', required_role_level: 'senior_therapist',
    required_skills: ['Swedish massage', 'Deep tissue', 'Facials'],
    required_brands: ['ESPA'], required_qualifications: ['NVQ Level 3'],
    min_years_experience: 4, salary_min: 28000, salary_max: 32000,
    latitude: 53.99, longitude: -1.54, location_country: 'GB',
  }
  const strong = {
    id: 'a', role_level: 'senior_therapist', experience_years: 6,
    services_offered: ['Swedish massage', 'Deep tissue', 'Facials', 'Hot stone'],
    product_houses: ['ESPA', 'Elemis'], qualifications: ['NVQ Level 3'],
    salary_expectation_min: 28000, salary_expectation_max: 31000,
    latitude: 53.96, longitude: -1.08, location_country: 'GB',
    availability_status: 'immediately', travel_radius_miles: 40,
  }
  const wrong = {
    id: 'b', role_level: 'receptionist', experience_years: 1,
    services_offered: ['Reception'], product_houses: [], qualifications: [],
    latitude: 50.9, longitude: -1.4, location_country: 'GB',
    availability_status: 'not_looking', travel_radius_miles: 10,
  }

  const good = calculateMatchScore(strong, job)
  const bad = calculateMatchScore(wrong, job)

  assert.ok(good.score >= 85, `a genuine fit must score highly, got ${good.score}`)
  assert.ok(bad.score <= 45, `a receptionist is not a senior therapist, got ${bad.score}`)
  assert.ok(good.score - bad.score > 40, 'the scale has to mean something')

  // A score with no reasons behind it is a number somebody has to take on
  // trust, which is the thing being asked about.
  assert.ok((good.matchingSkills || []).length >= 3, 'a strong match names what matched')
  assert.match(good.label, /Match/)
})

// A therapist applying one level up is the commonest real case on this
// platform, and it must not read the same as a wrong application.
test('stepping up scores between a perfect fit and a mismatch', () => {
  const job = {
    job_title: 'Senior Spa Therapist', required_role_level: 'senior_therapist',
    required_skills: ['Swedish massage', 'Facials'], min_years_experience: 4,
    latitude: 53.99, longitude: -1.54, location_country: 'GB',
  }
  const stepping = {
    id: 'c', role_level: 'therapist', experience_years: 3,
    services_offered: ['Swedish massage', 'Facials'], qualifications: ['NVQ Level 3'],
    latitude: 53.80, longitude: -1.55, location_country: 'GB',
    availability_status: 'one_month', travel_radius_miles: 30,
  }
  const score = calculateMatchScore(stepping, job).score
  assert.ok(score > 55 && score < 90, `a step up should read as a step up, got ${score}`)
})
