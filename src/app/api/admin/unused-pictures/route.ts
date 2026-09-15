import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PUBLIC_PAGES_DRAFT_KEY, PUBLIC_PAGES_PUBLISHED_KEY, PUBLIC_PAGES_HISTORY_KEY } from '@/lib/public-page-content'

// The pictures nothing points at any more.
//
// Replacing a photograph uploads a new file under a new name and leaves the
// old one exactly where it was. Nothing has ever deleted one. Every picture
// ever uploaded to this platform is still sitting in the bucket, being paid
// for, and still reachable by anybody who has the address.
//
// Deleting them as they are replaced would be wrong: a replacement is not live
// until it is published, and the version history exists so a change can be put
// back. A file is only safe to remove once nothing refers to it - not the
// draft, not the published version, and not any of the ten versions kept for
// reverting.
//
// So this counts them, and deletes them when asked. It does not delete on its
// own. A picture removed by accident cannot be recovered from here, and the
// difference between a screen that reports and a screen that acts on its own
// is the difference between a tidy-up and a bad afternoon.

export const dynamic = 'force-dynamic'

const BUCKET = 'site-images'

/** Every URL mentioned anywhere in the stored content, however deeply. */
function urlsWithin(value: unknown, found: Set<string>): void {
  if (typeof value === 'string') {
    if (value.includes(`/${BUCKET}/`)) found.add(value.split('/').pop()!.split('?')[0])
    return
  }
  if (Array.isArray(value)) { for (const item of value) urlsWithin(item, found); return }
  if (value && typeof value === 'object') { for (const item of Object.values(value)) urlsWithin(item, found) }
}

async function stillReferenced(admin: ReturnType<typeof createAdminClient>): Promise<Set<string>> {
  const referenced = new Set<string>()

  // Everything that could bring a picture back: the draft, what is live, the
  // versions kept for reverting, and the separate website content that the
  // dark panels and the homepage slides live in.
  const { data } = await admin.from('platform_config').select('key,value')
  for (const row of (data || []) as any[]) {
    if (typeof row.value === 'string' && !row.value.includes(BUCKET)) continue
    try { urlsWithin(typeof row.value === 'string' ? JSON.parse(row.value) : row.value, referenced) }
    catch { urlsWithin(row.value, referenced) }
  }

  // A key that failed to parse must not be treated as referring to nothing.
  // Reading the raw string for filenames is cruder but it never under-counts,
  // and under-counting here deletes a photograph that is still on the site.
  for (const row of (data || []) as any[]) {
    const raw = typeof row.value === 'string' ? row.value : JSON.stringify(row.value ?? '')
    for (const match of raw.matchAll(/website-[0-9]+-[A-Za-z0-9._-]+/g)) referenced.add(match[0])
  }

  void [PUBLIC_PAGES_DRAFT_KEY, PUBLIC_PAGES_PUBLISHED_KEY, PUBLIC_PAGES_HISTORY_KEY]
  return referenced
}

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const admin = createAdminClient()
  const { data: files, error } = await admin.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) return NextResponse.json({ error: 'The picture store could not be read.' }, { status: 502 })

  const referenced = await stillReferenced(admin)
  const unused = (files || []).filter(file => !referenced.has(file.name))
  const bytes = unused.reduce((sum, file) => sum + Number((file as any)?.metadata?.size || 0), 0)

  return NextResponse.json({
    total: (files || []).length,
    unused: unused.length,
    bytes,
    // Newest first, so what she recognises is at the top.
    names: unused.map(file => file.name).sort().reverse().slice(0, 200),
  })
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body.confirm !== true) {
    return NextResponse.json({ error: 'Nothing was deleted, because the request did not confirm it.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: files, error } = await admin.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) return NextResponse.json({ error: 'The picture store could not be read.' }, { status: 502 })

  // Recomputed here rather than trusting a list the browser sent back. A
  // permanent delete driven by a list the client supplies is a permanent
  // delete anybody can aim.
  const referenced = await stillReferenced(admin)
  const unused = (files || []).filter(file => !referenced.has(file.name)).map(file => file.name)
  if (!unused.length) return NextResponse.json({ success: true, removed: 0 })

  const { error: removeError } = await admin.storage.from(BUCKET).remove(unused)
  if (removeError) {
    console.error('[pictures] could not remove unused files:', removeError.message)
    return NextResponse.json({ error: 'Some pictures could not be removed. Nothing else was changed.' }, { status: 502 })
  }

  console.log(`[pictures] ${actor.id} removed ${unused.length} unused files`)
  return NextResponse.json({ success: true, removed: unused.length })
}
