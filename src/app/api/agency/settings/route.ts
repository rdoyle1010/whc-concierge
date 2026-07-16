import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { geocodePostcode } from '@/lib/geo'

// Agency register settings - joining is FREE for therapists (decided 15 Jul:
// hotels pay the 10% fee per booking; no candidate subscription).
// This route owns everything the register needs: opt-in, rate, mobile,
// postcode (geocoded to real coordinates) and travel radius.

function getAuthedUser() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    return NextResponse.json({
      settings: {
        profile_id: cand.id,
        agency_available: Boolean(cand.agency_available),
        agency_tier: cand.agency_tier ?? null,
        agency_listed_until: cand.agency_listed_until ?? null,
        hourly_rate: cand.hourly_rate ?? null,
        phone: cand.phone ?? null,
        postcode: cand.postcode ?? null,
        travel_radius_miles: cand.travel_radius_miles ?? null,
        has_coords: cand.latitude != null && cand.longitude != null,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles').select('id, postcode').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    const body = await req.json()

    // Joining the register requires the essentials properties rely on.
    // NOTE: agency_available itself is NOT set here - only the Stripe
    // webhook flips it, after the £10/mo listing subscription is paid.
    if (body.joining) {
      const rate = parseInt(String(body.hourly_rate), 10)
      if (!rate || rate <= 0) {
        return NextResponse.json({ error: 'Please set your hourly rate - properties need to see what you charge.' }, { status: 400 })
      }
      if (!body.phone || !String(body.phone).trim()) {
        return NextResponse.json({ error: 'Please add your mobile number - urgent same-day offers are sent by text.' }, { status: 400 })
      }
    }

    const update: Record<string, any> = {
      hourly_rate: body.hourly_rate ? parseInt(String(body.hourly_rate), 10) : null,
      phone: body.phone ? String(body.phone).trim() : null,
      postcode: body.postcode ? String(body.postcode).trim().toUpperCase() : null,
      travel_radius_miles: body.travel_radius_miles ? parseInt(String(body.travel_radius_miles), 10) : null,
    }

    // Geocode when a postcode is present - once here, so searches and offers
    // can do real-mileage maths without calling out per request.
    if (update.postcode) {
      const coords = await geocodePostcode(update.postcode)
      if (coords) {
        update.latitude = coords.latitude
        update.longitude = coords.longitude
      } else {
        return NextResponse.json({ error: `We couldn't find the postcode "${update.postcode}" - please check it and try again.` }, { status: 400 })
      }
    }

    // Live table may lack the geo columns until the migration runs - strip and retry
    let { error } = await admin.from('candidate_profiles').update(update).eq('id', cand.id)
    for (let i = 0; i < 4 && error; i++) {
      const m = /Could not find the '([^']+)' column/.exec(error.message || '')
      if (!m || !(m[1] in update)) break
      delete update[m[1]]
      const retry = await admin.from('candidate_profiles').update(update).eq('id', cand.id)
      error = retry.error
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
