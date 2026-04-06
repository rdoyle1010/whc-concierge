import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    // ── Auth: caller must be logged in ──
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* read-only in Route Handlers */ },
        },
      }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // ── Get Stripe customer ID from talent or employer profile ──
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Check candidate_profiles first
    const { data: candidateProfile } = await supabaseAuth
      .from('candidate_profiles')
      .select('stripe_customer_id')
      .eq('user_id', authUser.id)
      .single()

    // Check employer_profiles if no candidate profile
    const { data: employerProfile } = await supabaseAuth
      .from('employer_profiles')
      .select('stripe_customer_id')
      .eq('user_id', authUser.id)
      .single()

    const stripeCustomerId = candidateProfile?.stripe_customer_id || employerProfile?.stripe_customer_id

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found. Please create a subscription first.' },
        { status: 400 }
      )
    }

    // ── Create Stripe billing portal session ──
    const referrer = req.headers.get('referer') || ''
    let returnUrl = '/talent/billing'
    if (referrer.includes('/employer')) {
      returnUrl = '/employer/billing'
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}${returnUrl}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create billing portal session' }, { status: 500 })
  }
}
