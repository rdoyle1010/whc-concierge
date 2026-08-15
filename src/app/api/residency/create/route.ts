import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Creates a residency listing for the logged-in user.
// Uses the service-role client because residency_profiles has no
// INSERT policy for authenticated users (read-only RLS).
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const body = await req.json()
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Pull the candidate profile (if any) to enrich the listing
    const { data: cand } = await admin
      .from('candidate_profiles')
      .select('id, full_name, profile_image_url')
      .eq('user_id', user.id)
      .maybeSingle()

    // DB check constraints only allow these exact values
    const ALLOWED_DURATIONS = ['1-2 months', '3-4 months', '5-6 months', 'Flexible']
    const ALLOWED_TRAVEL = ['UK Only', 'Europe', 'Middle East', 'Asia Pacific', 'Global']
    const duration = ALLOWED_DURATIONS.includes(body.preferred_duration) ? body.preferred_duration : null
    const travel = ALLOWED_TRAVEL.includes(body.travel_availability) ? body.travel_availability : null

    const row: Record<string, any> = {
      user_id: user.id,
      candidate_profile_id: cand?.id || null,
      full_name: cand?.full_name || body.title,
      profile_photo_url: cand?.profile_image_url || null,
      primary_specialism: body.title,
      bio: body.description || null,
      secondary_specialisms: Array.isArray(body.services_offered) && body.services_offered.length > 0 ? body.services_offered : null,
      qualifications: Array.isArray(body.qualifications) && body.qualifications.length > 0 ? body.qualifications : null,
      brand_experience: Array.isArray(body.product_houses) && body.product_houses.length > 0 ? body.product_houses : null,
      current_location: body.postcode || null,
      will_travel_to: travel,
      preferred_duration: duration,
      weekly_rate: body.weekly_rate ? parseInt(String(body.weekly_rate), 10) : null,
      day_rate: body.day_rate ? parseInt(String(body.day_rate), 10) : null,
      monthly_rate: body.monthly_rate ? parseInt(String(body.monthly_rate), 10) : null,
      negotiable: body.negotiable === true,
      available_from: body.availability_start || null,
      approval_status: 'pending',
    }

    const { data, error } = await admin
      .from('residency_profiles')
      .insert(row)
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
