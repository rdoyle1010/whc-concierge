import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken, MARKETING_CONSENT_WORDING, PRIVACY_POLICY_VERSION } from '@/lib/privacy-consent'

export async function GET(req: NextRequest) {
  const token = String(new URL(req.url).searchParams.get('token') || '')
  if (!token) return NextResponse.redirect(new URL('/privacy?marketing=invalid', req.url))

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('marketing_confirmation_tokens')
    .select('id,user_id,expires_at,consumed_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()

  if (!row || row.consumed_at || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/privacy?marketing=expired', req.url))
  }

  const now = new Date().toISOString()
  const { error } = await admin.from('privacy_preferences').upsert({
    user_id: row.user_id,
    marketing_email_status: 'confirmed',
    marketing_email_confirmed_at: now,
    marketing_email_revoked_at: null,
    updated_at: now,
  }, { onConflict: 'user_id' })
  if (error) return NextResponse.redirect(new URL('/privacy?marketing=error', req.url))

  await admin.from('marketing_confirmation_tokens').update({ consumed_at: now }).eq('id', row.id)
  await admin.from('consent_events').insert({
    user_id: row.user_id,
    consent_type: 'marketing_email',
    action: 'confirmed',
    policy_version: PRIVACY_POLICY_VERSION,
    wording: MARKETING_CONSENT_WORDING,
    source: 'double_opt_in_email',
  })

  return NextResponse.redirect(new URL('/privacy?marketing=confirmed', req.url))
}
