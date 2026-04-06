import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { welcomeEmailHtml } from '@/lib/welcome-email-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@wellnesshousecollective.co.uk>'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sendWelcomeEmail(email: string, firstName: string) {
  const html = welcomeEmailHtml({ firstName, userType: 'talent', dashboardUrl: 'https://talent.wellnesshousecollective.co.uk/talent/dashboard' })
  if (!RESEND_API_KEY) { console.log(`[Welcome email skipped] To: ${email}`); return }
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: 'Welcome to WHC Concierge', html }),
  }).catch(err => console.error('Welcome email failed:', err))
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
    // This resolves the foreign key timing issue after signUp()
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

    // Insert candidate profile with retry loop
    let lastError: string | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: profileError } = await supabase
        .from('candidate_profiles')
        .insert({ user_id: userId, ...profileData })

      if (!profileError) {
        if (userEmail) sendWelcomeEmail(userEmail, profileData.full_name?.split(' ')[0] || 'there')
        return NextResponse.json({ success: true })
      }

      lastError = profileError.message

      // If it's a foreign key error, wait and retry
      if (profileError.message.includes('foreign key') || profileError.message.includes('fkey')) {
        await sleep(1000)
        continue
      }

      // If it's a column error, retry with minimal fields
      const { error: retryError } = await supabase
        .from('candidate_profiles')
        .insert({
          user_id: userId,
          full_name: profileData.full_name,
          phone: profileData.phone || null,
          bio: profileData.bio || null,
          headline: profileData.headline || null,
        })

      if (!retryError) {
        if (userEmail) sendWelcomeEmail(userEmail, profileData.full_name?.split(' ')[0] || 'there')
        return NextResponse.json({ success: true })
      }

      lastError = retryError.message
      await sleep(1000)
    }

    return NextResponse.json({ error: lastError || 'Failed to create profile after retries' }, { status: 500 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
