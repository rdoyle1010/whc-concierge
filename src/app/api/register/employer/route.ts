import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { welcomeEmailHtml } from '@/lib/welcome-email-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWelcomeEmail(email: string, firstName: string) {
  const html = welcomeEmailHtml({ firstName, userType: 'employer', dashboardUrl: 'https://talent.wellnesshousecollective.co.uk/employer/dashboard' })
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
      console.error(`[Welcome email FAILED ${res.status}] To: ${email} — ${detail.slice(0, 300)}`)
    }
  } catch (err) {
    console.error('Welcome email failed:', err)
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
    const { userId, profileData } = body

    if (!userId || !profileData) {
      return NextResponse.json({ error: 'Missing userId or profileData' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Wait for the user to be fully committed to auth.users
    let userVerified = false
    let userEmail = ''
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
      return NextResponse.json({ error: 'User not found in auth — please try again' }, { status: 400 })
    }

    // Ensure the shared profiles row exists — messaging FKs, role routing and
    // notifications all key on it. Live check constraint allows 'employer'.
    // ignoreDuplicates keeps this idempotent and never overwrites an existing row.
    try {
      const { error: profErr } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email: userEmail,
          role: 'employer',
          full_name: profileData.property_name || profileData.company_name || null,
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
        .insert({ user_id: userId, ...profileData })

      if (!profileError) {
        if (userEmail) await sendWelcomeEmail(userEmail, profileData.company_name?.split(' ')[0] || profileData.contact_name?.split(' ')[0] || 'there')
        return NextResponse.json({ success: true })
      }

      lastError = profileError.message

      if (profileError.message.includes('foreign key') || profileError.message.includes('fkey')) {
        await sleep(1000)
        continue
      }

      // Column mismatch: strip only the offending columns, keep the rest of the data
      const result = await insertStrippingUnknownColumns(supabase, 'employer_profiles', { user_id: userId, ...profileData })
      if (result.ok) {
        if (userEmail) await sendWelcomeEmail(userEmail, profileData.company_name?.split(' ')[0] || profileData.contact_name?.split(' ')[0] || 'there')
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
