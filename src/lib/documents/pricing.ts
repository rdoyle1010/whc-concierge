import { LIBRARY_PLAN, TIER_LABEL, type BuildTier } from './library-plan'
import {
  POOL_INDEX as POOL_PLAN_ENTRIES,
  GUIDE_INDEX as GUIDE_ENTRIES,
  RISK_ASSESSMENT_INDEX as RISK_ASSESSMENT_ENTRIES,
  CHECKLIST_INDEX as CHECKLIST_ENTRIES,
  FINANCE_INDEX as FINANCE_ENTRIES,
  JOB_DESCRIPTION_INDEX as JOB_DESCRIPTION_ENTRIES,
  POLICY_INDEX as POLICY_ENTRIES,
  HIRING_INDEX as HIRING_ENTRIES,
} from './catalogue-index'
import { JOURNEY_STAGES, stageOf, kindOf, KIND_LABEL, type StageGroup } from './journey'

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

// A stage of the guest journey, priced as a share of its parts.
//
// A department is flat because every department is a team, and a team either
// has its procedures or it does not. A stage is not a team. "After the visit"
// is seventeen documents and "Management" is a hundred and ninety-eight, and
// charging one price for both would put a seventeen document pack beside a
// hundred and five document department costing less. A buyer makes that
// comparison in about four seconds and stops trusting every other number on
// the page.
//
// So a stage is thirty-five per cent of its documents bought one at a time,
// which is a discount deep enough to be obviously the right way to buy and
// shallow enough that six of them cost more than the complete library. The
// ceiling stops the two large stages becoming the most expensive thing in the
// shop, and it sits under the eight hundred a spa director can usually
// approve without a second signature.
export const JOURNEY_PACK_SHARE = 0.35
export const JOURNEY_PACK_CEILING = 79500

// The nine daily checklists, at three hundred and ninety-five pounds.
//
// Priced against what it replaces, which is a manager spending a fortnight
// turning procedures into shift sheets and then maintaining nine of them.
// Under the five hundred a spa director signs off alone, and deliberately
// cheaper than the procedures they enforce, because a spa that owns the
// procedures and runs the day off a sheet somebody printed in 2019 has the
// expensive half already and is getting no benefit from it.
export const CHECKLIST_PACK_PRICE = 39500

// Twenty-five job descriptions, at three hundred and ninety-five pounds.
//
// Priced against what it replaces, which is a spa director writing them at
// eleven at night, one at a time, each one a duty list copied from the last
// one and edited. Under the five hundred a spa director signs off alone,
// because this is the purchase that has to be easy: a property that cannot
// describe its own roles cannot recruit for them, appraise against them, or
// defend a decision about one of them.
export const JOB_DESCRIPTION_PACK_PRICE = 39500

// Twenty policies, at four hundred and ninety-five pounds.
//
// Priced above the job descriptions because the consequence of not having one
// is larger: a job description that is missing costs an argument at an
// appraisal, and a safeguarding or lone working policy that is missing costs
// an investigation. Still under the five hundred a spa director signs off
// alone, because the property most exposed by having none of these is the one
// least likely to have a budget line for them.
export const POLICY_PACK_PRICE = 49500

// Twelve hiring instruments, at three hundred and ninety-five pounds.
//
// Priced against one bad hire. A therapist who leaves inside ninety days
// costs a spa several thousand pounds in recruitment, training, lost
// utilisation and the cover somebody else worked, and most properties make
// that mistake twice a year because they hire on a conversation. Anything
// under five hundred is cheap against that arithmetic, and a spa director can
// approve it alone.
export const HIRING_PACK_PRICE = 39500

// The twenty report templates, at one thousand two hundred and fifty pounds.
//
// The most expensive thing in this library except the library itself, and the
// one with the clearest payback. A spa running at sixty per cent room
// occupancy and not measuring RevPATH is leaving five figures a month in
// unsold capacity it cannot see, and the first month this pack is used it
// either finds that or proves it is not there. Both are worth the price.
//
// Above the two spa directors can usually approve alone, which is correct: a
// reporting pack is a general manager or owner decision, it changes what gets
// discussed at board level, and pricing it to slip through on one signature
// would sell it to the wrong person.
export const FINANCE_PACK_PRICE = 125000

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
  | 'single' | 'department' | 'journey' | 'day-one' | 'complete'
  | 'pool-safety' | 'risk-assessments' | 'checklists' | 'finance' | 'guest-journey'
  | 'job-descriptions' | 'policies' | 'recruitment'
  | SingleKindKey,
  number
