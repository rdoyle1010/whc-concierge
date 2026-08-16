import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getAcademyCatalog, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { sendCourseAccessEmail, sendBookingConfirmedEmail, sendReferralRewardEmail, sendFeaturedTalentEmail } from '@/lib/emails'
import Stripe from 'stripe'
import { getInternalApiSecret } from '@/lib/internal-request'

// Referral credit: when a referred therapist pays for their first register
// listing, mark the referral converted and tell the referrer their free
// month is coming (WHC applies it to the referrer's Stripe subscription).
// Best-effort - never fails the webhook.
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

export async function POST(req: NextRequest) {
  const stripe = getStripe()
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

      // A successful Stripe subscription creates a paid advert in the
      // approval queue. It is never public until an admin approves it.
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
          return NextResponse.json({ error: 'sponsored_ad fulfilment failed' }, { status: 500 })
        }
      }

      if (meta?.type === 'featured_profile' && meta?.candidate_id) {
        const { data: featuredCandidate } = await supabase.from('candidate_profiles').update({
          is_featured: true,
          featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: session.customer as string,
        }).eq('id', meta.candidate_id).select('full_name, headline').maybeSingle()

        // One launch alert per new checkout. Subscription renewals do not run
        // this block, so employers are not emailed every month.
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

      // Agency booking paid in full by the property → confirmed, and the
      // therapist's payout (gross minus 5%) is queued for after the shift.
      if (meta?.type === 'agency_booking' && meta?.booking_id) {
        const gross = meta.gross ? parseInt(meta.gross) : 0
        const fee = meta.fee ? parseInt(meta.fee) : 0
        const candidateFee = Math.ceil(gross * 0.05)
        await supabase.from('agency_bookings').update({
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          fee_paid_at: new Date().toISOString(),
          amount_paid: gross + fee,
          payout_amount: gross - candidateFee,
          payout_status: 'pending',
          // Kept so refunds (no-show, left early, dispute) can be issued
          // against the exact Stripe payment later.
          stripe_payment_intent: (session.payment_intent as string) || null,
        }).eq('id', meta.booking_id)

        // Tell both parties the shift is now confirmed - the therapist is
        // expected to turn up, the property has paid. Best-effort: a failed
        // notification or email must never fail the webhook.
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

            if (cand?.user_id) {
              await createNotification(cand.user_id, 'general', 'Booking confirmed - payment received',
                `Your shift at ${propertyName} on ${shiftDate} at £${booking.rate}/hr is confirmed. WHC pays you after the shift.`,
                '/talent/agency')
              const { data: u } = await supabase.auth.admin.getUserById(cand.user_id)
              if (u?.user?.email) {
                await sendBookingConfirmedEmail(u.user.email, cand.full_name || 'there',
                  `shift at ${propertyName} on ${shiftDate} at £${booking.rate}/hr. WHC pays you after the shift.`)
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

      // PUBLIC Academy purchase → create (or find) the buyer's learner
      // account, enrol them, and email a sign-in link. No membership needed;
      // the account is the vessel the certificate lives in.
      if (meta?.type === 'course_public' && meta?.course_slug && meta?.buyer_email) {
        try {
          const email = String(meta.buyer_email).toLowerCase()
          const buyerName = session.customer_details?.name || email.split('@')[0]

          // Existing user? profiles.email is kept in sync at registration.
          let userId: string | null = null
          const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
          if (prof) userId = prof.id
          if (!userId) {
            const { data: created, error: cErr } = await supabase.auth.admin.createUser({
              email, email_confirm: true, user_metadata: { role: 'talent', full_name: buyerName },
            })
            if (created?.user) userId = created.user.id
            else {
              // The email may already exist in auth.users without a matching
              // profiles row (or with a stale one) - generateLink resolves
              // the existing user so the paid order still fulfils, and the
              // profiles upsert below self-heals the missing row.
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
            // Emailed access - a one-tap sign-in link straight to the course
            try {
              const { data: link } = await supabase.auth.admin.generateLink({
                type: 'magiclink', email,
                options: { redirectTo: 'https://talent.wellnesshousecollective.co.uk/talent/academy' },
              })
              const action = (link as any)?.properties?.action_link || 'https://talent.wellnesshousecollective.co.uk/login'
              const course = await getAcademyCourseBySlug(meta.course_slug, true)
              await sendCourseAccessEmail(email, buyerName, course?.title || meta.course_slug, action)
            } catch (e: any) {
              console.error('[Academy public] access email failed:', e?.message)
            }
          }
          if (!userId) throw new Error('course_public fulfilment: no user for ' + email)
        } catch (e: any) {
          console.error('[Academy public] fulfilment failed:', e?.message)
          // A 500 makes Stripe retry the webhook - all fulfilment writes are
          // idempotent upserts, so retries are safe. Silence here would mean
          // a paid customer who receives nothing.
          return NextResponse.json({ error: 'course_public fulfilment failed' }, { status: 500 })
        }
      }

      // WHC Academy bundle → every course enrolled at once. The per-course
      // share of the bundle price is recorded so revenue totals stay honest.
      if (meta?.type === 'course_bundle' && meta?.candidate_id) {
        const coreCourses = (await getAcademyCatalog(false)).filter(course => course.is_core)
        const total = session.amount_total ?? 7900
        // Split the full bundle price across only the courses NOT already
        // owned - an already-bought course keeps its original record, so
        // giving it a share of the £79 would silently vanish from revenue.
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
              // ignoreDuplicates kept as a race-safety net
              { onConflict: 'candidate_id,course_slug', ignoreDuplicates: true }
            )
          }
        }
      }

      // WHC Academy course purchase → enrolment live.
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

      // Therapist's monthly register listing → live.
      if (meta?.type === 'agency_listing' && meta?.candidate_id) {
        await supabase.from('candidate_profiles').update({
          agency_available: true,
          agency_tier: meta.tier || 'basic',
          agency_listed_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: session.customer as string,
        }).eq('id', meta.candidate_id)
        await convertReferral(supabase, meta.candidate_id)
      }

      // Hotel's annual Preferred Employer registration → active.
      if (meta?.type === 'employer_registration' && meta?.employer_id) {
        await supabase.from('employer_profiles').update({
          preferred_employer: true,
          preferred_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: session.customer as string,
        }).eq('id', meta.employer_id)
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

        // Fire job alerts for matching candidates (fire-and-forget)
        fetch(new URL('/api/job-alerts', req.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-whc-internal-secret': getInternalApiSecret(),
          },
          body: JSON.stringify({ jobId: meta.job_id }),
        }).catch(() => {})
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

      await supabase.from('ad_placements').update({
        payment_status: 'past_due', status: 'paused', updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', customerId)

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
      const subType = subscription.metadata?.type // stamped via subscription_data.metadata
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

      // Therapist register listing (£10/£20 monthly)
      if (subType === 'agency_listing') {
        if (subscription.metadata?.candidate_id && (lapsed || active)) {
          await supabase.from('candidate_profiles').update(
            lapsed
              ? { agency_available: false, agency_listed_until: null }
              : { agency_available: true, agency_tier: subscription.metadata?.tier || 'basic', agency_listed_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
          ).eq('id', subscription.metadata.candidate_id)
        }
        break
      }

      // Preferred Employer registration (£150 yearly)
      if (subType === 'employer_registration') {
        if (subscription.metadata?.employer_id && (lapsed || active)) {
          await supabase.from('employer_profiles').update(
            lapsed
              ? { preferred_employer: false, preferred_until: null }
              : { preferred_employer: true, preferred_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }
          ).eq('id', subscription.metadata.employer_id)
        }
        break
      }

      // Featured profile - legacy subscriptions carry no metadata, and were
      // only ever created for featured profiles.
      if (lapsed) {
        await supabase.from('candidate_profiles').update({
          is_featured: false,
          featured_until: null,
        }).eq('stripe_customer_id', customerId)
      }
      if (active) {
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

      await supabase.from('candidate_profiles').update({ is_featured: false, featured_until: null }).eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
