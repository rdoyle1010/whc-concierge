import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ATTACHMENT_BUCKET, MAX_ATTACHMENT_BYTES, ALLOWED_ATTACHMENT_TYPES,
  attachmentPath, loadAttachments,
} from '@/lib/documents/attachments'
import { departmentPacks, tierPacks } from '@/lib/documents/pricing'
import { loadBundles } from '@/lib/documents/pricing-server'

// Uploading a file into a pack.
//
// She has a compliance register in Excel that is more useful than anything I
// could write, and no way to sell it with the rest. This is that way.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const bundles = await loadBundles(false, admin)

  return NextResponse.json({
    attachments: await loadAttachments(false, admin),
    // Packs and her own bundles together, because a file belongs to whichever
    // she says and a buyer does not know the difference.
    slugs: [
      ...[...tierPacks(), ...departmentPacks()].map(pack => ({ slug: pack.slug, name: pack.name })),
      ...bundles.map(bundle => ({ slug: bundle.slug, name: `${bundle.name} (bundle)` })),
    ],
    maxBytes: MAX_ATTACHMENT_BYTES,
    allowed: Array.from(ALLOWED_ATTACHMENT_TYPES.keys()),
  })
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const form = await req.formData().catch(() => null)

  // The upload itself arrives as a form. Everything else is JSON.
  if (form?.get('file')) {
    const file = form.get('file') as File
    const name = String(form.get('name') || file.name).trim()

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({
        error: `That is ${(file.size / 1024 / 1024).toFixed(1)} MB and the limit is `
          + `${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB. Nothing has been uploaded.`,
      }, { status: 400 })
    }
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      return NextResponse.json({
        error: `A ${file.type || 'file of that kind'} cannot go in a pack. Spreadsheets, documents, `
          + 'presentations, PDFs and CSV files can.',
      }, { status: 400 })
    }

    const path = attachmentPath(file.name)
    const { error: uploadError } = await admin.storage.from(ATTACHMENT_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) {
      return NextResponse.json({
        error: `That did not upload: ${uploadError.message}. Nothing has been saved.`,
      }, { status: 500 })
    }

    // The row after the file, and the file removed if the row fails. A file
    // in a bucket with no row is a file nobody can reach and nobody can find
    // to delete, which is how storage bills grow without explanation.
    const { error } = await admin.from('standards_attachments').insert({
      name: name || file.name,
      description: String(form.get('description') || '').trim() || null,
      storage_path: path,
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
      uploaded_by: actor.id,
    })
    if (error) {
      await admin.storage.from(ATTACHMENT_BUCKET).remove([path])
      return NextResponse.json({ error: `${error.message}. The file was removed again.` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      note: 'Uploaded. Choose which packs it belongs to, then make it live.',
    })
  }

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')

  if (action === 'save') {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'Missing file.' }, { status: 400 })

    const packSlugs: string[] = Array.isArray(body.packSlugs) ? body.packSlugs.map(String) : []
    const bundles = await loadBundles(false, admin)
    const known = new Set([
      ...[...tierPacks(), ...departmentPacks()].map(pack => pack.slug),
      ...bundles.map(bundle => bundle.slug),
    ])
    const unknown = packSlugs.filter(slug => !known.has(slug))
    if (unknown.length) {
      return NextResponse.json({ error: `Not a pack: ${unknown.slice(0, 3).join(', ')}.` }, { status: 400 })
    }
    // Live with no pack is a file nobody can ever reach, which looks like a
    // fault rather than the half-finished setup it is.
    if (body.isLive === true && !packSlugs.length) {
      return NextResponse.json({
        error: 'Choose at least one pack before making it live, or nobody can ever download it.',
      }, { status: 400 })
    }

    const { error } = await admin.from('standards_attachments').update({
      name: String(body.name || '').trim() || undefined,
      description: String(body.description || '').trim() || null,
      pack_slugs: packSlugs,
      is_live: body.isLive === true,
      sort_order: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      note: body.isLive === true
        ? 'Saved. Anybody who owns one of those packs can download it now.'
        : 'Saved. It is not delivered to anybody until you make it live.',
    })
  }

  if (action === 'delete') {
    const id = String(body.id || '')
    const { data: row } = await admin.from('standards_attachments')
      .select('storage_path').eq('id', id).maybeSingle()

    const { error } = await admin.from('standards_attachments').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // The row first, then the file. The other way round leaves a row pointing
    // at nothing, which a buyer meets as a download that fails.
    if (row?.storage_path) {
      const { error: removeError } = await admin.storage.from(ATTACHMENT_BUCKET).remove([row.storage_path])
      if (removeError) {
        return NextResponse.json({
          success: true,
          warning: `Removed from the packs, but the file itself is still in storage: ${removeError.message}.`,
        })
      }
    }
    return NextResponse.json({ success: true, note: 'Deleted.' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
