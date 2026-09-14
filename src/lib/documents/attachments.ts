import { createAdminClient } from '@/lib/supabase/admin'

// Files that travel with a pack.
//
// The compliance register this library grew out of is a spreadsheet, and a
// spreadsheet is the right shape for it: a register is a live thing somebody
// filters and sorts, and rewriting it as a PDF would turn a tool back into a
// picture of one.

export const ATTACHMENT_BUCKET = 'standards-files'

// Sixty megabytes, because a workbook with a year of water tests in it is a
// real file and refusing it would mean telling her to email it instead.
export const MAX_ATTACHMENT_BYTES = 60 * 1024 * 1024

// What may be sold as part of a pack. Deliberately not an image format and
// deliberately not a script: this is a list of things a spa opens in Office
// or a reader, and anything outside it is a file nobody asked for.
export const ALLOWED_ATTACHMENT_TYPES = new Map<string, string>([
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  ['application/vnd.ms-excel', 'xls'],
  ['application/vnd.ms-excel.sheet.macroEnabled.12', 'xlsm'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['application/msword', 'doc'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx'],
  ['application/pdf', 'pdf'],
  ['text/csv', 'csv'],
])

export type Attachment = {
  id: string
  name: string
  description: string | null
  storagePath: string
  fileName: string
  contentType: string | null
  sizeBytes: number
  packSlugs: string[]
  isLive: boolean
  sortOrder: number
  /** This file is the reporting workbook, so the generated one stands down. */
  replacesWorkbook: boolean
}

const asAttachment = (row: any): Attachment => ({
  id: row.id,
  name: row.name,
  description: row.description,
  storagePath: row.storage_path,
  fileName: row.file_name,
  contentType: row.content_type,
  sizeBytes: row.size_bytes,
  packSlugs: row.pack_slugs || [],
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

/**
 * The files a buyer is entitled to, from the packs they have bought.
 *
 * Matched on slug rather than on the documents inside a pack, because a file
 * is not a document: a workbook belongs to the pack as a whole and there is
 * no sensible way to own half of it.
 */
export function attachmentsForSlugs(attachments: Attachment[], slugs: string[]): Attachment[] {
  const owned = new Set(slugs)
  return attachments.filter(attachment => attachment.packSlugs.some(slug => owned.has(slug)))
}

/**
 * The uploaded file that replaces the generated reporting workbook.
 *
 * The one built in code is a floor, not a ceiling. It computes, and it agrees
 * with the documents beside it because both are rendered from the same
 * register, but it cannot do a chart, a pivot or a conditional format, and
 * the person who knows how a spa director reads a month can build a better
 * one in Excel in an afternoon.
 *
 * Stated on the file rather than inferred from it being a spreadsheet: the
 * compliance register is a spreadsheet too, and a rule that guessed would
 * withdraw the reporting workbook the first time a register was uploaded to
 * the same pack. Two workbooks in one pack is worse than either alone, since
 * the buyer has to decide which is authoritative and will suspect the other
 * disagreed.
 *
 * Asked of the files one buyer actually receives, so a bundle buyer whose
 * pack does not carry hers still gets the generated one rather than nothing.
 */
export function replacementWorkbook(attachments: Attachment[]): Attachment | null {
  return attachments.find(attachment => attachment.isLive && attachment.replacesWorkbook) || null
}

export function extensionFor(contentType: string | null, fileName: string): string {
  const known = contentType ? ALLOWED_ATTACHMENT_TYPES.get(contentType) : undefined
  if (known) return known
  const fromName = fileName.includes('.') ? fileName.split('.').pop() : ''
  return (fromName || 'file').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
}

export function readableSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} bytes`
}

/**
 * A storage path that cannot escape the bucket or collide with another.
 *
 * The separators go, so the name can only ever be one segment under a random
 * folder. Runs of dots go with them: "../../etc/passwd" survived the first
 * version as "..-..-etc-passwd", which was harmless only for as long as
 * nothing downstream put a slash back, and a sanitiser that relies on the
 * rest of the system staying the shape it is today is not a sanitiser.
 */
export function attachmentPath(fileName: string): string {
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(-80)
  return `${crypto.randomUUID()}/${safe || 'file'}`
}
