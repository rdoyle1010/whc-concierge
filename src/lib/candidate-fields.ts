// What an administrator may fill in on somebody else's behalf, and nothing else.
//
// This exists because the way we used to build a profile for somebody was to
// sign in as them. A magic link, opened in the same browser, on the same
// origin: the session it created replaced the administrator's own, so every
// admin screen behind it started answering "Unauthorised" and the workspace
// that opened belonged to a person with nothing in it yet. Two errors, one
// cause, and neither of them says what happened.
//
// So nobody is signed in as anybody. The administrator stays herself and the
// write happens here, through the service role, against a named list. Named,
// because a service-role write has no RLS in front of it: approval_status,
// the visibility columns, the commercial entitlements and the identity
// columns are absent on purpose and adding one to this list is a decision,
// not a typo.

export type EditableProfile = Record<string, unknown>

const TEXT_FIELDS: Record<string, number> = {
  full_name: 200,
  headline: 120,
  role_level: 60,
  bio: 4000,
  phone: 40,
  postcode: 20,
  location: 120,
  current_employer: 160,
  availability_status: 80,
  travel_availability: 80,
}

const NUMBER_FIELDS: Record<string, [number, number]> = {
  experience_years: [0, 60],
  day_rate_min: [0, 10000],
  day_rate_max: [0, 10000],
  travel_radius_miles: [0, 10000],
}

const LIST_FIELDS: Record<string, number> = {
  services_offered: 60,
  product_houses: 40,
  qualifications: 40,
  systems_experience: 30,
  business_skills: 30,
  languages: 20,
  hotel_brands_worked: 30,
}

const BOOLEAN_FIELDS = ['has_car', 'has_insurance', 'current_employer_visible']

/** Everything the editor is allowed to read back and send again. */
export const EDITABLE_FIELDS: string[] = [
  ...Object.keys(TEXT_FIELDS),
  ...Object.keys(NUMBER_FIELDS),
  ...Object.keys(LIST_FIELDS),
  ...BOOLEAN_FIELDS,
]

function line(value: unknown, limit: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, limit) : null
}

function list(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim().slice(0, 160))
    .filter(Boolean)
  return Array.from(new Set(cleaned)).slice(0, limit)
}

/**
 * Turn what the editor posted into a row.
 *
 * Only keys that were actually sent are written. A form that shows six fields
 * must not blank the other twenty by omitting them, which is how "she saved
 * one thing and lost the rest" happens.
 */
export function sanitiseProfileEdit(input: unknown): EditableProfile {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const row: EditableProfile = {}

  for (const [field, limit] of Object.entries(TEXT_FIELDS)) {
    if (field in source) row[field] = line(source[field], limit)
  }

  for (const [field, [min, max]] of Object.entries(NUMBER_FIELDS)) {
    if (!(field in source)) continue
    const raw = source[field]
    if (raw === '' || raw === null || raw === undefined) { row[field] = null; continue }
    const number = Number(raw)
    row[field] = Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : null
  }

  for (const [field, limit] of Object.entries(LIST_FIELDS)) {
    if (field in source) row[field] = list(source[field], limit)
  }

  for (const field of BOOLEAN_FIELDS) {
    if (field in source) row[field] = source[field] === true
  }

  // The treatments live in two places and only one of them is read by
  // matching. Writing services_offered without treatment_skills leaves the
  // profile page looking half filled in; writing treatment_skills without
  // services_offered produces a profile that looks finished and matches
  // nothing. It has been both, so it is now neither.
  if ('services_offered' in row) row.treatment_skills = row.services_offered

  // A postcode is where somebody is, and location is the column everything
  // else reads. They were allowed to disagree, and a profile with a postcode
  // and no location is invisible to search.
  if (row.postcode && !row.location) row.location = row.postcode

  return row
}

/**
 * The same ten things the professional's own profile page counts, counted the
 * same way.
 *
 * Two screens showing two different percentages for one profile is worse than
 * neither showing any: she cannot tell whether she has finished.
 */
export const COMPLETION_CHECKS: [string, (row: any) => boolean][] = [
  ['Full name', row => Boolean(row?.full_name)],
  ['Role level', row => Boolean(row?.role_level)],
  ['Headline', row => Boolean(row?.headline)],
  ['About you', row => Boolean(row?.bio)],
  ['Treatments and services', row => (row?.services_offered?.length || 0) > 0],
  ['Qualifications', row => (row?.qualifications?.length || 0) > 0],
  ['CV uploaded', row => Boolean(row?.cv_url)],
  ['Years of experience', row => Boolean(row?.experience_years)],
  ['Postcode', row => Boolean(row?.postcode)],
  ['Business skills', row => (row?.business_skills?.length || 0) > 0],
]

export function completionPercent(row: any): number {
  const done = COMPLETION_CHECKS.filter(([, check]) => check(row)).length
  return Math.round((done / COMPLETION_CHECKS.length) * 100)
}

export function missingFrom(row: any): string[] {
  return COMPLETION_CHECKS.filter(([, check]) => !check(row)).map(([label]) => label)
}
