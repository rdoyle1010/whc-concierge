import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARKETING_CONSENT_WORDING, PRIVACY_POLICY_VERSION } from '@/lib/privacy-consent'

async function getUser() {
  const cookieStore = await cookies()
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  return client.auth.getUser()
}

export async function POST() {
  const { data: { user } } = await getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await admin.from('privacy_preferences').upsert({
    user_id: user.id,
    marketing_email_status: 'unsubscribed',
    marketing_email_revoked_at: now,
    updated_at: now,
  }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await admin.from('consent_events').insert({
    user_id: user.id,
    consent_type: 'marketing_email',
    action: 'withdrawn',
    policy_version: PRIVACY_POLICY_VERSION,
    wording: MARKETING_CONSENT_WORDING,
    source: 'account_preferences',
  })
  return NextResponse.json({ success: true })
}
