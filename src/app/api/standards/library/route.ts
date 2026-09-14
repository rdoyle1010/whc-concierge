import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { fulfilCheckoutSession } from '@/lib/stripe-checkout-fulfilment'
import { ownedReferences } from '@/lib/documents/stock'
import { bundleReferenceMap } from '@/lib/documents/pricing-server'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { filesForOrders } from '@/lib/documents/entitlement'
import { FINANCE_REGISTER } from '@/lib/documents/finance/register'

// What a buyer owns, reached by the token in their receipt.
//
// Also the second path to getting what they paid for. The browser arrives here
// straight from Stripe with a session id, and rather than trusting it this
// asks Stripe whether that session was paid and runs exactly the same
// fulfilment the webhook runs. When a webhook URL was wrong for several days
// on this platform, every payment through it took the money and delivered
// nothing, and nobody noticed. One path is not enough for something somebody
// has paid for.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('t') || '').trim()
  const sessionId = String(req.nextUrl.searchParams.get('session_id') || '').trim()
  const admin = createAdminClient()

  // Straight back from Stripe. Deliver first, then show it.
  let resolvedToken = token
  if (!resolvedToken && sessionId) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status === 'paid') {
        await fulfilCheckoutSession(admin, session, { requestUrl: req.url })
      }
    } catch (caught: any) {
      console.error('[Standards library] could not confirm the session:', caught?.message)
    }

    const { data: order } = await admin.from('standards_orders')
      .select('access_token').eq('stripe_checkout_session_id', sessionId).maybeSingle()
    resolvedToken = order?.access_token || ''
  }

  if (!resolvedToken) {
    return NextResponse.json({
      error: 'That link does not open a library. Use the link in your receipt email, or tell us and we will resend it.',
    }, { status: 404 })
  }

  const { data: order, error } = await admin.from('standards_orders')
    .select('*').eq('access_token', resolvedToken).maybeSingle()
  // A library that cannot be read and a link that is wrong are different
  // facts, and telling a paying buyer the second when it is the first sends
  // them to ask for a refund for something they do own.
  if (error) {
    return NextResponse.json({
      error: 'We cannot reach your library just now. Nothing is lost: try again shortly, or tell us.',
    }, { status: 503 })
  }
  if (!order) {
    return NextResponse.json({
      error: 'That link does not open a library. Use the link in your receipt email, or tell us and we will resend it.',
    }, { status: 404 })
  }

  // Everything this buyer has ever bought, not just this order. Somebody who
  // buys a department in March and the library in June owns the union, and
  // showing them one order is showing them less than they paid for.
  const { data: theirs } = await admin.from('standards_orders')
    .select('pack_slug, document_reference, created_at')
    .ilike('buyer_email', order.buyer_email).order('created_at', { ascending: true })

  const orders = theirs?.length ? theirs : [order]
  const owned = ownedReferences(orders, await bundleReferenceMap(admin))

  // Only what is signed off can be downloaded, because only a signed off
  // document may leave this platform at all.
  const { data: approved } = await admin.from('operational_documents')
    .select('id, reference, title, department')
    .is('employer_id', null).eq('status', 'approved').limit(2000)

  const ready = new Map((approved || []).map((row: any) => [row.reference, row]))

  const documents = sellableCatalogue()
    .filter(entry => owned.has(entry.reference))
    .map(entry => {
      const live = ready.get(entry.reference)
      return {
        reference: entry.reference,
        title: entry.title,
        department: entry.department,
        // The id is what the download route needs, and it only exists for a
        // document that is actually there.
        id: live?.id || null,
        ready: Boolean(live),
      }
    })

  // Files that came with a pack. Listed beside the documents rather than in a
  // section of their own: a buyer thinks in terms of what they bought, not in
  // terms of which of it happens to be a PDF.
  const files = (await filesForOrders(orders, admin)).map(file => ({
    id: file.id,
    name: file.name,
    description: file.description,
    fileName: file.fileName,
    sizeBytes: file.sizeBytes,
  }))

  return NextResponse.json({
    buyer: { name: order.buyer_name, email: order.buyer_email },
    token: resolvedToken,
    documents,
    files,
    workbook: owned.has(FINANCE_REGISTER[0].reference),
    ready: documents.filter(entry => entry.ready).length,
    total: documents.length,
  })
}
