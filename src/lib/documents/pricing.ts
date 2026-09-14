import { LIBRARY_PLAN, TIER_LABEL, type BuildTier } from './library-plan'
import { POOL_PLAN_ENTRIES } from './pool-plans'
import { GUIDE_ENTRIES } from './guide/plans'
import { RISK_ASSESSMENT_ENTRIES } from './risk-assessment-plans'

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

// The pool safety operating procedure, both halves, at four hundred and
// ninety-five pounds.
//
// Priced against what it replaces rather than against the rest of the
// library. A consultancy producing a NOP and an EAP for one property charges
// four figures and takes weeks, and a pool operator cannot open without both:
// this is the document an insurer asks for first and an environmental health
// officer asks for second. Two documents at thirty-nine pounds each would be
// mispricing it so badly that it reads as not being the real thing.
//
// Still under the five hundred a spa director can usually approve on their
// own signature, which is the number that decides whether it is bought this
// week or discussed next quarter.
export const POOL_SAFETY_PACK_PRICE = 49500

// The twelve risk assessments, at seven hundred and fifty pounds.
//
// Sold as a suite and not singly, because an assessment of the pool and none
// of the plant room is not half a job: it is a register with a hole in it,
// and the hole is where the consequence is. A property buying one area would
// buy the area it already worries about, which is never the one that hurts
// somebody.
//
// Priced against a consultant walking the building for two days, which is
// what this replaces the first draft of. Still inside the two thousand a spa
// director can usually approve without a board.
export const RISK_ASSESSMENT_PACK_PRICE = 75000

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

// Overrides, keyed by the same names the admin screen uses. Absent means the
// default in this file, which is the one argued for above.
export type Prices = Partial<Record<
  'single' | 'department' | 'day-one' | 'complete' | 'pool-safety' | 'risk-assessments',
  number
>>

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
export function departmentPrice(count: number, prices: Prices = {}): number {
  return Math.min(prices.department ?? DEPARTMENT_PACK_PRICE, count * (prices.single ?? SINGLE_DOCUMENT_PRICE))
}

export function departmentPacks(prices: Prices = {}): Pack[] {
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
      price: departmentPrice(count, prices),
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

export function tierPacks(prices: Prices = {}): Pack[] {
  const dayOne = LIBRARY_PLAN.filter(entry => entry.tier === 'day-1')
  const poolReferences = [
    ...POOL_PLAN_ENTRIES.map(entry => entry.reference),
    ...GUIDE_ENTRIES.map(entry => entry.reference),
  ]
  const riskReferences = RISK_ASSESSMENT_ENTRIES.map(entry => entry.reference)
  return [
    {
      slug: 'risk-assessments',
      name: 'Spa Risk Assessment Suite',
      blurb:
        'Twelve risk assessments covering every area of a spa: the pool and surround, cold plunges, hydrotherapy '
        + 'pools, saunas and steam rooms, treatment rooms, changing areas, the plant room and chemical store, the '
        + 'gym, reception and back of house, fire and evacuation, outdoor areas, and cleaning. Forty-five hazards, '
        + 'each with the controls a competent operation would expect, and nothing scored for you.',
      price: prices['risk-assessments'] ?? RISK_ASSESSMENT_PACK_PRICE,
      includes: (reference: string) => riskReferences.includes(reference),
      count: riskReferences.length,
    },
    {
      slug: 'pool-safety',
      name: 'Spa Safety Operating Procedure',
      blurb:
        'The Normal Operating Procedure and the Emergency Action Plan for the whole spa: pools, heat and cold '
        + 'experiences, treatment rooms, gym, plant and front of house. Both halves of what an operator needs in '
        + 'writing: how the spa runs on an ordinary day, and who does what in the first minutes of an emergency. '
        + 'The guide to completing them and the guide to training your team on them are included free.',
      price: prices['pool-safety'] ?? POOL_SAFETY_PACK_PRICE,
      includes: (reference: string) => poolReferences.includes(reference),
      count: poolReferences.length,
    },
    {
      slug: 'before-the-first-guest',
      name: TIER_LABEL['day-1'],
      blurb:
        'Everything a spa needs written down before it opens its doors. Treatment delivery, consultation and '
        + 'consent, arrival and check-in, room opening and closing, cash and revenue close, and the safety '
        + 'procedures that are regulated from the first day.',
      price: prices['day-one'] ?? DAY_ONE_PACK_PRICE,
      includes: (reference: string) => dayOne.some(entry => entry.reference === reference),
      count: dayOne.length,
    },
    {
      slug: 'the-complete-library',
      name: 'The complete library',
      blurb:
        'Every document, across every department and every stage. The pre-opening suite, the first thirty days, '
        + 'and the governance and audit procedures that need an operation running before they can be written well.',
      price: prices.complete ?? COMPLETE_LIBRARY_PRICE,
      includes: () => true,
      count: LIBRARY_PLAN.length + POOL_PLAN_ENTRIES.length + RISK_ASSESSMENT_ENTRIES.length + GUIDE_ENTRIES.length,
    },
  ]
}

export function packBySlug(slug: string, prices: Prices = {}): Pack | null {
  return [...tierPacks(prices), ...departmentPacks(prices)].find(pack => pack.slug === slug) || null
}

export function singlePrice(prices: Prices = {}): number {
  return prices.single ?? SINGLE_DOCUMENT_PRICE
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
