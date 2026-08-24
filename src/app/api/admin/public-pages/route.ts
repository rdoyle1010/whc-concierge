import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PUBLIC_PAGES_CACHE_TAG } from '@/lib/public-page-content-server'
import {
  cloneDefaultPublicPagesContent,
  parsePublicPagesContent,
  PublicPagesContentSchema,
  PUBLIC_PAGES_DRAFT_KEY,
  PUBLIC_PAGES_HISTORY_KEY,
  PUBLIC_PAGES_PUBLISHED_KEY,
  type PublicPagesHistoryEntry,
} from '@/lib/public-page-content'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return profile?.role === 'admin' ? user : null
}

async function saveValue(key: string, value: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('platform_config').select('key').eq('key', key).limit(1)
  if (data?.length) {
    const { error } = await admin.from('platform_config').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
    if (error) throw error
  } else {
    const { error } = await admin.from('platform_config').insert({ key, value, updated_at: new Date().toISOString() })
    if (error) throw error
  }
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin.from('platform_config').select('key,value').in('key', [PUBLIC_PAGES_DRAFT_KEY, PUBLIC_PAGES_PUBLISHED_KEY, PUBLIC_PAGES_HISTORY_KEY])
  const values = new Map((data || []).map(row => [row.key, row.value]))
  const published = values.has(PUBLIC_PAGES_PUBLISHED_KEY) ? parsePublicPagesContent(values.get(PUBLIC_PAGES_PUBLISHED_KEY)) : cloneDefaultPublicPagesContent()
  const draft = values.has(PUBLIC_PAGES_DRAFT_KEY) ? parsePublicPagesContent(values.get(PUBLIC_PAGES_DRAFT_KEY)) : published
  let history: PublicPagesHistoryEntry[] = []
  try { const parsed = JSON.parse(values.get(PUBLIC_PAGES_HISTORY_KEY) || '[]'); if (Array.isArray(parsed)) history = parsed.slice(0, 10) } catch {}
  return NextResponse.json({ draft, published, history })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = PublicPagesContentSchema.safeParse(body.content)
    if (!parsed.success) return NextResponse.json({ error: 'Some page fields are invalid.' }, { status: 400 })
    if (body.action === 'save') {
      await saveValue(PUBLIC_PAGES_DRAFT_KEY, JSON.stringify(parsed.data))
      return NextResponse.json({ success: true })
    }
    if (body.action === 'publish') {
      const admin = createAdminClient()
      const { data } = await admin.from('platform_config').select('key,value').in('key', [PUBLIC_PAGES_PUBLISHED_KEY, PUBLIC_PAGES_HISTORY_KEY])
      const values = new Map((data || []).map(row => [row.key, row.value]))
      let history: PublicPagesHistoryEntry[] = []
      try { const stored = JSON.parse(values.get(PUBLIC_PAGES_HISTORY_KEY) || '[]'); if (Array.isArray(stored)) history = stored } catch {}
      const previous = values.get(PUBLIC_PAGES_PUBLISHED_KEY)
      if (previous) history.unshift({ id: crypto.randomUUID(), publishedAt: new Date().toISOString(), publishedBy: user.id, content: parsePublicPagesContent(previous) })
      history = history.slice(0, 10)
      await Promise.all([
        saveValue(PUBLIC_PAGES_DRAFT_KEY, JSON.stringify(parsed.data)),
        saveValue(PUBLIC_PAGES_PUBLISHED_KEY, JSON.stringify(parsed.data)),
        saveValue(PUBLIC_PAGES_HISTORY_KEY, JSON.stringify(history)),
      ])
      revalidateTag(PUBLIC_PAGES_CACHE_TAG, 'max')
      return NextResponse.json({ success: true, history })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not save page content.' }, { status: 500 })
  }
}
