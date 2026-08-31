// Private Career Mode helpers - shared by every route that shows a candidate
// to an employer, so anonymisation behaves identically everywhere.

// First name plus surname initial: "Alexandra Whitmore-Hunt" -> "Alexandra W."
export function anonymiseDisplayName(fullName: string | null | undefined): string {
  const name = (fullName || '').trim()
  if (!name) return 'WHC professional'
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
