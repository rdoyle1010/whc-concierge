import { calculateProfileStrength } from '@/lib/profile-strength'
import { audienceFor, type OnboardingAudience } from '@/lib/onboarding-email'

// Who has just arrived, and how far did they actually get.
//
// Two things read from this and they must not disagree: the hourly sweep that
// sends the how-to-use-it email, and the admin screen that shows who is stuck.
// An administrator looking at "34% complete, no photograph, no qualifications"
// should be looking at exactly what the email told that person.

/**
 * The hand-holding offer. The first fifty accounts get their profile built for
 * them, because at fifty people it is still possible and at five hundred it is
 * not. Counted across talent and properties together.
 */
export const SETUP_HELP_LIMIT = 50

export type OnboardingAccount = {
  kind: 'candidate' | 'employer'
  /** The row id in candidate_profiles or employer_profiles. */
  id: string
  userId: string | null
  name: string
  email: string | null
  createdAt: string
  audience: OnboardingAudience
  score: number
  missing: string[]
  /** Whether the how-to-use-it email has gone, and what happened to it. */
  onboardingEmail: { sentAt: string; status: string } | null
}

// Every column, deliberately. The strength scorer reads both spellings of
// several fields (phone/phone_number, hotel_brands/brand_experience) because
// only one of each exists - and naming a column that is not there fails the
// whole query rather than that one field. This is an internal sweep over a
// handful of rows, so the wide read costs nothing worth saving.
const CANDIDATE_FIELDS = '*'

// A property has no profile-strength scorer of its own, so it gets one here.
// The weights are the same shape as the talent one: the things that decide
// whether a professional reading the page applies or closes the tab.
const EMPLOYER_FIELDS: { label: string; weight: number; check: (p: any) => boolean }[] = [
  { label: 'Property name', weight: 10, check: p => !!p.property_name },
  { label: 'Contact name', weight: 5, check: p => !!p.contact_name },
  { label: 'Phone number', weight: 5, check: p => !!p.phone || !!p.contact_phone },
  { label: 'Logo', weight: 10, check: p => !!p.logo_url },
  { label: 'Property photographs', weight: 10, check: p => (p.gallery_urls?.length || p.property_images?.length || 0) >= 1 },
  { label: 'Description', weight: 15, check: p => (p.description || p.about || '').trim().split(/\s+/).filter(Boolean).length >= 40 },
  { label: 'Location', weight: 10, check: p => !!p.location || !!p.city },
  { label: 'Website', weight: 5, check: p => !!p.website },
  { label: 'Spa size', weight: 5, check: p => !!p.treatment_rooms || !!p.spa_size },
  { label: 'Product houses stocked', weight: 10, check: p => (p.product_houses?.length || 0) >= 1 },
  { label: 'Hotel brand', weight: 5, check: p => !!p.hotel_brand || (p.hotel_brands?.length || 0) >= 1 },
  { label: 'A live role', weight: 10, check: p => !!p.has_live_role },
]

export function employerStrength(profile: any): { score: number; missing: string[] } {
  if (!profile) return { score: 0, missing: EMPLOYER_FIELDS.map(f => f.label) }
  let earned = 0
  const missing: string[] = []
  for (const field of EMPLOYER_FIELDS) {
    if (field.check(profile)) earned += field.weight
    else missing.push(field.label)
  }
  return { score: Math.min(100, earned), missing }
}

/**
 * How many accounts existed before this one. Used for the first-fifty offer,
 * and counted across both tables because the offer is not per audience.
 */
export async function accountsBefore(admin: any, createdAt: string): Promise<number> {
  const [candidates, employers] = await Promise.all([
    admin.from('candidate_profiles').select('id', { count: 'exact', head: true }).lt('created_at', createdAt),
    admin.from('employer_profiles').select('id', { count: 'exact', head: true }).lt('created_at', createdAt),
  ])
  return (candidates.count || 0) + (employers.count || 0)
}

/** An address for an account, from the profile row or from auth.users. */
export async function addressFor(admin: any, row: any, userId: string | null): Promise<string | null> {
  const onRow = row?.email || row?.contact_email || row?.work_email
  if (onRow) return String(onRow).trim()
  if (!userId) return null
  try {
    const { data } = await admin.auth.admin.getUserById(userId)
    return data?.user?.email || null
  } catch {
    return null
  }
}

