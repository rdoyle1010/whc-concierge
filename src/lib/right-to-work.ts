// Right to work, done the way that counts.
//
// Storing an uploaded document and marking it "verified" is not a right-to-work
// check. It records that somebody sent a file. Only three methods give a
// statutory excuse against a civil penalty, and a PDF in a bucket is none of
// them:
//
//   1. a manual check of original documents, in person or over live video
//   2. the Home Office online service, using a share code
//   3. identity document validation through a certified provider (IDSP), for
//      British and Irish passport holders
//
// The share code is the right one for a platform. The professional generates it
// at gov.uk/prove-right-to-work; the checker views the result at the URL below
// and records what it said. What gets stored is the code, the date, who looked
// and the outcome - not the person's immigration documents, which are about the
// most sensitive thing a spa platform could be holding.
//
// This module is deliberately not a legal opinion. Which of the three applies,
// and whether the duty falls on Talent House or on the property, depends on whether a
// given engagement makes Talent House the employment business - and that is a question
// for a solicitor, not for a comment in a file.

export const HOME_OFFICE_CHECK_URL = 'https://www.gov.uk/view-right-to-work'
export const SHARE_CODE_URL = 'https://www.gov.uk/prove-right-to-work'

export type RtwMethod = 'share_code' | 'passport' | 'idsp'

export const RTW_METHODS: { value: RtwMethod; label: string; hint: string }[] = [
  {
    value: 'share_code',
    label: 'Home Office share code',
    hint: 'For anyone with an eVisa, settled or pre-settled status, or a biometric residence permit.',
  },
  {
    value: 'passport',
    label: 'British or Irish passport',
    hint: 'Checked manually against the original document, or through a certified identity provider.',
  },
  {
    value: 'idsp',
    label: 'Certified identity provider',
    hint: 'A digital identity check carried out by a certified IDSP.',
  },
]

// Nine alphanumeric characters. Formatted with spaces on gov.uk, which people
// copy across, so the spaces come out before anything else looks at it.
const SHARE_CODE = /^[A-Za-z0-9]{9}$/

export function normaliseShareCode(input: string): string {
  return (input || '').replace(/[\s-]/g, '').toUpperCase()
}

export function isValidShareCode(input: string): boolean {
  return SHARE_CODE.test(normaliseShareCode(input))
}

/** The gov.uk page a checker opens to see the result for a given code. */
export function checkUrlFor(shareCode: string): string {
  return `${HOME_OFFICE_CHECK_URL}?shareCode=${encodeURIComponent(normaliseShareCode(shareCode))}`
}

export type RtwRecord = {
  right_to_work_method?: string | null
  right_to_work_share_code?: string | null
  right_to_work_status?: string | null
  right_to_work_verified_at?: string | null
  right_to_work_expiry_date?: string | null
}

/**
 * Whether a check has actually been carried out, as opposed to a professional
 * having supplied something to check.
 *
 * The distinction is the entire point: supplying a share code is the
 * professional's half, and it is not evidence of anything until somebody has
 * opened the Home Office page and recorded what it said.
 */
export function hasBeenChecked(record: RtwRecord): boolean {
  return record.right_to_work_status === 'approved' && Boolean(record.right_to_work_verified_at)
}

/**
 * True when a time-limited permission needs looking at again.
 *
 * Permission that expires has to be re-checked before it lapses, or the
 * statutory excuse goes with it. Thirty days is enough notice to chase somebody
 * without being so early that it gets ignored.
 */
export function needsRecheck(record: RtwRecord, now = new Date()): boolean {
  if (!record.right_to_work_expiry_date) return false
  const expiry = new Date(record.right_to_work_expiry_date)
  if (Number.isNaN(expiry.getTime())) return false
  const days = (expiry.getTime() - now.getTime()) / 86_400_000
  return days <= 30
}
