import { sellableCatalogue } from './catalogue'
import {
  SINGLE_DOCUMENT_PRICE, DEPARTMENT_PACK_PRICE, DAY_ONE_PACK_PRICE, COMPLETE_LIBRARY_PRICE,
  POOL_SAFETY_PACK_PRICE, RISK_ASSESSMENT_PACK_PRICE,
} from './pricing'

// Prices she can change without a deploy, and bundles she can compose.
//
// The code keeps its defaults, which are the ones argued for in pricing.ts. A
// row in standards_pricing overrides one, and deleting that row puts the
// default back, so a price decided at four on a Tuesday is one click from
// being undone.

export type PriceKey =
  | 'single' | 'department' | 'day-one' | 'complete' | 'pool-safety' | 'risk-assessments'

export const PRICE_KEYS: { key: PriceKey; label: string; why: string; fallback: number }[] = [
  {
    key: 'single', label: 'A single document', fallback: SINGLE_DOCUMENT_PRICE,
    why: 'Roughly what it costs to have somebody senior write one, and low enough that a spa manager can buy it without asking anybody.',
  },
  {
    key: 'department', label: 'A department pack', fallback: DEPARTMENT_PACK_PRICE,
    why: 'The cap. A department is never charged more than its documents bought one at a time, so a small department costs less than this.',
  },
  {
    key: 'day-one', label: 'Before the First Guest', fallback: DAY_ONE_PACK_PRICE,
    why: 'Under the two thousand most spa directors can approve without going to a board.',
  },
  {
    key: 'complete', label: 'The complete library', fallback: COMPLETE_LIBRARY_PRICE,
    why: 'Under the two and a half thousand that usually pulls procurement into the room.',
  },
  {
    key: 'pool-safety', label: 'Spa Safety Operating Procedure', fallback: POOL_SAFETY_PACK_PRICE,
    why: 'The NOP and the EAP. A consultancy charges four figures and takes weeks, and a pool operator cannot open without both.',
  },
  {
    key: 'risk-assessments', label: 'Spa Risk Assessment Suite', fallback: RISK_ASSESSMENT_PACK_PRICE,
    why: 'Thirteen assessments and sixty-one hazards, against what a consultant charges to walk the building for two days.',
  },
]

export type PriceOverrides = Partial<Record<PriceKey, number>>


export type Bundle = {
  id: string
  slug: string
  name: string
  blurb: string | null
  pricePence: number
  packSlugs: string[]
  documentReferences: string[]
  isLive: boolean
  sortOrder: number
}

/** Every document a bundle covers, with the duplicates removed. */
export function bundleReferences(
  bundle: Pick<Bundle, 'packSlugs' | 'documentReferences'>,
  packIncludes: (slug: string, reference: string) => boolean,
): string[] {
  const owned = new Set<string>(bundle.documentReferences)
  for (const entry of sellableCatalogue()) {
    if (bundle.packSlugs.some(slug => packIncludes(slug, entry.reference))) owned.add(entry.reference)
  }
  return Array.from(owned)
}

/**
 * What a price must be for it to be worth taking.
 *
 * Not a judgement about her pricing: a guard against the zero and the missing
 * digit. A pack accidentally saved at nine pence is a pack somebody buys
 * forty times before anybody notices, and there is no taking it back.
 */
export function priceIsSane(pence: unknown): { ok: true; pence: number } | { ok: false; reason: string } {
  const value = Number(pence)
  if (!Number.isInteger(value)) return { ok: false, reason: 'A price has to be a whole number of pence.' }
  if (value < 100) return { ok: false, reason: 'That is under a pound. If you mean to give it away, take it off sale instead.' }
  if (value > 5000000) return { ok: false, reason: 'That is over fifty thousand pounds. Check the zeros.' }
  return { ok: true, pence: value }
}

export function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}