/**
 * Accounts created inside a window, with completion and email status attached.
 * `withinHours` is the age band: [olderThanHours, youngerThanHours].
 */
export async function recentAccounts(admin: any, opts: {
  olderThanHours?: number
  youngerThanHours: number
  limit?: number
  withEmail?: boolean
}): Promise<OnboardingAccount[]> {
  const now = Date.now()
  const ceiling = new Date(now - (opts.olderThanHours || 0) * 3600_000).toISOString()
  const floor = new Date(now - opts.youngerThanHours * 3600_000).toISOString()
  const limit = opts.limit || 100

  const [candidateRes, employerRes] = await Promise.all([
    admin.from('candidate_profiles').select(CANDIDATE_FIELDS)
      .gte('created_at', floor).lte('created_at', ceiling)
      .order('created_at', { ascending: false }).limit(limit),
    admin.from('employer_profiles').select('*')
      .gte('created_at', floor).lte('created_at', ceiling)
      .order('created_at', { ascending: false }).limit(limit),
  ])

  const candidates = candidateRes.data || []
  const employers = employerRes.data || []
  const userIds = [...candidates, ...employers].map((r: any) => r.user_id).filter(Boolean)

  // Which of them already has a residency listing, and which has already had
  // the email. Two queries rather than two per person.
  const [residencyRes, logRes, liveRoleRes] = await Promise.all([
    candidates.length
      ? admin.from('residency_profiles').select('user_id').in('user_id', candidates.map((c: any) => c.user_id).filter(Boolean))
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from('email_log').select('user_id,status,created_at').eq('kind', 'onboarding').in('user_id', userIds)
      : Promise.resolve({ data: [] }),
    // A live role is part of a property being set up, and it is not a column
    // on the property row - so it is fetched rather than assumed absent. A
    // scorer that can never award a point is a scorer that lies by ten.
    employers.length
      ? admin.from('job_listings').select('employer_id').eq('is_live', true).in('employer_id', employers.map((e: any) => e.id))
      : Promise.resolve({ data: [] }),
  ])

  const withResidency = new Set((residencyRes.data || []).map((r: any) => r.user_id))
  const withLiveRole = new Set((liveRoleRes.data || []).map((r: any) => r.employer_id))
  const sent = new Map<string, { sentAt: string; status: string }>()
  for (const row of logRes.data || []) {
    // The first attempt is the one that matters; a later retry does not make
    // the earlier send un-happen.
    const existing = sent.get(row.user_id)
    if (!existing || row.created_at < existing.sentAt) {
      sent.set(row.user_id, { sentAt: row.created_at, status: row.status })
    }
  }

  const out: OnboardingAccount[] = []

  for (const row of candidates) {
    const strength = calculateProfileStrength(row)
    out.push({
      kind: 'candidate',
      id: row.id,
      userId: row.user_id || null,
      name: row.full_name || 'Unnamed',
      email: opts.withEmail ? await addressFor(admin, row, row.user_id || null) : null,
      createdAt: row.created_at,
      audience: audienceFor({
        role: 'talent',
        accountFocus: row.account_focus,
        hasResidencyListing: withResidency.has(row.user_id),
        agencyAvailable: row.agency_available,
      }),
      score: strength.score,
      missing: strength.missing,
      onboardingEmail: (row.user_id && sent.get(row.user_id)) || null,
    })
  }

  for (const row of employers) {
    const strength = employerStrength({ ...row, has_live_role: withLiveRole.has(row.id) })
    out.push({
      kind: 'employer',
      id: row.id,
      userId: row.user_id || null,
      name: row.property_name || row.contact_name || 'Unnamed property',
      email: opts.withEmail ? await addressFor(admin, row, row.user_id || null) : null,
      createdAt: row.created_at,
      audience: 'employer',
      score: strength.score,
      missing: strength.missing,
      onboardingEmail: (row.user_id && sent.get(row.user_id)) || null,
    })
  }

  return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
