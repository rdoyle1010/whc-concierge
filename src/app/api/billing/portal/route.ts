import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertStripeModeMatchesOrigin, getSafeSiteOrigin } from '@/lib/site-origin'
import { getRequestUser } from '@/lib/request-user'

const RETURN_PATHS = new Set(['/billing', '/talent/membership', '/employer/membership'])

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const admin = createAdminClient()
    const [{ data: cand }, { data: emp }] = await Promise.all([
      admin.from('candidate_profiles').select('stripe_customer_id,membership_stripe_customer_id').eq('user_id', user.id).maybeSingle(),
      admin.from('employer_profiles').select('stripe_customer_id,membership_stripe_customer_id').eq('user_id', user.id).maybeSingle(),
    ])

    const scope = String(body.scope || '')
    const customerId = scope === 'featured_employer' && emp
      ? emp.stripe_customer_id
      : cand?.membership_stripe_customer_id || cand?.stripe_customer_id || emp?.membership_stripe_customer_id || emp?.stripe_customer_id || null
    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found yet. It is created with your first subscription payment.' }, { status: 400 })
    }

    const origin = getSafeSiteOrigin(body.returnUrl || req.headers.get('origin'))
    assertStripeModeMatchesOrigin(origin)
    const role = emp ? 'employer' : 'talent'
    const requestedReturnPath = String(body.returnPath || '')
    const returnPath = RETURN_PATHS.has(requestedReturnPath) ? requestedReturnPath : `/${role}/membership`
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${returnPath}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
