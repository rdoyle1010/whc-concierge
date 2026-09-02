import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { shrinkImage, MAX_IMAGE_WIDTH } from '@/lib/image-resize'
import sharp from 'sharp'

// Reprocesses the pictures already in storage. Uploads are capped from now on,
// but that was prospective: every photograph uploaded before it still sits in
// the bucket at full camera resolution, and those are what visitors download.
//
// This lives as a route rather than a script because Rebecca works from a
// browser. A script would need a terminal, a checkout and the service role key
// on her own machine; here the key is already in Netlify's environment and
// never leaves it.
//
// Work is done in small batches with a cursor. A serverless function has a
// hard timeout and a bucket can hold hundreds of photographs, so the page
// calls this repeatedly rather than asking for everything at once and losing
// the lot to a timeout.

// Private buckets are deliberately absent. A right-to-work document is
// evidence; re-encoding it changes bytes somebody may later need to rely on.
const BUCKETS = ['site-images', 'property-photos'] as const
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i
const BATCH = 6

type Listed = { bucket: string; path: string }

async function listBucket(admin: ReturnType<typeof createAdminClient>, bucket: string, prefix = ''): Promise<string[]> {
  const out: string[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 100, offset })
    if (error || !data?.length) break
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      // A folder comes back with no id.
      if (!entry.id) out.push(...await listBucket(admin, bucket, path))
      else out.push(path)
    }
    if (data.length < 100) break
    offset += data.length
  }
  return out
}

export async function POST(req: NextRequest) {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const apply = body.apply === true
  const cursor = Number.isFinite(body.cursor) ? Math.max(0, Math.floor(body.cursor)) : 0

  const admin = createAdminClient()

  // The listing is cheap next to the image work, so it is rebuilt each call
  // rather than held in memory a serverless instance may not still have.
  const all: Listed[] = []
  for (const bucket of BUCKETS) {
    for (const path of await listBucket(admin, bucket)) {
      if (IMAGE_EXT.test(path)) all.push({ bucket, path })
    }
  }

  const slice = all.slice(cursor, cursor + BATCH)
  let rewritten = 0, before = 0, after = 0, skipped = 0, failed = 0
  const changes: { path: string; from: number; to: number; width: number }[] = []

  for (const item of slice) {
    const { data, error } = await admin.storage.from(item.bucket).download(item.path)
    if (error || !data) { failed++; continue }
    const original = Buffer.from(await data.arrayBuffer())
    const type = data.type || 'image/jpeg'

    let width = 0
    try { width = (await sharp(original, { failOn: 'none' }).metadata()).width || 0 } catch { /* reported as 0 */ }

    const out = await shrinkImage(original, type)
    // Do not churn an object for a rounding error.
    if (out.length >= original.length * 0.95) { skipped++; continue }

    before += original.length
    after += out.length
    rewritten++
    changes.push({ path: `${item.bucket}/${item.path}`, from: original.length, to: out.length, width })

    if (apply) {
      const { error: upErr } = await admin.storage.from(item.bucket).upload(item.path, out, {
        upsert: true,
        contentType: type,
        // Every upload path in the app is timestamped, so a replacement is a
        // new URL and this can be cached hard.
        cacheControl: '31536000',
      })
      if (upErr) { failed++; rewritten--; before -= original.length; after -= out.length; changes.pop() }
    }
  }

  const nextCursor = cursor + slice.length
  return NextResponse.json({
    total: all.length,
    cursor: nextCursor,
    done: nextCursor >= all.length,
    processed: slice.length,
    rewritten, skipped, failed, before, after, changes,
    maxWidth: MAX_IMAGE_WIDTH,
    applied: apply,
  })
}
