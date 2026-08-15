import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRegistrationProof, type RegistrationRole } from '@/lib/registration'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = rateLimit('register-init', { windowMs: 60 * 60 * 1000, maxRequests: 10 })

export async function POST(req: NextRequest) {
  const { success } = limiter.check(getClientIp(req))
  if (!success) return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })

  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role: RegistrationRole | null = body.role === 'talent' || body.role === 'employer' ? body.role : null
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 200) : ''

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
      return NextResponse.json({ error: error?.message || 'Registration failed.' }, { status: 400 })
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed.' }, { status: 500 })
  }
}
