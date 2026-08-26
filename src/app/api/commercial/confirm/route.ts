import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { getRequestUser } from '@/lib/request-user'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const sessionId = String(body.sessionId || '')
  if (!sessionId.startsWith('cs_')) return NextResponse.json({ error: 'Invalid checkout session' }, { status: 400 })

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })
  if (session.metadata?.user_id !== user.id) return NextResponse.json({ error: 'This payment belongs to another account' }, { status: 403 })
  if (session.payment_status !== 'paid') return NextResponse.json({ error: 'Payment has not completed yet' }, { status: 409 })

  const product = String(session.metadata?.product || '')
  const role = String(session.metadata?.role || '')
  const admin = createAdminClient()
  const now = new Date()
  const sub: any = typeof session.subscription === 'object' ? session.subscription : null
  const renewsAt = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null
  const subscriptionId = sub?.id || (typeof session.subscription === 'string' ? session.subscription : null)

  if (product === 'talent_standard' || product === 'talent_pro') {
    const tier = product === 'talent_standard' ? 'standard' : 'pro'
    const credits = tier === 'standard' ? 1 : 10
    const cap = tier === 'standard' ? 3 : 20
    const discount = tier === 'standard' ? 10 : 20
    const featureCredits = tier === 'pro' ? 1 : 0
    const { data: profile } = await admin.from('candidate_profiles').select('id,interview_ready_credits').eq('user_id', user.id).maybeSingle()
    if (!profile) return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })
    const nextCredits = Math.min(cap, Number(profile.interview_ready_credits || 0) + credits)
    await admin.from('candidate_profiles').update({ membership_tier: tier, membership_started_at: now.toISOString(), membership_renews_at: renewsAt, membership_stripe_subscription_id: subscriptionId, membership_stripe_customer_id: customerId, membership_cancel_at_period_end: Boolean(sub?.cancel_at_period_end), interview_ready_credits: nextCredits, academy_discount_pct: discount, free_feature_credits: featureCredits }).eq('id', profile.id)
  } else if (product === 'featured_talent_7' || product === 'featured_talent_30') {
    const days = Number(session.metadata?.featured_days || (product.endsWith('_7') ? 7 : 30))
    const { data: profile } = await admin.from('candidate_profiles').select('id,featured_until').eq('user_id', user.id).maybeSingle()
    if (!profile) return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })
    const existing = profile.featured_until ? new Date(profile.featured_until) : null
    const start = existing && existing > now ? existing : now
    const until = new Date(start.getTime() + days * 86400000)
    await admin.from('candidate_profiles').update({ is_featured: true, featured_until: until.toISOString() }).eq('id', profile.id)
  } else if (product === 'employer_pro' || product === 'employer_group') {
    const tier = product === 'employer_pro' ? 'pro' : 'group'
    const { data: profile } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!profile) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    await admin.from('employer_profiles').update({ membership_tier: tier, membership_started_at: now.toISOString(), membership_renews_at: renewsAt, membership_stripe_subscription_id: subscriptionId, membership_stripe_customer_id: customerId, membership_cancel_at_period_end: Boolean(sub?.cancel_at_period_end), annual_job_allowance: tier === 'group' ? 20 : 0, annual_jobs_used: 0 }).eq('id', profile.id)
  } else {
    return NextResponse.json({ error: 'Unsupported product' }, { status: 400 })
  }

  await admin.from('commercial_purchases').upsert({ user_id: user.id, product_key: product, stripe_session_id: session.id, stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null, amount_pence: session.amount_total || 0, status: 'paid', metadata: session.metadata || {} }, { onConflict: 'stripe_session_id' })
  return NextResponse.json({ success: true, product, role })
}