>>

// What one document costs, by what kind of document it is.
//
// One flat price for everything was wrong in both directions at once. A
// two-page cleaning procedure and a pool emergency action plan are not the
// same purchase, and pricing them the same made the packs look like a con:
// the pool safety pack is four documents at four hundred and ninety-five
// pounds, and the same four sat at thirty-nine pounds each in the list
// further down the page, where anybody could do the sum.
//
// A procedure is ten pounds. That is deliberate and it is the whole entry to
// the ladder: cheap enough that a spa manager buys one this afternoon without
// asking anybody, and once they have opened one and seen what it is, the
// department and the pack are a different conversation. The documents that
// carry real liability are priced against what they replace, which is a
// consultant's day rate, not against the rest of the list.
//
// Every one of these is hers to change from Prices and Bundles without a
// deploy. These are the starting points, and the test in
// tests/a-shop-that-takes-money.test.ts holds the one rule that matters: no
// pack may cost more than its own documents bought one at a time.

export type SingleKindKey =
  | 'single-sop' | 'single-chk' | 'single-jd' | 'single-pol' | 'single-gde'
  | 'single-trg' | 'single-ssw' | 'single-ra' | 'single-rpt' | 'single-nop' | 'single-eap'

/** The price key for a document kind, so one code names one setting. */
export const KIND_PRICE_KEY: Record<string, SingleKindKey> = {
  SOP: 'single-sop', CHK: 'single-chk', JD: 'single-jd', POL: 'single-pol',
  GDE: 'single-gde', TRG: 'single-trg', SSW: 'single-ssw', RA: 'single-ra',
  RPT: 'single-rpt', NOP: 'single-nop', EAP: 'single-eap',
}

export const KIND_PRICE: Record<SingleKindKey, number> = {
  // A procedure. The way in.
  'single-sop': 1000,
  // A checklist is a working sheet a team prints every day, and it is the
  // thing most often bought on its own.
  'single-chk': 3500,
  // A job description is used once per hire and saves a morning.
  'single-jd': 2900,
  // A policy is the thing an assessor asks for, and it is read by lawyers.
  'single-pol': 3900,
  'single-gde': 3900,
  // A training manual is a course somebody else would charge to deliver.
  'single-trg': 4900,
  'single-ssw': 4500,
  // A risk assessment is the document an inspector opens first. A consultant
  // writing one for a property charges a day for it.
  'single-ra': 7500,
  // A reporting pack replaces a spreadsheet somebody builds badly over weeks.
  'single-rpt': 7500,
  // The pool operating procedure and its emergency plan. A pool cannot open
  // without both, a consultancy charges four figures for the pair, and two
  // documents at thirty-nine pounds each read as not being the real thing.
  'single-nop': 25000,
  'single-eap': 25000,
}

/** What this one document costs, with her overrides applied. */
export function singlePriceFor(reference: string, prices: Prices = {}): number {
  const key = KIND_PRICE_KEY[kindOf(reference)] || 'single-sop'
  return prices[key] ?? KIND_PRICE[key] ?? (prices.single ?? SINGLE_DOCUMENT_PRICE)
}

/** What a set of documents costs bought one at a time. The ceiling on a pack. */
export function sumSingles(references: string[], prices: Prices = {}): number {
  return references.reduce((total, reference) => total + singlePriceFor(reference, prices), 0)
}

/** The cheapest single document in the library, for "from" prices. */
export function cheapestSingle(prices: Prices = {}): number {
  return Math.min(...Object.keys(KIND_PRICE).map(key =>
    prices[key as SingleKindKey] ?? KIND_PRICE[key as SingleKindKey]))
}

/** The kinds, priced, for a screen that lists what things cost. */
export function kindPrices(prices: Prices = {}): { code: string; label: string; price: number }[] {
  return Object.entries(KIND_PRICE_KEY)
    .map(([code, key]) => ({
      code,
      label: KIND_LABEL[code] || code,
      price: prices[key] ?? KIND_PRICE[key],
    }))
    .sort((a, b) => a.price - b.price)
}

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
  /** A longer line for a pack that gets a card of its own. */
  detail?: string
  /** Whether a stage is part of the visit or behind it. */
  group?: StageGroup
  /**
   * Withdrawn from the shop, still resolvable.
   *
   * A slug is written into an order and that order is a buyer's entitlement
   * for as long as they have an account. Deleting a pack from this file would
   * take a paid library away from whoever bought it, so a pack that stops
   * being sold is marked here instead and the shop declines to list it.
   */
  retired?: boolean
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
  // The cap against the parts is applied by capped(), which knows which
  // documents are in this department and what each of them actually costs.
  // This is only the ceiling.
  return prices.department ?? DEPARTMENT_PACK_PRICE
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
    // Capped here rather than by the caller. A rule a caller has to remember
    // is a rule that holds until somebody writes a new screen.
    .map(pack => capped(pack, prices))
}

