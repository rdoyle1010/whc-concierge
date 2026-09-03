// The VAT registration threshold, and the two readings of turnover that could
// take Rebecca over it.
//
// On an agency shift a property pays the whole amount and the professional is
// paid out of it. Whether that whole amount is turnover depends on which of
// two things WHC is:
//
//   Agent (an employment agency)      - introduces the professional, who is
//                                       engaged by the property. Turnover is
//                                       the commission only.
//   Principal (an employment business) - supplies the professional, who is
//                                       engaged by WHC. Turnover is the whole
//                                       charge, therapist's pay included.
//
// The gap is roughly seven times, so the same trading year sits either
// comfortably below the threshold or well over it. Registering late is the
// expensive mistake: VAT is owed on sales already made, and a property cannot
// be sent a bill for it a year afterwards, so it comes out of margin.
//
// This file does not decide which reading applies - only an accountant, on the
// facts of the contracts, can. It shows both so the question gets asked while
// there is still time to answer it.

// £90,000 since April 2024. Held here rather than typed into a page so that a
// change to it is one edit, and confirm it against gov.uk before relying on it.
export const VAT_THRESHOLD_PENCE = 9_000_000

export type TurnoverReading = {
  /** Money that is turnover under either reading: WHC's own products. */
  ownProductsPence: number
  /** Commission retained on pass-through bookings. */
  commissionPence: number
  /** The full value of pass-through bookings, professionals' pay included. */
  passThroughGrossPence: number
}

export type ThresholdView = {
  label: string
  turnoverPence: number
  headroomPence: number
  pctOfThreshold: number
  over: boolean
}

export function asAgent(reading: TurnoverReading): number {
  return reading.ownProductsPence + reading.commissionPence
}

export function asPrincipal(reading: TurnoverReading): number {
  return reading.ownProductsPence + reading.passThroughGrossPence
}

function view(label: string, turnoverPence: number): ThresholdView {
  return {
    label,
    turnoverPence,
    headroomPence: VAT_THRESHOLD_PENCE - turnoverPence,
    pctOfThreshold: VAT_THRESHOLD_PENCE > 0 ? Math.round((turnoverPence / VAT_THRESHOLD_PENCE) * 100) : 0,
    over: turnoverPence >= VAT_THRESHOLD_PENCE,
  }
}

export function thresholdViews(reading: TurnoverReading): { agent: ThresholdView; principal: ThresholdView } {
  return {
    agent: view('As agent - commission only', asAgent(reading)),
    principal: view('As principal - full booking value', asPrincipal(reading)),
  }
}

/**
 * Months until this reading crosses the threshold at the run rate of the last
 * three months. Null when it is already over, or when nothing has been taken
 * recently and a projection would be invented rather than measured.
 */
export function monthsToThreshold(turnoverPence: number, lastThreeMonthsPence: number): number | null {
  if (turnoverPence >= VAT_THRESHOLD_PENCE) return null
  const monthly = lastThreeMonthsPence / 3
  if (monthly <= 0) return null
  return Math.max(0, Math.floor((VAT_THRESHOLD_PENCE - turnoverPence) / monthly))
}

/**
 * The threshold test is a rolling twelve months, not a tax year - a common and
 * costly misreading, because a strong summer can take a business over in
 * September while the year-to-date figure still looks safe.
 */
export function rollingWindowStart(now = new Date()): string {
  const start = new Date(now)
  start.setMonth(start.getMonth() - 12)
  return start.toISOString()
}
