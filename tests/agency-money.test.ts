import test from 'node:test'
import assert from 'node:assert/strict'
import {
  agencyShiftMoney,
  agencyFeeBpsForShift,
  AGENCY_FEE_BPS_STANDARD,
  AGENCY_FEE_BPS_PLUS,
  AGENCY_URGENT_SURCHARGE_BPS,
  formatPence,
  bpsToPercentLabel,
} from '../src/lib/agency-money'

// The bug that stopped properties paying at all: a shift that is not a whole
// number of quarter-hours produced a fractional pence amount, and Stripe
// refuses a non-integer unit_amount outright.
test('every Stripe amount is an integer number of pence, whatever the shift length', () => {
  // 06:00 to 23:00 at one-minute granularity, which is the range the shift
  // form actually allows.
  for (let minutes = 30; minutes <= 17 * 60; minutes += 1) {
    for (const rate of [18, 20.5, 22, 27.75, 35, 42.5]) {
      const money = agencyShiftMoney({ ratePounds: rate, hours: minutes / 60 })
      assert.ok(Number.isInteger(money.grossPence), `gross not integer for ${minutes}m at £${rate}`)
      assert.ok(Number.isInteger(money.feePence), `fee not integer for ${minutes}m at £${rate}`)
      assert.ok(Number.isInteger(money.totalPence), `total not integer for ${minutes}m at £${rate}`)
      assert.ok(money.totalPence >= money.grossPence)
    }
  }
})

test('the 09:00 to 17:10 shift at £35 that Stripe used to reject', () => {
  const money = agencyShiftMoney({ ratePounds: 35, hours: 490 / 60 })
  assert.equal(money.grossPence, 28583)
  assert.ok(Number.isInteger(money.totalPence))
})

// The Agency Plus overcharge: 0.10 + 0.05 is 0.15000000000000002 in floating
// point, so Math.ceil turned a £15 fee into £16 on one gross in twenty -
// always for the customer paying £99 a month to be charged less.
test('an Agency Plus urgent shift is never overcharged by rounding', () => {
  const bps = AGENCY_FEE_BPS_PLUS + AGENCY_URGENT_SURCHARGE_BPS
  for (let gross = 20; gross <= 2000; gross += 20) {
    const money = agencyShiftMoney({ ratePounds: gross, hours: 1, feeBps: bps })
    assert.equal(money.feePounds, gross * 0.15, `£${gross} gross should attract a £${gross * 0.15} fee`)
  }
})

test('a fee already agreed on a booking is never recalculated', () => {
  const money = agencyShiftMoney({ ratePounds: 30, hours: 8, storedFeePounds: 12, feeBps: AGENCY_FEE_BPS_STANDARD })
  assert.equal(money.feePounds, 12)
  assert.equal(money.totalPence, 24000 + 1200)
})

test('a shift with no recorded hours falls back to eight, as it always has', () => {
  assert.equal(agencyShiftMoney({ ratePounds: 25, hours: null }).hours, 8)
  assert.equal(agencyShiftMoney({ ratePounds: 25, hours: 0 }).grossPence, 20000)
})

test('the professional always receives the full gross; the fee is on top', () => {
  const money = agencyShiftMoney({ ratePounds: 22, hours: 7.5 })
  assert.equal(money.grossPence, 16500)
  assert.equal(money.totalPence, money.grossPence + money.feePence)
})

test('urgency is priced for everyone, the reduced base only for Agency Plus', () => {
  const today = '2026-09-01'
  assert.equal(agencyFeeBpsForShift('2026-09-20', today, false), AGENCY_FEE_BPS_STANDARD)
  assert.equal(agencyFeeBpsForShift('2026-09-20', today, true), AGENCY_FEE_BPS_PLUS)
  assert.equal(agencyFeeBpsForShift('2026-09-01', today, false), AGENCY_FEE_BPS_STANDARD + AGENCY_URGENT_SURCHARGE_BPS)
  assert.equal(agencyFeeBpsForShift('2026-09-02', today, true), AGENCY_FEE_BPS_PLUS + AGENCY_URGENT_SURCHARGE_BPS)
})

test('money is displayed to the penny, never as a recurring decimal', () => {
  assert.equal(formatPence(28583), '£285.83')
  assert.equal(formatPence(0), '£0.00')
  assert.equal(bpsToPercentLabel(1500), '15')
  assert.equal(bpsToPercentLabel(1000), '10')
  assert.equal(bpsToPercentLabel(2000), '20')
})