/**
 * What one stage of the visit costs.
 *
 * Never more than its documents bought singly, for the same reason a
 * department is not, and never less than one document, so a stage that
 * shrinks can never be cheaper than buying a single procedure out of it.
 */
export function journeyPrice(count: number, prices: Prices = {}): number {
  const single = prices.single ?? SINGLE_DOCUMENT_PRICE
  const ceiling = prices.journey ?? JOURNEY_PACK_CEILING
  const share = Math.round((count * single * JOURNEY_PACK_SHARE) / 500) * 500
  // capped() brings this down to the real cost of its parts where that is
  // lower. The share is still worked from the flat price because it is a
  // shape, not a sum: it decides how a big stage relates to a small one.
  return Math.max(single, Math.min(ceiling, share))
}

/**
 * The library sold the way a spa is actually run.
 *
 * A department pack asks a buyer to know which team owns a procedure. A stage
 * asks them where in a visit the problem is, or which part of the operation
 * is thin, which is the question they arrived with: "our arrivals are a mess"
 * and "we have nothing written down about training" are how this gets
 * described out loud, and neither maps to one department. Arrival alone spans
 * reception, housekeeping and membership.
 *
 * Built from the build plan rather than from the whole catalogue, and that is
 * deliberate. The risk assessment suite and the pool safety plans are sold on
 * their own arguments at seven hundred and fifty and four hundred and
 * ninety-five, and a stage pack at a third of its parts would hand both of
 * them over inside a six hundred and fifty pound pack along with forty-eight
 * other documents. That is not a discount, it is undercutting your own
 * flagship with your own shop. They are in the complete library, which is the
 * top of the ladder and the right place for them.
 */
// The five stages of a visit, withdrawn as separate packs.
//
// Nobody arrives asking for "departure". They overlapped as well: a reception
// procedure sits inside three of them, so the same document was being sold
// under three names at three prices and a buyer had to work out which one
// they were supposed to want.
//
// They are one pack now. What they are not is deleted: five slugs are in
// orders, and a buyer who paid for The Visit Itself keeps it.
const RETIRED_STAGES = new Set(['pre-arrival', 'arrival', 'experience', 'departure', 'post-departure'])

/**
 * The whole visit, as one pack.
 *
 * Priced well under the complete library rather than at a third of its parts.
 * Two hundred and sixty-five documents at a third would be more than the
 * library costs, and a pack that makes the library look cheap is a pack that
 * sells the library, which is fine, but it should be by being better value
 * rather than by being absurd.
 */
export const GUEST_JOURNEY_PRICE = 129500

export function guestJourneyPack(prices: Prices = {}): Pack {
  const references = new Set(
    LIBRARY_PLAN.filter(entry => RETIRED_STAGES.has(stageOf(entry))).map(entry => entry.reference),
  )
  return capped({
    slug: 'guest-journey',
    name: 'The Guest Journey',
    blurb:
      'Every procedure a guest passes through, from the enquiry to the follow-up. Bookings, deposits, '
      + 'consent and screening, check-in and welcome, the treatment itself, the pool and thermal suite, '
      + 'paying, rebooking, and what happens when somebody complains afterwards.',
    detail:
      'The whole visit in one pack, across every team it touches. Arrivals are not a reception problem: they '
      + 'are reception, housekeeping and membership at the same moment, which is why this is sold end to end '
      + 'rather than a stage at a time.',
    price: prices['guest-journey'] ?? GUEST_JOURNEY_PRICE,
    includes: (reference: string) => references.has(reference),
    count: references.size,
  }, prices)
}

