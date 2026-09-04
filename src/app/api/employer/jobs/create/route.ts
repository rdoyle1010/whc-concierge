import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { geocodeLocation } from '@/lib/geo'
import { countryCode, DEFAULT_COUNTRY, productAvailableIn } from '@/lib/countries'
import { CURRENCIES, currencyForCountry } from '@/lib/money'
import { getRequestUser } from '@/lib/request-user'

// Job storytelling columns (20260831170000). Optional narrative fields; if the
// live database does not have them yet, the insert retries without them.
const STORY_FIELDS = [
  'why_role_exists', 'success_90_days', 'reporting_line', 'team_size', 'opening_hours',
  'commercial_responsibility', 'membership_size', 'key_kpis', 'why_move',
  'career_progression', 'interview_process',
] as const

const ALLOWED_FIELDS = [
  'job_title', 'job_description', 'job_image_url', 'location', 'location_postcode', 'radius_miles',
  // Anything the form sends and this list omits is silently dropped, and the
  // failure surfaces as a database error the person posting can do nothing
  // with. sector_id was missing while the column is NOT NULL, so posting a
  // role failed every single time with "null value in column sector_id
  // violates not-null constraint" - which reads like a platform outage
  // because it is one.
  'sector_id',
  // Same omission, quieter consequence: the country picker was read and
  // thrown away, so every role inherited the property's country - a London
  // group posting for its Hong Kong resort advertised a UK job, mapped to
  // Yorkshire, priced in pounds.
  'country_code', 'location_city', 'salary_currency',
  'job_type', 'contract_type', 'required_role_level', 'candidate_scope', 'salary_min', 'salary_max',
  'required_skills', 'required_brands', 'required_qualifications', 'required_systems',
  'preferred_business_skills', 'min_years_experience', 'shift_pattern',
  'offers_accommodation', 'requirements', 'benefits', 'insurance_required',
  'is_agency_role', 'is_residency_role', 'tier', 'is_live', 'status',
  ...STORY_FIELDS,
] as const

const CANDIDATE_SCOPES = new Set(['same_level', 'step_up', 'emerging', 'open_transferable'])

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()
  const { data: employer } = await admin
    .from('employer_profiles')
    .select('id, postcode, latitude, longitude, country_code, country')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const payload: Record<string, unknown> = { employer_id: employer.id }
  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field]
  }

  if (!String(payload.job_title || '').trim() || !String(payload.location || '').trim()) {
    return NextResponse.json({ error: 'Job title and location are required.' }, { status: 400 })
  }
  // Checked here rather than left to the database. A constraint violation is
  // accurate and useless: it names a column, not a thing the person can fix.
  if (!String(payload.sector_id || '').trim()) {
    return NextResponse.json({ error: 'Choose the door and sector this role sits in before posting it.' }, { status: 400 })
  }
  if (!['draft', 'pending_payment'].includes(String(payload.status))) {
    return NextResponse.json({ error: 'Invalid job status.' }, { status: 400 })
  }
  if (!CANDIDATE_SCOPES.has(String(payload.candidate_scope || 'step_up'))) payload.candidate_scope = 'step_up'
  payload.is_live = false

  // A role's country is not always the property's. A London group hiring for
  // its resort in the Maldives is the ordinary case, so the role carries its
  // own country and only falls back to the property's when it is not given.
  const roleCountry = countryCode(payload.country_code as string | null) || countryCode(employer.country_code || employer.country) || DEFAULT_COUNTRY
  payload.country_code = roleCountry

  // A role abroad can be advertised, but it cannot be an Agency Cover shift:
  // supplying somebody into one makes Talent House an employment business,
  // licensed country by country. Cleared rather than refused, because the rest
  // of the role is perfectly postable and refusing the whole thing over a
  // checkbox would read as the country being unsupported.
  if (!productAvailableIn('agency', roleCountry)) payload.is_agency_role = false

  // A currency the platform cannot render is worse than the default: it would
  // print a pound sign in front of a Hong Kong figure. An unknown code falls
  // back to what the country would normally quote in.
  const currency = String(payload.salary_currency || '').toUpperCase()
  payload.salary_currency = CURRENCIES.some(known => known.code === currency)
    ? currency
    : currencyForCountry(roleCountry)

  const rolePostcode = String(payload.location_postcode || '').trim()
  const roleTown = String(payload.location_city || payload.location || '').trim()
  let coords: { latitude: number; longitude: number } | null = null
  if (rolePostcode || roleTown) coords = await geocodeLocation(rolePostcode || roleTown, roleCountry)
  // The property's own coordinates are only a sensible fallback when the role
  // is in the same country. Otherwise a Maldives role inherits a Yorkshire pin
  // and every distance on the platform is wrong by four thousand miles.
  const sameCountry = roleCountry === (countryCode(employer.country_code || employer.country) || DEFAULT_COUNTRY)
  if (!coords && sameCountry && employer.latitude != null && employer.longitude != null) coords = { latitude: employer.latitude, longitude: employer.longitude }
  if (!coords && sameCountry && employer.postcode) coords = await geocodeLocation(employer.postcode, roleCountry)
  if (coords) { payload.latitude = coords.latitude; payload.longitude = coords.longitude }

  let { data: job, error } = await admin.from('job_listings').insert(payload).select('id').single()
  if (error && /column/i.test(error.message) && STORY_FIELDS.some(field => field in payload)) {
    // Storytelling columns not migrated yet: post the role without them.
    const trimmed = { ...payload }
    for (const field of STORY_FIELDS) delete trimmed[field]
    ;({ data: job, error } = await admin.from('job_listings').insert(trimmed).select('id').single())
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ job })
}
