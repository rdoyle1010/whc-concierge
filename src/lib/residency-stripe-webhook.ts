import Stripe from 'stripe'
import { createNotification } from '@/lib/notifications'

function periodEnd(subscription: Stripe.Subscription) {
  const itemEnd = Number((subscription.items?.data?.[0] as any)?.current_period_end || 0)
  const subscriptionEnd = Number((subscription as any)?.current_period_end || 0)
  const unix = itemEnd || subscriptionEnd
  return unix > 0 ? new Date(unix * 1000).toISOString() : null
}

async function setResidencyMembership(supabase: any, subscription: Stripe.Subscription, activeOverride?: boolean) {
  const meta = subscription.metadata || {}
  if (meta.type !== 'residency_listing' || !meta.candidate_id) return false

  const active = activeOverride ?? ['active', 'trialing'].includes(subscription.status)
  const { error } = await supabase.from('candidate_profiles').update({
    residency_member: active,
    residency_subscription_id: subscription.id,
    residency_subscription_status: subscription.status,
    residency_subscription_ends_at: periodEnd(subscription),
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null,
  }).eq('id', meta.candidate_id)

  if (error) throw new Error(`Residency membership update failed: ${error.message}`)
  return true
}

async function fulfillResidencyBooking(supabase: any, session: Stripe.Checkout.Session) {
  const meta = session.metadata || {}
  if (meta.type !== 'residency_booking' || !meta.booking_id) return false
  if (session.payment_status !== 'paid') return true

  const gross = Number(meta.gross || 0)
  const fee = Number(meta.fee || 0)
  const totalPaid = Number(((session.amount_total || 0) / 100).toFixed(2))

  const { data: booking, error: bookingError } = await supabase.from('residency_bookings')
    .select('id,candidate_id,employer_id,property_name,start_date,end_date,status,paid_at')
    .eq('id', meta.booking_id)
    .maybeSingle()
  if (bookingError) throw new Error(`Residency booking lookup failed: ${bookingError.message}`)
  if (!booking) throw new Error('Residency booking not found for Stripe payment')

  const alreadyFulfilled = Boolean(booking.paid_at && booking.status === 'confirmed')
  if (!alreadyFulfilled) {
    const payout = Math.max(0, gross)
    const { data: claimed, error } = await supabase.from('residency_bookings').update({
      status: 'confirmed',
      paid_at: new Date().toISOString(),
      amount_paid: totalPaid || gross + fee,
      platform_fee: fee,
      payout_amount: payout,
      payout_status: 'pending',
      stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    }).eq('id', booking.id).is('paid_at', null).select('id').maybeSingle()
    if (error) throw new Error(`Residency booking fulfilment failed: ${error.message}`)
    if (!claimed) return true // the redirect confirmation already fulfilled and notified

    try {
      const [{ data: candidate }, { data: employer }] = await Promise.all([
        supabase.from('candidate_profiles').select('user_id').eq('id', booking.candidate_id).maybeSingle(),
        supabase.from('employer_profiles').select('user_id,property_name,company_name').eq('id', booking.employer_id).maybeSingle(),
      ])
      const propertyName = booking.property_name || employer?.property_name || employer?.company_name || 'the property'
      if (candidate?.user_id) {
        await createNotification(
          candidate.user_id,
          'general',
          'Residency confirmed - payment received',
          `Your Residency with ${propertyName} is confirmed. The agreed booking is now secured through Spa Platform.`,
          '/talent/residency',
        )
      }
      if (employer?.user_id) {
        await createNotification(
          employer.user_id,
          'general',
          'Residency payment received',
          'Your Residency booking with the specialist is confirmed and secured through Spa Platform.',
          '/employer/residency',
        )
        await createNotification(employer.user_id, 'general', 'Complete your Property Fact File', 'Your confirmed specialist receives a Before You Arrive pack built from your Property Fact File - the more complete it is, the better their arrival goes.', '/employer/property-fact-file')
      }
      if (candidate?.user_id) {
        await createNotification(candidate.user_id, 'general', 'Your Before You Arrive pack is ready', `Everything you need for ${propertyName} - travel, arrival and property details - is in your Before You Arrive pack.`, '/talent/before-you-arrive')
      }
    } catch (error: any) {
      console.error('Residency payment notification failed (non-fatal):', error?.message)
    }
  }

  return true
}

export async function handleResidencyStripeEvent(event: Stripe.Event, stripe: Stripe, supabase: any) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.type === 'residency_booking') return fulfillResidencyBooking(supabase, session)
    if (session.metadata?.type === 'residency_listing') {
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      if (!subscriptionId) return true
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      await setResidencyMembership(supabase, subscription)
      return true
    }
    return false
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const rawSubscription = (invoice as any).subscription || (invoice as any).parent?.subscription_details?.subscription
    const subscriptionId = typeof rawSubscription === 'string' ? rawSubscription : rawSubscription?.id
    if (!subscriptionId) return false
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    if (subscription.metadata?.type !== 'residency_listing') return false
    await setResidencyMembership(supabase, subscription, event.type === 'invoice.paid' && ['active', 'trialing'].includes(subscription.status))
    return true
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    if (subscription.metadata?.type !== 'residency_listing') return false
    await setResidencyMembership(supabase, subscription)
    return true
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    if (subscription.metadata?.type !== 'residency_listing' || !subscription.metadata?.candidate_id) return false
    const { error } = await supabase.from('candidate_profiles').update({
      residency_member: false,
      residency_subscription_id: subscription.id,
      residency_subscription_status: 'canceled',
      residency_subscription_ends_at: periodEnd(subscription),
    }).eq('id', subscription.metadata.candidate_id)
    if (error) throw new Error(`Residency cancellation update failed: ${error.message}`)
    return true
  }

  return false
}
