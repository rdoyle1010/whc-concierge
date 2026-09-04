import type Stripe from 'stripe'
import { recordCommercialPurchase } from './commercial-fulfilment'
import { createNotification } from './notifications'

// Publishing a paid role, in one place.
//
// Every other purchase on this platform is fulfilled twice over: once by
// /api/commercial/confirm the moment the browser comes back from Stripe, and
// again by the webhook for the case where the tab never returns. Job adverts -
// the commonest thing a property buys - only ever had the webhook. So a
// webhook that is late, refused or misrouted leaves the property looking at
// "Complete payment" on a role it has already paid for, with no way to say so
// and nothing on the platform that will ever notice.
//
// This is the shared half. Calling it twice for the same session is safe: the
// listing update is idempotent, and the ledger row is keyed on the Stripe
// session id.

export type PublishResult =
  | { ok: true; published: boolean; heldForApproval: boolean }
  | { ok: false; reason: string }

export async function publishPaidJobPosting(
  admin: any,
  session: Stripe.Checkout.Session,
  options?: { onPublished?: (jobId: string) => void },
): Promise<PublishResult> {
  const meta = session.metadata || {}
  if (meta.type !== 'job_posting' || !meta.job_id) {
    return { ok: false, reason: 'This checkout was not for a job advert.' }
  }
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  if (!paid) return { ok: false, reason: 'Stripe has not confirmed this payment yet.' }

  await recordCommercialPurchase(
    admin, session,
    String(meta.tier || '').toLowerCase() === 'bronze' ? 'standard_job' : `job_${String(meta.tier || 'standard').toLowerCase()}`,
    String(meta.user_id || ''),
  )

  const days = meta.days ? parseInt(meta.days) : 30
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  // Safety net behind the publish gate: if payment completes while the
  // employer is still unapproved, keep the paid term but hold the role as a
  // draft until approval.
  let employerApproved = true
  if (meta.employer_id) {
    const { data: paidEmployer } = await admin.from('employer_profiles')
      .select('approval_status,user_id').eq('id', meta.employer_id).maybeSingle()
    employerApproved = paidEmployer?.approval_status === 'approved'
    if (!employerApproved && paidEmployer?.user_id) {
      await createNotification(
        paidEmployer.user_id, 'general',
        'Payment received - role held for approval',
        'Your role is paid for and will go live automatically as soon as Talent House approves your employer account.',
        '/employer/jobs',
      ).catch?.(() => {})
    }
  }

  await admin.from('job_listings').update({
    is_live: employerApproved,
    status: employerApproved ? 'active' : 'draft',
    expires_at: expiresAt,
    // The free publish path stamps posted_date too - without it paid roles
    // sort and display as undated.
    posted_date: new Date().toISOString(),
  }).eq('id', meta.job_id)

  // Instrumentation: the paid posting is the moment a role truly enters the
  // market. Record the event and the advertised salary history row.
  try {
    const { trackEvent, recordSalary } = await import('./analytics')
    const { data: postedJob } = await admin.from('job_listings')
      .select('id,salary_min,salary_max,required_role_level').eq('id', meta.job_id).maybeSingle()
    await trackEvent('job_posted', { employerId: meta.employer_id || null, jobId: meta.job_id }, { tier: meta.tier || null, held_for_approval: !employerApproved })
    if (postedJob && (postedJob.salary_min || postedJob.salary_max)) {
      await recordSalary({
        kind: 'advertised', source: 'employer_advertised',
        amountMin: postedJob.salary_min ? Number(postedJob.salary_min) : null,
        amountMax: postedJob.salary_max ? Number(postedJob.salary_max) : null,
        employerId: meta.employer_id || null, jobId: meta.job_id,
        roleLevel: postedJob.required_role_level ? String(postedJob.required_role_level) : null,
      })
    }
  } catch { /* best-effort */ }

  if (meta.employer_id) {
    // A paid advert carries Discover Talent for as long as it runs. A property
    // that pays to fill a role and is then locked out of the screen showing
    // who could fill it has been sold an advert when it wanted a hire.
    //
    // Extended by a later advert, never shortened: somebody running two roles
    // keeps the tools until the last one lapses, and re-publishing a shorter
    // advert must not cut short a window they have already paid for.
    const { data: current } = await admin.from('employer_profiles')
      .select('talent_search_until').eq('id', meta.employer_id).maybeSingle()
    const existing = current?.talent_search_until ? new Date(current.talent_search_until).getTime() : 0
    const searchUntil = Number.isFinite(existing) && existing > new Date(expiresAt).getTime()
      ? current!.talent_search_until
      : expiresAt

    await admin.from('employer_profiles').update({
      subscription_tier: meta.tier,
      talent_search_until: searchUntil,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
    }).eq('id', meta.employer_id)
  }

  if (employerApproved) options?.onPublished?.(String(meta.job_id))
  return { ok: true, published: employerApproved, heldForApproval: !employerApproved }
}

/**
 * The paid Stripe session for a role, when the webhook never arrived.
 *
 * Stripe has no index on metadata, so this reads recent sessions and filters.
 * That is fine for the job it does - somebody is standing in front of a
 * listing they have just paid for - and the window is bounded so it cannot
 * become an unbounded scan of a busy account's history.
 */
export async function findPaidSessionForJob(stripe: Stripe, jobId: string): Promise<Stripe.Checkout.Session | null> {
  const since = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
  let startingAfter: string | undefined
  for (let page = 0; page < 5; page++) {
    const list: Stripe.ApiList<Stripe.Checkout.Session> = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: since },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
    for (const session of list.data) {
      if (session.metadata?.type !== 'job_posting') continue
      if (session.metadata?.job_id !== jobId) continue
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') return session
    }
    if (!list.has_more || !list.data.length) break
    startingAfter = list.data[list.data.length - 1].id
  }
  return null
}
