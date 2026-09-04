// Data retention policy (1 September 2026).
//
// Every period Talent House applies to personal data lives here, in one place, so the
// privacy policy, the admin panel and the sweep route cannot drift apart.
// Changing a number here changes the policy everywhere it is stated or run.
//
// FINANCIAL AND STATUTORY RECORDS ARE DELIBERATELY ABSENT FROM THIS LIST.
// agency_bookings, residency_bookings, commercial_purchases, course_enrollments,
// placements and salary_records carry amounts, payment references and hire
// outcomes. UK company and tax law (Companies Act 2006 s388 and the Finance
// Act record-keeping rules) requires those to be kept for six years from the
// end of the accounting period they fall in, so the retention sweep never
// touches them. They are anonymised on account deletion instead - the link to
// the person is removed and the money and dates survive.

export type RetentionAction = 'delete' | 'clear'

export type RetentionCategory = {
  /** Stable key used by the API response and the retention_runs summary. */
  key: string
  /** Plain-English name shown in the admin panel and the privacy policy. */
  label: string
  /** Retention period in whole months. */
  months: number
  /** Human wording for the period, e.g. "13 months". */
  period: string
  /** What the sweep does to a row that is past its period. */
  action: RetentionAction
  /** Why the period is what it is - shown to the admin, quoted in the policy. */
  reason: string
}

const MONTH = (months: number) => (months === 1 ? '1 month' : `${months} months`)

export const RETENTION_CATEGORIES: RetentionCategory[] = [
  {
    key: 'analytics_events',
    label: 'Behavioural analytics events',
    months: 13,
    period: MONTH(13),
    action: 'delete',
    reason: 'Job views, profile views and other server-side activity records. Thirteen months allows a full year-on-year comparison and no more.',
  },
  {
    key: 'notifications',
    label: 'In-app notifications',
    months: 12,
    period: MONTH(12),
    action: 'delete',
    reason: 'Delivered notifications stop being useful to the recipient long before a year passes.',
  },
  {
    key: 'contact_queries',
    label: 'Contact and complaint enquiries',
    months: 12,
    period: MONTH(12),
    action: 'delete',
    reason: 'Answered enquiries are kept for a year so a follow-up can be traced, then removed.',
  },
  {
    key: 'marketing_confirmation_tokens',
    label: 'Used or expired marketing confirmation tokens',
    months: 1,
    period: '30 days',
    action: 'delete',
    reason: 'A double opt-in token is spent once. The consent itself is recorded separately in the consent ledger.',
  },
  {
    key: 'newsletter_confirmation_tokens',
    label: 'Expired newsletter confirmation tokens',
    months: 1,
    period: '30 days',
    action: 'clear',
    reason: 'An unconfirmed newsletter token that has expired can never be used again, so the credential is cleared from the subscriber row.',
  },
  {
    key: 'applications',
    label: 'Job applications with no activity',
    months: 24,
    period: '24 months after the last activity',
    action: 'delete',
    reason: 'Two years covers the practical limit for a recruitment dispute or discrimination claim.',
  },
  {
    key: 'messages',
    label: 'Platform messages',
    months: 24,
    period: '24 months after the last activity',
    action: 'delete',
    reason: 'Message threads are kept for the same two years as the applications they usually accompany.',
  },
  {
    key: 'verification_rows',
    label: 'Verification records for closed accounts',
    months: 12,
    period: '12 months after the account is closed',
    action: 'delete',
    reason: 'Right-to-work and certificate evidence left behind by a closed account. The documents themselves are removed at the moment of deletion; this clears the rows that referenced them.',
  },
]

export const RETENTION_BY_KEY: Record<string, RetentionCategory> = Object.fromEntries(
  RETENTION_CATEGORIES.map(category => [category.key, category]),
)

/** Thirty-day periods are expressed as one month above; this keeps them exact. */
const EXACT_DAYS: Record<string, number> = {
  marketing_confirmation_tokens: 30,
  newsletter_confirmation_tokens: 30,
}

/** The ISO timestamp a row must be older than to fall out of retention. */
export function retentionCutoff(key: string, now: Date = new Date()): string {
  const category = RETENTION_BY_KEY[key]
  const cutoff = new Date(now.getTime())
  const days = EXACT_DAYS[key]
  if (days) cutoff.setUTCDate(cutoff.getUTCDate() - days)
  else cutoff.setUTCMonth(cutoff.getUTCMonth() - (category ? category.months : 12))
  return cutoff.toISOString()
}

/**
 * Tables the sweep must never touch, and the reason. Kept as data so the
 * admin panel can show the founder what is deliberately excluded rather than
 * leaving them to assume it was forgotten.
 */
export const RETENTION_EXCLUDED: { table: string; reason: string }[] = [
  { table: 'agency_bookings', reason: 'Financial record - statutory retention (six years).' },
  { table: 'residency_bookings', reason: 'Financial record - statutory retention (six years).' },
  { table: 'commercial_purchases', reason: 'Financial record - statutory retention (six years).' },
  { table: 'course_enrollments', reason: 'Paid enrolment and certificate record - statutory retention (six years).' },
  { table: 'placements', reason: 'Hire outcome record - statutory and contractual retention.' },
  { table: 'salary_records', reason: 'Salary provenance tied to placements - statutory retention.' },
  { table: 'consent_events', reason: 'Consent ledger - the evidence that consent was given or withdrawn must outlive the consent. Removed with the account when the account is deleted.' },
]
