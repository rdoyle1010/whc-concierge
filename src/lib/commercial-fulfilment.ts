import Stripe from 'stripe'

export type CommercialFulfilmentResult = {
  ok: boolean
  status: number
  product: string
  role: string
  error?: string
  message?: string
}

const KNOWN_PRODUCTS = ['talent_standard', 'talent_pro', 'featured_talent_7', 'featured_talent_30', 'employer_pro', 'employer_group', 'residency_featured', 'consultancy_featured']

/**
 * Write a paid checkout into the purchase ledger.
 *
 * The ledger is what a receipt is printed from and what the revenue page
 * counts, so anything missing from it cannot be receipted and does not appear
 * in the month's takings. Deliberately NOT recorded here are the products
 * already banked in their own tables - academy courses (course_enrolments),
 * agency shifts (agency_bookings), residency placements (residency_bookings)
 * and advertising (ad_placements). Adding those would double the month.
 *
 * Idempotent on stripe_session_id, so a webhook replay is harmless.
 */
export async function recordCommercialPurchase(admin: any, session: Stripe.Checkout.Session, productKey: string, userId: string) {
  if (!userId || !productKey) return
  const { error } = await admin.from('commercial_purchases').upsert({
    user_id: userId,
    product_key: productKey,
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    amount_pence: session.amount_total || 0,
    status: 'paid',
    metadata: session.metadata || {},
  }, { onConflict: 'stripe_session_id' })
  // A failed ledger write must not undo fulfilment - the buyer has paid and
  // should get what they bought. It is logged so it can be reconciled against
  // Stripe rather than disappearing.
  if (error) console.error('[ledger] purchase not recorded', productKey, session.id, error.message)
}

function fail(status: number, error: string, product: string, role: string): CommercialFulfilmentResult {
  return { ok: false, status, error, product, role }
}

