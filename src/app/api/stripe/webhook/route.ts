import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata

      if (meta?.type === 'featured_profile' && meta?.candidate_id) {
        await supabase.from('candidate_profiles').update({
          is_featured: true,
          featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: session.customer as string,
        }).eq('id', meta.candidate_id)
      }

      if (meta?.type === 'job_posting' && meta?.job_id) {
        const days = meta.days ? parseInt(meta.days) : 30
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('job_listings').update({
          is_live: true,
          status: 'active',
          expires_at: expiresAt,
        }).eq('id', meta.job_id)

        if (meta.employer_id) {
          await supabase.from('employer_profiles').update({
            subscription_tier: meta.tier,
            stripe_customer_id: session.customer as string,
          }).eq('id', meta.employer_id)
        }
      }
      break
    }
    case 'checkout.session.expired': {
      // Clean up orphaned pending-payment jobs when checkout expires
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata
      if (meta?.type === 'job_posting' && meta?.job_id) {
        await supabase.from('job_listings').delete()
          .eq('id', meta.job_id)
          .eq('status', 'pending_payment')
          .eq('is_live', false)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      if (!customerId) break

      const { data: candidate } = await supabase
        .from('candidate_profiles')
        .select('id, is_featured')
        .eq('stripe_customer_id', customerId)
        .eq('is_featured', true)
        .single()

      if (candidate) {
        const attemptCount = invoice.attempt_count || 0
        if (attemptCount >= 2) {
          await supabase.from('candidate_profiles').update({
            is_featured: false,
            featured_until: null,
          }).eq('id', candidate.id)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        await supabase.from('candidate_profiles').update({
          is_featured: false,
          featured_until: null,
        }).eq('stripe_customer_id', customerId)
      }

      if (subscription.status === 'active') {
        await supabase.from('candidate_profiles').update({
          is_featured: true,
          featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      await supabase.from('candidate_profiles').update({ is_featured: false, featured_until: null }).eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
