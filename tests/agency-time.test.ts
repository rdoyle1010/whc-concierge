import assert from 'node:assert/strict'
import test from 'node:test'
import { validShiftWindow, windowCovers, windowsOverlap } from '../src/lib/agency-time.ts'

test('validates same-day London shift windows', () => {
  assert.equal(validShiftWindow('2026-08-20', '09:00', '17:00'), true)
  assert.equal(validShiftWindow('2026-08-20', '17:00', '09:00'), false)
  assert.equal(validShiftWindow('bad', '09:00', '17:00'), false)
})

test('requires availability to cover the complete shift', () => {
  assert.equal(windowCovers('08:00', '18:00', '09:00', '17:00'), true)
  assert.equal(windowCovers('10:00', '18:00', '09:00', '17:00'), false)
})

test('adjacent shifts do not overlap', () => {
  assert.equal(windowsOverlap('09:00', '13:00', '12:00', '14:00'), true)
  assert.equal(windowsOverlap('09:00', '13:00', '13:00', '17:00'), false)
})
