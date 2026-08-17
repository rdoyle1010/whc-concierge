import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCommercialSetting } from '@/lib/commercial-settings'
import { getStripe } from '@/lib/stripe'
import { assertStripeModeMatchesOrigin, getSafeSiteOrigin } from '@/lib/site-origin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const employerId = String(body.employerId || '')
    const origin = getSafeSiteOrigin(body.returnUrl)
    assertStripeModeMatchesOrigin(origin)

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id,user_id,property_name,company_name,featured_employer,featured_until')
      .eq('id', employerId)
      .maybeSingle()
    if (!employer || employer.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const setting = await getCommercialSetting('featured_employer')
    if (!setting || !setting.is_active) {
      return NextResponse.json({ error: 'Featured Hotel is currently unavailable.' }, { status: 400 })
    }
    if (setting.billing_interval !== 'month' && setting.billing_interval !== 'year') {
      return NextResponse.json({ error: 'Featured Hotel must use recurring billing.' }, { status: 500 })
    }

    const metadata = {
      type: 'featured_employer',
      employer_id: employer.id,
      user_id: user.id,
      commercial_product_key: setting.product_key,
      charged_pence: String(setting.price_pence),
    }
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `WHC Concierge - ${setting.label}`,
            description: setting.description,
          },
          unit_amount: setting.price_pence,
          recurring: { interval: setting.billing_interval },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${origin}/employer/billing?featured=success`,
      cancel_url: `${origin}/employer/billing?featured=cancelled`,
      metadata,
      subscription_data: { metadata },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not start checkout' }, { status: 500 })
  }
}
