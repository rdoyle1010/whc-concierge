import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { profileUpdateSchema, validateRequest } from '@/lib/validations'

// -- Column whitelist --
// Only these fields may be written via this endpoint.
// Add new columns here when the UI legitimately needs them.
const ALLOWED_COLUMNS = new Set([
  'full_name',
  'phone',
  'postcode',
  'location',
  'location_country',
  'has_car',
  'role_level',
  'headline',
  'bio',
  'experience_years',
  'day_rate_min',
  'day_rate_max',
  'hourly_rate',
  'willing_to_relocate',
  'availability_status',
  'right_to_work',
  'languages',
  'availability_date',
  'services_offered',
  'product_houses',
  'qualifications',
  'systems_experience',
  'travel_availability',
  'travel_radius_miles',
  'has_insurance',
  'employment_types_wanted',
  'skills',
  'certificates_urls',
  'profile_completion_pct',
  'profile_completion_score',
  'profile_image_url',
  'cv_url',
  'insurance_document_url',
  'stealth_mode',
  'sms_opt_in',
  'job_alerts_enabled',
  'job_alerts_frequency',
  'job_alerts_min_score',
  'transport_method',
  'max_commute',
  'shift_preferences',
  'location_preferences',
  'needs_accommodation',
])

function stripToAllowed(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const key of Object.keys(data)) {
    if (ALLOWED_COLUMNS.has(key)) clean[key] = data[key]
  }
  return clean
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* read-only in Route Handlers */ },
        },
      }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const validation = validateRequest(profileUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
    }
    const { profileId, data } = validation.data!

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('candidate_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single()

    if (!profile || profile.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const safeData = stripToAllowed(data)
    if (Object.keys(safeData).length === 0) return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })

    const attempt = { ...safeData }
    const skipped: string[] = []
    let { error } = await admin.from('candidate_profiles').update(attempt).eq('id', profileId)
    for (let i = 0; i < 8 && error; i++) {
      const m = /Could not find the '([^']+)' column/.exec(error.message || '')
        || /column "([^"]+)" of relation/.exec(error.message || '')
      if (!m || !(m[1] in attempt)) break
      skipped.push(m[1])
      delete attempt[m[1]]
      if (Object.keys(attempt).length === 0) break
      const retry = await admin.from('candidate_profiles').update(attempt).eq('id', profileId)
      error = retry.error
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (skipped.length) console.error('[profile/update] columns missing in live DB, values dropped:', skipped.join(', '))

    return NextResponse.json({ success: true, skipped })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
