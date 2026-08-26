import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { getStripe } from '@/lib/stripe'
import { geocodePostcode } from '@/lib/geo'
import { AGENCY_LISTING_TIERS } from '@/lib/constants'

const SITE = 'https://talent.wellnesshousecollective.co.uk'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles')
    .select('id,full_name,approval_status,whc_verified,has_insurance,agency_available,agency_tier,agency_listed_until,hourly_rate,phone,sms_opt_in,postcode,travel_radius_miles,latitude,longitude,stripe_customer_id')
    .eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

  return NextResponse.json({
    candidate: {
      ...candidate,
      location_verified: candidate.latitude != null && candidate.longitude != null,
      approved_for_agency: candidate.approval_status === 'approved',
    },
    tiers: {
      basic: AGENCY_LISTING_TIERS.basic,
      featured: AGENCY_LISTING_TIERS.featured,
    },
  })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles')
    .select('id,user_id,approval_status,agency_available,hourly_rate,phone,postcode,travel_radius_miles,stripe_customer_id')
    .eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

  if (action === 'save') {
    const rate = body.hourly_rate === '' || body.hourly_rate == null ? null : Number(body.hourly_rate)
    const radius = body.travel_radius_miles === '' || body.travel_radius_miles == null ? null : Number(body.travel_radius_miles)
    if (rate != null && (!Number.isFinite(rate) || rate < 1 || rate > 500)) {
      return NextResponse.json({ error: 'Hourly rate must be between £1 and £500.' }, { status: 400 })
    }
    if (radius != null && (!Number.isFinite(radius) || radius < 1 || radius > 250)) {
      return NextResponse.json({ error: 'Travel radius must be between 1 and 250 miles.' }, { status: 400 })
    }
    const postcode = String(body.postcode || '').trim().toUpperCase()
    const update: Record<string, any> = {
      hourly_rate: rate == null ? null : Math.round(rate),
      phone: String(body.phone || '').trim() || null,
      postcode: postcode || null,
      travel_radius_miles: radius == null ? null : Math.round(radius),
    }
    if (typeof body.sms_opt_in === 'boolean') update.sms_opt_in = body.sms_opt_in
    if (postcode) {
      const coords = await geocodePostcode(postcode)
      if (!coords) return NextResponse.json({ error: `We couldn't find the postcode "${postcode}". Please check it and try again.` }, { status: 400 })
      update.latitude = coords.latitude
      update.longitude = coords.longitude
    }
    const { error } = await admin.from('candidate_profiles').update(update).eq('id', candidate.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'manage_subscription') {
    if (!candidate.stripe_customer_id) {
      return NextResponse.json({ error: 'No Agency billing account found yet.' }, { status: 400 })
    }
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: candidate.stripe_customer_id,
      return_url: `${SITE}/agency-account`,
    })
    return NextResponse.json({ url: session.url })
  }

  if (action === 'checkout') {
    if (candidate.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Your Talent profile must be approved by WHC before you can join the Agency register.' }, { status: 403 })
    }
    if (candidate.agency_available) {
      return NextResponse.json({ error: 'Your Agency listing is already active. Use Manage subscription instead.' }, { status: 400 })
    }
    const rate = Number(body.hourly_rate ?? candidate.hourly_rate)
    const phone = String(body.phone ?? candidate.phone ?? '').trim()
    const postcode = String(body.postcode ?? candidate.postcode ?? '').trim().toUpperCase()
    const radius = Number(body.travel_radius_miles ?? candidate.travel_radius_miles)
    if (!Number.isFinite(rate) || rate <= 0 || !phone || !postcode || !Number.isFinite(radius) || radius <= 0) {
      return NextResponse.json({ error: 'Add your hourly rate, mobile number, postcode and travel radius before joining the Agency register.' }, { status: 400 })
    }

    const tier = String(body.tier || 'basic') as keyof typeof AGENCY_LISTING_TIERS
    const tierConfig = AGENCY_LISTING_TIERS[tier]
    if (!tierConfig) return NextResponse.json({ error: 'Choose Basic or Featured Agency.' }, { status: 400 })

    const coords = await geocodePostcode(postcode)
    if (!coords) return NextResponse.json({ error: `We couldn't find the postcode "${postcode}". Please check it and try again.` }, { status: 400 })
    await admin.from('candidate_profiles').update({
      hourly_rate: Math.round(rate), phone, postcode, travel_radius_miles: Math.round(radius),
      latitude: coords.latitude, longitude: coords.longitude,
      ...(typeof body.sms_opt_in === 'boolean' ? { sms_opt_in: body.sms_opt_in } : {}),
    }).eq('id', candidate.id)

    const stripe = getStripe()
    const meta = { type: 'agency_listing', candidate_id: candidate.id, tier, user_id: user.id }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email || undefined,
      line_items: [{ price_data: {
        currency: 'gbp',
        product_data: { name: `WHC Agency Register - ${tierConfig.label}`, description: tierConfig.features.join(' · ') },
        unit_amount: tierConfig.price,
        recurring: { interval: 'month' },
      }, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${SITE}/agency-account?agency=success`,
      cancel_url: `${SITE}/agency-account?agency=cancelled`,
      metadata: meta,
      subscription_data: { metadata: meta },
    })
    return NextResponse.json({ url: session.url })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
