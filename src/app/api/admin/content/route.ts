import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  parseWebsiteContent,
  WebsiteContentSchema,
  WEBSITE_DRAFT_KEY,
  WEBSITE_HISTORY_KEY,
  WEBSITE_PUBLISHED_KEY,
  type WebsiteHistoryEntry,
} from '@/lib/site-content'
import { getWebsiteContent } from '@/lib/site-content-server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'
const DEFAULT_CONTACT_PAGE_SIZE = 25
const MAX_CONTACT_PAGE_SIZE = 100
const CONTACT_STATUSES = new Set(['open', 'replied', 'closed', 'investigating', 'resolved', 'dismissed'])

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

async function saveConfigValue(
  admin: ReturnType<typeof createAdminClient>,
  key: string,
  value: string,
  updatedAt = new Date().toISOString()
) {
  const { data: existing, error: lookupError } = await admin
    .from('platform_config')
    .select('key')
    .eq('key', key)
    .limit(1)
  if (lookupError) throw lookupError

  if (existing?.length) {
    const { error } = await admin
      .from('platform_config')
      .update({ value, updated_at: updatedAt })
      .eq('key', key)
    if (error) throw error
    return
  }

  const { error } = await admin
    .from('platform_config')
    .insert({ key, value, updated_at: updatedAt })
  if (error) throw error
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
    if (kind === 'website_editor') {
      const { data } = await admin
        .from('platform_config')
        .select('key, value, updated_at')
        .in('key', [WEBSITE_DRAFT_KEY, WEBSITE_PUBLISHED_KEY, WEBSITE_HISTORY_KEY])

      const values = new Map((data || []).map(row => [row.key, row.value]))
      const published = values.has(WEBSITE_PUBLISHED_KEY)
        ? parseWebsiteContent(values.get(WEBSITE_PUBLISHED_KEY))
        : await getWebsiteContent(false)
      const draft = values.has(WEBSITE_DRAFT_KEY)
        ? parseWebsiteContent(values.get(WEBSITE_DRAFT_KEY))
        : values.has(WEBSITE_PUBLISHED_KEY) ? published : await getWebsiteContent(true)
      let history: WebsiteHistoryEntry[] = []
      try {
        const parsed = JSON.parse(values.get(WEBSITE_HISTORY_KEY) || '[]')
        if (Array.isArray(parsed)) history = parsed.slice(0, 10)
      } catch {}
      return NextResponse.json({ draft, published, history })
    }
    if (kind === 'contact_queries') {
      const requestedPage = Number(req.nextUrl.searchParams.get('page'))
      const requestedPerPage = Number(req.nextUrl.searchParams.get('per_page'))
      const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1
      const perPage = Number.isFinite(requestedPerPage) && requestedPerPage > 0
        ? Math.min(Math.floor(requestedPerPage), MAX_CONTACT_PAGE_SIZE)
        : DEFAULT_CONTACT_PAGE_SIZE
      const statusParam = req.nextUrl.searchParams.get('status') || 'all'
      const status = CONTACT_STATUSES.has(statusParam) ? statusParam : 'all'
      const from = (page - 1) * perPage
      const to = from + perPage - 1

      const complaintsOnly = req.nextUrl.searchParams.get('view') === 'complaints'
      // subject and type arrive with today's migration - retry without them
      // (and without the type-based filters) so the inboxes work either way.
      const buildQuery = (withNewColumns: boolean) => {
        let query = admin.from('contact_queries')
          .select(withNewColumns
            ? 'id,name,email,subject,message,status,type,created_at,admin_reply,replied_at'
            : 'id,name,email,message,status,created_at,admin_reply,replied_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to)
        if (withNewColumns) query = complaintsOnly ? query.eq('type', 'complaint') : query.or('type.neq.complaint,type.is.null')
        if (status !== 'all') query = query.eq('status', status)
        return query
      }
      let { data, count, error } = await buildQuery(true)
      if (error) ({ data, count, error } = await buildQuery(false))
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const total = count || 0
      return NextResponse.json({
        rows: data || [],
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.max(1, Math.ceil(total / perPage)),
          has_more: to + 1 < total,
        },
      })
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

    if (action === 'config_upsert') {
      const { key, value } = body
      if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
      await saveConfigValue(admin, key, String(value ?? ''))
      return NextResponse.json({ success: true })
    }

    if (action === 'website_save_draft') {
      const parsed = WebsiteContentSchema.safeParse(body.content)
      if (!parsed.success) return NextResponse.json({ error: 'Some website fields are invalid.', details: parsed.error.flatten() }, { status: 400 })
      await saveConfigValue(admin, WEBSITE_DRAFT_KEY, JSON.stringify(parsed.data))
      return NextResponse.json({ success: true, content: parsed.data })
    }

    if (action === 'website_publish') {
      const parsed = WebsiteContentSchema.safeParse(body.content)
      if (!parsed.success) return NextResponse.json({ error: 'Some website fields are invalid.', details: parsed.error.flatten() }, { status: 400 })

      const { data: rows } = await admin.from('platform_config')
        .select('key, value')
        .in('key', [WEBSITE_PUBLISHED_KEY, WEBSITE_HISTORY_KEY])
      const values = new Map((rows || []).map(row => [row.key, row.value]))
      let history: WebsiteHistoryEntry[] = []
      try {
        const storedHistory = JSON.parse(values.get(WEBSITE_HISTORY_KEY) || '[]')
        if (Array.isArray(storedHistory)) history = storedHistory
      } catch {}

      const previousValue = values.get(WEBSITE_PUBLISHED_KEY)
      if (previousValue) {
        history.unshift({
          id: crypto.randomUUID(),
          publishedAt: new Date().toISOString(),
          publishedBy: user.id,
          content: parseWebsiteContent(previousValue),
        })
      }
      history = history.slice(0, 10)
      const now = new Date().toISOString()
      await Promise.all([
        saveConfigValue(admin, WEBSITE_DRAFT_KEY, JSON.stringify(parsed.data), now),
        saveConfigValue(admin, WEBSITE_PUBLISHED_KEY, JSON.stringify(parsed.data), now),
        saveConfigValue(admin, WEBSITE_HISTORY_KEY, JSON.stringify(history), now),
      ])
      // Bust the cached published content immediately - without this the
      // public site keeps serving the old version for up to 60 seconds.
      revalidateTag('website-content', 'max')
      return NextResponse.json({ success: true, publishedAt: now, history })
    }

    if (action === 'website_restore_draft') {
      const id = String(body.id || '')
      const { data: rows } = await admin.from('platform_config').select('value').eq('key', WEBSITE_HISTORY_KEY).limit(1)
      const row = rows?.[0]
      let history: WebsiteHistoryEntry[] = []
      try {
        const parsed = JSON.parse(row?.value || '[]')
        if (Array.isArray(parsed)) history = parsed
      } catch {}
      const version = history.find(item => item.id === id)
      if (!version) return NextResponse.json({ error: 'Version not found.' }, { status: 404 })
      const content = parseWebsiteContent(version.content)
      await saveConfigValue(admin, WEBSITE_DRAFT_KEY, JSON.stringify(content))
      return NextResponse.json({ success: true, content })
    }

    if (action === 'query_status') {
      if (!CONTACT_STATUSES.has(String(body.status))) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
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
      const { data: q } = await admin.from('contact_queries')
        .select('id,email,message')
        .eq('id', body.id)
        .maybeSingle()
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
              <hr style="border: none; border-top: 1px solid #e0dad2; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6e6a66;">Your original message: ${String(q.message || '').slice(0, 500).replace(/</g, '&lt;')}</p>
            </div>`,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        console.error(`[Admin reply email FAILED ${res.status}] ${detail.slice(0, 300)}`)
        return NextResponse.json({ error: 'The email could not be sent - check resend.com/logs.' }, { status: 502 })
      }
      const markStatus = CONTACT_STATUSES.has(String(body.markStatus)) ? body.markStatus : 'replied'
      await admin.from('contact_queries')
        .update({ status: markStatus, admin_reply: replyText, replied_at: new Date().toISOString() })
        .eq('id', q.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
