import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// The pictures nothing points at any more.
//
// Replacing a photograph uploads a new file under a new timestamped name and
// leaves the old one exactly where it was. Nothing has ever deleted one, so
// every picture ever uploaded is still in the bucket: paid for, and still
// reachable by anybody holding the address.
//
// Deleting on replacement would be wrong. A replacement is not live until it
// is published, and ten previous versions are kept so a change can be put
// back. A file is only safe to remove once nothing refers to it at all.
//
// The first version of this counted correctly and deleted nothing, which is
// the worst way to fail: the button reported thirteen, she pressed it, and
// thirteen came back. Two reasons, both in the listing.
//
// A bucket listing returns folders and placeholders alongside files. A folder
// has no id, and asking storage to remove a folder name succeeds and removes
// nothing, so the count never moved. And it only ever listed the top level, so
// anything inside a folder was neither counted nor removable.
//
// It now walks the folders, keeps only real files, addresses them by their
// full path, and reports how many were actually removed rather than assuming.

export const dynamic = 'force-dynamic'

const BUCKET = 'site-images'
const PAGE = 1000

type StoredFile = { path: string; bytes: number }

/**
 * Every real file in the bucket, folders walked.
 *
 * An entry with no id is a folder or the placeholder Supabase writes into an
 * empty one. Treating either as a file is how a delete reports success and
 * changes nothing.
 */
async function listFiles(
  admin: ReturnType<typeof createAdminClient>,
  prefix = '',
  depth = 0,
): Promise<StoredFile[]> {
  if (depth > 4) return []
  const { data, error } = await admin.storage.from(BUCKET).list(prefix, { limit: PAGE })
  if (error || !data) return []

  const files: StoredFile[] = []
  for (const entry of data as any[]) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.id) {
      files.push({ path, bytes: Number(entry?.metadata?.size || 0) })
    } else if (entry.name !== '.emptyFolderPlaceholder') {
      files.push(...await listFiles(admin, path, depth + 1))
    }
  }
  return files
}

/**
 * Everything a stored picture could still be named by.
 *
 * Both the full path and the bare filename, because a stored URL carries the
 * path while older content sometimes carries only the name, and a picture
 * missed by this check is a picture deleted off a live page.
 */
function referencesWithin(value: unknown, found: Set<string>): void {
  if (typeof value === 'string') {
    if (value.includes(BUCKET)) {
      const after = value.split(`${BUCKET}/`).pop()!.split('?')[0]
      if (after) { found.add(after); found.add(after.split('/').pop()!) }
    }
    return
  }
  if (Array.isArray(value)) { for (const item of value) referencesWithin(item, found); return }
  if (value && typeof value === 'object') { for (const item of Object.values(value)) referencesWithin(item, found) }
}

async function stillReferenced(admin: ReturnType<typeof createAdminClient>): Promise<Set<string>> {
  const referenced = new Set<string>()
  const { data } = await admin.from('platform_config').select('key,value')

  for (const row of (data || []) as any[]) {
    const raw = typeof row.value === 'string' ? row.value : JSON.stringify(row.value ?? '')
    if (!raw.includes(BUCKET)) continue

    try { referencesWithin(typeof row.value === 'string' ? JSON.parse(row.value) : row.value, referenced) }
    catch { /* handled by the raw scan below */ }

    // A value that will not parse must not read as referring to nothing. This
    // is cruder and can only over-count, which is the right direction:
    // over-counting leaves a file lying about, under-counting deletes a
    // photograph that is still on a page.
    for (const match of raw.matchAll(/[A-Za-z0-9._-]*website-[0-9]+-[A-Za-z0-9._-]+/g)) {
      referenced.add(match[0]); referenced.add(match[0].split('/').pop()!)
    }
  }
  return referenced
}

async function unusedFiles(admin: ReturnType<typeof createAdminClient>) {
  const [files, referenced] = await Promise.all([listFiles(admin), stillReferenced(admin)])
  const unused = files.filter(file => !referenced.has(file.path) && !referenced.has(file.path.split('/').pop()!))
  return { files, unused }
}

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const { files, unused } = await unusedFiles(createAdminClient())
  return NextResponse.json({
    total: files.length,
    unused: unused.length,
    bytes: unused.reduce((sum, file) => sum + file.bytes, 0),
    names: unused.map(file => file.path).sort().reverse().slice(0, 200),
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
  // Recomputed rather than taken from the browser. A permanent delete driven
  // by a list the client sends is a permanent delete anybody can aim.
  const { unused } = await unusedFiles(admin)
  if (!unused.length) return NextResponse.json({ success: true, removed: 0 })

  const paths = unused.map(file => file.path)
  const { data: removed, error } = await admin.storage.from(BUCKET).remove(paths)
  if (error) {
    console.error('[pictures] remove failed:', error.message)
    return NextResponse.json({ error: `Those could not be deleted: ${error.message}` }, { status: 502 })
  }

  // Storage reports what it actually removed, and it is not always everything
  // asked for. Reporting the number requested would have hidden exactly the
  // failure that made the first version of this look broken.
  const count = Array.isArray(removed) ? removed.length : 0
  if (!count) {
    console.error('[pictures] remove returned nothing for:', paths.slice(0, 10))
    return NextResponse.json({
      error: 'Storage accepted the request and removed nothing. The pictures are still there.',
    }, { status: 502 })
  }

  console.log(`[pictures] ${actor.id} removed ${count} of ${paths.length} unused files`)
  return NextResponse.json({ success: true, removed: count, asked: paths.length })
}
