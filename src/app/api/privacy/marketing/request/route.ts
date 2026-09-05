import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARKETING_CONSENT_WORDING, PRIVACY_POLICY_VERSION, hashToken, newConfirmationToken, sendMarketingDoubleOptInEmail } from '@/lib/privacy-consent'

async function getUser() {
  const cookieStore = await cookies()
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  return client.auth.getUser()
}

const RESEND_COOLDOWN_SECONDS = 60

export async function POST() {
  const { data: { user } } = await getUser()
  if (!user?.email) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })

  const admin = createAdminClient()

  // Asking again is how somebody who never received the first one gets in.
  // The button used to be disabled at "pending", which left anybody whose
  // confirmation email went missing stuck there permanently - and that is
  // where the largest part of a marketing list quietly sits.
  //
  // A short cooldown, because the button is now enabled and a confirmation
  // link is an email somebody else's address receives.
  const { data: existing } = await admin.from('privacy_preferences')
    .select('marketing_email_status, marketing_email_requested_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.marketing_email_status === 'confirmed') {
    return NextResponse.json({ success: true, status: 'confirmed', note: 'already confirmed' })
  }

  const lastAsked = existing?.marketing_email_requested_at ? new Date(existing.marketing_email_requested_at).getTime() : 0
  const waitedSeconds = Math.round((Date.now() - lastAsked) / 1000)
  if (lastAsked && waitedSeconds < RESEND_COOLDOWN_SECONDS) {
    return NextResponse.json({
      error: `A confirmation email went out less than a minute ago. Check your junk folder, then try again in ${RESEND_COOLDOWN_SECONDS - waitedSeconds} seconds.`,
    }, { status: 429 })
  }

  const token = newConfirmationToken()
  const now = new Date()
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  await admin.from('marketing_confirmation_tokens').delete().eq('user_id', user.id).is('consumed_at', null)
  const { error: tokenError } = await admin.from('marketing_confirmation_tokens').insert({
    user_id: user.id,
    token_hash: hashToken(token),
    expires_at: expires.toISOString(),
  })
  if (tokenError) return NextResponse.json({ error: tokenError.message }, { status: 500 })

  const { error: prefError } = await admin.from('privacy_preferences').upsert({
    user_id: user.id,
    marketing_email_status: 'pending',
    marketing_email_requested_at: now.toISOString(),
    marketing_email_confirmed_at: null,
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })
  if (prefError) return NextResponse.json({ error: prefError.message }, { status: 500 })

  await admin.from('consent_events').insert({
    user_id: user.id,
    consent_type: 'marketing_email',
    action: existing?.marketing_email_status === 'pending' ? 'requested_again' : 'requested',
    policy_version: PRIVACY_POLICY_VERSION,
    wording: MARKETING_CONSENT_WORDING,
    source: 'account_preferences',
  })

  const sent = await sendMarketingDoubleOptInEmail(user.email, token)
  if (!sent) return NextResponse.json({ error: 'We could not send the confirmation email. Your marketing preference is still off.' }, { status: 503 })

  return NextResponse.json({ success: true, status: 'pending', resent: existing?.marketing_email_status === 'pending' })
}
