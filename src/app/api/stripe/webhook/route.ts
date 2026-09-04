import { NextRequest, NextResponse } from 'next/server'
import { triggerJobAlerts } from '@/lib/job-alerts-trigger'
import { publishPaidJobPosting } from '@/lib/job-posting-fulfilment'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification, notifyAdmins } from '@/lib/notifications'
import { getAcademyCatalog, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { sendCourseAccessEmail, sendBookingConfirmedEmail, sendReferralRewardEmail, sendFeaturedTalentEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'
import { sendFeaturedEmployerEmail } from '@/lib/featured-employer-email'
import Stripe from 'stripe'
import { getInternalApiSecret } from '@/lib/internal-request'
import { handleResidencyStripeEvent } from '@/lib/residency-stripe-webhook'
import { fulfilCommercialPurchase, recordCommercialPurchase } from '@/lib/commercial-fulfilment'
import { applyAgencyCaseAdjustment } from '@/lib/agency-case-adjustment'

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

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  // Stripe signs each endpoint with its own secret, and an account can have
  // more than one endpoint - a live one, a spare, one left over from a rename.
  // A single STRIPE_WEBHOOK_SECRET therefore verifies deliveries from one of
  // them and rejects the rest with a bare 400, which is what an 83% error rate
  // on a live endpoint looks like from the Stripe dashboard. Accepting every
  // configured secret also makes rotating one a non-event rather than an
  // outage.
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_2,
    process.env.STRIPE_WEBHOOK_SECRET_ALT,
  ].flatMap(value => String(value || '').split(',')).map(value => value.trim()).filter(Boolean)

  if (!secrets.length) {
    console.error('[Stripe webhook] no STRIPE_WEBHOOK_SECRET is configured, so every delivery will be rejected')
    return NextResponse.json({ error: 'Webhook secret is not configured on this deployment' }, { status: 500 })
  }

  let event: Stripe.Event | null = null
  let lastError = ''
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret)
      break
    } catch (err: any) {
      lastError = err?.message || 'signature verification failed'
    }
  }
  if (!event) {
    // Said plainly in the logs, because from Stripe's side this is an opaque
    // 400 and from the platform's side it was previously nothing at all.
    console.error(
      `[Stripe webhook] signature rejected against ${secrets.length} configured secret(s): ${lastError}. `
      + 'The signing secret in Netlify does not match the endpoint that sent this. '
      + 'Stripe > Developers > Webhooks > the endpoint > Signing secret.',
    )
    return NextResponse.json({ error: lastError || 'Signature verification failed' }, { status: 400 })
  }
  // Past this point the event is verified. Naming it separately keeps the rest
  // of the handler working on a non-null value without a cast at every use.
  const verified: Stripe.Event = event

  const supabase = createAdminClient()

  // Event ledger. Stripe retries and replays events; recording the verified
  // event id before any work makes EVERY branch below idempotent, not just
  // the ones that happen to upsert. A duplicate key means we have already
  // processed this event, so acknowledge it and do nothing.
  try {
    const { error: ledgerError } = await supabase.from('stripe_events')
      .insert({ event_id: verified.id, type: verified.type, payload: verified as any })
    if (ledgerError) {
      const message = String(ledgerError.message || '')
      if ((ledgerError as any).code === '23505' || /duplicate key|already exists/i.test(message)) {
        return NextResponse.json({ received: true, duplicate: true })
      }
      // stripe_events arrives with migration 20260901100000. Until it is run,
      // log and carry on - a missing ledger must never break a payment.
      console.error('[Stripe events] ledger unavailable, continuing:', message)
    }
  } catch (ledgerFailure: any) {
    console.error('[Stripe events] ledger unavailable, continuing:', ledgerFailure?.message)
  }

  // If fulfilment fails we release the ledger row, so Stripe's retry is new
  // work rather than a duplicate we silently acknowledge. The ledger stops
  // double fulfilment; it must never stop a failed one being retried.
  async function releaseLedger() {
    try { await supabase.from('stripe_events').delete().eq('event_id', verified.id) } catch { /* nothing to release */ }
  }
  async function fulfilmentFailed(message: string) {
    await releaseLedger()
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Wrapped so that any unexpected throw below releases the ledger row before
  // the 500 reaches Stripe. The body keeps its original indentation so this
  // change stays reviewable.
  try {
  const residencyHandled = await handleResidencyStripeEvent(event, stripe, supabase)
  if (residencyHandled) return NextResponse.json({ received: true })

  switch (verified.type) {
    case 'checkout.session.completed': {
      const session = verified.data.object as Stripe.Checkout.Session
      const meta = session.metadata

      if (meta?.type === 'commercial_product' && meta?.product) {
        // Guaranteed fulfilment for memberships and featured products - the
        // redirect to /api/commercial/confirm never fires if the tab closes.
        const result = await fulfilCommercialPurchase(supabase, stripe, session)
        if (!result.ok) {
          console.error('[Commercial product] fulfilment failed:', result.error)
          return await fulfilmentFailed('commercial_product fulfilment failed')
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
          return await fulfilmentFailed('sponsored_ad fulfilment failed')
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
          await Promise.allSettled((employers || []).map(async employer => {
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
          return await fulfilmentFailed('featured_employer fulfilment failed')
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
          return await fulfilmentFailed('agency_case_adjustment fulfilment failed')
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
          return await fulfilmentFailed('agency_booking fulfilment failed')
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
          return NextResponse.json({ received: true, unclaimed: true })
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
          return await fulfilmentFailed('course_public fulfilment failed')
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
          onPublished: jobId => triggerJobAlerts(jobId, req.url),
        })
      }
      break
    }

    case 'account.updated': {
      // Stripe Connect: keep the specialist's payout-readiness in step.
      const account = verified.data.object as Stripe.Account
      const candidateId = account.metadata?.candidate_id
      const enabled = Boolean(account.payouts_enabled)
      if (candidateId) {
        await supabase.from('candidate_profiles').update({ connect_payouts_enabled: enabled }).eq('id', candidateId)
      } else if (account.id) {
        await supabase.from('candidate_profiles').update({ connect_payouts_enabled: enabled }).eq('stripe_connect_account_id', account.id)
      }
      break
    }

    case 'checkout.session.expired': {
      const session = verified.data.object as Stripe.Checkout.Session
      const meta = session.metadata
      if (meta?.type === 'job_posting' && meta?.job_id) {
        await supabase.from('job_listings').delete()
          .eq('id', meta.job_id)
          .eq('status', 'pending_payment')
          .eq('is_live', false)
      }
      break
    }

    // Money leaving again. Until now the platform heard only about money
    // arriving, so a refund issued in the Stripe dashboard and a chargeback
    // raised by a property were both invisible: the admin money page went on
    // showing the booking as ready to pay out, and an administrator could
    // bank-transfer a professional money Stripe had already taken back.
    case 'charge.refunded':
    case 'charge.dispute.created':
    case 'charge.dispute.closed': {
      const isDispute = verified.type.startsWith('charge.dispute')
      const object = verified.data.object as any
      const paymentIntent = typeof object?.payment_intent === 'string'
        ? object.payment_intent
        : object?.payment_intent?.id
      if (!paymentIntent) break

      const disputeStatus = verified.type === 'charge.dispute.closed'
        ? (object?.status === 'won' ? 'resolved' : 'open')
        : 'open'

      // Agency bookings.
      try {
        const { data: bookings } = await supabase.from('agency_bookings')
          .select('id, candidate_id, employer_id, shift_date, payout_status, amount_paid')
          .eq('stripe_payment_intent', paymentIntent)
        for (const booking of bookings || []) {
          const update: Record<string, any> = { dispute_status: disputeStatus }
          if (disputeStatus === 'open') {
            // Freeze the payout. A booking under dispute or refunded must
            // never appear on the admin page as ready to pay.
            if (booking.payout_status !== 'paid') update.payout_status = 'on_hold'
          }
          if (verified.type === 'charge.refunded') {
            const refundedPence = Number(object?.amount_refunded || 0)
            if (refundedPence > 0) update.refund_amount = refundedPence / 100
            update.refunded_at = new Date().toISOString()
          }
          let { error } = await supabase.from('agency_bookings').update(update).eq('id', booking.id)
          if (error && /column|refunded_at|refund_amount/i.test(error.message || '')) {
            delete update.refunded_at
            delete update.refund_amount
            ;({ error } = await supabase.from('agency_bookings').update(update).eq('id', booking.id))
          }
          if (error) console.error('[Stripe reversal] agency booking update failed:', error.message)

          const alreadyPaidOut = booking.payout_status === 'paid'
          await notifyAdmins(
            isDispute ? 'Chargeback raised on a shift' : 'Refund issued on a shift',
            `${isDispute ? 'A property has disputed' : 'A refund was issued on'} the payment for the shift on ${booking.shift_date || 'an agreed date'} (booking ${booking.id}). The payout is on hold.${alreadyPaidOut ? ' WARNING: this shift has already been paid out, so the money is out of the account.' : ''}`,
            '/admin/agency',
          )
        }
      } catch (reversalError: any) {
        console.error('[Stripe reversal] agency lookup failed:', reversalError?.message)
      }

      // Residency bookings hold money the same way.
      try {
        const { data: residencies } = await supabase.from('residency_bookings')
          .select('id, payout_status')
          .eq('stripe_payment_intent', paymentIntent)
        for (const booking of residencies || []) {
          const update: Record<string, any> = { dispute_status: disputeStatus }
          if (disputeStatus === 'open' && booking.payout_status !== 'paid') update.payout_status = 'on_hold'
          const { error } = await supabase.from('residency_bookings').update(update).eq('id', booking.id)
          if (error) console.error('[Stripe reversal] residency booking update failed:', error.message)
          await notifyAdmins(
            isDispute ? 'Chargeback raised on a Residency booking' : 'Refund issued on a Residency booking',
            `Residency booking ${booking.id} has a ${isDispute ? 'chargeback' : 'refund'} against it. The payout is on hold.`,
            '/admin/residency-money',
          )
        }
      } catch (reversalError: any) {
        console.error('[Stripe reversal] residency lookup failed:', reversalError?.message)
      }
      break
    }

    // A payout to a professional's connected account bounced. Silent failure
    // here means somebody believes they have been paid and has not been.
    case 'payout.failed': {
      const payout = verified.data.object as any
      await notifyAdmins('A Stripe payout failed',
        `Stripe could not pay out ${payout?.amount ? `£${(Number(payout.amount) / 100).toFixed(2)}` : 'an amount'}${payout?.failure_message ? `: ${payout.failure_message}` : ''}. Check the connected account's bank details.`,
        '/admin/agency')
      break
    }

    case 'invoice.paid': {
      const invoice = verified.data.object as Stripe.Invoice
      const rawSubscription = (invoice as any).subscription
        || (invoice as any).parent?.subscription_details?.subscription
      const subscriptionId = typeof rawSubscription === 'string' ? rawSubscription : rawSubscription?.id
      if (!subscriptionId) break

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const meta = subscription.metadata || {}
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
      const monthEnd = subscriptionPeriodEnd(subscription, 30)
      const yearEnd = subscriptionPeriodEnd(subscription, 365)

      if (meta.type === 'sponsored_ad') {
        const { data: advert } = await supabase.from('ad_placements')
          .select('id, review_status').eq('stripe_subscription_id', subscription.id).maybeSingle()
        if (advert) {
          await supabase.from('ad_placements').update({
            payment_status: 'paid',
            status: advert.review_status === 'approved' ? 'active' : 'pending',
            updated_at: new Date().toISOString(),
          }).eq('id', advert.id)
        }
        break
      }

      if (meta.type === 'agency_listing' && meta.candidate_id) {
        await supabase.from('candidate_profiles').update({
          agency_available: true,
          agency_tier: meta.tier || 'basic',
          agency_listed_until: monthEnd,
          stripe_customer_id: customerId,
        }).eq('id', meta.candidate_id)
        break
      }

      if (meta.type === 'employer_registration' && meta.employer_id) {
        await supabase.from('employer_profiles').update({
          preferred_employer: true,
          preferred_until: yearEnd,
          stripe_customer_id: customerId,
        }).eq('id', meta.employer_id)
        break
      }

      if (meta.type === 'featured_employer' && meta.employer_id) {
        const interval = subscription.items?.data?.[0]?.price?.recurring?.interval
        await supabase.from('employer_profiles').update({
          featured_employer: true,
          featured_until: subscriptionPeriodEnd(subscription, interval === 'year' ? 365 : 30),
          featured_payment_source: 'stripe',
          stripe_customer_id: customerId,
        }).eq('id', meta.employer_id)
        break
      }

      if (meta.type === 'featured_profile' && meta.candidate_id) {
        await supabase.from('candidate_profiles').update({
          is_featured: true,
          featured_until: monthEnd,
          stripe_customer_id: customerId,
        }).eq('id', meta.candidate_id)
        break
      }

      // Featured Talent is a separate one-off purchase (£9.99 for 7 days,
      // £24.99 for 30). This fall-through used to extend it on EVERY paid
      // invoice for the same Stripe customer - so a professional holding any
      // £9.99 monthly membership had their £24.99 featured placement renewed
      // free, every month, forever. The product became free for anyone with a
      // membership.
      //
      // Featured is now extended only by the branch above, which fires on an
      // invoice whose subscription actually says featured_profile.

      // Commercial memberships carry no recognised metadata.type on their
      // invoices, so advance their renewal date here on every paid invoice.
      const invoiceLineEnd = Number((invoice.lines?.data?.[0] as any)?.period?.end || 0)
      const membershipRenewsAt = invoiceLineEnd > 0 ? new Date(invoiceLineEnd * 1000).toISOString() : monthEnd
      // A cleared payment lifts the suspension in the same statement that
      // advances the renewal date, so a member who was past due is whole
      // again the moment the money arrives.
      const renewal: Record<string, any> = { membership_renews_at: membershipRenewsAt, membership_past_due: false }
      let { error: candidateRenewalError } = await supabase.from('candidate_profiles')
        .update(renewal)
        .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
        .not('membership_tier', 'is', null)
      if (candidateRenewalError && /column|membership_past_due/i.test(candidateRenewalError.message || '')) {
        // membership_past_due arrives with 20260901210000_membership_dunning.sql.
        delete renewal.membership_past_due
        await supabase.from('candidate_profiles')
          .update(renewal)
          .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
          .not('membership_tier', 'is', null)
      }
      await supabase.from('employer_profiles')
        .update(renewal)
        .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
        .not('membership_tier', 'is', null)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = verified.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      if (!customerId) break

      await supabase.from('ad_placements').update({
        payment_status: 'past_due', status: 'paused', updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', customerId)

      const attemptCount = invoice.attempt_count || 0
      if (attemptCount >= 2) {
        await supabase.from('candidate_profiles').update({
          is_featured: false,
          featured_until: null,
        }).eq('stripe_customer_id', customerId).eq('is_featured', true)
        await supabase.from('employer_profiles').update({
          featured_employer: false,
          featured_until: null,
        }).eq('stripe_customer_id', customerId).eq('featured_employer', true)

        // A failing card used to leave every membership benefit switched on
        // until Stripe's dunning finally gave up - typically two to three
        // weeks of Interview Ready credits, Academy discount, agency
        // bookability and Agency Plus fee reduction, all unpaid for.
        //
        // The account is not closed and the tier is not deleted: the member
        // keeps their profile, their history and their place. Only the
        // benefits that cost Talent House money are suspended, and invoice.paid
        // restores them the moment the card clears.
        await supabase.from('candidate_profiles')
          .update({ membership_past_due: true, agency_available: false })
          .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
          .not('membership_tier', 'is', null)
        await supabase.from('employer_profiles')
          .update({ membership_past_due: true, agency_plus_active: false })
          .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
          .not('membership_tier', 'is', null)

        await notifyAdmins('A membership payment is failing',
          `Stripe has failed to collect a membership payment ${attemptCount} times for customer ${customerId}. Benefits are suspended until it clears.`,
          '/admin/revenue')
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = verified.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const subType = subscription.metadata?.type
      const lapsed = subscription.status === 'past_due' || subscription.status === 'unpaid'
      const active = subscription.status === 'active'

      if (subType === 'sponsored_ad') {
        const { data: advert } = await supabase.from('ad_placements')
          .select('id, review_status').eq('stripe_subscription_id', subscription.id).maybeSingle()
        if (advert && (lapsed || active)) {
          await supabase.from('ad_placements').update(lapsed
            ? { payment_status: subscription.status, status: 'paused', updated_at: new Date().toISOString() }
            : { payment_status: 'paid', status: advert.review_status === 'approved' ? 'active' : 'pending', updated_at: new Date().toISOString() }
          ).eq('id', advert.id)
        }
        break
      }

      if (subType === 'agency_listing') {
        if (subscription.metadata?.candidate_id && (lapsed || active)) {
          await supabase.from('candidate_profiles').update(
            lapsed
              ? { agency_available: false, agency_listed_until: null }
              : { agency_available: true, agency_tier: subscription.metadata?.tier || 'basic', agency_listed_until: subscriptionPeriodEnd(subscription, 30) }
          ).eq('id', subscription.metadata.candidate_id)
        }
        break
      }

      if (subType === 'employer_registration') {
        if (subscription.metadata?.employer_id && (lapsed || active)) {
          await supabase.from('employer_profiles').update(
            lapsed
              ? { preferred_employer: false, preferred_until: null }
              : { preferred_employer: true, preferred_until: subscriptionPeriodEnd(subscription, 365) }
          ).eq('id', subscription.metadata.employer_id)
        }
        break
      }

      if (subType === 'agency_plus') {
        if (subscription.metadata?.employer_id && (lapsed || active)) {
          await supabase.from('employer_profiles').update(
            lapsed
              ? { agency_plus_active: false, agency_plus_until: null }
              : { agency_plus_active: true, agency_plus_until: subscriptionPeriodEnd(subscription, 30) }
          ).eq('id', subscription.metadata.employer_id)
        }
        break
      }

      if (subType === 'featured_employer') {
        if (subscription.metadata?.employer_id && (lapsed || active)) {
          const interval = subscription.items?.data?.[0]?.price?.recurring?.interval
          await supabase.from('employer_profiles').update(
            lapsed
              ? { featured_employer: false, featured_until: null }
              : { featured_employer: true, featured_until: subscriptionPeriodEnd(subscription, interval === 'year' ? 365 : 30), featured_payment_source: 'stripe' }
          ).eq('id', subscription.metadata.employer_id)
        }
        break
      }

      if (lapsed) {
        await supabase.from('candidate_profiles').update({
          is_featured: false,
          featured_until: null,
        }).eq('stripe_customer_id', customerId)
      }
      if (active) {
        await supabase.from('candidate_profiles').update({
          is_featured: true,
          featured_until: subscriptionPeriodEnd(subscription, 30),
        }).eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = verified.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const subType = subscription.metadata?.type

      if (subType === 'sponsored_ad') {
        await supabase.from('ad_placements').update({
          payment_status: 'cancelled', status: 'paused', updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id)
        break
      }

      if (subType === 'agency_listing') {
        if (subscription.metadata?.candidate_id) {
          await supabase.from('candidate_profiles')
            .update({ agency_available: false, agency_listed_until: null })
            .eq('id', subscription.metadata.candidate_id)
        }
        break
      }
      if (subType === 'employer_registration') {
        if (subscription.metadata?.employer_id) {
          await supabase.from('employer_profiles')
            .update({ preferred_employer: false, preferred_until: null })
            .eq('id', subscription.metadata.employer_id)
        }
        break
      }
      if (subType === 'agency_plus') {
        if (subscription.metadata?.employer_id) {
          await supabase.from('employer_profiles')
            .update({ agency_plus_active: false, agency_plus_until: null })
            .eq('id', subscription.metadata.employer_id)
        }
        break
      }
      if (subType === 'featured_employer') {
        if (subscription.metadata?.employer_id) {
          await supabase.from('employer_profiles')
            .update({ featured_employer: false, featured_until: null })
            .eq('id', subscription.metadata.employer_id)
        }
        break
      }

      // Deliberately NOT revoking is_featured here.
      //
      // This used to switch off Featured Talent for every profile sharing the
      // cancelled subscription's Stripe customer. A professional who paid
      // £24.99 for thirty days of featured placement on the first of the
      // month and then cancelled their separate £9.99 membership on the fifth
      // lost twenty-five days she had already paid for. One purchase must
      // never be revoked by the cancellation of another.
      //
      // Featured expires on its own: featured_until is set at purchase and
      // the maintenance sweep clears it when it passes.

      // Commercial memberships have no dedicated branch, so revoke the tier
      // here - otherwise benefits outlive the cancelled subscription.
      await supabase.from('candidate_profiles')
        .update({ membership_tier: null, membership_renews_at: null })
        .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
        .not('membership_tier', 'is', null)
      await supabase.from('employer_profiles')
        .update({ membership_tier: null, membership_renews_at: null, annual_job_allowance: 0 })
        .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
        .not('membership_tier', 'is', null)
      break
    }
  }
  } catch (processingError: any) {
    console.error('[Stripe webhook] processing failed:', processingError?.message)
    await releaseLedger()
    throw processingError
  }

  return NextResponse.json({ received: true })
}
