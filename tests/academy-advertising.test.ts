import test from 'node:test'
import assert from 'node:assert/strict'
import { AD_PLACEMENTS, isAdPlacement } from '../src/lib/advertising.ts'

test('sponsored advert locations have the agreed monthly prices', () => {
  assert.equal(AD_PLACEMENTS.homepage_spotlight.monthlyPence, 40000)
  assert.equal(AD_PLACEMENTS.academy_sponsor.monthlyPence, 25000)
  assert.equal(AD_PLACEMENTS.jobs_talent_sponsor.monthlyPence, 30000)
})

test('only configured advert locations are accepted', () => {
  assert.equal(isAdPlacement('homepage_spotlight'), true)
  assert.equal(isAdPlacement('homepage_banner'), false)
  assert.equal(isAdPlacement('attacker_location'), false)
})
