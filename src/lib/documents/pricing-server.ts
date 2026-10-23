import { createAdminClient } from '@/lib/supabase/admin'
import type { Prices } from './pricing'
import { packBySlug } from './pricing'
import { sellableCatalogue } from './catalogue'
import type { Bundle } from './price-overrides'

// Live prices and bundles, read where the money is decided.
//
// One place, so the shop, the checkout and the receipt cannot disagree about
// what something costs. A shop showing one number and a checkout charging
// another is a refund and a review, and it is the kind of fault nobody finds
// until a buyer does.

export async function loadPrices(admin = createAdminClient()): Promise<Prices> {
  const { data, error } = await admin.from('standards_pricing').select('key, price_pence')
  // A pricing table that cannot be read falls back to the defaults in the
  // code rather than to nothing. Selling at the old price is recoverable;
  // selling at zero is not.
  if (error || !data) return {}
  const prices: Prices = {}
  for (const row of data as any[]) {
    if (Number.isInteger(row.price_pence) && row.price_pence > 0) {
      (prices as any)[row.key] = row.price_pence
    }
  }
  return prices
}

const asBundle = (row: any): Bundle => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  blurb: row.blurb,
  pricePence: row.price_pence,
  packSlugs: row.pack_slugs || [],
  documentReferences: row.document_references || [],
  isLive: row.is_live,
  sortOrder: row.sort_order,
})

export async function loadBundles(liveOnly: boolean, admin = createAdminClient()): Promise<Bundle[]> {
  let query = admin.from('standards_bundles').select('*').order('sort_order', { ascending: true })
  if (liveOnly) query = query.eq('is_live', true)
  const { data, error } = await query
  if (error || !data) return []
  return (data as any[]).map(asBundle)
}

/**
 * Every document a bundle covers.
 *
 * Packs are resolved at read time rather than stored as a list of references,
 * so a bundle containing the complete library still contains it after the
 * library grows. Storing the references would have frozen the bundle on the
 * day it was made, and nobody would notice until a buyer asked where the new
 * documents were.
 */
export function referencesInBundle(bundle: Bundle, prices: Prices = {}): string[] {
  const owned = new Set<string>(bundle.documentReferences)
  for (const slug of bundle.packSlugs) {
    const pack = packBySlug(slug, prices)
    if (!pack) continue
    for (const entry of sellableCatalogue()) {
      if (pack.includes(entry.reference)) owned.add(entry.reference)
    }
  }
  return Array.from(owned)
}

export async function bundleBySlug(slug: string, admin = createAdminClient()): Promise<Bundle | null> {
  const { data } = await admin.from('standards_bundles').select('*').eq('slug', slug).maybeSingle()
  return data ? asBundle(data) : null
}

/**
 * Every bundle, resolved to the documents it covers, keyed by slug.
 *
 * Handed to ownedReferences so a buyer who bought a bundle owns what was in
 * it. Without this a bundle sells fine and delivers nothing, which is the
 * worst of the two possible failures.
 */
export async function bundleReferenceMap(admin = createAdminClient()): Promise<Record<string, string[]>> {
  const map: Record<string, string[]> = {}
  for (const bundle of await loadBundles(false, admin)) {
    map[bundle.slug] = referencesInBundle(bundle)
  }
  return map
}
