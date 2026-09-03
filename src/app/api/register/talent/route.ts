import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { welcomeEmailHtml } from '@/lib/welcome-email-template'
import { sendTransactionalEmail } from '@/lib/send-email'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sanitiseTalentRegistration, verifyRegistrationProof } from '@/lib/registration'
import { canCompleteRegistration } from '@/lib/role-access'

async function sendWelcomeEmail(email: string, firstName: string, userId?: string | null) {
  await sendTransactionalEmail({
    to: email,
    subject: 'Welcome to Talent House Collective',
    html: welcomeEmailHtml({ firstName, userType: 'talent', dashboardUrl: 'https://talenthousecollective.co.uk/talent/dashboard' }),
    kind: 'welcome_talent',
    userId,
  })
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function recordReferral(supabase: any, userId: string, refCode: string) {
  try {
    const code = String(refCode || '').trim().toUpperCase()
    if (!code) return
    const { data: referrer } = await supabase.from('candidate_profiles')
      .select('id, user_id, full_name').eq('referral_code', code).maybeSingle()
    if (!referrer) return
    const { data: newCand } = await supabase.from('candidate_profiles')
      .select('id').eq('user_id', userId).maybeSingle()
    if (!newCand || newCand.id === referrer.id) return
    await supabase.from('candidate_profiles').update({ referred_by: referrer.id }).eq('id', newCand.id)
    await supabase.from('referrals').upsert(
      { referrer_candidate_id: referrer.id, referred_candidate_id: newCand.id, status: 'pending' },
      { onConflict: 'referred_candidate_id', ignoreDuplicates: true }
    )
  } catch (e: any) {
    console.error('Referral record failed (non-fatal):', e?.message)
  }
}

// Upsert, stripping ONLY columns the DB reports as unknown. This makes the
// final registration step safe to retry if an auth/database trigger has
// already created the candidate row for this user.
async function upsertStrippingUnknownColumns(supabase: any, table: string, row: Record<string, any>, maxStrips = 8) {
  const data = { ...row }
  for (let i = 0; i <= maxStrips; i++) {
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'user_id' })
    if (!error) return { ok: true as const, stripped: i }
    const m = error.message.match(/Could not find the '([^']+)' column/) || error.message.match(/column "([^"]+)" of relation/)
    if (m && m[1] && m[1] in data) { delete data[m[1]]; continue }
    return { ok: false as const, error: error.message }
  }
  return { ok: false as const, error: 'Too many unknown columns' }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, profileData, registrationProof } = body

    if (!userId || !profileData) {
      return NextResponse.json({ error: 'Missing userId or profileData' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user: signedInUser } } = await authClient.auth.getUser()
    const proof = verifyRegistrationProof(registrationProof, { userId, role: 'talent' })
    if (signedInUser?.id !== userId && !proof) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const supabase = createAdminClient()

    let userVerified = false
    let userEmail = signedInUser?.email || proof?.email || ''
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase.auth.admin.getUserById(userId)
      if (data?.user && !error) {
        userVerified = true
        userEmail = data.user.email || ''
        break
      }
      await sleep(1000)
    }

    if (!userVerified) {
      return NextResponse.json({ error: 'User not found in auth - please try again' }, { status: 400 })
    }

    const { data: existingAccount, error: accountError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    if (accountError) {
      console.error('profiles role check failed (talent register):', accountError.message)
      return NextResponse.json({ error: 'We could not verify this account type. Please try again.' }, { status: 503 })
    }
    if (!canCompleteRegistration(existingAccount?.role, 'talent')) {
      return NextResponse.json({ error: 'This email is already registered as a hotel or employer account. Please sign in through Hotel / Employer.' }, { status: 409 })
    }

    const { data: existingEmployer, error: employerCheckError } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (employerCheckError) {
      console.error('employer profile check failed (talent register):', employerCheckError.message)
      return NextResponse.json({ error: 'We could not verify this account type. Please try again.' }, { status: 503 })
    }
    if (existingEmployer && existingAccount?.role !== 'admin') {
      return NextResponse.json({ error: 'This email is already registered as a hotel or employer account. Please sign in through Hotel / Employer.' }, { status: 409 })
    }

    const safeProfile = sanitiseTalentRegistration(profileData, userId)
    if (!safeProfile.full_name || !safeProfile.role_level || safeProfile.agreed_terms !== true) {
      return NextResponse.json({ error: 'Name, role level and acceptance of the terms are required.' }, { status: 400 })
    }

    try {
      const { error: profErr } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email: userEmail,
          role: 'candidate',
          full_name: safeProfile.full_name || null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      if (profErr) console.error('profiles upsert failed (talent register):', profErr.message)
    } catch (e: any) {
      console.error('profiles upsert failed (talent register):', e?.message)
    }

    // Candidate rows can be created by an auth/database trigger before this
    // final form submission. Upsert on user_id so registration is idempotent
    // and a retry completes the profile instead of throwing a duplicate-key error.
    let lastError: string | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: profileError } = await supabase
        .from('candidate_profiles')
        .upsert(safeProfile, { onConflict: 'user_id' })

      if (!profileError) {
        if (body.refCode) await recordReferral(supabase, userId, body.refCode)
        if (userEmail) await sendWelcomeEmail(userEmail, String(safeProfile.full_name).split(' ')[0] || 'there', userId)
        return NextResponse.json({ success: true })
      }

      lastError = profileError.message

      if (profileError.message.includes('foreign key') || profileError.message.includes('fkey')) {
        await sleep(1000)
        continue
      }

      const result = await upsertStrippingUnknownColumns(supabase, 'candidate_profiles', safeProfile)
      if (result.ok) {
        if (body.refCode) await recordReferral(supabase, userId, body.refCode)
        if (userEmail) await sendWelcomeEmail(userEmail, String(safeProfile.full_name).split(' ')[0] || 'there', userId)
        return NextResponse.json({ success: true })
      }
      lastError = result.error
      await sleep(1000)
    }

    return NextResponse.json({ error: lastError || 'Failed to save profile after retries' }, { status: 500 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
