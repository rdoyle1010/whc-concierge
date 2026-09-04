import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { JOB_TIERS, FEATURED_PROFILE_PRICE, AGENCY_LISTING_TIERS, AGENCY_PLATFORM_FEE_PCT, PREFERRED_EMPLOYER_PRICE, AGENCY_PLUS_MONTHLY_PRICE } from '@/lib/constants'
import { BUNDLE_PRICE, coursePrice, publicCoursePrice } from '@/lib/academy'
import { getAcademyCatalog, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { AD_PLACEMENTS, isAdPlacement } from '@/lib/advertising'
import { assertStripeModeMatchesOrigin, getSafeSiteOrigin } from '@/lib/site-origin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function secureUrl(value: unknown) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:' ? url.toString().slice(0, 500) : ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: caller must be logged in ──
    const cookieStore = await cookies()
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

    const body = await req.json()
    const { type, returnUrl } = body
    const origin = getSafeSiteOrigin(returnUrl)
    assertStripeModeMatchesOrigin(origin)
    const stripe = getStripe()

    // ── PUBLIC Academy purchase - no account needed. The guest pays £15 by
    // email; the webhook creates their learner account and emails access. ──
    if (type === 'course_public') {
      const { courseSlug, email } = body
      const course = await getAcademyCourseBySlug(String(courseSlug || ''), false)
      if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })
      const cleanEmail = String(email || '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address - your course access is sent there.' }, { status: 400 })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: cleanEmail,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Talent House Academy - ${course.title}`,
              description: 'Online course with certificate. Access details are emailed after payment.',
            },
            unit_amount: publicCoursePrice(course),
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/academy?purchased=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/academy?cancelled=true`,
        metadata: { type: 'course_public', course_slug: course.slug, buyer_email: cleanEmail },
      })
      return NextResponse.json({ url: session.url })
    }

    // Sponsored adverts are available to brands without a Talent House member
    // account. Payment starts the subscription; the advert remains pending
    // until Talent House approves the creative in Admin → Sponsored Ads.
    if (type === 'sponsored_ad') {
      const placement = body.placement
      const brandName = String(body.brandName || '').trim().slice(0, 120)
      const contactEmail = String(body.contactEmail || '').trim().toLowerCase().slice(0, 254)
      const tagline = String(body.tagline || '').trim().slice(0, 220)
      const websiteUrl = secureUrl(body.websiteUrl)
      const logoUrl = secureUrl(body.logoUrl)
      if (!isAdPlacement(placement)) return NextResponse.json({ error: 'Choose an advert location.' }, { status: 400 })
      if (!brandName || !tagline || !websiteUrl || !logoUrl || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return NextResponse.json({ error: 'Complete the brand, email, tagline and secure https:// website/logo links.' }, { status: 400 })
      }
      const config = AD_PLACEMENTS[placement]
      const metadata = {
        type: 'sponsored_ad',
        placement,
        brand_name: brandName,
        contact_email: contactEmail,
        tagline,
        website_url: websiteUrl,
        logo_url: logoUrl,
        monthly_pence: String(config.monthlyPence),
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: contactEmail,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `Talent House Sponsored Advert - ${config.label}`, description: config.description },
            unit_amount: config.monthlyPence,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/advertise?paid=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/advertise?cancelled=true`,
        metadata,
        subscription_data: { metadata },
      })
      return NextResponse.json({ url: session.url })
    }

    // Everything below requires a signed-in user.
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // ── Talent House Academy bundle - every course for £79 ──
    if (type === 'course_bundle') {
      const { candidateId } = body
      if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 })

      // The paying user must own the candidate profile being enrolled
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: cand } = await admin.from('candidate_profiles').select('id, user_id, academy_discount_pct').eq('id', candidateId).maybeSingle()
      if (!cand || cand.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Nothing to buy if every core course is already owned
      const { data: owned } = await admin.from('course_enrollments')
        .select('course_slug').eq('candidate_id', cand.id).not('paid_at', 'is', null)
      const coreCourses = (await getAcademyCatalog(false)).filter(course => course.is_core)
      const coreSlugs = coreCourses.map(course => course.slug)
      const ownedCore = new Set((owned || []).map((r: any) => r.course_slug).filter((slug: string) => coreSlugs.includes(slug)))
      if (!coreCourses.length || ownedCore.size >= coreCourses.length) {
        return NextResponse.json({ error: 'You already own every course in the core curriculum bundle.' }, { status: 400 })
      }

      // Member Academy discount, applied the same way as the mobile checkout.
      const discountPct = Math.max(0, Math.min(50, Number(cand.academy_discount_pct || 0)))
      const amountPence = Math.max(100, Math.round(BUNDLE_PRICE * (1 - discountPct / 100)))

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Talent House Academy - Core Curriculum Bundle (${coreCourses.length} courses)`,
              description: `All ${coreCourses.length} active core curriculum courses, with a certificate and profile badge for each on completion. Brand masterclasses and specialist care courses sold separately.`,
            },
            unit_amount: amountPence,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/academy?enrolled=bundle&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/talent/academy?cancelled=true`,
        metadata: { type: 'course_bundle', candidate_id: candidateId, user_id: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Talent House Academy course - one-off, certificate on completion ──
    if (type === 'course') {
      const { candidateId, courseSlug } = body
      if (!candidateId || !courseSlug) return NextResponse.json({ error: 'Missing candidateId or courseSlug' }, { status: 400 })
      const courseDef = await getAcademyCourseBySlug(String(courseSlug), false)
      if (!courseDef) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })
      // The paying user must own the candidate profile being enrolled
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: cand } = await admin.from('candidate_profiles').select('id, user_id, academy_discount_pct').eq('id', candidateId).maybeSingle()
      if (!cand || cand.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Member Academy discount, applied the same way as the mobile checkout.
      const discountPct = Math.max(0, Math.min(50, Number(cand.academy_discount_pct || 0)))
      const amountPence = Math.max(100, Math.round(coursePrice(courseDef) * (1 - discountPct / 100)))

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Talent House Academy - ${courseDef.title.slice(0, 80)}`,
              description: 'Online course with certificate and profile badge on completion',
            },
            unit_amount: amountPence,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/academy?enrolled=${encodeURIComponent(courseSlug)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/talent/academy?cancelled=true`,
        metadata: { type: 'course', candidate_id: candidateId, course_slug: courseSlug, user_id: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    if (type === 'featured_profile') {
      const { candidateId } = body
      if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 })

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: cand } = await admin.from('candidate_profiles')
        .select('id, user_id').eq('id', candidateId).maybeSingle()
      if (!cand || cand.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Talent House Collective - Featured Profile', description: 'Monthly featured profile subscription' },
            unit_amount: FEATURED_PROFILE_PRICE,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/talent/upgrade?cancelled=true`,
        metadata: { type: 'featured_profile', candidate_id: candidateId, user_id: user.id },
        subscription_data: { metadata: { type: 'featured_profile', candidate_id: candidateId, user_id: user.id } },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Agency booking payment - the PROPERTY pays the FULL amount at
    // acceptance: rate × hours + the Talent House platform fee. The therapist always
    // receives 100% of the agreed shift amount. Where the therapist has
    // connected Stripe payouts the shift money is transferred to them by
    // Stripe as the payment clears; otherwise Talent House collects it and settles by
    // bank transfer after the completed shift.
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

      // Stripe Connect. When the professional has finished payout onboarding
      // this becomes a DESTINATION CHARGE: the shift money is transferred to
      // them as the property pays, and Talent House keeps only its booking fee as the
      // application fee. The professional never waits on a Talent House bank transfer
      // and Talent House never holds their money. Amounts are identical either way.
      const { candidatePayoutAccount, agencyDestinationSplit, AGENCY_PAYOUT_CONNECT, AGENCY_PAYOUT_MANUAL } = await import('@/lib/agency-payouts')
      const payee = await candidatePayoutAccount(admin, booking.candidate_id)
      const split = agencyDestinationSplit(gross, fee)
      const payoutMethod = payee.ready && payee.accountId ? AGENCY_PAYOUT_CONNECT : AGENCY_PAYOUT_MANUAL

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Talent House Collective - Agency Shift Booking',
              description: `${booking.shift_date || 'Agreed date'}: £${booking.rate}/hr × ${effHours}h (£${gross}) + ${Math.round((fee / Math.max(1, gross)) * 100)}% Talent House fee (£${fee}). ${payoutMethod === AGENCY_PAYOUT_CONNECT ? `The therapist is paid the full £${gross} agreed shift amount directly by Stripe as this payment clears.` : `The therapist receives the full £${gross} agreed shift amount after the completed shift.`}`,
            },
            unit_amount: totalPounds * 100, // pounds → pence
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: false,
        ...(payoutMethod === AGENCY_PAYOUT_CONNECT && payee.accountId ? {
          payment_intent_data: {
            transfer_data: { destination: payee.accountId },
            application_fee_amount: split.applicationFeePence,
            metadata: { type: 'agency_booking', booking_id: booking.id, candidate_id: String(booking.candidate_id || '') },
          },
        } : {}),
        success_url: `${origin}/employer/agency?paid=processing&booking=${encodeURIComponent(booking.id)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/employer/agency?paid=cancelled`,
        metadata: { type: 'agency_booking', booking_id: booking.id, employer_id: emp.id, user_id: user.id, gross: String(gross), fee: String(fee), payout_method: payoutMethod },
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
              name: `Talent House Collective - Agency Register (${tierConfig.label})`,
              description: `Monthly agency listing subscription - ${tierConfig.display}`,
            },
            unit_amount: tierConfig.price,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/agency?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
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
              name: 'Talent House Collective - Preferred Employer Registration',
              description: 'Annual registration. Book agency cover, carry the Preferred Employer badge.',
            },
            unit_amount: PREFERRED_EMPLOYER_PRICE,
            recurring: { interval: 'year' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/employer/agency?registered=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/employer/agency?registered=cancelled`,
        metadata: meta,
        subscription_data: { metadata: meta },
      })
      return NextResponse.json({ url: session.url })
    }

    if (type === 'agency_plus') {
      const { employerId } = body
      if (!employerId) return NextResponse.json({ error: 'Missing employerId' }, { status: 400 })

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: emp } = await admin.from('employer_profiles').select('id, user_id, agency_plus_active').eq('id', employerId).maybeSingle()
      if (!emp || emp.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (emp.agency_plus_active) {
        return NextResponse.json({ error: 'Agency Plus is already active on this account.' }, { status: 400 })
      }

      let pricePence = AGENCY_PLUS_MONTHLY_PRICE
      try {
        const { getCommercialSetting } = await import('@/lib/commercial-settings')
        const setting = await getCommercialSetting('agency_plus_monthly')
        if (setting?.is_active && setting.price_pence > 0) pricePence = setting.price_pence
      } catch { /* fall back to the constant */ }

      const meta = { type: 'agency_plus', employer_id: employerId, user_id: user.id }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Talent House Agency Plus',
              description: 'Monthly membership: reduced 10% booking fee, priority cover and the Agency Plus badge. Professionals always keep 100% of the agreed rate.',
            },
            unit_amount: pricePence,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/employer/agency?plus=active&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/employer/agency?plus=cancelled`,
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

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const [{ data: emp }, { data: job }] = await Promise.all([
        admin.from('employer_profiles').select('id, user_id, purchase_order_ref').eq('id', employerId).maybeSingle(),
        admin.from('job_listings').select('id, employer_id').eq('id', jobId).maybeSingle(),
      ])
      if (!emp || emp.user_id !== user.id || !job || job.employer_id !== emp.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // The purchase order comes from the property's own billing settings, not
      // from this checkout: a hotel issues one PO for a supplier and expects it
      // on everything, and asking again at every payment is how it gets typed
      // wrong. Stripe metadata values are capped, so it is trimmed to fit.
      const poRef = String(emp.purchase_order_ref || '').trim().slice(0, 100)

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `Talent House Collective - ${tier} Job Posting`, description: `${tierConfig.days}-day listing` },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/employer/jobs?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/employer/post-role?cancelled=true`,
        metadata: { type: 'job_posting', tier, employer_id: employerId, job_id: jobId, days: String(tierConfig.days), user_id: user.id, ...(poRef ? { po_number: poRef } : {}) },
      })
      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
