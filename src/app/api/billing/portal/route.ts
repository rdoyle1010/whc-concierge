import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Stripe customer portal for subscription management. Called (with no body)
// by /talent/billing, which redirects to the returned { url }.

// Only allow return redirects back to our own domain
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://talent.wellnesshousecollective.co.uk',
  'https://whc-concierge.netlify.app',
].filter(Boolean) as string[]

function getSafeOrigin(untrusted?: string | null): string {
  if (untrusted) {
    try {
      const o = new URL(untrusted).origin
      if (ALLOWED_ORIGINS.includes(o)) return o
    } catch { /* fall through to the default */ }
  }
  return ALLOWED_ORIGINS[0] || 'https://talent.wellnesshousecollective.co.uk'
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: caller must be logged in ──
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // ── Find the caller's Stripe customer id (candidate first, employer as
    // a fallback so the handler can serve both sides later) ──
    const admin = createAdminClient()
    const { data: cand } = await admin
      .from('candidate_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId: string | null = cand?.stripe_customer_id || null
    if (!customerId) {
      const { data: emp } = await admin
        .from('employer_profiles')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()
      customerId = emp?.stripe_customer_id || null
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account found for your profile yet - it is created with your first subscription payment.' },
        { status: 400 }
      )
    }

    const origin = getSafeOrigin(req.headers.get('origin'))
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/talent/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
