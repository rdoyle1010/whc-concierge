import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const tierPrices: Record<string, number> = {
  Silver: 15000,
  Gold: 20000,
  Platinum: 25000,
}

export async function POST(req: NextRequest) {
  try {
    const { tier, employerId, returnUrl } = await req.json()

    if (!tier || !tierPrices[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `WHC Concierge - ${tier} Job Posting`,
              description: `${tier} tier job listing on WHC Concierge`,
            },
            unit_amount: tierPrices[tier],
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl || process.env.NEXT_PUBLIC_SITE_URL}/employer/jobs?success=true`,
      cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_SITE_URL}/employer/jobs?cancelled=true`,
      metadata: {
        employer_id: employerId,
        tier,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
