import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { getStripe } from '@/lib/stripe'

const SITE = 'https://talenthousecollective.co.uk'
const RESIDENCY_MEMBERSHIP_PENCE = 1000
const DURATIONS = new Set(['1-2 months','3-4 months','5-6 months','Flexible'])
const TRAVEL = new Set(['UK Only','Europe','Middle East','Asia Pacific','Global'])

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles')
    .select('id,full_name,profile_image_url,residency_member,residency_subscription_status,residency_subscription_ends_at')
    .eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })
  const { data: listing } = await admin.from('residency_profiles').select('*').eq('candidate_profile_id', candidate.id).maybeSingle()
  return NextResponse.json({ candidate, listing: listing || null, pricePence: RESIDENCY_MEMBERSHIP_PENCE })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles')
    .select('id,full_name,profile_image_url,residency_member,residency_subscription_status')
    .eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

  if (action === 'membership_checkout') {
    if (candidate.residency_member) return NextResponse.json({ error: 'Your Residency membership is already active.' }, { status: 400 })
    const stripe = getStripe()
    const meta = { type: 'residency_listing', candidate_id: candidate.id, user_id: user.id }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], customer_email: user.email || undefined, mode: 'subscription', allow_promotion_codes: true,
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: 'Talent House Residency Membership', description: 'Monthly specialist listing, Residency offers and booking management.' }, unit_amount: RESIDENCY_MEMBERSHIP_PENCE, recurring: { interval: 'month' } }, quantity: 1 }],
      success_url: `${SITE}/residency-setup?membership=success`, cancel_url: `${SITE}/residency-setup?membership=cancelled`,
      metadata: meta, subscription_data: { metadata: meta },
    })
    return NextResponse.json({ url: session.url })
  }

  if (action !== 'save_listing') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  if (!candidate.residency_member) return NextResponse.json({ error: 'An active £10/month Residency membership is required before you can publish a listing.' }, { status: 402 })

  const primary = String(body.primary_specialism || '').trim()
  if (primary.length < 3) return NextResponse.json({ error: 'Add your primary specialist area.' }, { status: 400 })
  const duration = DURATIONS.has(String(body.preferred_duration)) ? String(body.preferred_duration) : null
  const travel = TRAVEL.has(String(body.will_travel_to)) ? String(body.will_travel_to) : null
  const payload: Record<string, any> = {
    user_id: user.id,
    candidate_profile_id: candidate.id,
    full_name: candidate.full_name || primary,
    profile_photo_url: candidate.profile_image_url || null,
    primary_specialism: primary,
    bio: String(body.bio || '').trim() || null,
    secondary_specialisms: Array.isArray(body.secondary_specialisms) ? body.secondary_specialisms.filter(Boolean) : null,
    qualifications: Array.isArray(body.qualifications) ? body.qualifications.filter(Boolean) : null,
    brand_experience: Array.isArray(body.brand_experience) ? body.brand_experience.filter(Boolean) : null,
    current_location: String(body.current_location || '').trim() || null,
    will_travel_to: travel,
    preferred_duration: duration,
    day_rate: body.day_rate ? Number(body.day_rate) : null,
    weekly_rate: body.weekly_rate ? Number(body.weekly_rate) : null,
    monthly_rate: body.monthly_rate ? Number(body.monthly_rate) : null,
    negotiable: body.negotiable === true,
    available_from: body.available_from || null,
  }
  const { data: existing } = await admin.from('residency_profiles').select('id').eq('candidate_profile_id', candidate.id).maybeSingle()
  if (existing) {
    const { data, error } = await admin.from('residency_profiles').update(payload).eq('id', existing.id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, listing: data })
  }
  payload.approval_status = 'pending'
  const { data, error } = await admin.from('residency_profiles').insert(payload).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, listing: data })
}
