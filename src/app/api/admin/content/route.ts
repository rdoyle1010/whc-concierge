import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin content operations, service-role backed so RLS can be locked down on
// the underlying tables: site_images (homepage imagery + hero copy),
// platform_config (site settings), contact_queries (enquiries/complaints:
// status, delete, and REAL email replies via Resend).

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

async function requireAdmin() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const kind = req.nextUrl.searchParams.get('kind')
  const admin = createAdminClient()
  try {
    if (kind === 'site_images') {
      const { data } = await admin.from('site_images').select('*').order('sort_order', { ascending: true })
      return NextResponse.json({ rows: data || [] })
    }
    if (kind === 'platform_config') {
      const { data } = await admin.from('platform_config').select('*')
      return NextResponse.json({ rows: data || [] })
    }
    if (kind === 'contact_queries') {
      const { data } = await admin.from('contact_queries').select('*').order('created_at', { ascending: false })
      return NextResponse.json({ rows: data || [] })
    }
    return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const body = await req.json()
    const { action } = body

    // ── site_images (slots are the natural key on this table) ──
    if (action === 'image_update') {
      const { error } = await admin.from('site_images').update(body.data).eq('slot', body.slot)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (action === 'image_insert') {
      const { error } = await admin.from('site_images').insert(body.data)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (action === 'image_delete') {
      const { error } = await admin.from('site_images').delete().eq('slot', body.slot)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // ── platform_config ──
    if (action === 'config_upsert') {
      const { key, value } = body
      if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
      const { error } = await admin.from('platform_config').upsert({ key, value }, { onConflict: 'key' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // ── contact_queries: status / delete / reply ──
    if (action === 'query_status') {
      const { error } = await admin.from('contact_queries').update({ status: body.status }).eq('id', body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (action === 'query_delete') {
      const { error } = await admin.from('contact_queries').delete().eq('id', body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (action === 'query_reply') {
      // A REAL reply: emails the enquirer via Resend, then marks replied.
      const { data: q } = await admin.from('contact_queries').select('*').eq('id', body.id).maybeSingle()
      if (!q) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
      if (!q.email) return NextResponse.json({ error: 'This enquiry has no email address to reply to.' }, { status: 400 })
      const replyText = String(body.message || '').trim()
      if (!replyText) return NextResponse.json({ error: 'Please write a reply.' }, { status: 400 })
      if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY missing).' }, { status: 500 })

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: q.email,
          subject: `Re: your message to Wellness House Collective`,
          html: `
            <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
              <p style="font-size: 16px; font-weight: 600; margin-bottom: 24px;">WHC Concierge</p>
              <p style="color: #374151; white-space: pre-wrap;">${replyText.replace(/</g, '&lt;')}</p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
              <p style="font-size: 12px; color: #9CA3AF;">Your original message: ${String(q.message || '').slice(0, 500).replace(/</g, '&lt;')}</p>
            </div>`,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        console.error(`[Admin reply email FAILED ${res.status}] ${detail.slice(0, 300)}`)
        return NextResponse.json({ error: 'The email could not be sent - check resend.com/logs.' }, { status: 502 })
      }
      await admin.from('contact_queries').update({ status: body.markStatus || 'replied' }).eq('id', q.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
