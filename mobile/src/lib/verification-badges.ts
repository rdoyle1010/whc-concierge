// Ported verbatim from the web platform's src/lib/verification-badges.ts so the phone derives
// exactly the same result. Keep the two copies in step - if one changes, the
// app and the website start telling a candidate different things.

// Verification badges: the structured trust marks a hotel sees on a
// candidate. Hotels are buying reduced risk, not CVs, so every badge here is
// honestly derived - either from verified columns on the candidate profile or
// from manual verification rows an admin has explicitly granted. Pure module:
// no I/O, safe on server and client.

export type VerificationBadge = { key: string; label: string }

// The manual marks an admin can grant or revoke, stored one row per mark in
// candidate_verifications. Order here is display order.
export const MANUAL_VERIFICATION_TYPES: Array<{ type: string; label: string }> = [
  { type: 'employment', label: 'Employment verified' },
  { type: 'qualifications', label: 'Qualifications verified' },
  { type: 'references', label: 'References verified' },
  { type: 'whc_assessed', label: 'WHC assessed' },
  { type: 'manager_approved', label: 'Manager approved' },
]

// Insurance counts only while it is in date. A missing expiry date is treated
// as current - the admin verification flow chases expiries separately.
function insuredNow(candidate: any): boolean {
  if (!candidate?.has_insurance) return false
  if (!candidate.insurance_expiry_date) return true
  const expiry = new Date(candidate.insurance_expiry_date)
  if (isNaN(expiry.getTime())) return true
  return expiry.getTime() >= Date.now()
}

// Every badge this candidate has earned, derived badges first, then the
// manual marks, then the composite "Agency ready" when the full set of
// agency prerequisites is genuinely met.
export function candidateBadges(candidate: any, manualTypes: string[]): VerificationBadge[] {
  if (!candidate) return []
  const badges: VerificationBadge[] = []

  const insured = insuredNow(candidate)
  const rightToWork = candidate.right_to_work_status === 'verified'

  if (candidate.whc_verified) badges.push({ key: 'identity', label: 'Identity verified' })
  if (rightToWork) badges.push({ key: 'right_to_work', label: 'Right to work verified' })
  if (insured) badges.push({ key: 'insured', label: 'Insured' })

  const granted = new Set((manualTypes || []).map(type => String(type)))
  for (const manual of MANUAL_VERIFICATION_TYPES) {
    if (granted.has(manual.type)) badges.push({ key: manual.type, label: manual.label })
  }

  const agencyReady = Boolean(candidate.whc_verified) && insured && rightToWork
    && Number(candidate.hourly_rate) > 0 && candidate.latitude != null
  if (agencyReady) badges.push({ key: 'agency_ready', label: 'Agency ready' })

  return badges
}
