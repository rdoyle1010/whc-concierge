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
