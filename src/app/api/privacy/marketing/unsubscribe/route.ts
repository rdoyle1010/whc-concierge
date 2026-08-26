import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARKETING_CONSENT_WORDING, PRIVACY_POLICY_VERSION, verifyUnsubscribeToken } from '@/lib/privacy-consent'

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const userId = String(params.get('uid') || '')
  const token = String(params.get('token') || '')
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return NextResponse.redirect(new URL('/privacy?marketing=invalid-unsubscribe', req.url))
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  await admin.from('privacy_preferences').upsert({
    user_id: userId,
    marketing_email_status: 'unsubscribed',
    marketing_email_revoked_at: now,
    updated_at: now,
  }, { onConflict: 'user_id' })
  await admin.from('consent_events').insert({
    user_id: userId,
    consent_type: 'marketing_email',
    action: 'withdrawn',
    policy_version: PRIVACY_POLICY_VERSION,
    wording: MARKETING_CONSENT_WORDING,
    source: 'one_click_unsubscribe',
  })
  return NextResponse.redirect(new URL('/privacy?marketing=unsubscribed', req.url))
}
