import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { JOB_TIERS, FEATURED_PROFILE_PRICE, AGENCY_LISTING_TIERS, AGENCY_PLATFORM_FEE_PCT, PREFERRED_EMPLOYER_PRICE } from '@/lib/constants'
import { BUNDLE_PRICE, coursePrice, publicCoursePrice } from '@/lib/academy'
import { getAcademyCatalog, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { AD_PLACEMENTS, isAdPlacement } from '@/lib/advertising'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Only allow redirects back to our own domain
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://talent.wellnesshousecollective.co.uk',
  'https://whc-concierge.netlify.app',
].filter(Boolean) as string[]

function getSafeOrigin(untrusted?: string): string {
  // Exact origin match only - a startsWith prefix check would accept
  // 'https://whc-concierge.netlify.app.attacker.com' and hand Stripe an
  // attacker-controlled success/cancel URL.
  if (untrusted) {
    try {
      const o = new URL(untrusted).origin
      if (ALLOWED_ORIGINS.includes(o)) return o
    } catch { /* fall through to the safe default */ }
  }
  return ALLOWED_ORIGINS[0] || 'https://talent.wellnesshousecollective.co.uk'
}

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
    const stripe = getStripe()
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
    const origin = getSafeOrigin(returnUrl)

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
              name: `WHC Academy - ${course.title}`,
              description: 'Online course with certificate. Access details are emailed after payment.',
            },
            unit_amount: publicCoursePrice(course),
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/academy?purchased=true`,
        cancel_url: `${origin}/academy?cancelled=true`,
        metadata: { type: 'course_public', course_slug: course.slug, buyer_email: cleanEmail },
      })
      return NextResponse.json({ url: session.url })
    }

    // Sponsored adverts are available to brands without a WHC member
    // account. Payment starts the subscription; the advert remains pending
    // until WHC approves the creative in Admin → Sponsored Ads.
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
            product_data: { name: `WHC Sponsored Advert - ${config.label}`, description: config.description },
            unit_amount: config.monthlyPence,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/advertise?paid=true`,
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

    // ── WHC Academy bundle - every course for £79 ──
    if (type === 'course_bundle') {
      const { candidateId } = body
      if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 })

      // The paying user must own the candidate profile being enrolled
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: cand } = await admin.from('candidate_profiles').select('id, user_id').eq('id', candidateId).maybeSingle()
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

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `WHC Academy - Core Curriculum Bundle (${coreCourses.length} courses)`,
              description: `All ${coreCourses.length} active core curriculum courses, with a certificate and profile badge for each on completion. Brand masterclasses and specialist care courses sold separately.`,
            },
            unit_amount: BUNDLE_PRICE,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/academy?enrolled=bundle`,
        cancel_url: `${origin}/talent/academy?cancelled=true`,
        metadata: { type: 'course_bundle', candidate_id: candidateId, user_id: user.id },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── WHC Academy course - one-off, certificate on completion ──
    if (type === 'course') {
      const { candidateId, courseSlug } = body
      if (!candidateId || !courseSlug) return NextResponse.json({ error: 'Missing candidateId or courseSlug' }, { status: 400 })
      const courseDef = await getAcademyCourseBySlug(String(courseSlug), false)
      if (!courseDef) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })

      // The paying user must own the candidate profile being enrolled
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const { data: cand } = await admin.from('candidate_profiles').select('id, user_id').eq('id', candidateId).maybeSingle()
      if (!cand || cand.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `WHC Academy - ${courseDef.title.slice(0, 80)}`,
              description: 'Online course with certificate and profile badge on completion',
            },
            unit_amount: coursePrice(courseDef),
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

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const [{ data: emp }, { data: job }] = await Promise.all([
        admin.from('employer_profiles').select('id, user_id').eq('id', employerId).maybeSingle(),
        admin.from('job_listings').select('id, employer_id').eq('id', jobId).maybeSingle(),
      ])
      if (!emp || emp.user_id !== user.id || !job || job.employer_id !== emp.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

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
