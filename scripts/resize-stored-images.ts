/**
 * Resize the pictures already in storage.
 *
 * Uploads are capped at 2400px from now on, but that is prospective: every
 * photograph uploaded before it is still sitting in the bucket at full camera
 * resolution, and those are what visitors download today. On the one real
 * photograph in this repo, 5472px and 5.99MB became 2400px and 0.71MB with no
 * visible difference. This applies the same treatment to what is already there.
 *
 * Each object is rewritten at its own path, so every URL stored in the database
 * keeps working and nothing needs updating alongside it. Supabase purges its
 * CDN copy when an object is replaced, though an edge may serve the old bytes
 * for a few minutes afterwards.
 *
 *   npx tsx scripts/resize-stored-images.ts            # report only, writes nothing
 *   npx tsx scripts/resize-stored-images.ts --apply    # rewrite them
 *   npx tsx scripts/resize-stored-images.ts --apply --limit 5   # try a handful first
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment. Private buckets are deliberately left alone: a right-to-work
 * document or a message attachment is evidence, and re-encoding it changes the
 * bytes somebody may later need to rely on.
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const MAX_IMAGE_WIDTH = 2400
const BUCKETS = ['site-images', 'property-photos']
const SKIP = new Set(['image/svg+xml', 'image/gif'])
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i

const apply = process.argv.includes('--apply')
const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}
const admin = createClient(url, key, { auth: { persistSession: false } })

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + 'MB'

/** Storage has no recursive list, so walk the folders. */
async function listAll(bucket: string, prefix = ''): Promise<string[]> {
  const out: string[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 100, offset })
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`)
    if (!data?.length) break
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      // A folder comes back with no id.
      if (!entry.id) out.push(...await listAll(bucket, path))
      else out.push(path)
    }
    if (data.length < 100) break
    offset += data.length
  }
  return out
}

async function run() {
  let considered = 0, rewritten = 0, before = 0, after = 0, skipped = 0, failed = 0

  for (const bucket of BUCKETS) {
    let paths: string[]
    try { paths = await listAll(bucket) } catch (error: any) {
      console.error(`  ${bucket}: ${error.message}`)
      continue
    }
    const images = paths.filter(path => IMAGE_EXT.test(path))
    console.log(`\n${bucket}: ${images.length} images of ${paths.length} objects`)

    for (const path of images) {
      if (considered >= limit) break
      considered++
      const { data, error } = await admin.storage.from(bucket).download(path)
      if (error || !data) { failed++; console.log(`  ! ${path}: ${error?.message || 'could not download'}`); continue }

      const original = Buffer.from(await data.arrayBuffer())
      const type = data.type || ''
      if (SKIP.has(type)) { skipped++; continue }

      try {
        const image = sharp(original, { failOn: 'none' })
        const meta = await image.metadata()
        let pipeline = image.rotate()
        if (meta.width && meta.width > MAX_IMAGE_WIDTH) {
          pipeline = pipeline.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
        }
        const out = type === 'image/png'
          ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
          : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()

        // Never make anything bigger, and do not churn an object for a rounding
        // error: below 5% saved it is not worth replacing.
        if (out.length >= original.length * 0.95) { skipped++; continue }

        before += original.length
        after += out.length
        rewritten++
        console.log(`  ${apply ? 'rewrote' : 'would rewrite'} ${path}  ${mb(original.length)} -> ${mb(out.length)}  (${meta.width}px -> ${Math.min(meta.width || 0, MAX_IMAGE_WIDTH)}px)`)

        if (apply) {
          const { error: upErr } = await admin.storage.from(bucket).upload(path, out, {
            upsert: true, contentType: type || 'image/jpeg', cacheControl: '31536000',
          })
          if (upErr) { failed++; console.log(`  ! ${path}: ${upErr.message}`) }
        }
      } catch (error: any) {
        failed++
        console.log(`  ! ${path}: ${error?.message || 'could not process'}`)
      }
    }
  }

  const saved = before - after
  console.log(`\n${considered} images considered, ${rewritten} ${apply ? 'rewritten' : 'to rewrite'}, ${skipped} already fine, ${failed} failed`)
  if (rewritten) {
    console.log(`${mb(before)} -> ${mb(after)}, saving ${mb(saved)} (${Math.round((saved / before) * 100)}%)`)
  }
  if (!apply && rewritten) console.log('\nNothing was written. Re-run with --apply.')
}

run().catch(error => { console.error(error); process.exit(1) })
