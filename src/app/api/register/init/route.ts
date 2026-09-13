import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRegistrationProof, type RegistrationRole } from '@/lib/registration'
import { createAdminClient } from '@/lib/supabase/admin'
import { geocodePostcode } from '@/lib/geo'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { recordTermsAcceptance, startMarketingOptIn } from '@/lib/privacy-consent'
import { LAUNCH_COURSE_SLUGS, grantCourses, launchOfferOpen } from '@/lib/launch-offers'
import { alertAdminOfSignup } from '@/lib/admin-alerts'
import { tolerantUpsert } from '@/lib/tolerant-upsert'
import { DEFAULT_VISIBILITY, isTalentVisibility, visibilityColumns } from '@/lib/talent-visibility'
import { welcomeEmailHtml } from '@/lib/welcome-email-template'
import { sendTransactionalEmail } from '@/lib/send-email'

export const runtime = 'nodejs'

const limiter = rateLimit('register-init', { windowMs: 60 * 60 * 1000, maxRequests: 10 })

// Best-effort referral credit: look up the referrer by their code, record the
// referral and mark the new candidate as referred. Never fails registration.
async function recordReferral(admin: ReturnType<typeof createAdminClient>, userId: string, refCode: string) {
  try {
    const code = String(refCode || '').trim().toUpperCase()
    if (!code) return
    const { data: referrer } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name').eq('referral_code', code).maybeSingle()
    if (!referrer) return
    const { data: newCand } = await admin.from('candidate_profiles')
      .select('id').eq('user_id', userId).maybeSingle()
    if (!newCand || newCand.id === referrer.id) return
    await admin.from('candidate_profiles').update({ referred_by: referrer.id }).eq('id', newCand.id)
    await admin.from('referrals').upsert(
      { referrer_candidate_id: referrer.id, referred_candidate_id: newCand.id, status: 'pending' },
      { onConflict: 'referred_candidate_id', ignoreDuplicates: true }
    )
  } catch (e: any) {
    console.error('Referral record failed (non-fatal):', e?.message)
  }
}

function friendlySignupError(message?: string) {
  const text = (message || '').toLowerCase()
  if (text.includes('weak') || text.includes('easy to guess') || text.includes('password')) {
    return 'That password is too easy to guess. Try a longer phrase or a more unique combination.'
  }
  if (text.includes('already registered') || text.includes('already exists') || text.includes('user already')) {
    return 'An account already exists for that email. Try signing in instead.'
  }
  if (text.includes('email')) {
    return 'Please check your email address and try again.'
  }
  return 'We could not create your account. Please check your details and try again.'
}

