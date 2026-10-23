import type { StatusTone } from './status-tone'

// How urgent is this, really?
//
// Every row in the Activity Centre rendered as the same grey bell. A
// counter-offer that expires in four hours, an insurance certificate lapsing
// tomorrow, and a badge being awarded all looked identical, so the list told
// somebody there were eight things and nothing about which one mattered.
//
// Sixty-three of the seventy-one notifications this platform sends are typed
// 'general', so the type cannot answer the question. The titles can: they are
// written by us, not by users, and they say plainly whether somebody is
// waiting on the reader.
//
//   action   red     somebody is waiting on you, or something is running out
//   waiting  amber   in motion, no move of yours needed yet
//   done     green   a good outcome, nothing to do
//   quiet    grey    information
//
// Ordered deliberately: a negation beats the good word inside it, so
// "Consultancy listing not approved" is not read as an approval.

const ACTION = [
  'urgent', 'expires', 'expiring', 'not approved', 'not filled', 'cancelled',
  'withdrawn', 'paused', 'issue raised', 'counter-offer', 'counter offer',
  'offer -', 'shift offer', 'agency offer', 'job offer', 'times requested',
  'details changed', 'time changed', 'reference request', 'complete your',
  'how was your shift', 'how did the shift go', 'action needed', 'declined',
  'rejected', 'failed', 'overdue', 'reopened',
]

const DONE = [
  'verified', 'approved', 'confirmed', 'awarded', 'earned', 'hired',
  'unlocked', 'now live', 'resolved', 'is ready', 'complete', 'completed',
  'payment received', 'received - booking', 'filled', 'shortlisted',
]

const WAITING = [
  'submitted', 'request received', 'interested in you', 'new message',
  'suggested a course', 'invitation', 'new match', 'pending',
]

const has = (text: string, needles: string[]) => needles.some(needle => text.includes(needle))

export function activityTone(type: string, title: string, message = ''): StatusTone {
  const text = `${title} ${message}`.toLowerCase()

  // A negation anywhere outranks the good word it negates.
  if (has(text, ACTION)) return 'action'
  if (type === 'new_message') return 'waiting'
  if (has(text, DONE)) return 'done'
  if (has(text, WAITING)) return 'waiting'
  return 'quiet'
}

// The word beside the row, because a colour nobody can name is decoration and
// a screenshot in a support thread has no colour at all.
export function activityWord(tone: StatusTone): string {
  if (tone === 'action') return 'Action'
  if (tone === 'waiting') return 'In progress'
  if (tone === 'done') return 'Done'
  return ''
}
