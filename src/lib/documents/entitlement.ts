import { createAdminClient } from '@/lib/supabase/admin'
import { attachmentsForSlugs, type Attachment } from './attachments'
import { loadAttachments } from './attachments-server'

// Which pack slugs a buyer's orders cover.
//
// Separate from ownedReferences, which answers a different question: that one
// resolves packs down to the documents inside them, and a file is not a
// document. A workbook belongs to the pack as a whole and there is no
// sensible way to own half of it.

export function slugsInOrders(orders: { pack_slug?: string | null }[]): string[] {
  return orders.map(order => order.pack_slug).filter((slug): slug is string => Boolean(slug))
}

export async function filesForOrders(
  orders: { pack_slug?: string | null }[],
  admin = createAdminClient(),
): Promise<Attachment[]> {
  const slugs = slugsInOrders(orders)
  if (!slugs.length) return []
  return attachmentsForSlugs(await loadAttachments(true, admin), slugs)
}
