import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { welcomeEmailHtml } from '@/lib/welcome-email-template'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sanitiseTalentRegistration, verifyRegistrationProof } from '@/lib/registration'
import { canCompleteRegistration } from '@/lib/role-access'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWelcomeEmail(email: string, firstName: string) {
  const html = welcomeEmailHtml({ firstName, userType: 'talent', dashboardUrl: 'https://talent.wellnesshousecollective.co.uk/talent/dashboard' })
  if (!RESEND_API_KEY) { console.log(`[Welcome email skipped] To: ${email}`); return }
  // Awaited by callers (fire-and-forget dies on serverless) and failures logged loudly.
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: 'Welcome to WHC Concierge', html }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[Welcome email FAILED ${res.status}] To: ${email} - ${detail.slice(0, 300)}`)
    }
  } catch (err) {
    console.error('Welcome email failed:', err)
  }
}


// Referral link credit: tie the new candidate to their referrer. Best-effort -
// never blocks registration, and no-ops until migration 025 is live.
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

    // The profile must belong to the signed-in browser session. Previously a
    // caller who learned another auth UUID could create a profile for it.
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

    // Wait for the user to be fully committed to auth.users
    // This resolves the foreign key timing issue after signUp()
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

    const { data: existingCandidate } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (existingCandidate) {
      return NextResponse.json({ error: 'This registration has already been completed.' }, { status: 409 })
    }

    const safeProfile = sanitiseTalentRegistration(profileData, userId)
    if (!safeProfile.full_name || !safeProfile.role_level || safeProfile.agreed_terms !== true) {
      return NextResponse.json({ error: 'Name, role level and acceptance of the terms are required.' }, { status: 400 })
    }

    // Ensure the shared profiles row exists - messaging FKs, role routing and
    // notifications all key on it. Live check constraint requires 'candidate'
    // (not 'talent'); the app's auth helpers recognise both.
    // ignoreDuplicates keeps this idempotent and never overwrites an existing row.
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

    // Insert candidate profile with retry loop
    let lastError: string | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: profileError } = await supabase
        .from('candidate_profiles')
        .insert(safeProfile)

      if (!profileError) {
        if (body.refCode) await recordReferral(supabase, userId, body.refCode)
        if (userEmail) await sendWelcomeEmail(userEmail, String(safeProfile.full_name).split(' ')[0] || 'there')
        return NextResponse.json({ success: true })
      }

      lastError = profileError.message

      // If it's a foreign key error, wait and retry
      if (profileError.message.includes('foreign key') || profileError.message.includes('fkey')) {
        await sleep(1000)
        continue
      }

      // Column mismatch: strip only the offending columns, keep the rest of the data
      const result = await insertStrippingUnknownColumns(supabase, 'candidate_profiles', safeProfile)
      if (result.ok) {
        if (body.refCode) await recordReferral(supabase, userId, body.refCode)
        if (userEmail) await sendWelcomeEmail(userEmail, String(safeProfile.full_name).split(' ')[0] || 'there')
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