// Shared by /api/commercial/confirm (instant UX on the redirect back) and the
// Stripe webhook (guaranteed delivery when the tab never returns). The
// commercial_purchases row keyed on stripe_session_id is the idempotency
// anchor: a fulfilled_at stamp in its metadata marks a completed run, so
// calling this twice for the same session is safe.
export async function fulfilCommercialPurchase(admin: any, stripe: Stripe, session: Stripe.Checkout.Session): Promise<CommercialFulfilmentResult> {
  const product = String(session.metadata?.product || '')
  const role = String(session.metadata?.role || '')
  const userId = String(session.metadata?.user_id || '')
  if (!KNOWN_PRODUCTS.includes(product)) return fail(400, 'Unsupported product', product, role)
  if (!userId) return fail(400, 'Missing purchaser on the checkout session', product, role)
  if (session.payment_status !== 'paid') return fail(409, 'Payment has not completed yet', product, role)

  const { data: existing } = await admin.from('commercial_purchases')
    .select('id, metadata').eq('stripe_session_id', session.id).maybeSingle()
  if (existing?.metadata?.fulfilled_at) return { ok: true, status: 200, product, role }

  // Revenue first: the ledger row is written before any profile change so a
  // paid purchase is always recorded even if fulfilment fails part-way.
  const { error: ledgerError } = await admin.from('commercial_purchases').upsert({
    user_id: userId,
    product_key: product,
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    amount_pence: session.amount_total || 0,
    status: 'paid',
    metadata: session.metadata || {},
  }, { onConflict: 'stripe_session_id' })
  if (ledgerError) return fail(500, `Purchase record failed: ${ledgerError.message}`, product, role)

  const now = new Date()
  let sub: any = typeof session.subscription === 'object' ? session.subscription : null
  if (!sub && typeof session.subscription === 'string') {
    // The webhook's session carries only the subscription id, unlike the
    // expanded retrieve in /api/commercial/confirm.
    try { sub = await stripe.subscriptions.retrieve(session.subscription) } catch { /* renewal date falls back to null */ }
  }
  const renewsAt = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null
  const subscriptionId = sub?.id || (typeof session.subscription === 'string' ? session.subscription : null)
  // The billing portal and webhook customer matching read stripe_customer_id
  // first, so both customer id columns are kept in step.
  const customerColumns = customerId
    ? { membership_stripe_customer_id: customerId, stripe_customer_id: customerId }
    : { membership_stripe_customer_id: customerId }

  if (product === 'talent_standard' || product === 'talent_pro') {
    const tier = product === 'talent_standard' ? 'standard' : 'pro'
    const credits = tier === 'standard' ? 1 : 10
    const cap = tier === 'standard' ? 3 : 20
    const discount = tier === 'standard' ? 10 : 20
    const featureCredits = tier === 'pro' ? 1 : 0
    const { data: profile } = await admin.from('candidate_profiles').select('id,interview_ready_credits').eq('user_id', userId).maybeSingle()
    if (!profile) return fail(404, 'Talent profile not found', product, role)
    const nextCredits = Math.min(cap, Number(profile.interview_ready_credits || 0) + credits)
    const { error } = await admin.from('candidate_profiles').update({ membership_tier: tier, membership_started_at: now.toISOString(), membership_renews_at: renewsAt, membership_stripe_subscription_id: subscriptionId, ...customerColumns, membership_cancel_at_period_end: Boolean(sub?.cancel_at_period_end), interview_ready_credits: nextCredits, academy_discount_pct: discount, free_feature_credits: featureCredits }).eq('id', profile.id)
    if (error) return fail(500, `Membership update failed: ${error.message}`, product, role)
  } else if (product === 'featured_talent_7' || product === 'featured_talent_30') {
    const days = Number(session.metadata?.featured_days || (product.endsWith('_7') ? 7 : 30))
    const { data: profile } = await admin.from('candidate_profiles').select('id,featured_until').eq('user_id', userId).maybeSingle()
    if (!profile) return fail(404, 'Talent profile not found', product, role)
    const existingUntil = profile.featured_until ? new Date(profile.featured_until) : null
    const start = existingUntil && existingUntil > now ? existingUntil : now
    const until = new Date(start.getTime() + days * 86400000)
    const { error } = await admin.from('candidate_profiles').update({ is_featured: true, featured_until: until.toISOString() }).eq('id', profile.id)
    if (error) return fail(500, `Featured update failed: ${error.message}`, product, role)
  } else if (product === 'employer_pro' || product === 'employer_group') {
    const tier = product === 'employer_pro' ? 'pro' : 'group'
    const { data: profile } = await admin.from('employer_profiles').select('id').eq('user_id', userId).maybeSingle()
    if (!profile) return fail(404, 'Employer profile not found', product, role)
    const { error } = await admin.from('employer_profiles').update({ membership_tier: tier, membership_started_at: now.toISOString(), membership_renews_at: renewsAt, membership_stripe_subscription_id: subscriptionId, ...customerColumns, membership_cancel_at_period_end: Boolean(sub?.cancel_at_period_end), annual_job_allowance: tier === 'group' ? 20 : 0, annual_jobs_used: 0 }).eq('id', profile.id)
    if (error) return fail(500, `Membership update failed: ${error.message}`, product, role)
  } else if (product === 'consultancy_featured') {
    // The payment is already banked, so a listing that cannot be found must
    // never come back as a bare 404 - the buyer is told it is recorded and
    // Talent House applies it by hand.
    const recordedMessage = 'Your payment is recorded. Your Consultancy listing could not be updated automatically - please contact Talent House and we will apply your Featured placement.'
    const days = Number(session.metadata?.featured_days || 30)
    const { data: listing } = await admin.from('consultancy_profiles')
      .select('id, featured_until').eq('user_id', userId).maybeSingle()
    if (!listing) return { ok: true, status: 200, product, role, message: recordedMessage }

    // Buying a second month while the first is still running extends it rather
    // than restarting it, or the buyer loses the days they already paid for.
    const existingUntil = listing.featured_until ? new Date(listing.featured_until) : null
    const start = existingUntil && existingUntil > now ? existingUntil : now
    const until = new Date(start.getTime() + days * 86400000)
    const { error } = await admin.from('consultancy_profiles')
      .update({ featured: true, featured_until: until.toISOString() }).eq('id', listing.id)
    if (error) return fail(500, `Consultancy featured update failed: ${error.message}`, product, role)
  } else if (product === 'residency_featured') {
    // The payment is already in the ledger, so a missing profile or listing
    // must never surface as a bare 404 - tell the member it is recorded.
    const recordedMessage = 'Your payment is recorded. Your Residency listing could not be updated automatically - please contact Talent House and we will apply your Featured placement.'
    const { data: profile } = await admin.from('candidate_profiles').select('id').eq('user_id', userId).maybeSingle()
    if (!profile) return { ok: true, status: 200, product, role, message: recordedMessage }

    // featured_until arrives with the paid-featured migration; fall back
    // gracefully until it exists so fulfilment never breaks.
    let { data: listing, error: listingError } = await admin.from('residency_profiles')
      .select('id, is_featured, featured_until').eq('candidate_profile_id', profile.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (listingError) {
      ({ data: listing, error: listingError } = await admin.from('residency_profiles')
        .select('id, is_featured').eq('candidate_profile_id', profile.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle())
    }
    if (listingError) return fail(500, `Residency listing lookup failed: ${listingError.message}`, product, role)
    if (!listing) return { ok: true, status: 200, product, role, message: recordedMessage }

    const existingUntil = listing.featured_until ? new Date(listing.featured_until) : null
    const start = existingUntil && existingUntil > now ? existingUntil : now
    const until = new Date(start.getTime() + 30 * 86400000)
    let { error: updateError } = await admin.from('residency_profiles').update({ is_featured: true, featured_until: until.toISOString() }).eq('id', listing.id)
    if (updateError) {
      ({ error: updateError } = await admin.from('residency_profiles').update({ is_featured: true }).eq('id', listing.id))
    }
    if (updateError) return fail(500, `Residency listing update failed: ${updateError.message}`, product, role)
  }

  await admin.from('commercial_purchases')
    .update({ metadata: { ...(session.metadata || {}), fulfilled_at: now.toISOString() } })
    .eq('stripe_session_id', session.id)
  return { ok: true, status: 200, product, role }
}
