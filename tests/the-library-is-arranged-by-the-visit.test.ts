import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JOURNEY_STAGES, stageOf, kindOf, kindLabel, byJourney, countByStage } from '../src/lib/documents/journey'
import { sellableCatalogue } from '../src/lib/documents/catalogue'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('every document lands in exactly one stage, and none of them is empty', () => {
  const counts = countByStage(sellableCatalogue())
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  assert.equal(total, sellableCatalogue().length, 'nothing may be counted twice or lost')

  // A stage with nothing in it is a hole in the shelf: a buyer clicks
  // "Departure" and is told the library covers none of it.
  for (const stage of JOURNEY_STAGES) {
    assert.ok(counts[stage.slug] > 0, `${stage.label} has nothing in it`)
  }

  // And no single stage may swallow the library. Management is the biggest by
  // nature - systems, money, people and compliance really are most of a spa's
  // paperwork - but past about half, the arrangement has stopped sorting.
  assert.ok(counts.management < sellableCatalogue().length * 0.5,
    `management holds ${counts.management} of ${sellableCatalogue().length}`)
})

test('the obvious documents land where a person would look for them', () => {
  const cases: [string, string, string][] = [
    ['REC-CHECKIN-SOP-001', 'Guest Arrival and Check-In', 'arrival'],
    ['REC-BOOK-NEW-SOP-002', 'Take a New Booking by Telephone', 'pre-arrival'],
    ['THER-MASS-DELIV-SOP-197', 'Massage Service Delivery Standard', 'experience'],
    ['RTL-RETURNS-EXCHANGES-SOP-299', 'Retail Returns and Exchanges', 'departure'],
    ['MEM-COMPLAINTS-RECOVERY-SOP-180', 'Member Complaints and Service Recovery', 'post-departure'],
    ['FIN-DAILY-REVENUE-CLOSE-SOP-314', 'Daily Revenue Close and Reconciliation', 'management'],
    // A reference prefix wins over a word in the title: configuring a payment
    // gateway is not a departure procedure because it says payment.
    ['SYS-PAY-GATEWAY-SOP-139', 'Configure Payment Gateway Integration', 'management'],
    // And pre-opening is not pre-arrival.
    ['PRE-CRITICAL-PATH-SOP-411', 'Pre-Opening Critical Path and Milestone Control', 'management'],
  ]
  for (const [reference, title, expected] of cases) {
    assert.equal(stageOf({ reference, title }), expected, `${title} should be ${expected}`)
  }
})

test('the kind comes from the reference, which is the one part that is not a judgement', () => {
  assert.equal(kindOf('REC-CHECKIN-SOP-001'), 'SOP')
  assert.equal(kindOf('SPA-THERMAL-RA-013'), 'RA')
  assert.equal(kindOf('SPA-OPERATIONS-TRG-004'), 'TRG')
  assert.equal(kindLabel('SPA-OPERATIONS-EAP-002'), 'Emergency plan')
  // Anything unrecognised reads as a procedure rather than as a blank.
  assert.equal(kindLabel('SOMETHING-ODD-001'), 'Procedure')

  const grouped = byJourney(sellableCatalogue())
  assert.equal(grouped.length, JOURNEY_STAGES.length)
  for (const stage of grouped) {
    assert.equal(stage.kinds.reduce((sum, k) => sum + k.entries.length, 0), stage.entries.length)
  }
})

test('the shop and the library screen both browse by the visit, not by the opening', () => {
  for (const page of ['src/components/StandardsList.tsx', 'src/app/admin/documents/page.tsx']) {
    const source = body(page)
    assert.ok(source.includes('JOURNEY_STAGES'), `${page} offers the stages`)
    assert.ok(source.includes('kindOf('), `${page} offers the kinds`)
    // The old arrangement answered a question a property asks once, while it
    // is opening, and never again.
    assert.ok(!source.includes('TIER_LABEL'), `${page} still groups by opening tier`)
  }
})