export function journeyPacks(prices: Prices = {}): Pack[] {
  return JOURNEY_STAGES.map(stage => {
    const references = new Set(
      LIBRARY_PLAN.filter(entry => stageOf(entry) === stage.slug).map(entry => entry.reference),
    )
    return {
      slug: `journey-${stage.slug}`,
      name: JOURNEY_PACK_NAME[stage.slug],
      blurb: stage.blurb,
      detail: JOURNEY_PACK_DETAIL[stage.slug],
      price: journeyPrice(references.size, prices),
      includes: (reference: string) => references.has(reference),
      count: references.size,
      group: stage.group,
      retired: RETIRED_STAGES.has(stage.slug),
    }
  }).map(pack => capped(pack, prices))
}

// Named for what a buyer gets rather than for the stage, because "Arrival" on
// its own is a label and "The first ten minutes" is an offer.
const JOURNEY_PACK_NAME: Record<string, string> = {
  'pre-arrival': 'Before They Arrive',
  arrival: 'The First Ten Minutes',
  experience: 'The Visit Itself',
  departure: 'The Last Five Minutes',
  'post-departure': 'After They Leave',
  money: 'Money and Membership',
  // Named for the words somebody types, not for the cleverer line. A buyer
  // looking for recruitment does not search "hiring and keeping people".
  people: 'Recruitment and HR',
  training: 'Training Your Team',
  systems: 'Systems and Setup',
  safety: 'Safety and the Building',
  'running-the-day': 'Running the Day',
}

const JOURNEY_PACK_DETAIL: Record<string, string> = {
  'pre-arrival':
    'Every procedure between somebody wanting to come and somebody walking in. Enquiries, bookings, deposits, '
    + 'amendments, cancellations, confirmations and the consent and health screening that should reach a guest '
    + 'before they are lying on a couch, not after.',
  arrival:
    'The ten minutes that decide what a guest thinks of the place. Check-in, welcome, lockers and robes, the '
    + 'tour, accessibility and medical needs flagged at the desk, and what happens when somebody arrives late, '
    + 'early or to a delay.',
  experience:
    'The visit itself, and the standards that keep it safe. Treatment delivery and draping, the pool, thermal '
    + 'suite and cold plunge, water testing, the gym floor and studio, housekeeping of the areas a guest is '
    + 'standing in, and what to do when something goes wrong in the middle of it.',
  departure:
    'Paying, buying and coming back. Checking out, settling a bill, retail at the till, refunds, gratuities and '
    + 'the rebooking conversation that decides whether there is a next visit at all.',
  'post-departure':
    'The part most spas leave to chance. Aftercare, feedback and reviews, complaints and service recovery, '
    + 'follow-up, retention and winning back somebody who has stopped coming.',
  money:
    'Where the money actually goes. Float and banking, the daily revenue close, discrepancies and chargebacks, '
    + 'commission and complimentary approvals, and the membership side underneath it: contracts, direct debits, '
    + 'arrears, freezes, upgrades and renewals.',
  people:
    'Hiring somebody, keeping them, and the day they leave. Interviews and packs, onboarding, rotas and cover, '
    + 'absence, overtime approval, conduct, and the leaver process including the system access somebody still '
    + 'has three months after their last shift.',
  training:
    'What your team was taught, and the record that proves it. Induction, competency sign-off, observation and '
    + 'coaching, refresher cycles and sales training. The documents an insurer asks for after an incident and '
    + 'the ones nobody has.',
  systems:
    'The configuration nobody writes down and everybody needs when the person who set it up leaves. Booking '
    + 'system setup end to end, pricing and packages, buffers and resources, reporting, receipts and email '
    + 'templates, plus the pre-opening critical path and snagging.',
  safety:
    'What an inspector asks for first. Accident and near-miss reporting, COSHH and chemical handling, fire and '
    + 'evacuation, security and CCTV, data protection and breach response, audit and corrective actions, and '
    + 'the building itself: plant, anti-scald, HVAC, contractors and planned maintenance.',
  'running-the-day':
    'How a shift is actually held together. The leadership briefing, duty manager rounds, the priorities board, '
    + 'daily risk review, escalation and decision protocol, staffing adjustments, major incident command, and '
    + 'the weekly operations review.',
}