export async function POST(req: NextRequest) {
  const { success } = limiter.check(getClientIp(req))
  if (!success) return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })

  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role: RegistrationRole | null = body.role === 'talent' || body.role === 'employer' ? body.role : null
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 200) : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : ''
    const postcode = typeof body.postcode === 'string' ? body.postcode.trim().slice(0, 20) : ''
    const hasCar = body.hasCar === true
    // Anything other than one of the three answers is private. A malformed
    // body must not be the thing that publishes somebody's name.
    const visibility = isTalentVisibility(body.visibility) ? body.visibility : DEFAULT_VISIBILITY
    // Strictly true. An absent or truthy-ish value is not consent.
    const marketingOptIn = body.marketingOptIn === true
    // Same standard, and now required. An account used to be created before
    // anybody had agreed to anything: the talent sign-up asked at all, and
    // the employer form asked on the page but never told the server, so the
    // acceptance existed only in the browser that had already navigated away.
    // Enforced here because this is the route that creates the account.
    const agreedTerms = body.agreedTerms === true

    if (!email || !password || !role || password.length < 8) {
      return NextResponse.json({ error: 'Please provide a valid email and a password of at least 8 characters.' }, { status: 400 })
    }
    if (!agreedTerms) {
      return NextResponse.json({ error: 'Please accept the Terms & Conditions and Privacy Policy to create an account.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: role === 'talent'
          ? { role: 'talent', full_name: displayName }
          : { role: 'employer', company_name: displayName },
      },
    })

    if (error || !data.user) {
      return NextResponse.json({ error: friendlySignupError(error?.message) }, { status: 400 })
    }

    // Recorded against the account before anything else, so the ledger says
    // what was accepted and when even if a later step of registration fails.
    await recordTermsAcceptance(createAdminClient(), data.user.id, 'registration')

    let launchOfferGranted: string[] = []

    if (role === 'talent') {
      const admin = createAdminClient()
      const { error: sharedProfileError } = await admin.from('profiles').upsert({
        id: data.user.id,
        email,
        role: 'candidate',
        full_name: displayName || null,
        location: postcode || null,
      }, { onConflict: 'id' })
      if (sharedProfileError) {
        // Without a profiles row the account can never pass the role gate at
        // login - reporting success here would create a permanently locked
        // account. Fail loudly instead so the person can retry.
        console.error('Talent signup shared profile seed failed:', sharedProfileError.message)
        return NextResponse.json({ error: 'Your account could not be fully set up. Please try again in a moment.' }, { status: 500 })
      }

      let coords: { latitude: number; longitude: number } | null = null
      if (postcode) { try { coords = await geocodePostcode(postcode) } catch {} }
      // Tolerant, because it has to be.
      //
      // This wrote `agreed_terms`, which is not a column on this table, and
      // Postgres refuses a whole statement over one unknown column. So every
      // talent registration failed here, the person was told their profile
      // could not be opened, and they left - while the auth user, the
      // profiles row and the name all survived, which made it look like three
      // people who signed up and could not be bothered.
      //
      // Their acceptance of the terms is recorded above in its own ledger, by
      // recordTermsAcceptance, which is where it belongs and where it always
      // actually was.
      const seeded = await tolerantUpsert(admin, 'candidate_profiles', {
        user_id: data.user.id,
        full_name: displayName || null,
        phone: phone || null,
        postcode: postcode || null,
        location: postcode || null,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
        has_car: hasCar,
        approval_status: 'approved',
        ...visibilityColumns(visibility),
      }, { onConflict: 'user_id' })

      if (seeded.stripped.length) {
        // Noisy on purpose. A column quietly vanishing from this write is how
        // the bug hid for three days.
        console.error('Talent signup wrote without unknown columns:', seeded.stripped.join(', '))
      }
      if (!seeded.ok) {
        console.error('Talent signup candidate profile seed failed:', seeded.error)
        return NextResponse.json({ error: 'Your account was created, but we could not open your Talent profile. Please sign in and try again.' }, { status: 500 })
      }

      // Read it back, because the write above reported success and did not
      // happen. Three people signed up on the launch weekend, typed their
      // names in, and ended up on the register as "Unnamed": the name reached
      // auth.users and profiles and was absent from candidate_profiles, with
      // no error anywhere. The cause is still being tracked down in the
      // database rather than here.
      //
      // Until it is found, this refuses to take the write's word for it. A
      // profile with no name on it is invisible to matching, unaddressable in
      // an email, and reads as an abandoned account to whoever looks at it,
      // so it is worth one extra read to be certain.
      if (displayName) {
        const { data: saved } = await admin.from('candidate_profiles')
          .select('id, full_name').eq('user_id', data.user.id).maybeSingle()
        if (saved && !String(saved.full_name || '').trim()) {
          console.error('Talent signup name did not persist; repairing', { userId: data.user.id })
          const { error: repairError } = await admin.from('candidate_profiles')
            .update({ full_name: displayName }).eq('id', saved.id)
          if (repairError) console.error('Talent signup name repair failed:', repairError.message)
        }
      }

      if (typeof body.refCode === 'string' && body.refCode.trim()) {
        await recordReferral(admin, data.user.id, body.refCode)
      }

      // The opening-month offer. Granted here, at the moment the account is
      // created, rather than left as a promise to claim later: an offer you
      // have to remember to redeem is an offer most people never get, and the
      // two courses are worth far more to us sitting in somebody's Academy on
      // day one than as a coupon in an email.
      if (launchOfferOpen()) {
        try {
          const { data: newCandidate } = await admin.from('candidate_profiles')
            .select('id').eq('user_id', data.user.id).maybeSingle()
          if (newCandidate?.id) {
            launchOfferGranted = (await grantCourses(admin, newCandidate.id, LAUNCH_COURSE_SLUGS, 'opening month')).granted
          }
        } catch (offerError: any) {
          // Best effort, always. Nobody is refused an account because a gift
          // failed to land.
          console.error('Opening-month course grant failed:', offerError?.message)
        }
      }
    } else {
      // Employers need the shared profiles row too: if the second registration
      // step never completes, an auth user with no profiles row can never pass
      // the role gate at login and the email reads as already registered.
      const admin = createAdminClient()
      const { error: sharedProfileError } = await admin.from('profiles').upsert({
        id: data.user.id,
        email,
        role: 'employer',
        full_name: displayName || null,
        location: postcode || null,
      }, { onConflict: 'id' })
      if (sharedProfileError) {
        // Without a profiles row the account can never pass the role gate at
        // login - reporting success here would create a permanently locked
        // account. Fail loudly instead so the person can retry.
        console.error('Employer signup shared profile seed failed:', sharedProfileError.message)
        return NextResponse.json({ error: 'Your account could not be fully set up. Please try again in a moment.' }, { status: 500 })
      }
    }

    // Asked at the moment somebody is most willing, and never assumed: the
    // box is unticked, and ticking it starts the same double opt-in as the
    // preferences page. Their marketing status stays off until they click.
    //
    // Best effort on purpose. An account is not withheld because a marketing
    // email failed to send.
    let marketingOptInStarted = false
    if (marketingOptIn === true) {
      try {
        const consentAdmin = createAdminClient()
        const started = await startMarketingOptIn(consentAdmin, data.user.id, email, 'registration')
        marketingOptInStarted = started.ok
        if (!started.ok) console.error('Registration marketing opt-in failed:', started.error)
      } catch (optInError: any) {
        console.error('Registration marketing opt-in threw:', optInError?.message)
      }
    }

    // Talent registration is finished here: the account, the shared profile
    // and candidate_profiles are all written above, and the page redirects
    // straight to the dashboard. Nothing else runs afterwards, which is why
    // the alert has to fire here.
    //
    // It did not, and that is how a launch weekend passed with the platform
    // apparently silent. The alert lived in /api/register/talent, a route the
    // talent form has not called since this one took over, so every therapist
    // who joined did so without a word reaching anybody. Properties were fine:
    // their form calls /api/register/employer afterwards and that route still
    // alerts, which is exactly why the gap was invisible - the alerts that
    // were being tested were the ones that worked.
    //
    // Employers are deliberately not alerted from here. At this point their
    // property row does not exist yet, so an alert now would announce a
    // sign-up that may never be completed. Theirs fires once the profile is
    // actually written.
    if (role === 'talent') {
      await alertAdminOfSignup('talent', displayName).catch(() => {})

      // And the welcome, which went the same way for the same reason. A
      // therapist signed up and heard nothing at all from us: no welcome, no
      // orientation, just a confirmation link from a service she had never
      // heard of. The quietest possible first impression of a platform whose
      // whole argument is that somebody is paying attention.
      //
      // Best-effort, like the alert. A mail provider having a bad afternoon
      // must never cost somebody the account they just created.
      try {
        await sendTransactionalEmail({
          to: email,
          subject: 'Welcome to Talent House Collective',
          html: welcomeEmailHtml({
            firstName: String(displayName || '').trim().split(/\s+/)[0] || 'there',
            userType: 'talent',
            dashboardUrl: 'https://talenthousecollective.co.uk/talent/dashboard',
          }),
          kind: 'welcome_talent',
          userId: data.user.id,
        })
      } catch (welcomeError: any) {
        console.error('Talent welcome email threw:', welcomeError?.message)
      }
    }

    return NextResponse.json({
      userId: data.user.id,
      marketingOptInStarted,
      launchOfferGranted,
      registrationProof: createRegistrationProof({ userId: data.user.id, role, email }),
      requiresEmailConfirmation: !data.session,
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      } : null,
    })
  } catch {
    return NextResponse.json({ error: 'We could not create your account. Please try again.' }, { status: 500 })
  }
}
