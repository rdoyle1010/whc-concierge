import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing checkout session.' }, { status: 400 })

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(String(sessionId))
    if (session.payment_status !== 'paid' || session.metadata?.type !== 'residency_listing') {
      return NextResponse.json({ error: 'Residency membership payment has not completed.' }, { status: 400 })
    }
    if (session.metadata.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    let endsAt: string | null = null
    let status = 'active'
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      status = subscription.status
      const periodEnd = Number((subscription.items?.data?.[0] as any)?.current_period_end || (subscription as any)?.current_period_end || 0)
      if (periodEnd) endsAt = new Date(periodEnd * 1000).toISOString()
    }

    const admin = createAdminClient()
    const { error } = await admin.from('candidate_profiles').update({
      residency_member: status === 'active' || status === 'trialing',
      residency_subscription_id: subscriptionId || null,
      residency_subscription_status: status,
      residency_subscription_ends_at: endsAt,
    }).eq('id', session.metadata.candidate_id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, status, endsAt })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not activate Residency membership.' }, { status: 500 })
  }
}
