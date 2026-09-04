import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { AD_PLACEMENTS, isAdPlacement } from '@/lib/advertising'
import { sendAdvertSubmittedEmail } from '@/lib/advertising-emails'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId || typeof sessionId !== 'string') return NextResponse.json({ error: 'Missing checkout session.' }, { status: 400 })

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const meta = session.metadata
    if (session.status !== 'complete' || meta?.type !== 'sponsored_ad' || !isAdPlacement(meta?.placement) || !meta?.brand_name) {
      return NextResponse.json({ error: 'This is not a completed sponsored advert checkout.' }, { status: 400 })
    }

    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
    if (!paid) return NextResponse.json({ error: 'Stripe has not confirmed payment yet.' }, { status: 409 })

    const admin = createAdminClient()
    const record = {
      brand_name: meta.brand_name,
      category: 'Sponsored',
      placement: meta.placement,
      website_url: meta.website_url || null,
      tagline: meta.tagline || null,
      logo_url: meta.logo_url || null,
      contact_email: meta.contact_email || session.customer_details?.email || null,
      monthly_rate: Number(meta.monthly_pence || session.amount_total || 0) / 100,
      status: 'pending',
      payment_status: 'paid',
      review_status: 'pending',
      start_date: null,
      end_date: null,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripe_subscription_id: subscriptionId || null,
      stripe_checkout_session_id: session.id,
      terms_version: meta.terms_version || null,
      terms_accepted_at: meta.terms_accepted_at || null,
      updated_at: new Date().toISOString(),
    }

    const { data: advert, error } = await admin.from('ad_placements')
      .upsert(record, { onConflict: 'stripe_checkout_session_id' })
      .select('*')
      .single()
    if (error) throw error

    if (advert.contact_email && !advert.confirmation_email_sent_at) {
      const sent = await sendAdvertSubmittedEmail(
        advert.contact_email,
        advert.brand_name,
        AD_PLACEMENTS[advert.placement as keyof typeof AD_PLACEMENTS]?.label || 'Sponsored Advert',
        Number(advert.monthly_rate || 0),
      )
      if (sent) {
        await admin.from('ad_placements').update({ confirmation_email_sent_at: new Date().toISOString() }).eq('id', advert.id)
      }
    }

    return NextResponse.json({
      success: true,
      advert: {
        id: advert.id,
        brandName: advert.brand_name,
        placement: AD_PLACEMENTS[advert.placement as keyof typeof AD_PLACEMENTS]?.label || advert.placement,
        reviewStatus: advert.review_status,
      },
    })
  } catch (error: any) {
    console.error('[Sponsored advert confirmation]', error?.message)
    return NextResponse.json({ error: 'We confirmed your Stripe checkout but could not finish the advert submission. Please contact Talent House with your payment receipt.' }, { status: 500 })
  }
}