export function tierPacks(prices: Prices = {}): Pack[] {
  const dayOne = LIBRARY_PLAN.filter(entry => entry.tier === 'day-1')
  const poolReferences = [
    ...POOL_PLAN_ENTRIES.map(entry => entry.reference),
    ...GUIDE_ENTRIES.map(entry => entry.reference),
  ]
  const riskReferences = RISK_ASSESSMENT_ENTRIES.map(entry => entry.reference)
  const checklistReferences = CHECKLIST_ENTRIES.map(entry => entry.reference)
  const financeReferences = FINANCE_ENTRIES.map(entry => entry.reference)
  const roleReferences = JOB_DESCRIPTION_ENTRIES.map(entry => entry.reference)
  const policyReferences = POLICY_ENTRIES.map(entry => entry.reference)
  const hiringReferences = HIRING_ENTRIES.map(entry => entry.reference)
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
      slug: 'daily-checklists',
      name: 'Daily Running Checklists',
      blurb:
        'Nine checklists covering how a spa is actually run each day: reception opening, mid shift and close, '
        + 'therapist opening and closing, cleaning opening and closing, the duty manager walk, and the weekly '
        + 'maintenance, safety and training sheet. Each block names the procedure, assessment or policy it is '
        + 'drawn from, so a change to one can be traced to every checklist it affects.',
      price: prices.checklists ?? CHECKLIST_PACK_PRICE,
      includes: (reference: string) => checklistReferences.includes(reference),
      count: checklistReferences.length,
    },
    {
      slug: 'financial-reporting',
      name: 'Spa Financial Reporting Pack',
      blurb:
        'Twenty report templates and the definitions behind them: the director dashboard, daily trading, '
        + 'revenue against capacity, forward pace, treatment and therapist performance, retail, membership, '
        + 'guests, channels, discounting and yield, vouchers, payroll, the departmental profit and loss, stock, '
        + 'complaints, standards, safety and marketing. Every line defined precisely enough that two people '
        + 'cannot compute it differently.',
      price: prices.finance ?? FINANCE_PACK_PRICE,
      includes: (reference: string) => financeReferences.includes(reference),
      count: financeReferences.length,
    },
    {
      slug: 'job-descriptions',
      name: 'Spa Job Descriptions',
      blurb:
        'Twenty-five roles, from Spa Director to Linen Attendant. Each one states what the job is for, who it '
        + 'reports to, the duties grouped by area, what good looks like as observable behaviour, and the '
        + 'measures it is judged on. Pay, hours and notice are left blank, because those belong to a contract.',
      detail:
        'Written to be used three times: at interview as the thing a candidate is assessed against, at '
        + 'appraisal as the thing performance is discussed against, and at appointment as the record of what '
        + 'somebody was told the job was. Most spa job descriptions are a duty list, which serves none of '
        + 'those three. The set also joins up: every role names who it reports to and who reports to it, so '
        + 'the pack reads as a structure rather than as twenty-five forms.',
      price: prices['job-descriptions'] ?? JOB_DESCRIPTION_PACK_PRICE,
      includes: (reference: string) => roleReferences.includes(reference),
      count: roleReferences.length,
    },
    {
      slug: 'policies',
      name: 'Spa Policy Suite',
      blurb:
        'Twenty policies, from health and safety and safeguarding to chaperoning, under-eighteens, '
        + 'cancellation and discount authority. Each one states the position, what follows from it, who is '
        + 'accountable, what has to be recorded, and what happens when it is breached.',
      detail:
        'A policy is not a procedure. A procedure says how something is done; a policy says what the '
        + 'property\u2019s position is and who decides. Most spa policies fail by being one or the other badly. '
        + 'These include the ones nobody else writes, because they are the ones a spa most needs: chaperoning '
        + 'and intimate treatments, under-eighteens, pregnancy, photography in a building where people are '
        + 'undressed. Disciplinary and grievance procedures are deliberately not included: take those from an '
        + 'employment adviser rather than from a template.',
      price: prices.policies ?? POLICY_PACK_PRICE,
      includes: (reference: string) => policyReferences.includes(reference),
      count: policyReferences.length,
    },
    {
      slug: 'recruitment',
      name: 'Spa Recruitment Pack',
      blurb:
        'Twelve instruments for hiring well: the advert, the screening call, the interview question bank and '
        + 'scorecard, three trade tests, pre-boarding, day one, the ninety days, the fairness guide and the '
        + 'exit interview.',
      detail:
        'Not the process. Requisition, scheduling, right to work and the offer are procedures and they are '
        + 'already in the library. These are the instruments: what is actually asked in the room, how the '
        + 'answer is scored, and what a candidate is watched doing before anybody makes an offer. A therapist '
        + 'who leaves inside ninety days costs several thousand pounds, and most spas make that mistake twice '
        + 'a year because they hire on a conversation.',
      price: prices.recruitment ?? HIRING_PACK_PRICE,
      includes: (reference: string) => hiringReferences.includes(reference),
      count: hiringReferences.length,
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
      count: LIBRARY_PLAN.length + POOL_PLAN_ENTRIES.length + RISK_ASSESSMENT_ENTRIES.length
        + GUIDE_ENTRIES.length + CHECKLIST_ENTRIES.length + FINANCE_ENTRIES.length,
    },
  ].map(pack => capped(pack, prices))
}

