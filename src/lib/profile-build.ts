// "Send us your CV and we will do the rest."
//
// The wording somebody agrees to is stored with their request, because the
// only thing that makes building a stranger's profile defensible is that they
// asked for it in writing, in words they actually read. Change the wording
// here and old requests keep the wording they were given.

export const BUILD_CONSENT_WORDING =
  'I would like Talent House Collective to build my professional profile for me. '
  + 'I am happy for you to hold the CV and details I send, use them to fill in my profile, '
  + 'and sign in to my account to do it. Nothing will be visible to anybody else until I have '
  + 'seen it and said yes.'

export const BUILD_STATUSES = ['new', 'building', 'sent', 'done', 'declined'] as const
export type BuildStatus = typeof BUILD_STATUSES[number]

export const BUILD_STATUS_LABEL: Record<BuildStatus, string> = {
  new: 'Waiting on us',
  building: 'Being built',
  sent: 'Sent to them',
  done: 'Theirs now',
  declined: 'Not proceeding',
}

export function isBuildStatus(value: unknown): value is BuildStatus {
  return BUILD_STATUSES.includes(value as BuildStatus)
}

// A CV, not a photograph and not a video. Kept narrow because this is the one
// upload on the platform that happens before anybody has an account.
export const CV_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
export const CV_MAX_BYTES = 8 * 1024 * 1024

export function cvTypeAllowed(type: string | null | undefined): boolean {
  return CV_TYPES.has(String(type || ''))
}

/**
 * A storage path that cannot be steered by whatever the file was called.
 *
 * The original name is kept as a separate column for display; it never
 * reaches the path, because a filename is attacker-controlled and a path is
 * not a place to find that out.
 */
export function cvStoragePath(requestId: string, filename: string): string {
  const extension = String(filename || '').toLowerCase().match(/\.(pdf|docx?|doc)$/)?.[0] || '.pdf'
  return `build-requests/${requestId}/cv${extension}`
}

/**
 * Whether the name on a CV and the name on the request are the same person.
 *
 * Colin sent a CV belonging to Rebecca, and the reader did exactly as it was
 * told: it read the name off the document and wrote it to Colin's profile.
 * The account was then his, under her name, with her career on it. That is a
 * data protection incident rather than a typo, and the only moment anybody
 * could have caught it was the moment the two names disagreed.
 *
 * Deliberately forgiving about how a name is written and unforgiving about
 * which name it is. Case, punctuation, extra spaces and middle names are the
 * same person; a different surname is not.
 */
export function namesAgree(a: string | null | undefined, b: string | null | undefined): boolean {
  const parts = (value: string | null | undefined) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)

  const one = parts(a)
  const two = parts(b)
  if (!one.length || !two.length) return true

  // First and last, because a middle name on one side and not the other is
  // the same person and always has been.
  const ends = (names: string[]) => [names[0], names[names.length - 1]]
  const [firstOne, lastOne] = ends(one)
  const [firstTwo, lastTwo] = ends(two)
  return firstOne === firstTwo && lastOne === lastTwo
}
