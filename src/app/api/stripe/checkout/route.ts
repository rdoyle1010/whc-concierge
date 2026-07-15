import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { JOB_TIERS, FEATURED_PROFILE_PRICE, AGENCY_LISTING_TIERS } from '@/lib/constants'
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

    if (type === 'featured_profile') {
      const { candidateId } = body
      if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 })

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: 'WHC Concierge — Featured Profile', description: 'Monthly featured profile subscription' },
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

    // Agency register listing — candidate pays a monthly subscription to be
    // discoverable for agency shifts. The webhook flips agency_available on
    // successful payment; nothing is granted before Stripe confirms.
    if (type === 'agency_listing') {
      const { candidateId, tier } = body
      if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 })
      const tierConfig = AGENCY_LISTING_TIERS[tier as keyof typeof AGENCY_LISTING_TIERS]
      if (!tierConfig) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

      // The candidate must own the profile they are listing
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
              name: `WHC Concierge — Agency Register (${tierConfig.label})`,
              description: `Monthly agency listing subscription — ${tierConfig.display}`,
            },
            unit_amount: tierConfig.price,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: `${origin}/talent/agency?subscribed=true`,
        cancel_url: `${origin}/talent/onboarding?step=9&cancelled=true`,
        metadata: meta,
        // Also stamp the subscription itself, so customer.subscription.*
        // webhook events can be routed without guessing.
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
            product_data: { name: `WHC Concierge — ${tier} Job Posting`, description: `${tierConfig.days}-day listing` },
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

