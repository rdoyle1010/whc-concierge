import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { getRequestUser } from '@/lib/request-user'
import { fulfilCommercialPurchase } from '@/lib/commercial-fulfilment'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const sessionId = String(body.sessionId || '')
  if (!sessionId.startsWith('cs_')) return NextResponse.json({ error: 'Invalid checkout session' }, { status: 400 })

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })
  if (session.metadata?.user_id !== user.id) return NextResponse.json({ error: 'This payment belongs to another account' }, { status: 403 })
  if (session.payment_status !== 'paid') return NextResponse.json({ error: 'Payment has not completed yet' }, { status: 409 })

  // The webhook is the guaranteed fulfilment path; this endpoint reruns the
  // same idempotent logic so the member sees the result immediately.
  const admin = createAdminClient()
  const result = await fulfilCommercialPurchase(admin, stripe, session)
  if (!result.ok) return NextResponse.json({ error: result.error || 'Could not confirm the payment' }, { status: result.status })
  return NextResponse.json({ success: true, product: result.product, role: result.role, ...(result.message ? { message: result.message } : {}) })
}
