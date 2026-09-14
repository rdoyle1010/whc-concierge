import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { getRequestUser } from '@/lib/request-user'
import { CURRENCY, SINGLE_DOCUMENT_PRICE, VAT_NOTE } from '@/lib/documents/pricing'
import { priceSingle, pricePack } from '@/lib/documents/stock'
import { DOCUMENT_STATUS } from '@/lib/documents/status'

// Buying a document.
//
// No account required, deliberately. A spa director is buying a procedure,
// not joining a platform, and a registration form standing between a decision
// and a payment is where the decision goes to die. They pay, and the receipt
// carries a link to their library.
//
// The price is worked out here and never sent by the browser. A checkout that
// trusts an amount from the page is a checkout somebody buys the complete
// library through for a pound.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const packSlug = typeof body.packSlug === 'string' ? body.packSlug.trim() : ''
  const reference = typeof body.reference === 'string' ? body.reference.trim() : ''

  if (Boolean(packSlug) === Boolean(reference)) {
    return NextResponse.json({ error: 'Choose either a pack or a single document.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // What is actually on the shelf, read now rather than trusted from the page.
  const { data: rows, error } = await admin.from('operational_documents')
    .select('reference').is('employer_id', null).eq('status', 'approved').limit(2000)
  if (error) {
    return NextResponse.json({
      error: 'We cannot reach the library to confirm what is ready, so nothing has been charged. Try again shortly.',
    }, { status: 503 })
  }
  const approved = new Set((rows || []).map((row: any) => row.reference))

  const purchase = packSlug
    ? pricePack(packSlug, approved)
    : priceSingle(reference, approved, SINGLE_DOCUMENT_PRICE)
  if (!purchase.ok) return NextResponse.json({ error: purchase.reason }, { status: 400 })

  // Signed in is a convenience, never a requirement. It links the order to an
  // account so it shows up on their dashboard later.
  const user = await getRequestUser(req).catch(() => null)

  const origin = req.nextUrl.origin
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Stripe collects it, so a guest never has to type an address twice and
      // the receipt has somewhere to go.
      customer_email: (user as any)?.email || undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: purchase.amountPence,
          product_data: {
            name: purchase.description,
            // Said at the moment of payment, not afterwards. What they are
            // buying is a professional template to review and sign off, and a
            // buyer who learns that after paying is a refund and a review.
            description: `${DOCUMENT_STATUS} ${VAT_NOTE}`,
          },
        },
      }],
      // The shape every other fulfilment branch on this platform reads.
      metadata: {
        type: 'standards',
        ...(purchase.packSlug ? { pack_slug: purchase.packSlug } : {}),
        ...(purchase.reference ? { document_reference: purchase.reference } : {}),
        ...(user?.id ? { buyer_user_id: user.id } : {}),
      },
      success_url: `${origin}/standards/library?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/standards`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a payment page. Nothing has been charged.' }, { status: 502 })
    }
    return NextResponse.json({ url: session.url })
  } catch (caught: any) {
    console.error('[Standards checkout] failed:', caught?.message)
    return NextResponse.json({
      error: 'That could not be started, and nothing has been charged. Try again, or tell us and we will invoice you.',
    }, { status: 502 })
  }
}
