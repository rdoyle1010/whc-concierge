import { sellableCatalogue, catalogueEntry } from './catalogue'
import { packBySlug, type Pack, type Prices } from './pricing'

// What can honestly be sold today.
//
// Only a signed off document may be sold. That is the whole purpose of the
// sign-off: somebody read it, against the premises, and put their name to it.
// A shop that takes money for four hundred and sixty and delivers four is a
// shop found out on its first order, and in this trade the buyer tells the
// other spa directors before they tell us.
//
// So a pack is buyable only when every document in it is ready, and a part
// ready pack says how far along it is and asks them to get in touch. That is
// deliberately conservative and it costs sales today. It also means nobody
// ever pays for a pack and receives a fraction of it, and it gives a clear
// goal: finish a department and it goes on sale by itself.

export type Readiness = {
  ready: number
  total: number
  /** Every document in this pack is signed off, so it can be bought now. */
  buyable: boolean
}

export function packReadiness(pack: Pack, approved: Set<string>): Readiness {
  const references = sellableCatalogue()
    .filter(entry => pack.includes(entry.reference))
    .map(entry => entry.reference)
  const ready = references.filter(reference => approved.has(reference)).length
  return { ready, total: references.length, buyable: references.length > 0 && ready === references.length }
}

/** Every document reference an order entitles its buyer to. */
export function referencesForOrder(
  order: { pack_slug?: string | null; document_reference?: string | null },
  /** Bundles, resolved to the references they cover. Keyed by slug. */
  bundles: Record<string, string[]> = {},
): string[] {
  if (order.document_reference) return [order.document_reference]
  if (order.pack_slug && bundles[order.pack_slug]) return bundles[order.pack_slug]
  const pack = order.pack_slug ? packBySlug(order.pack_slug) : null
  if (!pack) return []
  return sellableCatalogue().filter(entry => pack.includes(entry.reference)).map(entry => entry.reference)
}

/**
 * What a set of orders adds up to.
 *
 * Someone buys a department in March and the complete library in June. They
 * own the union, and asking "does this order cover it" one order at a time
 * gets the answer wrong the moment there are two.
 */
export function ownedReferences(
  orders: { pack_slug?: string | null; document_reference?: string | null }[],
  bundles: Record<string, string[]> = {},
): Set<string> {
  const owned = new Set<string>()
  for (const order of orders) {
    for (const reference of referencesForOrder(order, bundles)) owned.add(reference)
  }
  return owned
}

/** The thing being bought, named and priced, or a reason it cannot be. */
export type Purchase =
  | { ok: true; description: string; amountPence: number; packSlug?: string; reference?: string }
  | { ok: false; reason: string }

export function priceSingle(reference: string, approved: Set<string>, price: number): Purchase {
  const planned = catalogueEntry(reference)
  if (!planned) return { ok: false, reason: 'That document is not in the library.' }
  if (!approved.has(reference)) {
    return { ok: false, reason: 'That one is still in preparation. Tell us and we will prioritise it.' }
  }
  return { ok: true, description: `${planned.title} (${planned.reference})`, amountPence: price, reference }
}

export function pricePack(slug: string, approved: Set<string>, prices: Prices = {}): Purchase {
  const pack = packBySlug(slug, prices)
  if (!pack) return { ok: false, reason: 'That pack does not exist.' }
  const readiness = packReadiness(pack, approved)
  if (!readiness.buyable) {
    return {
      ok: false,
      // The number, not a vague apology. A buyer told "eighty-one of a hundred
      // and five, the rest this month" asks for the eighty-one. A buyer told
      // "not available" goes somewhere else.
      reason: `${readiness.ready} of ${readiness.total} in that pack are signed off. `
        + 'We do not sell a pack part-finished. Tell us you want it and we will prioritise the rest.',
    }
  }
  return { ok: true, description: `${pack.name} (${readiness.total} documents)`, amountPence: pack.price, packSlug: slug }
}
