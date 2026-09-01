// Agency shift money, computed in integers only.
//
// Why this file exists. Shift pricing used to be done in floating-point
// pounds: `rate * hours` for the gross, `gross * feePct` for the fee, and
// `total * 100` for the Stripe amount. Two things went wrong with that.
//
//   1. A shift that is not a whole number of quarter-hours produces a
//      non-integer pence amount. A 09:00-17:10 shift at £35/hr gives
//      8.1666... hours, £285.8333... gross and a unit_amount of
//      32883.3333..., which Stripe rejects outright with "Invalid integer".
//      The property could not pay at all and the booking stuck at accepted.
//   2. IEEE-754 makes 0.10 + 0.05 = 0.15000000000000002, so an Agency Plus
//      urgent shift on a £100 gross produced Math.ceil(15.000000000000002)
//      = £16 rather than £15. Exactly the customers paying £99/month for a
//      reduced fee were the ones being overcharged.
//
// Everything here is therefore integer arithmetic: pence for money, basis
// points for percentages. No float ever reaches a Stripe amount or a stored
// figure.
//
// Nothing about the commercial model changes. The property pays gross + fee.
// The professional receives 100% of the agreed shift value.

export const AGENCY_FEE_BPS_STANDARD = 1500 // 15%
export const AGENCY_FEE_BPS_PLUS = 1000     // 10% - the Agency Plus benefit
export const AGENCY_URGENT_SURCHARGE_BPS = 500 // +5% for same-day or next-day cover

export const DEFAULT_SHIFT_HOURS = 8

// The WHC fee in basis points for a shift, judged by how close the shift date
// is to today (both YYYY-MM-DD, Europe/London). Same-day or next-day carries
// the urgency premium, for everyone - it prices the emergency, not the
// relationship. Integer addition, so no float drift.
export function agencyFeeBpsForShift(
  shiftDate: string | null | undefined,
  todayLondon: string,
  plusActive: boolean,
): number {
  const base = plusActive ? AGENCY_FEE_BPS_PLUS : AGENCY_FEE_BPS_STANDARD
  if (!shiftDate || !todayLondon) return base
  const day = new Date(`${todayLondon}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() + 1)
  const tomorrow = day.toISOString().slice(0, 10)
  return String(shiftDate) <= tomorrow ? base + AGENCY_URGENT_SURCHARGE_BPS : base
}

export type AgencyShiftMoney = {
  hours: number
  grossPence: number
  feePence: number
  totalPence: number
  /** Whole pounds, for the integer `platform_fee` column. */
  feePounds: number
  /** Pounds with pence, for display and for the money columns. */
  grossPounds: number
  totalPounds: number
  feeBps: number
}

function toPence(pounds: number | null | undefined): number {
  return Math.round((Number(pounds) || 0) * 100)
}

/**
 * The single place a shift's money is worked out.
 *
 * `storedFeePounds` is the fee already agreed on the booking. When a booking
 * carries one it always wins, so re-pricing an accepted shift can never move
 * the number the two parties agreed to. Only a booking with no fee yet is
 * priced from `feeBps`.
 */
export function agencyShiftMoney(input: {
  ratePounds: number | null | undefined
  hours: number | null | undefined
  storedFeePounds?: number | null
  feeBps?: number
}): AgencyShiftMoney {
  const hours = input.hours && input.hours > 0 ? input.hours : DEFAULT_SHIFT_HOURS
  const feeBps = typeof input.feeBps === 'number' && input.feeBps >= 0 ? input.feeBps : AGENCY_FEE_BPS_STANDARD

  // Pence per hour first, then multiply - so a fractional hour count only
  // ever rounds once, at the end.
  const ratePence = toPence(input.ratePounds)
  const grossPence = Math.round(ratePence * hours)

  // The fee column is whole pounds, so the fee rounds up to the pound. A
  // stored fee is honoured exactly as agreed.
  const feePounds = input.storedFeePounds && Number(input.storedFeePounds) > 0
    ? Math.round(Number(input.storedFeePounds))
    : Math.ceil((grossPence * feeBps) / 1_000_000)
  const feePence = feePounds * 100

  const totalPence = grossPence + feePence

  return {
    hours,
    grossPence,
    feePence,
    totalPence,
    feePounds,
    grossPounds: grossPence / 100,
    totalPounds: totalPence / 100,
    feeBps,
  }
}

/** Pence to a plain "123.45" string, for money columns and display. */
export function penceToPounds(pence: number): number {
  return Math.round(Number(pence) || 0) / 100
}

/** "£285.83" - never "£285.8333333333333". */
export function formatPence(pence: number): string {
  return `£${(Math.round(Number(pence) || 0) / 100).toFixed(2)}`
}

/** Basis points as a human percentage: 1500 -> "15", 2000 -> "20". */
export function bpsToPercentLabel(bps: number): string {
  const pct = (Number(bps) || 0) / 100
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(1)
}
