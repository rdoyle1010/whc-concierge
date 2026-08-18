import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { assertStripeModeMatchesOrigin, getSafeSiteOrigin } from '@/lib/site-origin'

const RESIDENCY_MEMBERSHIP_PENCE = 1000

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in as talent.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const origin = getSafeSiteOrigin(body.returnUrl)
    assertStripeModeMatchesOrigin(origin)

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles').select('id,user_id,residency_member').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Complete your talent profile before joining Residency.' }, { status: 403 })
    if (candidate.residency_member) return NextResponse.json({ error: 'Your Residency membership is already active.' }, { status: 400 })

    const stripe = getStripe()
    const meta = { type: 'residency_listing', candidate_id: candidate.id, user_id: user.id }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: {
        currency: 'gbp',
        product_data: { name: 'Spa Platform - Residency Membership', description: 'Monthly specialist listing, hotel residency offers and booking management.' },
        unit_amount: RESIDENCY_MEMBERSHIP_PENCE,
        recurring: { interval: 'month' },
      }, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${origin}/residency/create?membership_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/residency/create?membership=cancelled`,
      metadata: meta,
      subscription_data: { metadata: meta },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not start Residency membership.' }, { status: 500 })
  }
}
