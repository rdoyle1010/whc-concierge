import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canRoleAccessPath, dashboardForRole, normaliseAccountRole } from '@/lib/role-access'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Supabase's own wording, turned into something a person can act on.
 *
 * "Invalid login credentials" covers a wrong password, a typo in the address
 * and an account that was never created, and says nothing about which - so
 * somebody reads it as "the platform will not let me in" rather than "try the
 * reset link". Worse, an unconfirmed sign-up returns a different message that
 * reads the same way, when the fix is simply to open the confirmation email.
 */
function signInMessage(raw: string | undefined): string {
  const message = String(raw || '').toLowerCase()
  if (message.includes('email not confirmed')) {
    return 'Your account is created but the email address has not been confirmed yet. Open the confirmation email we sent you, then sign in.'
  }
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'That email and password do not match an account. Check the password, use the reset link below, or create an account if you have not registered yet.'
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Wait a few minutes and try again.'
  }
  return raw || 'Sign in failed. Please try again.'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const requested = typeof body?.redirect === 'string' ? body.redirect : ''
    const expectedRole = ['employer', 'talent', 'admin'].includes(body?.role) ? body.role : null

    if (!email || !password) {
      return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 })
    }

    // Two limits, because they stop different attacks.
    //
    // Per address, because signInWithPassword runs on the server: Supabase's
    // own per-IP throttle sees the Netlify function's address, not the
    // caller's, so without this there was no brake anywhere in the path on
    // guessing passwords against the whole user base.
    //
    // Per account, because a patient attacker spread across many addresses
    // would otherwise walk straight past an address limit while hammering one
    // person's account.
    const byAddress = await enforceRateLimit(request, 'login-ip', { windowMs: 15 * 60_000, maxRequests: 20 })
    if (byAddress) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(byAddress.retryAfterSeconds) } },
      )
    }
    const byAccount = await enforceRateLimit(request, 'login-account', {
      windowMs: 15 * 60_000,
      maxRequests: 10,
      key: email.toLowerCase(),
    })
    if (byAccount) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts for this account. Wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(byAccount.retryAfterSeconds) } },
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData.user) {
      return NextResponse.json({ error: signInMessage(authError?.message) }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileError) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'Your account could not be verified. Please try again.' }, { status: 500 })
    }

    const accountRole = normaliseAccountRole(profile?.role)
    if (!accountRole) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'Your account role could not be verified. Please contact Talent House support.' }, { status: 403 })
    }

    if (expectedRole) {
      const matchesSelectedLogin = expectedRole === 'employer'
        ? accountRole === 'employer'
        : expectedRole === 'talent'
          ? accountRole === 'candidate'
          : accountRole === 'admin'

      if (!matchesSelectedLogin) {
        await supabase.auth.signOut()
        // Naming the door matters more than naming the account type. An
        // administrator who tries the ordinary sign-in page was told to "use
        // the Admin sign in" - which is not on that page, has no toggle, and
        // is at a URL nothing links to. That is a dead end dressed up as an
        // instruction, and it is how an administrator concludes their account
        // is broken.
        const correctArea = accountRole === 'employer'
          ? 'Hotel / Employer'
          : accountRole === 'candidate'
            ? 'Talent'
            : 'administrator'
        const where = accountRole === 'admin'
          ? 'Administrators sign in at talenthousecollective.co.uk/admin, not here.'
          : `Please use the ${correctArea} side of this page.`
        return NextResponse.json({
          error: `This is ${accountRole === 'admin' ? 'an' : 'a'} ${correctArea} account. ${where}`,
          accountRole,
          adminSignIn: accountRole === 'admin' ? '/admin' : undefined,
        }, { status: 403 })
      }
    }

    const safeRequested = requested
      && requested.startsWith('/')
      && !requested.startsWith('//')
      && canRoleAccessPath(accountRole, requested)
      ? requested
      : null

    const destination = safeRequested || dashboardForRole(accountRole)
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasVerifiedTotp = Boolean((factors?.totp || []).some((factor: any) => factor.status === 'verified'))
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (hasVerifiedTotp && assurance?.currentLevel !== 'aal2') {
      return NextResponse.json({ ok: true, mfaRequired: true, redirect: `/mfa-challenge?next=${encodeURIComponent(destination)}` }, {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }

    if (accountRole === 'admin' && !hasVerifiedTotp) {
      return NextResponse.json({ ok: true, setupRequired: true, redirect: '/admin/settings?security=required' }, {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }

    return NextResponse.json({ ok: true, redirect: destination }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('Login route failed:', error)
    return NextResponse.json({ error: 'Sign in failed. Please try again.' }, { status: 500 })
  }
}
