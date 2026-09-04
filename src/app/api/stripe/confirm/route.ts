import { NextRequest, NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/request-user'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { fulfilCheckoutSession } from '@/lib/stripe-checkout-fulfilment'

// The second path to getting what you paid for.
//
// Fulfilment used to happen in the Stripe webhook and nowhere else, so the
// webhook was the only thing standing between a payment and a delivery. When
// its URL was wrong for several days every purchase through it took the money
// and delivered nothing - no course access, no agency listing, no featured
// placement - with no way for the buyer to say so and nothing on the platform
// that would ever notice.
//
// This runs the same fulfilment, from the other side, the moment the browser
// comes back from Stripe. Whichever arrives first wins; the second is a no-op,
// because the event ledger and each branch's own record make it idempotent.
//
// It confirms with Stripe rather than trusting the caller, and only for the
// person who paid: a session id is not a secret worth relying on, and
// delivering a purchase nobody made would be a worse failure than the one
// this fixes.

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const { sessionId } = await req.json().catch(() => ({ sessionId: '' }))
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Which payment?' }, { status: 400 })
  }

  const stripe = getStripe()
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return NextResponse.json({ error: 'We could not find that payment with Stripe.' }, { status: 404 })
  }

  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  if (!paid) {
    return NextResponse.json({ ok: false, detail: 'Stripe has not confirmed this payment yet.' }, { status: 409 })
  }

  // The session records who was signed in when checkout began. Anyone else
  // presenting it - including somebody who found the id in a shared link or a
  // browser history - gets nothing.
  const buyer = String(session.metadata?.user_id || '')
  if (buyer && buyer !== user.id) {
    const admin = createAdminClient()
    const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (account?.role !== 'admin') return NextResponse.json({ error: 'This payment belongs to another account.' }, { status: 403 })
  }

  const admin = createAdminClient()

  // The same event-ledger row the webhook writes, so the two cannot both
  // fulfil the same session. A row already present means the webhook got here
  // first and the work is done.
  const ledgerId = `confirm:${session.id}`
  try {
    const { error } = await admin.from('stripe_events')
      .insert({ event_id: ledgerId, type: 'checkout.session.completed', payload: { session_id: session.id } as any })
    if (error && ((error as any).code === '23505' || /duplicate key|already exists/i.test(String(error.message)))) {
      return NextResponse.json({ ok: true, alreadyFulfilled: true, detail: 'This payment has already been applied.' })
    }
  } catch { /* a missing ledger must never stop somebody getting what they paid for */ }

  const outcome = await fulfilCheckoutSession(admin, session, { requestUrl: req.url })

  if (!outcome.ok) {
    // Release the claim so the webhook's retry, or a second attempt here, is
    // new work rather than a duplicate we silently acknowledge.
    try { await admin.from('stripe_events').delete().eq('event_id', ledgerId) } catch { }
    return NextResponse.json({
      ok: false,
      detail: 'Your payment went through but we could not finish setting it up. We have been told, and it will complete shortly.',
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, detail: 'Payment confirmed and applied.' })
}
