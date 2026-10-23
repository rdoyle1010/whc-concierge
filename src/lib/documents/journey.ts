import type { PlannedDocument } from './library-plan'

// The library, arranged the way a spa actually works.
//
// It used to be grouped by when a property needs a document: before the first
// guest, in the first thirty days, in the first quarter. That is a useful
// thing to know once, while you are opening, and useless every day after. A
// manager looking for the procedure that covers a guest arriving does not
// think "that was a day one document".
//
// So it is arranged by the guest journey, and within that by what kind of
// document it is. Two questions, in the order people ask them: where in the
// visit does this happen, and is it a procedure, an assessment or a training
// session.
//
// The stage is read from the title, which means it is a judgement rather than
// a fact, and a handful will sit in the wrong place. The signals below are
// the whole of that judgement: a document in the wrong stage is one line
// changed here, not a migration.

export type JourneyStage =
  // What a guest walks through.
  | 'pre-arrival' | 'arrival' | 'experience' | 'departure' | 'post-departure'
  // What keeps it running, which they never see.
  | 'money' | 'people' | 'training' | 'systems' | 'safety' | 'running-the-day'

/**
 * Two groups, because they answer different questions.
 *
 * "Management" was one bucket of a hundred and ninety-eight, which is not an
 * arrangement, it is a pile. Forty-one per cent of the library in a single
 * pack also meant one price for configuring a booking system and for the
 * accident reporting procedure, which are bought by different people in
 * different weeks for different reasons.
 */
export type StageGroup = 'visit' | 'behind'

export const JOURNEY_STAGES: { slug: JourneyStage; group: StageGroup; label: string; blurb: string }[] = [
  { slug: 'pre-arrival', group: 'visit', label: 'Pre-arrival', blurb: 'Everything before they walk in. Enquiries, bookings, deposits, confirmations and the consent forms that should arrive early.' },
  { slug: 'arrival', group: 'visit', label: 'Arrival', blurb: 'The first ten minutes. Check-in, welcome, lockers, robes and the induction that sets the tone.' },
  { slug: 'experience', group: 'visit', label: 'Experience', blurb: 'The visit itself. Treatments, pool and thermal, the gym floor, classes, and the standards that keep all of it safe.' },
  { slug: 'departure', group: 'visit', label: 'Departure', blurb: 'Paying, buying and rebooking. The last five minutes decide whether there is a next visit.' },
  { slug: 'post-departure', group: 'visit', label: 'After the visit', blurb: 'Feedback, complaints, aftercare and getting them back. The part most spas leave to chance.' },
  { slug: 'money', group: 'behind', label: 'Money and membership', blurb: 'Cash, revenue close, commission, chargebacks, and the membership contracts and direct debits underneath it.' },
  { slug: 'people', group: 'behind', label: 'People', blurb: 'Recruiting, onboarding, rotas, absence, overtime and leavers, including the access somebody keeps after they go.' },
  { slug: 'training', group: 'behind', label: 'Training', blurb: 'Induction, competency, observation and refreshers. What your team was taught, and the record that proves it.' },
  { slug: 'systems', group: 'behind', label: 'Systems and setup', blurb: 'Configuring the booking system, pricing, reporting and templates, and the pre-opening work that has to happen once.' },
  { slug: 'safety', group: 'behind', label: 'Safety and the building', blurb: 'Health and safety, security, governance and audit, plant and maintenance. What an inspector asks for first.' },
  { slug: 'running-the-day', group: 'behind', label: 'Running the day', blurb: 'Briefings, duty manager rounds, escalation, staffing adjustments and the weekly review. How a shift is actually held together.' },
]

export const VISIT_STAGES = JOURNEY_STAGES.filter(stage => stage.group === 'visit')
export const BEHIND_STAGES = JOURNEY_STAGES.filter(stage => stage.group === 'behind')

export const STAGE_LABEL: Record<JourneyStage, string> =
  Object.fromEntries(JOURNEY_STAGES.map(stage => [stage.slug, stage.label])) as Record<JourneyStage, string>

// Reference prefixes that are behind the scenes whatever the title says.
// Configuring a payment gateway is not a departure procedure because it has
// the word payment in it, and pre-opening work is not pre-arrival.
//
// Split by prefix rather than by keyword because the prefix is the one part
// of a reference that was decided rather than inferred, and because a person
// arguing with one of these can move a single line and be done.
const BEHIND_PREFIXES: Record<string, JourneyStage> = {
  FIN: 'money', COM: 'money',
  HR: 'people',
  TRN: 'training',
  SYS: 'systems', PRE: 'systems', DES: 'systems', PROC: 'systems',
  HSE: 'safety', SEC: 'safety', GOV: 'safety', AUD: 'safety', QUAL: 'safety',
  FAC: 'safety', MAINT: 'safety', LIN: 'safety', ASSET: 'safety',
  // The pool and spa plans and the risk assessments. They sit here when the
  // library is browsed, and they are deliberately not in any stage pack: see
  // journeyPacks.
  SPA: 'safety',
  OPS: 'running-the-day',
}

