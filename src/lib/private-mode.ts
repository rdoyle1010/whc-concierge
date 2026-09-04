// Private Career Mode helpers - shared by every route that shows a candidate
// to an employer, so anonymisation behaves identically everywhere.

// First name plus surname initial: "Alexandra Whitmore-Hunt" -> "Alexandra W."
export function anonymiseDisplayName(fullName: string | null | undefined): string {
  const name = (fullName || '').trim()
  if (!name) return 'Talent House professional'
  const parts = name.split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

// Columns added by migration 20260831190000. Selects that include them must
// retry without them so nothing breaks before the migration runs.
export const PRIVATE_MODE_COLUMNS = ['private_mode', 'private_hide_photo'] as const

export function isMissingColumnError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error && /column/i.test(error.message || ''))
}

/**
 * The single presentation step every employer-facing route must apply.
 *
 * Private Career Mode promises the professional that employers see a first
 * name and an initial, no photograph, and must request an introduction they
 * approve before learning who they are. That promise was kept in two routes
 * and broken in three others - the Agency directory, the mobile match feed
 * and the swipe response all returned the real name and photograph, and the
 * swipe notification put the full name in the employer's inbox.
 *
 * Anonymisation belongs in one function so it cannot be honoured in some
 * places and forgotten in others.
 *
 * `revealedToEmployer` is true once the professional has accepted this
 * employer's introduction, at which point the real identity is theirs to see.
 */
export function presentCandidateForEmployer<T extends Record<string, any>>(
  candidate: T,
  revealedToEmployer = false,
): T {
  const isPrivate = candidate.private_mode === true && !revealedToEmployer
  const hideName = isPrivate || candidate.show_first_name_only === true
  const hidePhoto = isPrivate || candidate.private_hide_photo === true
  return {
    ...candidate,
    full_name: hideName ? anonymiseDisplayName(candidate.full_name) : candidate.full_name,
    profile_image_url: hidePhoto ? null : candidate.profile_image_url,
    cv_url: isPrivate ? null : candidate.cv_url,
    private_mode: isPrivate,
    private_hide_photo: undefined,
  }
}

/** The name an employer may be told, in a notification or an email. */
export function candidateNameForEmployer(
  candidate: { full_name?: string | null; private_mode?: boolean | null; show_first_name_only?: boolean | null },
  revealedToEmployer = false,
): string {
  const isPrivate = candidate.private_mode === true && !revealedToEmployer
  if (isPrivate || candidate.show_first_name_only === true) return anonymiseDisplayName(candidate.full_name)
  return candidate.full_name || 'A Talent House professional'
}
