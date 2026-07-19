import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { ACADEMY, courseTitle } from '@/lib/academy'
import { sendCourseAccessEmail } from '@/lib/emails'
import Stripe from 'stripe'

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
    }
  } catch (e: any) {
    console.error('Referral conversion failed (non-fatal):', e?.message)
  }
}

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
            else if (cErr) console.error('[Academy public] createUser failed:', cErr.message)
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
              await sendCourseAccessEmail(email, buyerName, courseTitle(meta.course_slug), action)
            } catch (e: any) {
              console.error('[Academy public] access email failed:', e?.message)
            }
          }
        } catch (e: any) {
          console.error('[Academy public] fulfilment failed:', e?.message)
        }
      }

      // WHC Academy bundle → every course enrolled at once. The per-course
      // share of the bundle price is recorded so revenue totals stay honest.
      if (meta?.type === 'course_bundle' && meta?.candidate_id) {
        const per = Math.round((session.amount_total ?? 7900) / ACADEMY.length)
        for (const course of ACADEMY) {
          await supabase.from('course_enrollments').upsert(
            {
              candidate_id: meta.candidate_id,
              course_slug: course.slug,
              paid_at: new Date().toISOString(),
              amount_paid: per,
            },
            // ignoreDuplicates: a course already bought individually keeps
            // its original purchase record untouched
            { onConflict: 'candidate_id,course_slug', ignoreDuplicates: true }
          )
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
          headers: { 'Content-Type': 'application/json' },
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
