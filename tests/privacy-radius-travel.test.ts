import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canEmployerDiscoverCandidate,
  mutualRadiusResult,
  travelAccessSummary,
} from '../src/lib/discovery.ts'

test('blocked employers cannot discover a talent profile', () => {
  const candidate = { id: 'candidate-1', approval_status: 'approved', profile_visible: true }
  assert.equal(canEmployerDiscoverCandidate(candidate, new Set(['candidate-1'])), false)
  assert.equal(canEmployerDiscoverCandidate(candidate, new Set()), true)
})

test('profile visibility is enforced independently of stealth wording', () => {
  const hidden = { id: 'candidate-1', approval_status: 'approved', profile_visible: false }
  assert.equal(canEmployerDiscoverCandidate(hidden, new Set()), false)
})

test('distance must fit both employer search and talent travel radii', () => {
  const origin = { latitude: 51.5, longitude: -0.1 }
  const candidate = {
    id: 'candidate-1', approval_status: 'approved', profile_visible: true,
    latitude: 51.6, longitude: -0.1, travel_radius_miles: 10,
  }
  assert.equal(mutualRadiusResult(origin, candidate, 15).withinRadius, true)
  assert.equal(mutualRadiusResult(origin, candidate, 5).withinRadius, false)
  assert.equal(mutualRadiusResult(origin, candidate, null).withinRadius, true)
})

test('UK-wide employer search still respects the talent travel radius', () => {
  const result = mutualRadiusResult({ latitude: 51.5, longitude: -0.1 }, {
    id: 'candidate-1', approval_status: 'approved', profile_visible: true,
    latitude: 52.5, longitude: -0.1, travel_radius_miles: 10,
  }, null)
  assert.equal(result.withinRadius, false)
  assert.equal(result.reason, 'outside_talent_radius')
})

test('a radius search excludes profiles without a usable location', () => {
  const result = mutualRadiusResult({ latitude: 51.5, longitude: -0.1 }, {
    id: 'candidate-1', approval_status: 'approved', latitude: null, longitude: null,
  }, 25)
  assert.equal(result.withinRadius, false)
  assert.equal(result.reason, 'location_required')
})

test('a talent travel radius requires both locations even in a UK-wide search', () => {
  const result = mutualRadiusResult({ latitude: null, longitude: null }, {
    id: 'candidate-1', approval_status: 'approved', latitude: 51.5, longitude: -0.1,
    travel_radius_miles: 25,
  }, null)
  assert.equal(result.withinRadius, false)
  assert.equal(result.reason, 'location_required')
})

test('travel summary distinguishes public transport, parking and taxi support', () => {
  assert.deepEqual(travelAccessSummary({
    nearest_transport: 'Green Park Underground',
    transport_walk_minutes: 7,
    parking_available: true,
    taxi_support: true,
    taxi_notes: 'Taxi home after late shifts',
  }), [
    'Nearest public transport: Green Park Underground (7 min walk)',
    'Parking is available',
    'Taxi home after late shifts',
  ])
})
