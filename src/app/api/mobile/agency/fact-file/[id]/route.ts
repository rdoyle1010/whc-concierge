import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { profileDistanceMiles } from '@/lib/geo'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: candidate }, { data: employerViewer }, { data: booking }] = await Promise.all([
    admin.from('candidate_profiles').select('id,user_id,full_name,latitude,longitude,travel_radius_miles').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle(),
    admin.from('agency_bookings').select('*').eq('id', id).maybeSingle(),
  ])
  if (!booking) return NextResponse.json({ error: 'Shift not found.' }, { status: 404 })
  const isCandidate = Boolean(candidate && booking.candidate_id === candidate.id)
  const isEmployer = Boolean(employerViewer && booking.employer_id === employerViewer.id)
  if (!isCandidate && !isEmployer) return NextResponse.json({ error: 'You are not part of this shift.' }, { status: 403 })

  const [{ data: property }, { data: factFile }, { data: arrivalPack }, { data: bookingCandidate }] = await Promise.all([
    admin.from('employer_profiles').select('*').eq('id', booking.employer_id).maybeSingle(),
    admin.from('property_fact_files').select('*').eq('employer_id', booking.employer_id).maybeSingle(),
    admin.from('booking_arrival_packs').select('snapshot,generated_at,acknowledged_at').eq('booking_type', 'agency').eq('booking_id', booking.id).maybeSingle(),
    admin.from('candidate_profiles').select('id,user_id,full_name,latitude,longitude,travel_radius_miles').eq('id', booking.candidate_id).maybeSingle(),
  ])
  if (!property) return NextResponse.json({ error: 'Property information is unavailable.' }, { status: 404 })

  const distance = bookingCandidate ? profileDistanceMiles(bookingCandidate, property) : null
  const effectiveHours = Number(booking.hours || 0) > 0 ? Number(booking.hours) : 8
  const professionalPay = Number(booking.rate || 0) * effectiveHours
  const platformFee = Number(booking.platform_fee || 0)

  return NextResponse.json({
    viewer_role: isCandidate ? 'candidate' : 'employer',
    booking: {
      ...booking,
      professional_pay: professionalPay,
      total_with_fee: professionalPay + platformFee,
      distance_miles: distance == null ? null : Math.round(distance * 10) / 10,
    },
    candidate: bookingCandidate ? { id: bookingCandidate.id, full_name: bookingCandidate.full_name, travel_radius_miles: bookingCandidate.travel_radius_miles } : null,
    property: {
      id: property.id,
      name: property.property_name || property.company_name || 'Property',
      company_name: property.company_name,
      location: property.location,
      postcode: property.postcode,
      description: property.about_text || property.property_description || property.description || null,
      photos: Array.isArray(property.property_photos) ? property.property_photos : [],
      logo_url: property.logo_url,
      star_rating: property.star_rating,
      review_score: property.review_score,
      review_count: property.review_count,
      num_treatment_rooms: property.num_treatment_rooms,
      team_size: property.team_size,
      services_offered: property.services_offered,
      product_houses_used: property.product_houses_used,
      systems_used: property.systems_used,
      highlights: property.highlights,
      nearest_transport: property.nearest_transport,
      transport_walk_minutes: property.transport_walk_minutes,
      parking_available: property.parking_available,
      commute_car_required: property.commute_car_required,
      taxi_support: property.taxi_support,
      taxi_notes: property.taxi_notes,
      travel_notes: property.travel_notes,
      agency_note: property.agency_note,
    },
    fact_file: factFile || null,
    arrival_pack: arrivalPack || null,
  })
}
