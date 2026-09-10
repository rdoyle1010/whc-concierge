import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARKETING_CONSENT_WORDING, PRIVACY_POLICY_VERSION, verifyUnsubscribeToken } from '@/lib/privacy-consent'

async function unsubscribe(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const userId = String(params.get('uid') || '')
  const token = String(params.get('token') || '')
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) return false

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
  return true
}

export async function GET(req: NextRequest) {
  const done = await unsubscribe(req)
  return NextResponse.redirect(new URL(`/privacy?marketing=${done ? 'unsubscribed' : 'invalid-unsubscribe'}`, req.url))
}

// The one-click form, for the List-Unsubscribe-Post header. A mail client
// sends this for the reader without showing them anything, so it acts at once
// and answers in plain text rather than redirecting to a page nobody sees.
export async function POST(req: NextRequest) {
  const done = await unsubscribe(req)
  return new NextResponse(done ? 'Unsubscribed' : 'Invalid unsubscribe link', {
    status: done ? 200 : 400,
    headers: { 'Content-Type': 'text/plain' },
  })
}
