import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { AD_PLACEMENTS, AD_TERMS_VERSION, isAdPlacement } from '@/lib/advertising'
import { getCommercialSetting } from '@/lib/commercial-settings'
import { assertStripeModeMatchesOrigin, getSafeSiteOrigin } from '@/lib/site-origin'

function secureUrl(value: unknown) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:' ? url.toString().slice(0, 500) : ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const placement = body.placement
    if (!isAdPlacement(placement)) return NextResponse.json({ error: 'Choose an advert location.' }, { status: 400 })
    if (body.termsAccepted !== true) return NextResponse.json({ error: 'Please accept the Advertising Terms & Conditions before continuing.' }, { status: 400 })

    const brandName = String(body.brandName || '').trim().slice(0, 120)
    const contactEmail = String(body.contactEmail || '').trim().toLowerCase().slice(0, 254)
    const tagline = String(body.tagline || '').trim().slice(0, 220)
    const websiteUrl = secureUrl(body.websiteUrl)
    const logoUrl = secureUrl(body.logoUrl)
    if (!brandName || !tagline || !websiteUrl || !logoUrl || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: 'Complete the brand, email, tagline and secure https:// website/logo links.' }, { status: 400 })
    }

    const productKey = `ad_${placement}`
    const setting = await getCommercialSetting(productKey)
    if (!setting || !setting.is_active) return NextResponse.json({ error: 'This advert placement is not currently available.' }, { status: 400 })
    if (setting.billing_interval !== 'month') return NextResponse.json({ error: 'Sponsored advert placements must currently use monthly billing.' }, { status: 400 })

    const config = AD_PLACEMENTS[placement]
    const origin = getSafeSiteOrigin(body.returnUrl)
    assertStripeModeMatchesOrigin(origin)
    const stripe = getStripe()
    const acceptedAt = new Date().toISOString()
    const metadata = {
      type: 'sponsored_ad',
      placement,
      brand_name: brandName,
      contact_email: contactEmail,
      tagline,
      website_url: websiteUrl,
      logo_url: logoUrl,
      monthly_pence: String(setting.price_pence),
      pricing_source: 'commercial_settings',
      terms_version: AD_TERMS_VERSION,
      terms_accepted_at: acceptedAt,
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: contactEmail,
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Talent House Sponsored Advert - ${setting.label || config.label}`,
            description: `${setting.description || config.description} Rolling monthly subscription; renews until cancelled.`,
          },
          unit_amount: setting.price_pence,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${origin}/advertise?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/advertise?cancelled=true`,
      metadata,
      subscription_data: { metadata },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not start payment.' }, { status: 500 })
  }
}
