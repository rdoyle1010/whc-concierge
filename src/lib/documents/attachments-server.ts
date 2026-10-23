import { createAdminClient } from '@/lib/supabase/admin'
import { type Attachment } from './attachments'

// Reading the files out of the database.
//
// Separate from ./attachments on purpose, and not for tidiness. That module
// holds the types, the size limit and readableSize, all of which a client
// component legitimately wants. This one holds a service-role client. Putting
// them together meant a browser bundle that imported a formatting helper got
// a database admin client with it, evaluated it without the environment it
// needs, and the shop rendered an error boundary.

const asAttachment = (row: any): Attachment => ({
  id: row.id,
  name: row.name,
  description: row.description,
  storagePath: row.storage_path,
  fileName: row.file_name,
  contentType: row.content_type,
  sizeBytes: row.size_bytes,
  packSlugs: row.pack_slugs || [],
  slug: row.slug || null,
  pricePence: row.price_pence ?? null,
  isLive: row.is_live,
  sortOrder: row.sort_order,
  replacesWorkbook: Boolean(row.replaces_workbook),
})

export async function loadAttachments(liveOnly: boolean, admin = createAdminClient()): Promise<Attachment[]> {
  let query = admin.from('standards_attachments').select('*').order('sort_order', { ascending: true })
  if (liveOnly) query = query.eq('is_live', true)
  const { data, error } = await query
  if (error || !data) return []
  return (data as any[]).map(asAttachment)
}
