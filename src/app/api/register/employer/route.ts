import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { welcomeEmailHtml } from '@/lib/welcome-email-template'
import { sendTransactionalEmail } from '@/lib/send-email'
import { alertAdminOfSignup } from '@/lib/admin-alerts'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sanitiseEmployerRegistration, verifyRegistrationProof } from '@/lib/registration'
import { canCompleteRegistration } from '@/lib/role-access'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWelcomeEmail(email: string, firstName: string, userId?: string | null) {
  await sendTransactionalEmail({
    to: email,
    subject: 'Welcome to Talent House Collective',
    html: welcomeEmailHtml({ firstName, userType: 'employer', dashboardUrl: 'https://talenthousecollective.co.uk/employer/dashboard' }),
    kind: 'welcome_employer',
    userId,
  })
}


// Insert, stripping ONLY columns the DB reports as unknown (keeps all other data).
async function insertStrippingUnknownColumns(supabase: any, table: string, row: Record<string, any>, maxStrips = 8) {
  const data = { ...row }
  for (let i = 0; i <= maxStrips; i++) {
    const { error } = await supabase.from(table).insert(data)
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

    // Bind the new profile to the authenticated session, never merely to a
    // user id supplied in JSON.
    const cookieStore = await cookies()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user: signedInUser } } = await authClient.auth.getUser()
    const proof = verifyRegistrationProof(registrationProof, { userId, role: 'employer' })
    if (signedInUser?.id !== userId && !proof) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Wait for the user to be fully committed to auth.users
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
      console.error('profiles role check failed (employer register):', accountError.message)
      return NextResponse.json({ error: 'We could not verify this account type. Please try again.' }, { status: 503 })
    }
    if (!canCompleteRegistration(existingAccount?.role, 'employer')) {
      return NextResponse.json({ error: 'This email is already registered as a talent account. Please sign in through Talent.' }, { status: 409 })
    }

    const { data: existingCandidate, error: candidateCheckError } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (candidateCheckError) {
      console.error('candidate profile check failed (employer register):', candidateCheckError.message)
      return NextResponse.json({ error: 'We could not verify this account type. Please try again.' }, { status: 503 })
    }
    if (existingCandidate && existingAccount?.role !== 'admin') {
      return NextResponse.json({ error: 'This email is already registered as a talent account. Please sign in through Talent.' }, { status: 409 })
    }

    const { data: existingEmployer } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (existingEmployer) {
      return NextResponse.json({ error: 'This registration has already been completed.' }, { status: 409 })
    }

    const safeProfile = sanitiseEmployerRegistration(profileData, userId, userEmail)
    if (!safeProfile.company_name || !safeProfile.contact_name || safeProfile.agreed_terms !== true) {
      return NextResponse.json({ error: 'Company name, contact name and acceptance of the terms are required.' }, { status: 400 })
    }

    // Ensure the shared profiles row exists - messaging FKs, role routing and
    // notifications all key on it. Live check constraint allows 'employer'.
    // ignoreDuplicates keeps this idempotent and never overwrites an existing row.
    try {
      const { error: profErr } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email: userEmail,
          role: 'employer',
          full_name: safeProfile.property_name || safeProfile.company_name || null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      if (profErr) console.error('profiles upsert failed (employer register):', profErr.message)
    } catch (e: any) {
      console.error('profiles upsert failed (employer register):', e?.message)
    }

    // Insert employer profile with retry loop
    let lastError: string | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: profileError } = await supabase
        .from('employer_profiles')
        .insert(safeProfile)

      if (!profileError) {
        if (userEmail) await alertAdminOfSignup('employer', safeProfile.property_name || safeProfile.company_name); await sendWelcomeEmail(userEmail, String(safeProfile.contact_name || safeProfile.company_name).split(' ')[0] || 'there')
        return NextResponse.json({ success: true })
      }

      lastError = profileError.message

      if (profileError.message.includes('foreign key') || profileError.message.includes('fkey')) {
        await sleep(1000)
        continue
      }

      // Column mismatch: strip only the offending columns, keep the rest of the data
      const result = await insertStrippingUnknownColumns(supabase, 'employer_profiles', safeProfile)
      if (result.ok) {
        if (userEmail) await alertAdminOfSignup('employer', safeProfile.property_name || safeProfile.company_name); await sendWelcomeEmail(userEmail, String(safeProfile.contact_name || safeProfile.company_name).split(' ')[0] || 'there')
        return NextResponse.json({ success: true })
      }
      lastError = result.error
      await sleep(1000)
    }

    return NextResponse.json({ error: lastError || 'Failed to create profile after retries' }, { status: 500 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
