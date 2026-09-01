import test from 'node:test'
import assert from 'node:assert/strict'
import { canEmployerDiscoverCandidate } from '../src/lib/discovery'
import { presentCandidateForEmployer, candidateNameForEmployer, anonymiseDisplayName } from '../src/lib/private-mode'

const NO_BLOCKS = new Set<string>()

// Stealth Mode was enforced in the database and in the app's copy, but not in
// the function every employer-facing server route actually calls. Those
// routes use the service role, which bypasses row-level security - so the
// control worked only where nobody looked.
test('Stealth Mode hides a professional from employer discovery', () => {
  const base = { id: 'c1', approval_status: 'approved', profile_visible: true }
  assert.equal(canEmployerDiscoverCandidate({ ...base }, NO_BLOCKS), true)
  assert.equal(canEmployerDiscoverCandidate({ ...base, stealth_mode: true }, NO_BLOCKS), false)
})

// The two flags are deliberately asymmetric, matching the database predicate.
test('a null flag never hides someone who never touched the setting', () => {
  const base = { id: 'c1', approval_status: 'approved' }
  assert.equal(canEmployerDiscoverCandidate({ ...base, profile_visible: null, stealth_mode: null }, NO_BLOCKS), true)
  assert.equal(canEmployerDiscoverCandidate({ ...base, profile_visible: false }, NO_BLOCKS), false)
  assert.equal(canEmployerDiscoverCandidate({ ...base, stealth_mode: false }, NO_BLOCKS), true)
})

test('approval and blocks still decide discovery as they always did', () => {
  const base = { id: 'c1', approval_status: 'approved', profile_visible: true }
  assert.equal(canEmployerDiscoverCandidate({ ...base, approval_status: 'pending' }, NO_BLOCKS), false)
  assert.equal(canEmployerDiscoverCandidate(base, new Set(['c1'])), false)
})

// Private Career Mode promises a first name and an initial, no photograph,
// and no CV until the professional accepts an introduction. That promise was
// kept in two routes and broken in three.
test('Private Career Mode anonymises name, photograph and CV', () => {
  const presented = presentCandidateForEmployer({
    id: 'c1',
    full_name: 'Alexandra Whitmore-Hunt',
    profile_image_url: 'https://example.test/a.jpg',
    cv_url: '/api/files?bucket=talent-documents&path=u1/cv.pdf',
    private_mode: true,
  })
  assert.equal(presented.full_name, 'Alexandra W.')
  assert.equal(presented.profile_image_url, null)
  assert.equal(presented.cv_url, null)
  assert.equal(presented.private_mode, true)
})

test('an accepted introduction reveals the professional to that employer only', () => {
  const candidate = {
    id: 'c1',
    full_name: 'Alexandra Whitmore-Hunt',
    profile_image_url: 'https://example.test/a.jpg',
    cv_url: '/cv.pdf',
    private_mode: true,
  }
  const revealed = presentCandidateForEmployer(candidate, true)
  assert.equal(revealed.full_name, 'Alexandra Whitmore-Hunt')
  assert.equal(revealed.profile_image_url, 'https://example.test/a.jpg')
  assert.equal(revealed.cv_url, '/cv.pdf')
})

test('first-name-only is honoured independently of Private Career Mode', () => {
  const presented = presentCandidateForEmployer({
    id: 'c1', full_name: 'Priya Raman', show_first_name_only: true, profile_image_url: 'x', cv_url: 'y',
  })
  assert.equal(presented.full_name, 'Priya R.')
  // Only the name is withheld - this is not the full private mode.
  assert.equal(presented.profile_image_url, 'x')
  assert.equal(presented.cv_url, 'y')
})

test('a professional who has asked for nothing is shown as they are', () => {
  const presented = presentCandidateForEmployer({ id: 'c1', full_name: 'Sam Doyle', profile_image_url: 'x', cv_url: 'y' })
  assert.equal(presented.full_name, 'Sam Doyle')
  assert.equal(presented.profile_image_url, 'x')
  assert.equal(presented.cv_url, 'y')
})

// The swipe route put the real name into the employer's notification inbox,
// which defeats the anonymisation entirely.
test('notifications never name a private professional', () => {
  assert.equal(candidateNameForEmployer({ full_name: 'Alexandra Whitmore-Hunt', private_mode: true }), 'Alexandra W.')
  assert.equal(candidateNameForEmployer({ full_name: 'Alexandra Whitmore-Hunt', private_mode: true }, true), 'Alexandra Whitmore-Hunt')
  assert.equal(candidateNameForEmployer({ full_name: 'Sam Doyle' }), 'Sam Doyle')
  assert.equal(candidateNameForEmployer({ full_name: null }), 'A WHC professional')
})

test('anonymisation handles the awkward names as well as the easy ones', () => {
  assert.equal(anonymiseDisplayName('Cher'), 'Cher')
  assert.equal(anonymiseDisplayName('  '), 'WHC professional')
  assert.equal(anonymiseDisplayName(null), 'WHC professional')
  assert.equal(anonymiseDisplayName('mary jane o\'brien'), 'mary O.')
})
