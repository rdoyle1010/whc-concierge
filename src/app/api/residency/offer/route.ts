import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getRequestUser } from '@/lib/request-user'

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Please sign in as an employer to send an offer.' }, { status: 401 })

    const body = await req.json()
    const listingId = String(body.listingId || '')
    const propertyName = String(body.propertyName || '').trim().slice(0, 160)
    const startDate = String(body.startDate || '')
    const endDate = String(body.endDate || '')
    const daysRequired = Number(body.daysRequired || 0)
    const proposedDayRate = Number(body.proposedDayRate || 0)
    const servicesRequired = String(body.servicesRequired || '').trim().slice(0, 2000)
    const notes = String(body.notes || '').trim().slice(0, 3000)

    if (!listingId || !propertyName || !startDate || !endDate || daysRequired < 1 || proposedDayRate <= 0) {
      return NextResponse.json({ error: 'Complete the property, dates, days required and proposed day rate.' }, { status: 400 })
    }
    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ error: 'End date must be after the start date.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const [{ data: employer }, { data: listing }] = await Promise.all([
      admin.from('employer_profiles').select('id,user_id,property_name,company_name').eq('user_id', user.id).maybeSingle(),
      admin.from('residency_profiles').select('id,user_id,candidate_profile_id,full_name,primary_specialism,approval_status').eq('id', listingId).maybeSingle(),
    ])

    if (!employer) return NextResponse.json({ error: 'An employer profile is required to send a residency offer.' }, { status: 403 })
    if (!listing || (listing.approval_status && listing.approval_status !== 'approved')) {
      return NextResponse.json({ error: 'This residency specialist is not currently available for offers.' }, { status: 404 })
    }
    if (!listing.candidate_profile_id) {
      return NextResponse.json({ error: 'This specialist cannot receive structured offers yet.' }, { status: 400 })
    }

    const { data: conversation } = await admin.from('residency_conversations')
      .select('id,status')
      .eq('residency_profile_id', listing.id)
      .eq('candidate_id', listing.candidate_profile_id)
      .eq('employer_id', employer.id)
      .eq('status', 'open')
      .maybeSingle()

    if (!conversation) {
      return NextResponse.json({ error: 'Start a private Residency conversation before sending a formal offer.' }, { status: 403 })
    }

    const proposedTotal = Number((daysRequired * proposedDayRate).toFixed(2))
    const platformFee = Number((proposedTotal * 0.10).toFixed(2))

    const { data: booking, error } = await admin.from('residency_bookings').insert({
      residency_profile_id: listing.id,
      candidate_id: listing.candidate_profile_id,
      employer_id: employer.id,
      created_by: user.id,
      property_name: propertyName,
      start_date: startDate,
      end_date: endDate,
      days_required: daysRequired,
      proposed_day_rate: proposedDayRate,
      proposed_total: proposedTotal,
      platform_fee: platformFee,
      accommodation_included: body.accommodationIncluded === true,
      travel_included: body.travelIncluded === true,
      services_required: servicesRequired || null,
      notes: notes || null,
      status: 'offered',
    }).select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (listing.user_id) {
      await createNotification(
        listing.user_id,
        'general',
        `New residency offer from ${propertyName}`,
        `${daysRequired} days from ${startDate} to ${endDate} at £${proposedDayRate}/day. Review the full offer in your Residency dashboard.`,
        '/talent/residency',
      )
    }

    return NextResponse.json({ success: true, bookingId: booking.id, proposedTotal, platformFee })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not send residency offer.' }, { status: 500 })
  }
}
