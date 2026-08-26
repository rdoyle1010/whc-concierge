import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { getStripe } from '@/lib/stripe'
import { BUNDLE_PRICE, coursePrice } from '@/lib/academy'
import { getAcademyCatalog, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'

const SITE = 'https://talent.wellnesshousecollective.co.uk'

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const product = String(body.product || '')
    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id,user_id,academy_discount_pct')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

    const discountPct = Math.max(0, Math.min(50, Number(candidate.academy_discount_pct || 0)))
    const stripe = getStripe()

    if (product === 'course') {
      const slug = String(body.courseSlug || '')
      const course = await getAcademyCourseBySlug(slug, false)
      if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })

      const { data: owned } = await admin.from('course_enrollments')
        .select('id,paid_at').eq('candidate_id', candidate.id).eq('course_slug', slug).maybeSingle()
      if (owned?.paid_at) return NextResponse.json({ error: 'You already own this course.' }, { status: 400 })

      const basePence = coursePrice(course)
      const amountPence = Math.max(100, Math.round(basePence * (1 - discountPct / 100)))
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: user.email || undefined,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `WHC Academy - ${course.title}`, description: 'Online course with assessment, certificate and profile badge on completion.' },
            unit_amount: amountPence,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${SITE}/talent/academy?enrolled=${encodeURIComponent(slug)}`,
        cancel_url: `${SITE}/talent/academy?cancelled=true`,
        metadata: { type: 'course', candidate_id: candidate.id, course_slug: slug, user_id: user.id },
      })
      return NextResponse.json({ url: session.url, amountPence, basePence, discountPct })
    }

    if (product === 'bundle') {
      const courses = (await getAcademyCatalog(false)).filter(course => course.is_core)
      const slugs = courses.map(course => course.slug)
      const { data: owned } = slugs.length
        ? await admin.from('course_enrollments').select('course_slug,paid_at').eq('candidate_id', candidate.id).in('course_slug', slugs)
        : { data: [] as any[] }
      const ownedSet = new Set((owned || []).filter((row: any) => row.paid_at).map((row: any) => row.course_slug))
      if (courses.length && courses.every(course => ownedSet.has(course.slug))) {
        return NextResponse.json({ error: 'You already own every course in the core curriculum bundle.' }, { status: 400 })
      }

      const amountPence = Math.max(100, Math.round(BUNDLE_PRICE * (1 - discountPct / 100)))
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: user.email || undefined,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: `WHC Academy - Core Curriculum Bundle (${courses.length} courses)`, description: 'All active core curriculum courses, each with an assessment, certificate and profile badge.' },
            unit_amount: amountPence,
          },
          quantity: 1,
        }],
        mode: 'payment',
        allow_promotion_codes: true,
        success_url: `${SITE}/talent/academy?enrolled=bundle`,
        cancel_url: `${SITE}/talent/academy?cancelled=true`,
        metadata: { type: 'course_bundle', candidate_id: candidate.id, user_id: user.id },
      })
      return NextResponse.json({ url: session.url, amountPence, basePence: BUNDLE_PRICE, discountPct })
    }

    return NextResponse.json({ error: 'Unknown Academy product.' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not start Academy checkout.' }, { status: 500 })
  }
}
