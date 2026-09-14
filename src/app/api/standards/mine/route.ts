import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ownedReferences } from '@/lib/documents/stock'
import { bundleReferenceMap } from '@/lib/documents/pricing-server'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { getStripe } from '@/lib/stripe'
import { fulfilCheckoutSession } from '@/lib/stripe-checkout-fulfilment'

// Everything the signed-in person has bought, wherever they bought it from.
//
// Matched on the account and on the address, because most of these are bought
// before anybody signs up: a spa director pays, and creates an account weeks
// later when they come back for a department. Matching only on the account id
// would show them an empty shelf and a support email, so the address counts
// too, and their email address is confirmed by Supabase rather than typed.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  // Straight back from Stripe. Deliver before listing, rather than showing an
  // empty shelf to somebody who has just paid and waiting on a webhook.
  //
  // This is the second path, and it exists because fulfilment in the webhook
  // alone once took the money and delivered nothing for days on this platform
  // when its URL was wrong, with nothing that would ever have noticed.
  const sessionId = String(req.nextUrl.searchParams.get('session_id') || '').trim()
  if (sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId)
      if (session.payment_status === 'paid') {
        await fulfilCheckoutSession(admin, session, { requestUrl: req.url })
      }
    } catch (caught: any) {
      console.error('[Standards] could not confirm the session:', caught?.message)
    }
  }

  const { data: orders, error } = await admin.from('standards_orders')
    .select('id, pack_slug, document_reference, amount_pence, created_at, access_token, buyer_user_id, buyer_email')
    .or(`buyer_user_id.eq.${user.id},buyer_email.ilike.${(user.email || '').replace(/[,()]/g, '')}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({
      error: 'We cannot reach your documents just now. Nothing is lost: try again shortly.',
    }, { status: 503 })
  }

  // An order bought before they had an account is claimed onto it the first
  // time they look, so it is theirs on every device from then on.
  const unclaimed = (orders || []).filter(order => !order.buyer_user_id).map(order => order.id)
  if (unclaimed.length) {
    await admin.from('standards_orders')
      .update({ buyer_user_id: user.id, updated_at: new Date().toISOString() }).in('id', unclaimed)
  }

  const owned = ownedReferences(orders || [], await bundleReferenceMap(admin))

  const { data: approved } = await admin.from('operational_documents')
    .select('reference, title, department')
    .is('employer_id', null).eq('status', 'approved').limit(2000)
  const ready = new Set((approved || []).map((row: any) => row.reference))

  return NextResponse.json({
    documents: sellableCatalogue()
      .filter(entry => owned.has(entry.reference))
      .map(entry => ({
        reference: entry.reference,
        title: entry.title,
        department: entry.department,
        ready: ready.has(entry.reference),
      })),
    orders: (orders || []).map(order => ({
      id: order.id,
      packSlug: order.pack_slug,
      reference: order.document_reference,
      amountPence: order.amount_pence,
      boughtOn: order.created_at,
      // The link from their receipt, so a purchase made before they had an
      // account is still reachable from a phone that is not signed in.
      link: order.access_token,
    })),
  })
}
