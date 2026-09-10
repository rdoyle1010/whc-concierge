export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export function minutes(value: string): number | null {
  const match = TIME_RE.exec(value)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

export function validShiftWindow(date: string, start: string, end: string) {
  const startMinutes = minutes(start)
  const endMinutes = minutes(end)
  return DATE_RE.test(date) && startMinutes != null && endMinutes != null && startMinutes < endMinutes
}

export function windowCovers(start: string, end: string, requestedStart: string, requestedEnd: string) {
  const values = [start, end, requestedStart, requestedEnd].map(minutes)
  if (values.some(value => value == null)) return false
  return values[0]! <= values[2]! && values[1]! >= values[3]!
}

export function windowsOverlap(start: string, end: string, otherStart: string, otherEnd: string) {
  const values = [start, end, otherStart, otherEnd].map(minutes)
  if (values.some(value => value == null)) return false
  return values[0]! < values[3]! && values[2]! < values[1]!
}

export function shiftHours(start: string, end: string) {
  const startMinutes = minutes(start)
  const endMinutes = minutes(end)
  return startMinutes == null || endMinutes == null || endMinutes <= startMinutes ? null : (endMinutes - startMinutes) / 60
}

/**
 * Today's date in London, as the shift_date column stores it.
 *
 * A shift is booked, cancelled, reviewed and paid against a British calendar
 * day, and the server runs on UTC. In British Summer Time London is an hour
 * ahead, so between midnight and one in the morning the UTC date is still
 * yesterday: a shift that has finished reads as future, a cancellation that
 * should have been late is treated as early, and the review nudge for a shift
 * worked today does not go out until tomorrow.
 *
 * en-CA is not an affectation - it is the locale that formats a date as
 * YYYY-MM-DD, which is exactly what the column holds and what a string
 * comparison against it needs.
 *
 * There were two copies of this written inline and one place using the UTC
 * date instead, which is how a rule ends up applying differently depending on
 * which screen you came from.
 */
export function londonToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

/** A London date offset by whole days, for windows either side of today. */
export function londonDateOffset(days: number): string {
  const at = new Date(Date.now() + days * 86400000)
  return at.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}
