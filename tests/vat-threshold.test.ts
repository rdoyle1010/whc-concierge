import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  VAT_THRESHOLD_PENCE, asAgent, asPrincipal, thresholdViews, monthsToThreshold, rollingWindowStart,
} from '../src/lib/vat-threshold'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// The whole point of the panel: the same trading year reads very differently
// depending on which side of the agent/principal line WHC sits.
test('the two readings of the same year are far apart', () => {
  const reading = { ownProductsPence: 1_200_000, commissionPence: 900_000, passThroughGrossPence: 6_000_000 }
  assert.equal(asAgent(reading), 2_100_000)
  assert.equal(asPrincipal(reading), 7_200_000)
  const views = thresholdViews(reading)
  assert.equal(views.agent.over, false)
  assert.equal(views.principal.over, false)
  assert.equal(views.principal.pctOfThreshold, 80, 'the principal reading is already inside the warning band')
  assert.equal(views.agent.headroomPence, VAT_THRESHOLD_PENCE - 2_100_000)
})

test('crossing the threshold is reported, not softened', () => {
  const over = thresholdViews({ ownProductsPence: 0, commissionPence: 0, passThroughGrossPence: 9_500_000 })
  assert.equal(over.principal.over, true)
  assert.ok(over.principal.headroomPence < 0, 'headroom goes negative rather than clamping to zero')
})

// A projection built on no trading would be invented rather than measured.
test('the projection stays silent when there is nothing to project from', () => {
  assert.equal(monthsToThreshold(1_000_000, 0), null)
  assert.equal(monthsToThreshold(VAT_THRESHOLD_PENCE, 500_000), null, 'already over needs no countdown')
  // £80k turnover, £3k a month run rate over three months = £1k a month.
  assert.equal(monthsToThreshold(8_000_000, 300_000), 10)
})

// The test is a rolling twelve months. Reading it as a tax year is the common
// and expensive mistake, because a strong summer crosses it mid-year.
test('the window is a rolling twelve months, not a tax year', () => {
  const start = new Date(rollingWindowStart(new Date('2026-09-03T00:00:00Z')))
  assert.equal(start.toISOString().slice(0, 7), '2025-09')
  const lib = read('src/lib/vat-threshold.ts')
  assert.match(lib, /rolling twelve months, not a tax year/, 'the reason has to travel with the code')
})

// The booking tables store pounds and course_enrollments stores pence. Mixing
// them misreads the threshold by a factor of a hundred, in the direction that
// says everything is fine.
test('pounds and pence are not mixed in the exposure figures', () => {
  const route = read('src/app/api/admin/vat-exposure/route.ts')
  assert.match(route, /already pence; the booking tables store\s*\n?\s*\/\/\s*pounds/, 'the unit difference must be written down')
  const own = route.slice(route.indexOf('const ownProductsPence'), route.indexOf('const commissionPence'))
  assert.ok(!own.includes('toPence('), 'ledger and academy amounts are already pence')
  const commission = route.slice(route.indexOf('const commissionPence'), route.indexOf('const passThroughGrossPence'))
  assert.match(commission, /toPence\(/, 'booking amounts are pounds and must be converted')
})

// Money that did not stay is not turnover under either reading.
test('cancelled and refunded bookings are left out', () => {
  const route = read('src/app/api/admin/vat-exposure/route.ts')
  for (const status of ['cancelled', 'refunded', 'disputed']) {
    assert.ok(route.includes(`'${status}'`), `${status} bookings must be excluded`)
  }
  assert.match(route, /pounds\(row\.refund_amount\)/, 'partial refunds come off the gross too')
})

// This figure prompts a question for an accountant. It must not read as an
// answer to one.
test('the panel does not present itself as a VAT return', () => {
  const panel = read('src/components/VatExposurePanel.tsx')
  assert.match(panel, /your accountant decides which reading applies/)
  assert.match(panel, /not a VAT return/)
})

// A substring attribute selector matches more than it names: [class*="bg-amber-50"]
// also catches bg-amber-500, which was quietly repainted near-white and
// disappeared into the card behind it.
test('portal colour overrides match whole classes, not prefixes', () => {
  // Comments are stripped first: the note explaining the bug names the very
  // selector the assertion is looking for.
  const css = read('src/app/portal-clean.css').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(!/\[class\*="bg-(amber|yellow)-50"\]/.test(css),
    'a tint override must not match darker shades of the same colour by prefix')
  assert.match(css, /\[class~="bg-amber-50"\]/, 'the pale tint is matched exactly')
})

// Grey is the brand colour and the portal strips amber and yellow back out, so
// a panel that signals through those colours signals nothing.
test('the panel warns within the brand rather than with a colour that is stripped', () => {
  // Line comments stripped: the note above the component explains why amber is
  // avoided, and naming it there is not using it.
  const panel = read('src/components/VatExposurePanel.tsx').replace(/^\s*\/\/.*$/gm, '')
  assert.ok(!/(amber|yellow)-\d/.test(panel), 'no amber or yellow class inside a portal panel')
  assert.match(panel, /'Over' : 'Close'/, 'the warning state has to be readable without colour')
})
