import { tolerantUpsert } from '@/lib/tolerant-upsert'
import { visibilityColumns } from '@/lib/talent-visibility'

// Make sure a professional has a record, without trampling the one she has.
//
// Two rules that kept being written separately and getting one of them wrong:
//
// An account with no candidate_profiles row is an account whose workspace says
// "Profile not found" and whose saved draft updates nothing and reports
// success. The row created by the database trigger only appears when a
// profiles row is INSERTED, so an account that became talent any other way -
// converted by hand, created for a course purchase - has none.
//
// And an account that already has one has things in it that somebody put
// there. Her visibility above all: resetting a professional who chose to be
// open back to private, because she happened to send us a CV, is a decision
// that is hers and not ours.
//
// So: create it when it is missing, and when it is not, fill only what is
// genuinely empty.

export type CandidateSeed = {
  full_name?: string | null
  phone?: string | null
  cv_url?: string | null
}

export type EnsureResult =
  | { ok: true; created: boolean; filled: string[] }
  | { ok: false; error: string }

export async function ensureCandidateProfile(
  admin: any,
  userId: string,
  seed: CandidateSeed = {},
): Promise<EnsureResult> {
  if (!userId) return { ok: false, error: 'No account to attach a profile to.' }

  const { data: existing, error: readError } = await admin.from('candidate_profiles')
    .select('id, full_name, phone, cv_url').eq('user_id', userId).maybeSingle()
  if (readError) return { ok: false, error: readError.message }

  if (!existing) {
    // New, and private: nobody has seen this yet, least of all its owner.
    const written = await tolerantUpsert(admin, 'candidate_profiles', {
      user_id: userId,
      full_name: seed.full_name || null,
      phone: seed.phone || null,
      cv_url: seed.cv_url || null,
      approval_status: 'approved',
      ...visibilityColumns('private'),
    }, { onConflict: 'user_id' })
    if (!written.ok) return { ok: false, error: written.error }
    return { ok: true, created: true, filled: [] }
  }

  // Only the blanks. Never approval_status, and never visibility: both are
  // things she or an administrator has already decided.
  const patch: Record<string, any> = {}
  const blank = (value: unknown) => !String(value ?? '').trim()
  if (blank(existing.full_name) && seed.full_name) patch.full_name = seed.full_name
  if (blank(existing.phone) && seed.phone) patch.phone = seed.phone
  if (blank(existing.cv_url) && seed.cv_url) patch.cv_url = seed.cv_url

  if (!Object.keys(patch).length) return { ok: true, created: false, filled: [] }

  const written = await tolerantUpsert(admin, 'candidate_profiles',
    { user_id: userId, ...patch }, { onConflict: 'user_id' })
  if (!written.ok) return { ok: false, error: written.error }
  return { ok: true, created: false, filled: Object.keys(patch) }
}

/**
 * Fill in what is blank, and touch nothing that is not.
 *
 * The intake answers had a rule of their own: write them only when the record
 * had just been created, so that somebody who already had a profile did not
 * have their own work replaced by a form they filled in five minutes ago.
 * That rule was too blunt by half. Colin already had an account from an
 * earlier test, so his record was not new, so every answer he gave - his
 * postcode, when he could start, how far he would go - was dropped on the
 * floor and the profile sat at eighty per cent saying "Postcode" was missing
 * while his postcode was printed on the card above it.
 *
 * A blank field is not somebody's work. An empty string, a null and an empty
 * list are all blank; a value anybody put there, including a false, is not.
 */
export async function fillBlankProfileFields(
  admin: any,
  userId: string,
  fields: Record<string, unknown>,
): Promise<{ ok: true; filled: string[] } | { ok: false; error: string }> {
  if (!userId) return { ok: false, error: 'No account to attach a profile to.' }
  const wanted = Object.keys(fields)
  if (!wanted.length) return { ok: true, filled: [] }

  const { data: existing, error } = await admin.from('candidate_profiles')
    .select('*').eq('user_id', userId).maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!existing) return { ok: false, error: 'There is no profile to fill in.' }

  const blank = (value: unknown) => {
    if (value === null || value === undefined) return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'string') return value.trim() === ''
    return false
  }

  const patch: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(fields)) {
    // A column the table does not have reads as blank here and would be
    // written, which is the mistake that has cost this platform three
    // registrations. tolerantUpsert strips it either way, but not asking is
    // cheaper than being forgiven.
    if (!(field in existing)) continue
    if (blank(existing[field]) && !blank(value)) patch[field] = value
  }

  if (!Object.keys(patch).length) return { ok: true, filled: [] }

  const written = await tolerantUpsert(admin, 'candidate_profiles',
    { user_id: userId, ...patch }, { onConflict: 'user_id' })
  if (!written.ok) return { ok: false, error: written.error }
  return { ok: true, filled: Object.keys(patch) }
}
