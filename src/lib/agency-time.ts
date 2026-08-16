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
