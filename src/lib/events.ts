// Events: what is on, and who is allowed to see it.

export const EVENT_KINDS = [
  { value: 'launch', label: 'Brand launch' },
  { value: 'masterclass', label: 'Masterclass' },
  { value: 'training', label: 'Product house training' },
  { value: 'trade_show', label: 'Trade show' },
  { value: 'networking', label: 'Networking' },
  { value: 'awards', label: 'Awards' },
  { value: 'other', label: 'Other' },
] as const

export type EventKind = typeof EVENT_KINDS[number]['value']

export type SpaEvent = {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string | null
  kind: EventKind
  host: string | null
  location: string | null
  is_online: boolean
  starts_at: string
  ends_at: string | null
  booking_url: string | null
  image_url: string | null
  members_only: boolean
  is_published: boolean
  announced_at: string | null
}

export function eventKindLabel(kind: string): string {
  return EVENT_KINDS.find(entry => entry.value === kind)?.label || 'Event'
}

export function isEventKind(value: unknown): value is EventKind {
  return EVENT_KINDS.some(entry => entry.value === value)
}

/**
 * A URL-safe slug from a title, with the year kept so next season's running of
 * the same event does not collide with this one.
 */
export function eventSlug(title: string, startsAt: string): string {
  const base = String(title || 'event').toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'event'
  const year = new Date(startsAt).getFullYear()
  return Number.isFinite(year) ? `${base}-${year}` : base
}

/**
 * How an event's date reads to a person.
 *
 * A one-day event is one date. A run of days is a range, and where both fall
 * in the same month the month is said once, because "12 to 14 October" is how
 * anybody would write it and "12 October to 14 October" is how a database
 * would.
 */
export function eventDateLabel(startsAt: string, endsAt?: string | null): string {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return ''
  const dayMonthYear = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  if (!endsAt) return dayMonthYear(start)
  const end = new Date(endsAt)
  if (Number.isNaN(end.getTime())) return dayMonthYear(start)
  if (start.toDateString() === end.toDateString()) return dayMonthYear(start)

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    return `${start.toLocaleDateString('en-GB', { day: 'numeric' })} to ${dayMonthYear(end)}`
  }
  const sameYear = start.getFullYear() === end.getFullYear()
  const startLabel = sameYear
    ? start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : dayMonthYear(start)
  return `${startLabel} to ${dayMonthYear(end)}`
}

/** Where it is, in one phrase. */
export function eventWhereLabel(event: Pick<SpaEvent, 'is_online' | 'location'>): string {
  if (event.is_online) return 'Online'
  return event.location || 'Location to be confirmed'
}

/** Still worth showing: anything that has not finished yet. */
export function isUpcoming(event: Pick<SpaEvent, 'starts_at' | 'ends_at'>, now = new Date()): boolean {
  const end = event.ends_at ? new Date(event.ends_at) : new Date(event.starts_at)
  if (Number.isNaN(end.getTime())) return false
  // An event runs until the end of its last day rather than to midnight at
  // its start, so today's trade show is not filed under history at 00:01.
  end.setHours(23, 59, 59, 999)
  return end.getTime() >= now.getTime()
}
