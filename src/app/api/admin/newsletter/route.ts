import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Admin newsletter management - the newsletter_subscribers table holds
// personal data, so everything comes through this service-role route with
// an admin check. GET lists subscribers (optional ?q= email search, capped
// at 500 rows, newest first). POST handles { action: 'remove', id } and
// { action: 'save_popup', ...settings } for the signup popup configuration.

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

const POPUP_KEYS = {
  enabled: 'newsletter_popup_enabled',
  heading: 'newsletter_popup_heading',
  text: 'newsletter_popup_text',
  button: 'newsletter_popup_button',
  delaySeconds: 'newsletter_popup_delay_seconds',
  frequencyDays: 'newsletter_popup_frequency_days',
} as const

async function upsertConfig(admin: ReturnType<typeof createAdminClient>, key: string, value: string) {
  const updatedAt = new Date().toISOString()
  const { data: existing, error: lookupError } = await admin
    .from('platform_config').select('key').eq('key', key).limit(1)
  if (lookupError) throw lookupError
  if (existing?.length) {
    const { error } = await admin.from('platform_config').update({ value, updated_at: updatedAt }).eq('key', key)
    if (error) throw error
    return
  }
  const { error } = await admin.from('platform_config').insert({ key, value, updated_at: updatedAt })
  if (error) throw error
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const q = String(req.nextUrl.searchParams.get('q') || '').trim()
  const admin = createAdminClient()
  let query = admin
    .from('newsletter_subscribers')
    .select('id, email, status, requested_at, confirmed_at, unsubscribed_at, source, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (q) {
    // Escape LIKE wildcards so a search for "%" or "_" behaves literally.
    const safe = q.replace(/[%_\\]/g, ch => `\\${ch}`)
    query = query.ilike('email_normalized', `%${safe.toLowerCase()}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscribers: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action || '')
  const admin = createAdminClient()

  if (action === 'remove') {
    const id = String(body?.id || '')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const now = new Date().toISOString()
    const { error } = await admin
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: now, updated_at: now })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'save_popup') {
    const heading = String(body?.heading ?? '').trim()
    const text = String(body?.text ?? '').trim()
    const button = String(body?.button ?? '').trim()
    if (!heading || !text || !button) {
      return NextResponse.json({ error: 'Heading, text and button label are all required.' }, { status: 400 })
    }
    const delayRaw = Number(body?.delaySeconds)
    const frequencyRaw = Number(body?.frequencyDays)
    const delaySeconds = Number.isFinite(delayRaw) ? Math.min(Math.max(Math.round(delayRaw), 0), 60) : 6
    const frequencyDays = Number.isFinite(frequencyRaw) ? Math.min(Math.max(Math.round(frequencyRaw), 1), 90) : 14

    try {
      await upsertConfig(admin, POPUP_KEYS.enabled, body?.enabled ? 'true' : 'false')
      await upsertConfig(admin, POPUP_KEYS.heading, heading)
      await upsertConfig(admin, POPUP_KEYS.text, text)
      await upsertConfig(admin, POPUP_KEYS.button, button)
      await upsertConfig(admin, POPUP_KEYS.delaySeconds, String(delaySeconds))
      await upsertConfig(admin, POPUP_KEYS.frequencyDays, String(frequencyDays))
    } catch (error: any) {
      return NextResponse.json({ error: error?.message || 'Could not save popup settings.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
