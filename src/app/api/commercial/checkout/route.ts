import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSafeSiteOrigin, assertStripeModeMatchesOrigin } from '@/lib/site-origin'
import { TALENT_MEMBERSHIPS, FEATURED_TALENT, EMPLOYER_MEMBERSHIPS } from '@/lib/constants'
import { getRequestUser } from '@/lib/request-user'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const product = String(body.product || '')
  const origin = getSafeSiteOrigin(body.returnUrl)
  assertStripeModeMatchesOrigin(origin)
  const stripe = getStripe()

  let amount = 0
  let name = ''
  let description = ''
  let mode: 'payment' | 'subscription' = 'payment'
  let successPath = '/'
  let metadata: Record<string,string> = { user_id: user.id, product }

  if (product === 'talent_standard' || product === 'talent_pro') {
    const tier = product === 'talent_standard' ? 'standard' : 'pro'
    const cfg = TALENT_MEMBERSHIPS[tier]
    amount = cfg.price; name = `WHC Concierge - ${cfg.label}`; mode = 'subscription'; successPath = '/talent/membership'
    description = tier === 'standard' ? 'Monthly career membership with Interview Ready credit, enhanced matching and 10% Academy discount.' : 'Priority career membership with 10 Interview Ready credits monthly, advanced preparation and 20% Academy discount.'
    metadata = { ...metadata, role: 'talent', tier }
  } else if (product === 'featured_talent_7' || product === 'featured_talent_30') {
    const cfg = product === 'featured_talent_7' ? FEATURED_TALENT.seven_days : FEATURED_TALENT.thirty_days
    amount = cfg.price; name = `WHC Concierge - ${cfg.label}`; mode = 'payment'; successPath = '/talent/membership'
    description = `${cfg.days} days of premium visibility in employer searches and WHC featured placements.`
    metadata = { ...metadata, role: 'talent', featured_days: String(cfg.days) }
  } else if (product === 'employer_pro' || product === 'employer_group') {
    const tier = product === 'employer_pro' ? 'pro' : 'group'
    const cfg = EMPLOYER_MEMBERSHIPS[tier]
    amount = cfg.price; name = `WHC Concierge - ${cfg.label}`; mode = 'subscription'; successPath = '/employer/membership'
    description = tier === 'pro' ? 'Annual employer membership with full talent search, enhanced matching, analytics and £99 Standard Jobs.' : 'Annual multi-property membership with up to 20 included job listings and advanced recruitment tools.'
    metadata = { ...metadata, role: 'employer', tier }
  } else {
    return NextResponse.json({ error: 'Unknown commercial product' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: user.email || undefined,
    line_items: [{ price_data: { currency: 'gbp', product_data: { name, description }, unit_amount: amount, ...(mode === 'subscription' ? { recurring: { interval: product.startsWith('employer_') ? 'year' as const : 'month' as const } } : {}) }, quantity: 1 }],
    mode,
    allow_promotion_codes: true,
    success_url: `${origin}${successPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${successPath}?checkout=cancelled`,
    metadata,
    ...(mode === 'subscription' ? { subscription_data: { metadata } } : {}),
  })
  return NextResponse.json({ url: session.url })
}
