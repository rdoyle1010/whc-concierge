import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
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

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
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
  if (!user) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin.from('platform_config').select('key,value').in('key', [PUBLIC_PAGES_DRAFT_KEY, PUBLIC_PAGES_PUBLISHED_KEY, PUBLIC_PAGES_HISTORY_KEY])
  const values = new Map((data || []).map(row => [row.key, row.value]))
  const published = values.has(PUBLIC_PAGES_PUBLISHED_KEY) ? parsePublicPagesContent(values.get(PUBLIC_PAGES_PUBLISHED_KEY)) : cloneDefaultPublicPagesContent()
  const draft = values.has(PUBLIC_PAGES_DRAFT_KEY) ? parsePublicPagesContent(values.get(PUBLIC_PAGES_DRAFT_KEY)) : published
  let history: PublicPagesHistoryEntry[] = []
  try { const parsed = JSON.parse(values.get(PUBLIC_PAGES_HISTORY_KEY) || '[]'); if (Array.isArray(parsed)) history = parsed.slice(0, 10) } catch {}
  return NextResponse.json({ draft, published, history })
}

function parseSubmittedContent(content: unknown):
  | { ok: true; data: ReturnType<typeof parsePublicPagesContent> }
  | { ok: false; error: string; detail: string } {
  const strict = PublicPagesContentSchema.safeParse(content)
  if (strict.success) return { ok: true, data: strict.data }

  // parsePublicPagesContent fills gaps from the defaults and re-validates.
  // If the result is usable, the submission was merely older than the schema.
  const repaired = parsePublicPagesContent(content)
  const check = PublicPagesContentSchema.safeParse(repaired)
  if (check.success) return { ok: true, data: check.data }

  const first = strict.error.issues[0]
  const where = first?.path?.join(' → ') || 'somewhere in the content'
  return {
    ok: false,
    error: `That could not be saved: ${where} ${first?.message ? `(${first.message})` : 'is not valid'}.`,
    detail: JSON.stringify(strict.error.issues.slice(0, 5)),
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })
  try {
    const body = await req.json()
    // Repaired, not rejected, and this is the part that actually cost her the
    // photographs.
    //
    // A rejected save saves nothing at all. So when six pages were added to the
    // schema and her open editor was still holding a version from before them,
    // every upload she made was refused with "Some page fields are invalid" and
    // silently dropped. The live site went on serving the last thing that had
    // published successfully, which is why she kept reporting old photographs
    // after adding new ones. The error named no field, so there was nothing to
    // act on either.
    //
    // A picture somebody has already uploaded must not be lost because a page
    // they have never opened is missing from the payload. Gaps are filled from
    // the defaults first, and only content that is still unreadable after that
    // is refused - with the field named, so the next one is diagnosable.
    const parsed = parseSubmittedContent(body.content)
    if (!parsed.ok) {
      console.error('[public pages] rejected save:', parsed.detail)
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
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