// Where a department's work sits when the title gives nothing away.
const PREFIX_FALLBACK: Record<string, JourneyStage> = {
  REC: 'arrival', THER: 'experience', GYM: 'experience', CLS: 'experience',
  PT: 'experience', HK: 'experience', CLN: 'experience',
  RTL: 'departure', RET: 'departure',
  // Membership administration is the revenue engine: contracts, direct
  // debits, arrears, renewals and tiers. Not a stage of anybody's visit.
  MEM: 'money',
}

// Read in journey order, latest stage first, because a document about what
// happens after a treatment is about the after and not the treatment.
const SIGNALS: [JourneyStage, string[]][] = [
  ['post-departure', [
    'feedback', 'review', 'complaint', 'follow-up', 'follow up', 'aftercare', 'retention',
    'win-back', 'lapsed', 'survey', 'testimonial', 'referral', 'newsletter', 'marketing',
    're-engage', 'loyalty', 'birthday', 'anniversary', 'post-visit', 'service recovery',
    'churn', 'arrears',
  ]],
  ['departure', [
    'check-out', 'checkout', 'departure', 'till', 'settle', 'retail sale', 'retail returns',
    'purchase', 'gratuit', 'rebook', 'farewell', 'refund', 'point of sale', 'card payment',
    'cash handling', 'payment',
  ]],
  ['pre-arrival', [
    'booking', 'book ', 'book4time', 'enquir', 'reserv', 'confirm', 'deposit', 'waitlist',
    'itinerary', 'quote', 'availab', 'diary', 'no-show', 'cancel', 'amend', 'reschedul',
    'voucher', 'consent', 'health screen', 'intake', 'questionnaire', 'joining', 'sign-up',
    'enrol', 'trial', 'waiver',
  ]],
  ['arrival', [
    'check-in', 'checkin', 'arrival', 'welcome', 'greet', 'locker', 'robe', 'slipper',
    'changing', 'wristband', 'registration', 'induction', 'tour', 'orientation',
    'first visit', 'queue', 'waiting area', 'access card', 'sign-in',
  ]],
  ['experience', [
    'treatment', 'massage', 'facial', 'therapy', 'therapist', 'pool', 'sauna', 'steam',
    'thermal', 'hydro', 'plunge', 'gym', 'class', 'studio', 'trainer', 'session', 'delivery',
    'lounge', 'relaxation', 'refreshment', 'food', 'beverage', 'music', 'lighting', 'towel',
    'linen', 'clean', 'equipment', 'programme', 'workout', 'experience', 'comfort', 'water',
    'supervision', 'hygiene', 'amenit', 'contamination', 'slip', 'wet area', 'incident',
  ]],
]

/** Where in a guest's visit this document is used. */
export function stageOf(entry: { reference: string; title: string }): JourneyStage {
  const prefix = entry.reference.split('-')[0]
  const behind = BEHIND_PREFIXES[prefix]
  if (behind) return behind

  const title = entry.title.toLowerCase()
  for (const [stage, signals] of SIGNALS) {
    if (signals.some(signal => title.includes(signal))) return stage
  }
  return PREFIX_FALLBACK[prefix] || 'running-the-day'
}

// What kind of document it is, from the code in its reference. The house
// format puts it second from the end, which is the one part of a reference
// that is never a judgement.
export const KIND_LABEL: Record<string, string> = {
  SOP: 'Procedure',
  RA: 'Risk assessment',
  TRG: 'Training',
  GDE: 'Guide',
  POL: 'Policy',
  CHK: 'Checklist',
  JD: 'Job description',
  NOP: 'Operating procedure',
  EAP: 'Emergency plan',
  SSW: 'Safe system of work',
  RPT: 'Management report',
}

export function kindOf(reference: string): string {
  const parts = reference.split('-')
  const code = parts[parts.length - 2] || ''
  return KIND_LABEL[code] ? code : 'SOP'
}

export function kindLabel(reference: string): string {
  return KIND_LABEL[kindOf(reference)] || 'Procedure'
}

/**
 * The library grouped the way it is browsed: stage, then kind.
 *
 * Empty stages are kept. A stage with nothing in it is a real answer to
 * "what covers our departures", and dropping it makes the gap invisible.
 */
export function byJourney<T extends { reference: string; title: string }>(entries: T[]) {
  return JOURNEY_STAGES.map(stage => {
    const mine = entries.filter(entry => stageOf(entry) === stage.slug)
    const kinds = new Map<string, T[]>()
    for (const entry of mine) {
      const kind = kindOf(entry.reference)
      kinds.set(kind, [...(kinds.get(kind) || []), entry])
    }
    return {
      ...stage,
      entries: mine,
      // Procedures first, then the assessments and the training that hang off
      // them, which is the order somebody builds a department in.
      kinds: Array.from(kinds.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([code, list]) => ({ code, label: KIND_LABEL[code] || 'Procedure', entries: list })),
    }
  })
}

export function countByStage(entries: PlannedDocument[]): Record<JourneyStage, number> {
  const counts = Object.fromEntries(JOURNEY_STAGES.map(s => [s.slug, 0])) as Record<JourneyStage, number>
  for (const entry of entries) counts[stageOf(entry)] += 1
  return counts
}
