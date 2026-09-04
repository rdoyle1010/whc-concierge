import Stripe from 'stripe'
import { triggerJobAlerts } from '@/lib/job-alerts-trigger'
import { publishPaidJobPosting } from '@/lib/job-posting-fulfilment'
import { createNotification, notifyAdmins } from '@/lib/notifications'
import { getAcademyCatalog, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { sendCourseAccessEmail, sendBookingConfirmedEmail, sendReferralRewardEmail, sendFeaturedTalentEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'
import { sendFeaturedEmployerEmail } from '@/lib/featured-employer-email'
import { fulfilCommercialPurchase, recordCommercialPurchase } from '@/lib/commercial-fulfilment'
import { applyAgencyCaseAdjustment } from '@/lib/agency-case-adjustment'
import { getStripe } from '@/lib/stripe'

// Everything a completed Stripe checkout has to deliver, in one place.
//
// This lived inside the webhook and nowhere else, which meant the webhook was
// the only thing that could deliver a purchase. When its URL was wrong for
// several days, every payment through it took the money and delivered
// nothing: no course access, no agency listing, no featured placement, and no
// way for the buyer to say so or for the platform to notice.
//
// Job adverts were rescued by giving them a second path that asks Stripe
// directly. Doing that eight more times would have meant eight more copies of
// fulfilment logic, and the copy that drifts is always the one nobody watches.
// So the logic moved here instead, and both callers - the webhook, and the
// confirm route the browser hits on its way back from Stripe - run exactly
// the same code. Whichever arrives first wins; the second is a no-op, because
// every branch below is idempotent on its own record.

export type FulfilmentOutcome =
  | { ok: true; note?: string }
  | { ok: false; retry: boolean; message: string }

async function convertReferral(supabase: any, candidateId: string) {
  try {
    const { data: cand } = await supabase.from('candidate_profiles')
      .select('id, full_name, referred_by').eq('id', candidateId).maybeSingle()
    if (!cand?.referred_by) return
    const { data: ref } = await supabase.from('referrals')
      .update({ status: 'converted', converted_at: new Date().toISOString() })
      .eq('referred_candidate_id', cand.id)
      .eq('status', 'pending')
      .select('referrer_candidate_id')
      .maybeSingle()
    if (!ref) return
    const { data: referrer } = await supabase.from('candidate_profiles')
      .select('user_id, full_name').eq('id', ref.referrer_candidate_id).maybeSingle()
    if (referrer?.user_id) {
      await createNotification(referrer.user_id, 'general', 'You’ve earned a free month',
        `${cand.full_name || 'Your friend'} just joined the agency register with your link - a free month will be applied to your listing. Thank you for growing the collective.`,
        '/talent/agency/settings')
      const { data: u } = await supabase.auth.admin.getUserById(referrer.user_id)
      if (u?.user?.email) {
        await sendReferralRewardEmail(u.user.email, referrer.full_name || 'there')
      }
    }
  } catch (e: any) {
    console.error('Referral conversion failed (non-fatal):', e?.message)
  }
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription, fallbackDays: number) {
  const itemEnd = (subscription.items?.data?.[0] as any)?.current_period_end
  const subscriptionEnd = (subscription as any)?.current_period_end
  const unix = Number(itemEnd || subscriptionEnd || 0)
  if (unix > 0) return new Date(unix * 1000).toISOString()
  return new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000).toISOString()
}

async function announceFeaturedEmployer(supabase: any, employerId: string) {
  try {
    const { data: employer } = await supabase.from('employer_profiles')
      .select('property_name,company_name,location')
      .eq('id', employerId).maybeSingle()
    if (!employer) return
    const propertyName = employer.property_name || employer.company_name || 'A Talent House property'
    const { data: talent } = await supabase.from('candidate_profiles')
      .select('user_id,full_name')
      .eq('approval_status', 'approved')
      .or('profile_visible.eq.true,profile_visible.is.null')

    await Promise.allSettled((talent || []).map(async (candidate: any) => {
      if (!candidate.user_id) return
      await createNotification(
        candidate.user_id,
        'general',
        `Featured property: ${propertyName}`,
        `${propertyName}${employer.location ? ` in ${employer.location}` : ''} is now featured on Talent House Collective.`,
        '/properties',
      )
      const { data: talentUser } = await supabase.auth.admin.getUserById(candidate.user_id)
      if (talentUser.user?.email) {
        await sendFeaturedEmployerEmail(
          talentUser.user.email,
          candidate.full_name || 'there',
          propertyName,
          employer.location || '',
        )
      }
    }))
  } catch (e: any) {
    console.error('Featured employer talent alert failed (non-fatal):', e?.message)
  }
}

/**
 * Deliver a completed checkout.
 *
 * Returns rather than throws so the caller decides what a failure means: the
 * webhook releases its event-ledger row and answers 500 so Stripe retries,
 * while the confirm route tells the person standing in front of it to try
 * again. Neither interpretation belongs in here.
 */
export async function fulfilCheckoutSession(
  supabase: any,
  session: Stripe.Checkout.Session,
  ctx?: { requestUrl?: string },
): Promise<FulfilmentOutcome> {
  const stripe = getStripe()
  const meta = session.metadata

  if (meta?.type === 'commercial_product' && meta?.product) {
    // Guaranteed fulfilment for memberships and featured products - the
    // redirect to /api/commercial/confirm never fires if the tab closes.
    const result = await fulfilCommercialPurchase(supabase, stripe, session)
    if (!result.ok) {
      console.error('[Commercial product] fulfilment failed:', result.error)
      return { ok: false, retry: true, message: 'commercial_product fulfilment failed' }
    }
  }

  if (meta?.type === 'sponsored_ad' && meta?.placement && meta?.brand_name) {
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    const { error } = await supabase.from('ad_placements').upsert({
      brand_name: meta.brand_name,
      category: 'Sponsored',
      placement: meta.placement,
      website_url: meta.website_url || null,
      tagline: meta.tagline || null,
      logo_url: meta.logo_url || null,
      contact_email: meta.contact_email || session.customer_details?.email || null,
      monthly_rate: Number(meta.monthly_pence || session.amount_total || 0) / 100,
      status: 'pending',
      payment_status: 'paid',
      review_status: 'pending',
      start_date: new Date().toISOString().slice(0, 10),
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripe_subscription_id: subscriptionId || null,
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_checkout_session_id' })
    if (error) {
      console.error('[Sponsored advert] fulfilment failed:', error.message)
      return { ok: false, retry: true, message: 'sponsored_ad fulfilment failed' }
    }
  }

  if (meta?.type === 'featured_profile' && meta?.candidate_id) {
    const { data: featuredCandidate } = await supabase.from('candidate_profiles').update({
      is_featured: true,
      featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripe_customer_id: session.customer as string,
    }).eq('id', meta.candidate_id).select('full_name, headline').maybeSingle()

    try {
      const { data: employers } = await supabase.from('employer_profiles')
        .select('user_id, property_name, company_name')
        .eq('approval_status', 'approved')
      await Promise.allSettled((employers || []).map(async (employer: any) => {
        if (!employer.user_id) return
        await createNotification(
          employer.user_id,
          'general',
          `Featured talent: ${featuredCandidate?.full_name || 'New professional'}`,
          featuredCandidate?.headline || 'A featured professional is available to view and shortlist.',
          '/employer/candidates',
        )
        // Preference-gated ('product_news'): the featured-talent broadcast
        // is promotional; the in-app notification above always fires.
        if (!(await emailAllowed(supabase, employer.user_id, 'product_news'))) return
        const { data: employerUser } = await supabase.auth.admin.getUserById(employer.user_id)
        if (employerUser.user?.email) {
          await sendFeaturedTalentEmail(
            employerUser.user.email,
            employer.property_name || employer.company_name || '',
            featuredCandidate?.full_name || 'A new professional',
            featuredCandidate?.headline || '',
          )
        }
      }))
    } catch (e: any) {
      console.error('Featured talent employer alert failed (non-fatal):', e?.message)
    }
  }

  if (meta?.type === 'featured_employer' && meta?.employer_id) {
    let featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        featuredUntil = subscriptionPeriodEnd(subscription, subscription.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 365 : 30)
      } catch {}
    }
    const { error } = await supabase.from('employer_profiles').update({
      featured_employer: true,
      featured_until: featuredUntil,
      featured_payment_source: 'stripe',
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
    }).eq('id', meta.employer_id)
    if (error) {
      console.error('[Featured employer] fulfilment failed:', error.message)
      return { ok: false, retry: true, message: 'featured_employer fulfilment failed' }
    }
    await announceFeaturedEmployer(supabase, meta.employer_id)
  }

  // Extra money agreed in a shift resolution. This branch did not exist:
  // the credit was applied only by a browser redirect, so a closed tab
  // meant Stripe held the property's money, the case never closed and
  // the professional was never paid.
  if (meta?.type === 'agency_case_adjustment' && meta?.case_id) {
    const result = await applyAgencyCaseAdjustment(supabase, {
      caseId: String(meta.case_id),
      bookingId: meta.booking_id ? String(meta.booking_id) : null,
      extra: Number(meta.extra || 0),
      fee: Number(meta.fee || 0),
      sessionId: session.id,
      actorUserId: meta.user_id ? String(meta.user_id) : null,
      actorRole: 'employer',
    })
    if (!result.applied && result.reason === 'write_failed') {
      console.error('[Agency case adjustment] could not record the payment:', result.message)
      return { ok: false, retry: true, message: 'agency_case_adjustment fulfilment failed' }
    }
    if (!result.applied && (result.reason === 'case_not_found' || result.reason === 'booking_not_found')) {
      await notifyAdmins('Adjustment payment needs review',
        `An extra shift payment was received for case ${meta.case_id} but the case or booking could not be found. Check Stripe.`,
        '/admin/agency')
    }
  }

  if (meta?.type === 'agency_booking' && meta?.booking_id) {
    // Pence are authoritative. parseInt on a pound string silently
    // truncated every half-hour shift - "382.5" became 382 - so the
    // recorded amount_paid sat up to 99p below what was actually
    // collected, and every refund was then capped at the wrong figure.
    // The pound fields are still read as a fallback, for sessions created
    // before pence metadata existed.
    const grossPence = meta.gross_pence ? Math.round(Number(meta.gross_pence)) : Math.round(Number(meta.gross || 0) * 100)
    const feePence = meta.fee_pence ? Math.round(Number(meta.fee_pence)) : Math.round(Number(meta.fee || 0) * 100)
    const gross = grossPence / 100
    const fee = feePence / 100
    // Which money model this booking used. 'stripe_connect' means the
    // shift money was transferred to the professional by the destination
    // charge itself; 'manual' means Talent House holds it until it settles.
    const payoutMethod = meta.payout_method === 'stripe_connect' ? 'stripe_connect' : 'manual'
    const paidUpdate: Record<string, any> = {
      status: 'confirmed',
      paid_at: new Date().toISOString(),
      amount_paid: gross + fee,
      payout_amount: gross,
      payout_status: 'pending',
      stripe_payment_intent: (session.payment_intent as string) || null,
      payout_method: payoutMethod,
    }
    // Claim the booking rather than overwrite it. Two things this stops.
    // A second payment for the same shift (a stale checkout tab paid an
    // hour later) no longer silently overwrites the first with identical
    // values, leaving the property charged twice and nothing recording
    // it. And a shift the professional cancelled while the property was
    // on the Stripe page can no longer be flipped back to confirmed - a
    // paid, confirmed shift that nobody is working.
    const claim = () => supabase.from('agency_bookings')
      .update(paidUpdate)
      .eq('id', meta.booking_id)
      .is('paid_at', null)
      .in('status', ['accepted', 'confirmed'])
      .select('id')
    let { data: claimed, error: paidError } = await claim()
    if (paidError && /column|payout_method/i.test(paidError.message || '')) {
      // payout_method arrives with migration 20260901100000; the payment
      // must land regardless of whether it has been run yet.
      delete paidUpdate.payout_method
      ;({ data: claimed, error: paidError } = await claim())
    }
    // A write failure here means Stripe holds the property's money and
    // nothing records it. Returning 500 releases the ledger row so Stripe
    // retries, instead of swallowing it with a 200 and leaving a real
    // person unpaid with only a log line to show for it.
    if (paidError) {
      console.error('[Agency booking] payment record update failed:', paidError.message)
      return { ok: false, retry: true, message: 'agency_booking fulfilment failed' }
    }
    if (!claimed || claimed.length === 0) {
      // Nothing to claim: already paid, or cancelled while the property
      // was paying. Either way this payment needs a human, so flag it
      // rather than acknowledging it silently.
      console.error('[Agency booking] payment arrived for a booking that could not be claimed:', meta.booking_id)
      try {
        await supabase.from('agency_bookings')
          .update({ dispute_status: 'open', payout_status: 'on_hold' })
          .eq('id', meta.booking_id)
      } catch { }
      try {
        await notifyAdmins('Payment needs review',
          `A shift payment was received for booking ${meta.booking_id}, which was already paid or no longer open. Check Stripe and refund it if it is a duplicate.`,
          '/admin/agency')
      } catch { }
      return { ok: true, note: 'unclaimed' }
    }

    try {
      const { data: booking } = await supabase.from('agency_bookings')
        .select('candidate_id, employer_id, shift_date, rate')
        .eq('id', meta.booking_id).maybeSingle()
      if (booking) {
        const { data: cand } = await supabase.from('candidate_profiles')
          .select('user_id, full_name').eq('id', booking.candidate_id).maybeSingle()
        const { data: emp } = await supabase.from('employer_profiles')
          .select('user_id, company_name, property_name').eq('id', booking.employer_id).maybeSingle()
        const propertyName = emp?.property_name || emp?.company_name || 'the property'
        const therapistName = cand?.full_name || 'The therapist'
        const shiftDate = booking.shift_date || 'the agreed date'

        try {
          const { trackEvent, recordSalary } = await import('@/lib/analytics')
          await trackEvent('shift_confirmed', { candidateId: booking.candidate_id, employerId: booking.employer_id }, { shift_date: booking.shift_date, rate: booking.rate, gross, fee })
          if (booking.rate) {
            await recordSalary({
              kind: 'agency_rate', source: 'platform_transaction', period: 'hourly',
              amountMin: Number(booking.rate), amountMax: Number(booking.rate),
              candidateId: booking.candidate_id, employerId: booking.employer_id,
            })
          }
        } catch { /* best-effort */ }

        const payoutLine = payoutMethod === 'stripe_connect'
          ? 'Your payout has been sent straight to your connected bank account by Stripe.'
          : 'Talent House pays you after the shift.'

        if (cand?.user_id) {
          await createNotification(cand.user_id, 'general', 'Booking confirmed - payment received',
            `Your shift at ${propertyName} on ${shiftDate} at £${booking.rate}/hr is confirmed. ${payoutLine}`,
            '/talent/agency')
          // Preference-gated ('booking_updates'): the therapist's copy
          // honours their opt-out; the in-app notification above always
          // fires. The employer's copy below is a payment receipt for
          // their own payment, so it always sends (transactional).
          if (await emailAllowed(supabase, cand.user_id, 'booking_updates')) {
            const { data: u } = await supabase.auth.admin.getUserById(cand.user_id)
            if (u?.user?.email) {
              await sendBookingConfirmedEmail(u.user.email, cand.full_name || 'there',
                `shift at ${propertyName} on ${shiftDate} at £${booking.rate}/hr. ${payoutLine}`)
            }
          }
        }
        if (emp?.user_id) {
          await createNotification(emp.user_id, 'general', 'Payment received - booking confirmed',
            `${therapistName}'s shift on ${shiftDate} is confirmed.`,
            '/employer/agency')
          const { data: u } = await supabase.auth.admin.getUserById(emp.user_id)
          if (u?.user?.email) {
            await sendBookingConfirmedEmail(u.user.email, propertyName,
              `${therapistName}'s shift on ${shiftDate} is confirmed. Payment received.`)
          }
        }
      }
    } catch (e: any) {
      console.error('Booking confirmation notify failed (non-fatal):', e?.message)
    }
  }

  if (meta?.type === 'course_public' && meta?.course_slug && meta?.buyer_email) {
    try {
      const email = String(meta.buyer_email).toLowerCase()
      const buyerName = session.customer_details?.name || email.split('@')[0]

      let userId: string | null = null
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
      if (prof) userId = prof.id
      if (!userId) {
        const { data: created, error: cErr } = await supabase.auth.admin.createUser({
          email, email_confirm: true, user_metadata: { role: 'talent', full_name: buyerName },
        })
        if (created?.user) userId = created.user.id
        else {
          const { data: link, error: lErr } = await supabase.auth.admin.generateLink({ type: 'magiclink', email })
          if (link?.user) userId = link.user.id
          else console.error('[Academy public] createUser failed:', cErr?.message, lErr?.message)
        }
      }

      if (userId) {
        await supabase.from('profiles').upsert(
          { id: userId, email, role: 'candidate', full_name: buyerName },
          { onConflict: 'id', ignoreDuplicates: true }
        )
        let { data: cand } = await supabase.from('candidate_profiles').select('id').eq('user_id', userId).maybeSingle()
        if (!cand) {
          const { data: newCand } = await supabase.from('candidate_profiles')
            .insert({ user_id: userId, full_name: buyerName, approval_status: 'pending' })
            .select('id').single()
          cand = newCand
        }
        if (cand) {
          await supabase.from('course_enrollments').upsert(
            {
              candidate_id: cand.id,
              course_slug: meta.course_slug,
              paid_at: new Date().toISOString(),
              amount_paid: session.amount_total ?? 1500,
            },
            { onConflict: 'candidate_id,course_slug', ignoreDuplicates: true }
          )
        }
        try {
          const { data: link } = await supabase.auth.admin.generateLink({
            type: 'magiclink', email,
            options: { redirectTo: 'https://talenthousecollective.co.uk/talent/academy' },
          })
          const action = (link as any)?.properties?.action_link || 'https://talenthousecollective.co.uk/login'
          const course = await getAcademyCourseBySlug(meta.course_slug, true)
          await sendCourseAccessEmail(email, buyerName, course?.title || meta.course_slug, action)
        } catch (e: any) {
          console.error('[Academy public] access email failed:', e?.message)
        }
      }
      if (!userId) throw new Error('course_public fulfilment: no user for ' + email)
    } catch (e: any) {
      console.error('[Academy public] fulfilment failed:', e?.message)
      return { ok: false, retry: true, message: 'course_public fulfilment failed' }
    }
  }

  if (meta?.type === 'course_bundle' && meta?.candidate_id) {
    const coreCourses = (await getAcademyCatalog(false)).filter(course => course.is_core)
    const total = session.amount_total ?? 7900
    const { data: owned } = await supabase.from('course_enrollments')
      .select('course_slug').eq('candidate_id', meta.candidate_id)
    const ownedSet = new Set((owned ?? []).map((r: any) => r.course_slug))
    const newCourses = coreCourses.filter(c => !ownedSet.has(c.slug))
    if (newCourses.length > 0) {
      const per = Math.floor(total / newCourses.length)
      let remainder = total - per * newCourses.length
      for (const course of newCourses) {
        await supabase.from('course_enrollments').upsert(
          {
            candidate_id: meta.candidate_id,
            course_slug: course.slug,
            paid_at: new Date().toISOString(),
            amount_paid: per + (remainder-- > 0 ? 1 : 0),
          },
          { onConflict: 'candidate_id,course_slug', ignoreDuplicates: true }
        )
      }
    }
  }

  if (meta?.type === 'course' && meta?.candidate_id && meta?.course_slug) {
    await supabase.from('course_enrollments').upsert(
      {
        candidate_id: meta.candidate_id,
        course_slug: meta.course_slug,
        paid_at: new Date().toISOString(),
        amount_paid: session.amount_total ?? 1000,
      },
      { onConflict: 'candidate_id,course_slug' }
    )
  }

  if (meta?.type === 'agency_listing' && meta?.candidate_id) {
    await supabase.from('candidate_profiles').update({
      agency_available: true,
      agency_tier: meta.tier || 'basic',
      agency_listed_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripe_customer_id: session.customer as string,
    }).eq('id', meta.candidate_id)
    await convertReferral(supabase, meta.candidate_id)
  }

  if (meta?.type === 'employer_registration' && meta?.employer_id) {
    await supabase.from('employer_profiles').update({
      preferred_employer: true,
      preferred_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      stripe_customer_id: session.customer as string,
    }).eq('id', meta.employer_id)
  }

  if (meta?.type === 'agency_plus' && meta?.employer_id) {
    await supabase.from('employer_profiles').update({
      agency_plus_active: true,
      agency_plus_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripe_customer_id: session.customer as string,
    }).eq('id', meta.employer_id)
  }

  if (meta?.type === 'job_posting' && meta?.job_id) {
    // Shared with /api/employer/jobs/confirm-payment, which runs the same
    // publish when the browser comes back from Stripe. Two copies of this
    // would drift, and the one that drifts is the one nobody watches.
    await publishPaidJobPosting(supabase, session, {
      onPublished: jobId => triggerJobAlerts(jobId, ctx?.requestUrl || 'https://talenthousecollective.co.uk'),
    })
  }

  return { ok: true }
}
