import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { geocodePostcode } from '@/lib/geo'

const EDITABLE = [
  'company_name','property_name','contact_name','contact_phone','contact_email','website','location','postcode',
  'company_type','property_type','star_rating','about_text','tagline','logo_url','product_houses_used','systems_used',
  'services_offered','brand_partners','num_treatment_rooms','team_size','commute_car_required','nearest_transport',
  'transport_walk_minutes','parking_available','taxi_support','taxi_notes','travel_notes','culture_points','highlights',
  'property_photos','tripadvisor_url','treatment_menu_url','guest_review_summary','agency_available','agency_note',
] as const

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: profile } = await admin.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })
  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()
  const { data: profile } = await admin.from('employer_profiles').select('id,postcode').eq('user_id', user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const payload: Record<string, unknown> = {}
  for (const field of EDITABLE) if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field]
  if (Array.isArray(payload.property_photos) && payload.property_photos.length > 6) payload.property_photos = payload.property_photos.slice(0, 6)
  for (const numeric of ['num_treatment_rooms','team_size','transport_walk_minutes'] as const) {
    if (Object.prototype.hasOwnProperty.call(payload, numeric)) {
      const value = payload[numeric]
      payload[numeric] = value === '' || value == null ? null : Math.max(0, Number(value) || 0)
    }
  }

  const postcode = String(payload.postcode ?? profile.postcode ?? '').trim()
  if (postcode && postcode !== String(profile.postcode || '').trim()) {
    const coords = await geocodePostcode(postcode)
    if (coords) { payload.latitude = coords.latitude; payload.longitude = coords.longitude }
  }

  const { data: updated, error } = await admin.from('employer_profiles').update(payload).eq('id', profile.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, profile: updated })
}