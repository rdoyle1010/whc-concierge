import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CURRENCY, VAT_NOTE, singlePrice } from '@/lib/documents/pricing'
import { loadPrices, loadBundles, referencesInBundle } from '@/lib/documents/pricing-server'
import { priceSingle, pricePack } from '@/lib/documents/stock'
import { DOCUMENT_STATUS, FILE_STATUS } from '@/lib/documents/status'
import { soldSeparately } from '@/lib/documents/attachments'
import { toolBySlug } from '@/lib/documents/tools/registry'
import { loadAttachments } from '@/lib/documents/attachments-server'

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
  // An account, before anything is charged.
  //
  // A guest checkout puts the whole purchase in one email: lose it, change
  // job, leave the property, and a library somebody paid for is gone with no
  // way for us to prove they own it or for them to get it back. A document
  // bought once is referred to for years, so the account is not a hurdle in
  // front of the sale, it is where the thing they bought is kept.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({
      error: 'Create an account or sign in first. Documents are kept in your account, '
        + 'so they are still there in a year when you need them again.',
      needsAccount: true,
    }, { status: 401 })
  }

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

  // Live prices, read at the moment of sale. A shop showing one number and a
  // checkout charging another is a refund and a review, and it is the kind of
  // fault nobody finds until a buyer does.
  const prices = await loadPrices(admin)

  // A bundle is one of her own, so it is checked before the coded packs: a
  // bundle named the same as a pack sells the bundle, which is the one she
  // built deliberately.
  // A file sold on its own.
  //
  // Checked before bundles and packs because its slug is prefixed and cannot
  // collide with either, and because the answer is cheap: a workbook has no
  // documents to be part-finished, so there is nothing to verify against the
  // shelf. It either exists, is live and is priced, or it is not for sale.
  // A tool built in code. Checked first because it needs no database at all:
  // it either is one of ours or it is not.
  const tool = packSlug ? toolBySlug(packSlug) : null

  const file = !tool && packSlug
    ? soldSeparately(await loadAttachments(true, admin)).find(entry => entry.slug === packSlug)
    : null

  const bundle = !tool && !file && packSlug
    ? (await loadBundles(true, admin)).find(entry => entry.slug === packSlug)
    : null
  let purchase
  if (tool) {
    purchase = {
      ok: true as const,
      description: tool.name,
      amountPence: tool.pricePence,
      packSlug: tool.slug,
      isFile: true as const,
    }
  } else if (file) {
    purchase = {
      ok: true as const,
      description: file.name,
      amountPence: file.pricePence as number,
      packSlug: file.slug as string,
      isFile: true as const,
    }
  } else if (bundle) {
    const references = referencesInBundle(bundle, prices)
    const missing = references.filter(entry => !approved.has(entry))
    purchase = missing.length
      ? {
          ok: false as const,
          reason: `${references.length - missing.length} of ${references.length} in that bundle are signed off. `
            + 'We do not sell a bundle part-finished. Tell us you want it and we will prioritise the rest.',
        }
      : {
          ok: true as const,
          description: `${bundle.name} (${references.length} documents)`,
          amountPence: bundle.pricePence,
          packSlug: bundle.slug,
        }
  } else {
    purchase = packSlug
      ? pricePack(packSlug, approved, prices)
      : priceSingle(reference, approved, singlePrice(prices))
  }
  if (!purchase.ok) return NextResponse.json({ error: purchase.reason }, { status: 400 })

  const origin = req.nextUrl.origin
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // The account's own address, not one typed at the till. A receipt sent
      // to an address that is not the account is a purchase the account
      // cannot find afterwards, which is the entire failure this prevents.
      customer_email: user.email,
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
            description: `${'isFile' in purchase && purchase.isFile ? FILE_STATUS : DOCUMENT_STATUS} ${VAT_NOTE}`,
          },
        },
      }],
      // The shape every other fulfilment branch on this platform reads.
      metadata: {
        type: 'standards',
        ...(purchase.packSlug ? { pack_slug: purchase.packSlug } : {}),
        ...(purchase.reference ? { document_reference: purchase.reference } : {}),
        buyer_user_id: user.id,
      },
      success_url: `${origin}/my-documents?session_id={CHECKOUT_SESSION_ID}`,
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
