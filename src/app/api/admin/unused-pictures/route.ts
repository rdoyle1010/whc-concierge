import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// The pictures nothing points at any more.
//
// Replacing a photograph uploads a new file under a new timestamped name and
// leaves the old one where it was, so the bucket fills with versions nobody
// can reach. Clearing those out is worth doing: they are paid for, and still
// reachable by anybody holding the address.
//
// This screen has now been wrong twice, in opposite directions, and the second
// time cost real photographs.
//
// First it counted correctly and deleted nothing: it listed the bucket without
// walking folders, and asking storage to remove a folder name succeeds and
// removes nothing. It reported thirteen, the button was pressed, and thirteen
// came back.
//
// Fixing that made it delete - while it still decided what was "in use" by
// reading a single table, platform_config. site-images is a shared bucket:
// brand logos, course photographs, blog pictures, company logos, property
// photographs and candidate portraits all live in it, referenced from their
// own tables, none of which this looked at. So nearly every picture on the
// platform counted as unused, and the delete was permanent.
//
// The lesson is about which way to fail. A sweep that keeps a file it could
// have deleted wastes a few pence. A sweep that deletes a file somebody is
// using destroys something they cannot get back. So the rule now is that a
// picture is in use until proven otherwise, and the proof has to be complete:
//
//   - referenced_storage_paths() asks the database which columns exist and
//     scans every text and jsonb column in the schema. A new table with an
//     image column is covered the day it is created.
//   - If that function is missing or errors, nothing is deletable at all. An
//     unanswerable question is never read as "nothing is in use" again.
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

// referencesWithin() used to live here. It walked the JSON in platform_config
// looking for anything that mentioned the bucket - a reasonable thing to do,
// and the reason this screen only ever knew about one table out of dozens. The
// scan happens in the database now, where the list of tables is not a guess.

/**
 * Every storage path anything in the database still points at.
 *
 * Returns null when the answer cannot be trusted, which is different from an
 * empty set and must never be confused with it: null means "we do not know",
 * and nothing may be deleted on the strength of not knowing.
 */
async function stillReferenced(admin: ReturnType<typeof createAdminClient>): Promise<Set<string> | null> {
  const { data, error } = await admin.rpc('referenced_storage_paths', { p_bucket: BUCKET })
  if (error) {
    console.error('[pictures] reference scan unavailable:', error.message)
    return null
  }
  if (!Array.isArray(data)) return null

  const referenced = new Set<string>()
  for (const row of data) {
    // The function returns a set of text, which supabase-js hands back either
    // as bare strings or as one-key objects depending on version.
    const value = typeof row === 'string' ? row : String((row as any)?.referenced_storage_paths ?? '')
    const path = value.split('?')[0].trim()
    if (!path) continue
    referenced.add(path)
    referenced.add(path.split('/').pop()!)
  }
  return referenced
}

async function unusedFiles(admin: ReturnType<typeof createAdminClient>) {
  const [files, referenced] = await Promise.all([listFiles(admin), stillReferenced(admin)])
  // Unknown references mean nothing is unused. Failing the other way is what
  // deleted the photographs.
  if (!referenced) return { files, unused: [] as StoredFile[], missing: [] as string[], known: false }

  const unused = files.filter(file => !referenced.has(file.path) && !referenced.has(file.path.split('/').pop()!))

  // The same two lists, read the other way round: a page points at a picture
  // that is not in the bucket.
  //
  // This is the report that would have caught the sweep the first morning,
  // instead of it being noticed days later from a screenful of broken icons.
  // It is also the recovery list - every one of these is a picture that needs
  // uploading again, named, rather than hunted for by clicking around.
  //
  // Only real paths count. The scan picks up anything shaped like a path in a
  // text column, so an example URL in a help string would otherwise read as a
  // missing photograph for ever.
  const present = new Set(files.map(file => file.path))
  const presentNames = new Set(files.map(file => file.path.split('/').pop()!))
  const missing = [...referenced]
    .filter(path => path.includes('/') || /\.[a-z0-9]{2,5}$/i.test(path))
    .filter(path => !present.has(path) && !presentNames.has(path.split('/').pop()!))
    .sort()

  return { files, unused, missing, known: true }
}

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const { files, unused, missing, known } = await unusedFiles(createAdminClient())
  return NextResponse.json({
    total: files.length,
    unused: unused.length,
    bytes: unused.reduce((sum, file) => sum + file.bytes, 0),
    names: unused.map(file => file.path).sort().reverse().slice(0, 200),
    missing: missing.length,
    missingNames: missing.slice(0, 200),
    known,
    ...(known ? {} : {
      warning: 'Nothing can be deleted until the reference check is installed, so none of these are listed as unused. '
        + 'Without it this screen cannot tell a spare copy from the photograph on your brand page.',
    }),
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
  const { unused, known } = await unusedFiles(admin)

  // The check that would have saved the photographs. If we cannot establish
  // what is in use, we delete nothing at all - rather than deleting everything
  // we failed to find a reference for.
  if (!known) {
    return NextResponse.json({
      error: 'Nothing was deleted. The check that works out which pictures are still in use is not installed, '
        + 'and without it this screen cannot tell a spare copy from a photograph on a live page.',
    }, { status: 503 })
  }
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
