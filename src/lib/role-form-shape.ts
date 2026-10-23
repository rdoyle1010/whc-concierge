// A brand is not a hotel, and the job form should stop pretending otherwise.
//
// Posting a Regional Education Manager at a product house used to mean
// answering what time the spa opens, how many members it has, what shift
// pattern the role works and which spa booking systems the candidate must
// know. None of it applies. The person filling the form either invents
// answers, which then print onto the public advert, or abandons it - and
// either way the Brands door reads as an afterthought bolted onto a spa
// platform, which is exactly what it was.
//
// The form already asks which door the role sits in before anything else, so
// it has always known enough to ask better questions. It simply never used it.

/** Spa furniture. Real questions about a venue, meaningless about a brand. */
const SPA_ONLY_FIELDS = new Set([
  'opening_hours',    // a spa's trading hours
  'membership_size',  // a spa or club's membership
  'shift_pattern',    // brand roles keep business hours
  'required_systems', // Book4Time, SpaSoft; a brand educator lives in a CRM
  'radius_miles',     // a brand role covers a territory, not a commute
])

/** Where a brand role is actually worked from. */
export const WORK_SETTINGS = ['Head office', 'Field-based', 'Hybrid', 'On site'] as const
export type WorkSetting = typeof WORK_SETTINGS[number]

export const BRANDS_DOOR = 'brands'

export function isBrandRole(doorSlug: string | null | undefined): boolean {
  return doorSlug === BRANDS_DOOR
}

/**
 * Whether a field belongs on the form for a role in this door.
 *
 * Unknown doors get everything. A door nobody has taught this function about
 * should look exactly as it did before, never mysteriously shorter.
 */
export function fieldAppliesToRole(field: string, doorSlug: string | null | undefined): boolean {
  if (field === 'work_setting') return isBrandRole(doorSlug)
  if (isBrandRole(doorSlug)) return !SPA_ONLY_FIELDS.has(field)
  return true
}

/** What the form says instead, so the omission reads as deliberate. */
export const BRAND_ROLE_NOTE =
  'Spa opening hours, membership, shift pattern and booking systems are left off brand roles, because they describe a venue rather than this job.'
