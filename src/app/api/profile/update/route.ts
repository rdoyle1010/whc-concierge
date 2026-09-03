import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { profileUpdateSchema, validateRequest } from '@/lib/validations'
import { geocodeLocation } from '@/lib/geo'
import { recordSalary } from '@/lib/analytics'

const ALLOWED_COLUMNS = new Set([
  // Languages with fluency, and the language a CV is written in. Never
  // nationality: it is a protected characteristic and not a hiring criterion,
  // and a column here would put it on a profile properties browse.
  'language_skills','cv_language',
  'full_name','phone','postcode','location','location_country','has_car','role_level','headline','bio','experience_years',
  // Where they are, and where they will work. Agency stays UK-only; Roles,
  // Residency and Consultancy travel, and open_to_countries is what makes a
  // therapist in Leeds findable for a resort in the Maldives.
  'country_code','open_to_countries',
  'day_rate_min','day_rate_max','hourly_rate','willing_to_relocate','availability_status','right_to_work','languages','availability_date',
  'services_offered','product_houses','qualifications','systems_experience','business_skills','career_evidence','travel_availability','travel_radius_miles',
  'has_insurance','employment_types_wanted','skills','certificates_urls','profile_completion_pct','profile_completion_score','profile_image_url','cv_url',
  'insurance_document_url','stealth_mode','sms_opt_in','job_alerts_enabled','job_alerts_frequency','job_alerts_min_score','transport_method','max_commute',
  'shift_preferences','location_preferences','needs_accommodation','skill_proficiencies','hotel_brands_worked',
  'salary_expectation_min','salary_expectation_max','salary_expectation_private','commercial_experience','revenue_responsibility','team_size_managed','desired_roles','portfolio_url',
  // Private Career Mode (20260831190000) - the retry loop below drops the two
  // new columns harmlessly if the live database has not been migrated yet.
  'show_first_name_only','private_mode','private_hide_photo',
])

function stripToAllowed(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const key of Object.keys(data)) if (ALLOWED_COLUMNS.has(key)) clean[key] = data[key]
  return clean
}

// Distance-based matching needs coordinates, and web signups never had them:
// whenever a postcode is saved, geocode it. A failed lookup never blocks the
// save - the profile just stays text-matched until the postcode is corrected.
async function withCoordinates(clean: Record<string, unknown>): Promise<Record<string, unknown>> {
  const postcode = typeof clean.postcode === 'string' ? clean.postcode.trim() : ''
  const country = typeof clean.country_code === 'string' ? clean.country_code
    : typeof clean.location_country === 'string' ? clean.location_country : null
  // Abroad there is no postcode to give, and a therapist in Muscat would have
  // been left off every distance-aware list on the platform for not having
  // one. The town is what they have, and it is enough.
  const place = postcode || (typeof clean.location === 'string' ? clean.location.trim() : '')
  if (!place && !country) return clean
  try {
    const coords = await geocodeLocation(place, country)
    if (coords) return { ...clean, latitude: coords.latitude, longitude: coords.longitude }
  } catch {}
  return clean
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const validation = validateRequest(profileUpdateSchema, body)
    if (!validation.success) return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
    const { profileId, data } = validation.data!

    const admin = createAdminClient()
    const { data: profile } = await admin.from('candidate_profiles').select('user_id,salary_expectation_min,salary_expectation_max,role_level').eq('id', profileId).single()
    if (!profile || profile.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const safeData = stripToAllowed(data)
    if (!Object.keys(safeData).length) return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })

    const attempt = { ...(await withCoordinates(safeData)) }
    const skipped: string[] = []
    let { error } = await admin.from('candidate_profiles').update(attempt).eq('id', profileId)
    for (let i = 0; i < 8 && error; i++) {
      const m = /Could not find the '([^']+)' column/.exec(error.message || '') || /column "([^"]+)" of relation/.exec(error.message || '')
      if (!m || !(m[1] in attempt)) break
      skipped.push(m[1]); delete attempt[m[1]]
      if (!Object.keys(attempt).length) break
      error = (await admin.from('candidate_profiles').update(attempt).eq('id', profileId)).error
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (skipped.length) console.error('[profile/update] columns missing in live DB, values dropped:', skipped.join(', '))

    // Salary history with provenance: a changed expectation is a dated row,
    // never an overwrite. History is what makes salary intelligence possible.
    const newMin = 'salary_expectation_min' in attempt ? Number(attempt.salary_expectation_min) || null : undefined
    const newMax = 'salary_expectation_max' in attempt ? Number(attempt.salary_expectation_max) || null : undefined
    if (newMin !== undefined || newMax !== undefined) {
      const changed = (newMin !== undefined && newMin !== (profile.salary_expectation_min ?? null))
        || (newMax !== undefined && newMax !== (profile.salary_expectation_max ?? null))
      if (changed && (newMin || newMax)) {
        await recordSalary({
          kind: 'expectation', source: 'candidate_declared',
          amountMin: newMin ?? profile.salary_expectation_min ?? null,
          amountMax: newMax ?? profile.salary_expectation_max ?? null,
          candidateId: profileId,
          roleLevel: typeof attempt.role_level === 'string' ? attempt.role_level : profile.role_level || null,
        })
      }
    }
    return NextResponse.json({ success: true, skipped })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