/**
 * The shop, in the order people ask for things.
 *
 * One grid rather than "by stage of the visit" above "behind the scenes".
 * That split asked a buyer to decide which half of the business their problem
 * lived in before it would show them a price, and the stage half was the
 * confusing one: nobody arrives asking for departure.
 *
 * What somebody does arrive asking for is a risk assessment, a set of
 * procedures, the reporting pack, something for recruitment, something for
 * training. So that is the order, and the two "buy everything" options are
 * kept separate underneath, because they answer a different question.
 */

/**
 * A pack never costs more than its own documents bought one at a time.
 *
 * This was a rule stated in a comment and enforced in one function, so it held
 * for departments and quietly failed everywhere else. With one flat single
 * price it failed for five of the fourteen packs at once: the pool safety pack
 * was four documents at four hundred and ninety-five pounds sitting above the
 * same four at thirty-nine pounds each, on the same page, where anybody could
 * do the sum and conclude they were being had.
 *
 * So it is applied here, to every pack, from the one place they are all built,
 * and it is the reason per-kind prices can be changed from the admin screen
 * without anybody having to re-check fourteen numbers by hand. Set a document
 * kind too low and the packs containing it come down with it, which is the
 * correct behaviour and the only one that cannot embarrass the shop.
 */
export function capped(pack: Pack, prices: Prices = {}): Pack {
  const parts = sumSingles(everyReference().filter(pack.includes), prices)
  return parts > 0 && parts < pack.price ? { ...pack, price: parts } : pack
}

let everyReferenceCache: string[] | null = null
function everyReference(): string[] {
  if (!everyReferenceCache) {
    everyReferenceCache = [
      ...LIBRARY_PLAN.map(entry => entry.reference),
      ...POOL_PLAN_ENTRIES.map(entry => entry.reference),
      ...GUIDE_ENTRIES.map(entry => entry.reference),
      ...RISK_ASSESSMENT_ENTRIES.map(entry => entry.reference),
      ...CHECKLIST_ENTRIES.map(entry => entry.reference),
      ...FINANCE_ENTRIES.map(entry => entry.reference),
      ...JOB_DESCRIPTION_ENTRIES.map(entry => entry.reference),
      ...POLICY_ENTRIES.map(entry => entry.reference),
      ...HIRING_ENTRIES.map(entry => entry.reference),
    ]
  }
  return everyReferenceCache
}

export function categoryPacks(prices: Prices = {}): Pack[] {
  const tiers = tierPacks(prices)
  const stages = journeyPacks(prices).filter(pack => !pack.retired)
  const bySlug = (slug: string) => [...tiers, ...stages].find(pack => pack.slug === slug)!
  return [
    bySlug('risk-assessments'),
    bySlug('policies'),
    bySlug('job-descriptions'),
    bySlug('pool-safety'),
    bySlug('journey-safety'),
    bySlug('financial-reporting'),
    bySlug('journey-money'),
    guestJourneyPack(prices),
    bySlug('daily-checklists'),
    bySlug('journey-running-the-day'),
    bySlug('recruitment'),
    bySlug('journey-people'),
    bySlug('journey-training'),
    bySlug('journey-systems'),
  ].map(pack => capped(pack, prices))
}

/** The two that answer "just give me all of it". */
export function everythingPacks(prices: Prices = {}): Pack[] {
  const tiers = tierPacks(prices)
  return ['before-the-first-guest', 'the-complete-library']
    .map(slug => tiers.find(pack => pack.slug === slug)!)
    .map(pack => capped(pack, prices))
}

export function packBySlug(slug: string, prices: Prices = {}): Pack | null {
  // Every pack that has ever been sold has to resolve here, whatever the
  // shop happens to show today. A slug is written into an order and that
  // order is the buyer's entitlement for as long as they have an account.
  const found = [...tierPacks(prices), ...journeyPacks(prices), ...departmentPacks(prices), guestJourneyPack(prices)]
    .find(pack => pack.slug === slug)
  // Capped here too, because this is the one the checkout charges from. A
  // shop showing one number and a till taking another is a refund.
  return found ? capped(found, prices) : null
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
