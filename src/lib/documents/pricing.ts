import { LIBRARY_PLAN, TIER_LABEL, type BuildTier } from './library-plan'

// What a document costs, and why.
//
// Four prices, each chosen against something real rather than against a
// competitor nobody has.
//
// A single document is thirty-nine pounds. It replaces most of a day of
// somebody senior writing, and a spa manager can buy one without asking
// anybody. Twenty-five reads as a trifle for a professional procedure and
// invites the question of what is wrong with it; fifty makes a person think,
// and thinking is what stops a first purchase.
//
// A department is two hundred and ninety-nine, or the price of its documents
// bought singly if that is less. Reception is a hundred and five documents
// and Supervisors is five, and charging the same for both would be fleecing
// one of them. The shop works out which is cheaper and offers that, which
// costs a line of code and buys the thing this business runs on.
//
// Before the First Guest is fourteen hundred and ninety-five for all three
// hundred and thirty-eight. A pre-opening suite from a consultancy is five
// figures and takes months. The number matters for a second reason: most spa
// directors can approve under two thousand without going to a board, and a
// price that needs a board meeting does not get bought in the first year of
// anything.
//
// The complete library is two thousand four hundred and fifty, under the two
// and a half thousand that usually pulls procurement into the room.

export const SINGLE_DOCUMENT_PRICE = 3900
export const DEPARTMENT_PACK_PRICE = 29900
export const DAY_ONE_PACK_PRICE = 149500
export const COMPLETE_LIBRARY_PRICE = 245000

export const CURRENCY = 'gbp'

// Not VAT registered, so a price is simply the price.
//
// One flag rather than wording repeated on a shop page, a checkout, a receipt
// and an invoice. When she crosses the registration threshold this becomes
// true and every one of those changes with it, which is the difference
// between a decision and an afternoon of finding all the places a number was
// written out by hand.
//
// While it is false nothing may say "plus VAT", "inc VAT", or show a VAT
// number. A business that is not registered must not charge or imply VAT, and
// a shop page that does is a problem to unwind rather than edit.
export const VAT_REGISTERED = false

export const VAT_NOTE = VAT_REGISTERED
  ? 'Prices include VAT at the current rate.'
  : 'No VAT is charged. The price shown is the price paid.'

export type Pack = {
  slug: string
  name: string
  blurb: string
  /** In pence, because money is never a float. */
  price: number
  /** Which documents it covers. */
  includes: (reference: string) => boolean
  count: number
  /** The department exactly as the register spells it, where the pack is one. */
  department?: string
}

export function formatPrice(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * What a department costs.
 *
 * Never more than buying its documents one at a time. A pack that costs more
 * than its parts is a pack nobody buys twice, and the person who works it out
 * tells everybody.
 */
export function departmentPrice(count: number): number {
  return Math.min(DEPARTMENT_PACK_PRICE, count * SINGLE_DOCUMENT_PRICE)
}

export function departmentPacks(): Pack[] {
  const byDepartment = new Map<string, number>()
  for (const entry of LIBRARY_PLAN) {
    byDepartment.set(entry.department, (byDepartment.get(entry.department) || 0) + 1)
  }

  return Array.from(byDepartment.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([department, count]) => ({
      slug: `department-${department.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
      name: titleCase(department),
      blurb: `Every procedure, checklist and standard for the ${titleCase(department).toLowerCase()}.`,
      price: departmentPrice(count),
      includes: (reference: string) =>
        LIBRARY_PLAN.some(entry => entry.reference === reference && entry.department === department),
      count,
      // Carried rather than reconstructed. The page needs to count what is
      // ready in this department, and working that out by finding a document
      // the pack includes and reading its department back is a lookup that
      // breaks the day a pack covers more than one.
      department,
    }))
}

export function tierPacks(): Pack[] {
  const dayOne = LIBRARY_PLAN.filter(entry => entry.tier === 'day-1')
  return [
    {
      slug: 'before-the-first-guest',
      name: TIER_LABEL['day-1'],
      blurb:
        'Everything a spa needs written down before it opens its doors. Treatment delivery, consultation and '
        + 'consent, arrival and check-in, room opening and closing, cash and revenue close, and the safety '
        + 'procedures that are regulated from the first day.',
      price: DAY_ONE_PACK_PRICE,
      includes: (reference: string) => dayOne.some(entry => entry.reference === reference),
      count: dayOne.length,
    },
    {
      slug: 'the-complete-library',
      name: 'The complete library',
      blurb:
        'Every document, across every department and every stage. The pre-opening suite, the first thirty days, '
        + 'and the governance and audit procedures that need an operation running before they can be written well.',
      price: COMPLETE_LIBRARY_PRICE,
      includes: () => true,
      count: LIBRARY_PLAN.length,
    },
  ]
}

export function packBySlug(slug: string): Pack | null {
  return [...tierPacks(), ...departmentPacks()].find(pack => pack.slug === slug) || null
}

export function countInTier(tier: BuildTier): number {
  return LIBRARY_PLAN.filter(entry => entry.tier === tier).length
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map(word => (word === 'and' || word === 'of' ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
    .replace(/\bHr\b/, 'HR')
}
