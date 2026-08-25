import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canRoleAccessPath, dashboardForRole, normaliseAccountRole } from '@/lib/role-access'

export const dynamic = 'force-dynamic'

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

    const supabase = await createServerSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Sign in failed.' }, { status: 401 })
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
      return NextResponse.json({ error: 'Your account role could not be verified. Please contact WHC support.' }, { status: 403 })
    }

    if (expectedRole) {
      const matchesSelectedLogin = expectedRole === 'employer'
        ? accountRole === 'employer'
        : expectedRole === 'talent'
          ? accountRole === 'candidate'
          : accountRole === 'admin'

      if (!matchesSelectedLogin) {
        await supabase.auth.signOut()
        const correctArea = accountRole === 'employer'
          ? 'Hotel / Employer'
          : accountRole === 'candidate'
            ? 'Talent'
            : 'Admin'
        return NextResponse.json({
          error: `This is a ${correctArea} account. Please use the ${correctArea} sign in.`,
          accountRole,
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
