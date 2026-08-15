import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { geocodePostcode } from '@/lib/geo'

// Geocode the calling employer's postcode and cache the coordinates on their
// profile. Called after the profile page saves, so distance-to-candidate can
// be computed on offers without per-request lookups. Best-effort by design.

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: emp } = await admin.from('employer_profiles').select('id, postcode').eq('user_id', user.id).maybeSingle()
    if (!emp) return NextResponse.json({ error: 'No employer profile found' }, { status: 404 })
    if (!emp.postcode) return NextResponse.json({ success: true, geocoded: false })

    const coords = await geocodePostcode(emp.postcode)
    if (!coords) return NextResponse.json({ success: true, geocoded: false })

    const { error } = await admin.from('employer_profiles')
      .update({ latitude: coords.latitude, longitude: coords.longitude })
      .eq('id', emp.id)
    // Column may not exist until migration runs - treat as non-fatal
    if (error) return NextResponse.json({ success: true, geocoded: false })

    return NextResponse.json({ success: true, geocoded: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
