import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// -- Column whitelist --
// Only these fields may be written via this endpoint.
// Add new columns here when the UI legitimately needs them.
const ALLOWED_COLUMNS = new Set([
  'full_name',
  'phone',
  'postcode',
  'location',
  'has_car',
  'role_level',
  'headline',
  'bio',
  'experience_years',
  'day_rate_min',
  'day_rate_max',
  'willing_to_relocate',
  'availability_status',
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
    // -- Auth: caller must be logged in --
    const cookieStore = cookies()
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { profileId, data } = await req.json()
    if (!profileId || !data) {
      return NextResponse.json({ error: 'Missing profileId or data' }, { status: 400 })
    }

    // -- Ownership: profile must belong to the caller --
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('candidate_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single()

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // -- Whitelist: strip any columns not in the allow-list --
    const safeData = stripToAllowed(data)
    if (Object.keys(safeData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const { error } = await admin
      .from('candidate_profiles')
      .update(safeData)
      .eq('id', profileId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { profileId, data } = await req.json()
    if (!profileId || !data) return NextResponse.json({ error: 'Missing profileId or data' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('candidate_profiles').update(data).eq('id', profileId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
