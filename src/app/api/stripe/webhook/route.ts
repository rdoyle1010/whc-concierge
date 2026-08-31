import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getAcademyCatalog, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { sendCourseAccessEmail, sendBookingConfirmedEmail, sendReferralRewardEmail, sendFeaturedTalentEmail } from '@/lib/emails'
import { sendFeaturedEmployerEmail } from '@/lib/featured-employer-email'
import Stripe from 'stripe'
import { getInternalApiSecret } from '@/lib/internal-request'
import { handleResidencyStripeEvent } from '@/lib/residency-stripe-webhook'
import { fulfilCommercialPurchase } from '@/lib/commercial-fulfilment'

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
    const propertyName = employer.property_name || employer.company_name || 'A WHC property'
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
        `${propertyName}${employer.location ? ` in ${employer.location}` : ''} is now featured on WHC Concierge.`,
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

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = createAdminClient()
  const residencyHandled = await handleResidencyStripeEvent(event, stripe, supabase)
  if (residencyHandled) return NextResponse.json({ received: true })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata

      if (meta?.type === 'commercial_product' && meta?.product) {
        // Guaranteed fulfilment for memberships and featured products - the
        // redirect to /api/commercial/confirm never fires if the tab closes.
        const result = await fulfilCommercialPurchase(supabase, stripe, session)
        if (!result.ok) {
          console.error('[Commercial product] fulfilment failed:', result.error)
          return NextResponse.json({ error: 'commercial_product fulfilment failed' }, { status: 500 })
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
          return NextResponse.json({ error: 'sponsored_ad fulfilment failed' }, { status: 500 })
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
          return NextResponse.json({ error: 'featured_employer fulfilment failed' }, { status: 500 })
        }
        await announceFeaturedEmployer(supabase, meta.employer_id)
      }

      if (meta?.type === 'agency_booking' && meta?.booking_id) {
        const gross = meta.gross ? parseInt(meta.gross) : 0
        const fee = meta.fee ? parseInt(meta.fee) : 0
        await supabase.from('agency_bookings').update({
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          amount_paid: gross + fee,
          payout_amount: gross,
          payout_status: 'pending',
          stripe_payment_intent: (session.payment_intent as string) || null,
        }).eq('id', meta.booking_id)

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
          return NextResponse.json({ error: 'course_public fulfilment failed' }, { status: 500 })
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
        const days = meta.days ? parseInt(meta.days) : 30
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        // Safety net behind the publish gate: if payment completes while the
        // employer is still unapproved, keep the paid term but hold the role
        // as a draft until approval.
        let employerApproved = true
        if (meta.employer_id) {
          const { data: paidEmployer } = await supabase.from('employer_profiles').select('approval_status,user_id').eq('id', meta.employer_id).maybeSingle()
          employerApproved = paidEmployer?.approval_status === 'approved'
          if (!employerApproved && paidEmployer?.user_id) {
            await createNotification(paidEmployer.user_id, 'general', 'Payment received - role held for approval', 'Your role is paid for and will go live automatically as soon as WHC approves your employer account.', '/employer/jobs').catch?.(() => {})
          }
        }
        await supabase.from('job_listings').update({
          is_live: employerApproved,
          status: employerApproved ? 'active' : 'draft',
          expires_at: expiresAt,
          // The free publish path stamps posted_date too - without it paid
          // roles sort and display as undated.
          posted_date: new Date().toISOString(),
        }).eq('id', meta.job_id)

        // Instrumentation: the paid posting is the moment a role truly enters
        // the market. Record the event and the advertised salary history row.
        try {
          const { trackEvent, recordSalary } = await import('@/lib/analytics')
          const { data: postedJob } = await supabase.from('job_listings').select('id,salary_min,salary_max,required_role_level').eq('id', meta.job_id).maybeSingle()
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
          await supabase.from('employer_profiles').update({
            subscription_tier: meta.tier,
            stripe_customer_id: session.customer as string,
          }).eq('id', meta.employer_id)
        }

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

    case 'account.updated': {
      // Stripe Connect: keep the specialist's payout-readiness in step.
      const account = event.data.object as Stripe.Account
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

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
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

      await supabase.from('candidate_profiles').update({
        is_featured: true,
        featured_until: monthEnd,
      }).eq('stripe_customer_id', customerId).eq('is_featured', true)

      // Commercial memberships carry no recognised metadata.type on their
      // invoices, so advance their renewal date here on every paid invoice.
      const invoiceLineEnd = Number((invoice.lines?.data?.[0] as any)?.period?.end || 0)
      const membershipRenewsAt = invoiceLineEnd > 0 ? new Date(invoiceLineEnd * 1000).toISOString() : monthEnd
      await supabase.from('candidate_profiles')
        .update({ membership_renews_at: membershipRenewsAt })
        .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
        .not('membership_tier', 'is', null)
      await supabase.from('employer_profiles')
        .update({ membership_renews_at: membershipRenewsAt })
        .or(`stripe_customer_id.eq.${customerId},membership_stripe_customer_id.eq.${customerId}`)
        .not('membership_tier', 'is', null)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
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
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
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

      await supabase.from('candidate_profiles').update({ is_featured: false, featured_until: null }).eq('stripe_customer_id', customerId)

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

  return NextResponse.json({ received: true })
}
