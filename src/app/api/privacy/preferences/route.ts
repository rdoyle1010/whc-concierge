import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARKETING_CONSENT_WORDING, PRIVACY_POLICY_VERSION } from '@/lib/privacy-consent'
import { getRequestUser } from '@/lib/request-user'

// The browser sends a cookie session; the mobile preference screen sends the
// same Supabase access token as a Bearer header. Both resolve to the same
// user, and the Bearer path carries the same two-step verification rule.
async function getUser(req?: NextRequest) {
  const authorization = req?.headers.get('authorization') || ''
  if (authorization.startsWith('Bearer ')) {
    return { data: { user: await getRequestUser(req as NextRequest) } }
  }
  const cookieStore = await cookies()
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  return client.auth.getUser()
}

const BOOLEAN_FIELDS = [
  'marketing_sms', 'marketing_phone', 'job_alerts_email', 'application_updates_email',
  'booking_updates_email', 'academy_updates_email',
  'product_news_email', 'partner_marketing_email', 'share_profile_with_employers',
  'share_profile_with_whc_partners', 'allow_anonymised_research',
] as const

export async function GET(req: NextRequest) {
  const { data: { user } } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin.from('privacy_preferences').select('*').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({
    preferences: data || {
      user_id: user.id,
      marketing_email_status: 'never',
      marketing_sms: false,
      marketing_phone: false,
      job_alerts_email: true,
      application_updates_email: true,
      booking_updates_email: true,
      academy_updates_email: false,
      product_news_email: false,
      partner_marketing_email: false,
      share_profile_with_employers: true,
      share_profile_with_whc_partners: false,
      allow_anonymised_research: false,
    },
    policyVersion: PRIVACY_POLICY_VERSION,
    marketingWording: MARKETING_CONSENT_WORDING,
  })
}

export async function POST(req: NextRequest) {
  const { data: { user } } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()

  const update: Record<string, any> = { user_id: user.id, updated_at: new Date().toISOString() }
  for (const field of BOOLEAN_FIELDS) if (typeof body[field] === 'boolean') update[field] = body[field]

  const { data: existing } = await admin.from('privacy_preferences').select('*').eq('user_id', user.id).maybeSingle()
  const { error } = await admin.from('privacy_preferences').upsert({ ...(existing || {}), ...update }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const events = BOOLEAN_FIELDS
    .filter(field => typeof body[field] === 'boolean' && existing?.[field] !== body[field])
    .map(field => ({
      user_id: user.id,
      consent_type: field,
      action: body[field] ? 'enabled' : 'disabled',
      policy_version: PRIVACY_POLICY_VERSION,
      wording: field === 'share_profile_with_whc_partners' ? 'Allow Talent House to share my profile with selected Talent House commercial partners outside a direct application or booking.' : null,
      source: 'account_preferences',
    }))
  if (events.length) await admin.from('consent_events').insert(events)

  return NextResponse.json({ success: true })
}
