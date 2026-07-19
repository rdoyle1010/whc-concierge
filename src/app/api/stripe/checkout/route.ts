import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { JOB_TIERS, FEATURED_PROFILE_PRICE, AGENCY_LISTING_TIERS, AGENCY_PLATFORM_FEE_PCT, PREFERRED_EMPLOYER_PRICE } from '@/lib/constants'
import { COURSE_PRICE } from '@/lib/academy'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Only allow redirects back to our own domain
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://talent.wellnesshousecollective.co.uk',
  'https://whc-concierge.netlify.app',
].filter(Boolean) as string[]

function getSafeOrigin(untrusted?: string): string {
  if (untrusted && ALLOWED_ORIGINS.some(o => untrusted.startsWith(o))) return untrusted
  return ALLOWED_ORIGINS[0] || 'https://talent.wellnesshousecollective.co.uk'
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: caller must be logged in ──
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* read-only in Route Handlers */ },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await req.json()
    const { type, returnUrl } = body
    const origin = getSafeOrigin(returnUrl)

    // ── WHC Academy course - £10 one-off, certificate on completion ──
    if (type === 'course') {
      const { candidateId, courseSlug, courseTitle } = body
      if (!candidateId || !courseSlug) return NextResponse.json({ error: 'Missing candidateId or courseSlug' }, { status: 400 })

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `WHC Academy - ${String(courseTitle || courseSlug).slice(0, 80)}`,
              description: 'Online course with certificate and profile badge on completion',
            },
            unit_amount: COURSE_PRICE,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/academy?enrolled=${encodeURIComponent(courseSlug)}`,
        cancel_url: `${origin}/talent/academy?cancelled=true`,
        metadata: { type: 'course', candidate_id: candidateId, course_slug: courseSlug, user_id: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    if (type === 'featured_profile') {
      const { candidateId } = body
      if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 })

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: 'WHC Concierge - Featured Profile', description: 'Monthly featured profile subscription' },
            unit_amount: FEATURED_PROFILE_PRICE,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/upgrade?success=true`,
        cancel_url: `${origin}/talent/upgrade?cancelled=true`,
        metadata: { type: 'featured_profile', candidate_id: candidateId, user_id: user.id },
        subscription_data: { metadata: { type: 'featured_profile', candidate_id: candidateId, user_id: user.id } },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Agency booking payment - the PROPERTY pays the FULL amount through
    // WHC at acceptance: rate × hours + 10% platform fee. WHC pays the
    // therapist out after the shift, minus 5% (handled in Admin → Agency).
    if (type === 'agency_booking') {
      const { bookingId } = body
      if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', bookingId).maybeSingle()
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

      // The paying employer must own the booking
      const { data: emp } = await admin.from('employer_profiles').select('id, user_id').eq('id', booking.employer_id).maybeSingle()
      if (!emp || emp.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (booking.status !== 'accepted') {
        return NextResponse.json({ error: `Payment is due once a shift is accepted (this one is ${booking.status}).` }, { status: 400 })
      }
      if (booking.paid_at || booking.fee_paid_at) {
        return NextResponse.json({ error: 'This booking has already been paid.' }, { status: 400 })
      }

      const effHours = booking.hours && booking.hours > 0 ? booking.hours : 8
      const gross = (booking.rate || 0) * effHours
      const fee = booking.platform_fee && booking.platform_fee > 0
        ? booking.platform_fee
        : Math.ceil(gross * AGENCY_PLATFORM_FEE_PCT)
      const totalPounds = gross + fee
      if (!gross || totalPounds <= 0) {
        return NextResponse.json({ error: 'Could not work out the total for this booking.' }, { status: 400 })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'WHC Concierge - Agency Shift Booking',
              description: `${booking.shift_date || 'Agreed date'}: £${booking.rate}/hr × ${effHours}h (£${gross}) + 10% WHC fee (£${fee}). The therapist is paid by WHC after the shift.`,
            },
            unit_amount: totalPounds * 100, // pounds → pence
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/employer/agency?paid=true`,
        cancel_url: `${origin}/employer/agency?paid=cancelled`,
        metadata: { type: 'agency_booking', booking_id: booking.id, employer_id: emp.id, user_id: user.id, gross: String(gross), fee: String(fee) },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Agency register listing - therapists pay £10/mo (basic) or £20/mo
    // (featured) to appear on the register. Webhook flips agency_available.
    if (type === 'agency_listing') {
      const { candidateId, tier } = body
      if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 })
      const tierConfig = AGENCY_LISTING_TIERS[tier as keyof typeof AGENCY_LISTING_TIERS]
      if (!tierConfig) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: cand } = await admin.from('candidate_profiles').select('id, user_id').eq('id', candidateId).maybeSingle()
      if (!cand || cand.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const meta = { type: 'agency_listing', candidate_id: candidateId, tier, user_id: user.id }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `WHC Concierge - Agency Register (${tierConfig.label})`,
              description: `Monthly agency listing subscription - ${tierConfig.display}`,
            },
            unit_amount: tierConfig.price,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/agency?subscribed=true`,
        cancel_url: `${origin}/talent/agency/settings?cancelled=true`,
        metadata: meta,
        subscription_data: { metadata: meta },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Preferred Employer registration - hotels pay £150/year to book
    // agency cover. Webhook flips preferred_employer on payment.
    if (type === 'employer_registration') {
      const { employerId } = body
      if (!employerId) return NextResponse.json({ error: 'Missing employerId' }, { status: 400 })

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: emp } = await admin.from('employer_profiles').select('id, user_id').eq('id', employerId).maybeSingle()
      if (!emp || emp.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const meta = { type: 'employer_registration', employer_id: employerId, user_id: user.id }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'WHC Concierge - Preferred Employer Registration',
              description: 'Annual registration. Book agency cover, carry the Preferred Employer badge.',
            },
            unit_amount: PREFERRED_EMPLOYER_PRICE,
            recurring: { interval: 'year' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/employer/agency?registered=true`,
        cancel_url: `${origin}/employer/agency?registered=cancelled`,
        metadata: meta,
        subscription_data: { metadata: meta },
      })
      return NextResponse.json({ url: session.url })
    }

    if (type === 'job_posting') {
      const { tier, employerId, jobId } = body
      if (!employerId || !jobId) return NextResponse.json({ error: 'Missing employerId or jobId' }, { status: 400 })

      const tierConfig = JOB_TIERS[tier as keyof typeof JOB_TIERS]
      if (!tierConfig) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `WHC Concierge - ${tier} Job Posting`, description: `${tierConfig.days}-day listing` },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/employer/jobs?success=true`,
        cancel_url: `${origin}/employer/post-role?cancelled=true`,
        metadata: { type: 'job_posting', tier, employer_id: employerId, job_id: jobId, days: String(tierConfig.days), user_id: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

