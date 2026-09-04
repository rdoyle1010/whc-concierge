import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRegistrationProof, type RegistrationRole } from '@/lib/registration'
import { createAdminClient } from '@/lib/supabase/admin'
import { geocodePostcode } from '@/lib/geo'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

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

    if (!email || !password || !role || password.length < 8) {
      return NextResponse.json({ error: 'Please provide a valid email and a password of at least 8 characters.' }, { status: 400 })
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
      const { error: candidateError } = await admin.from('candidate_profiles').upsert({
        user_id: data.user.id,
        full_name: displayName || null,
        phone: phone || null,
        postcode: postcode || null,
        location: postcode || null,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
        has_car: hasCar,
        approval_status: 'approved',
        profile_visible: true,
      }, { onConflict: 'user_id' })
      if (candidateError) {
        console.error('Talent signup candidate profile seed failed:', candidateError.message)
        return NextResponse.json({ error: 'Your account was created, but we could not open your Talent profile. Please sign in and try again.' }, { status: 500 })
      }

      if (typeof body.refCode === 'string' && body.refCode.trim()) {
        await recordReferral(admin, data.user.id, body.refCode)
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

    return NextResponse.json({
      userId: data.user.id,
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
