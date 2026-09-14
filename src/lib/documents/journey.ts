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
  | 'management' | 'pre-arrival' | 'arrival' | 'experience' | 'departure' | 'post-departure'

export const JOURNEY_STAGES: { slug: JourneyStage; label: string; blurb: string }[] = [
  { slug: 'management', label: 'Management', blurb: 'How the business runs. Systems, money, people, compliance and the pre-opening work a guest never sees.' },
  { slug: 'pre-arrival', label: 'Pre-arrival', blurb: 'Everything before they walk in. Enquiries, bookings, deposits, confirmations and the consent forms that should arrive early.' },
  { slug: 'arrival', label: 'Arrival', blurb: 'The first ten minutes. Check-in, welcome, lockers, robes and the induction that sets the tone.' },
  { slug: 'experience', label: 'Experience', blurb: 'The visit itself. Treatments, pool and thermal, the gym floor, classes, and the standards that keep all of it safe.' },
  { slug: 'departure', label: 'Departure', blurb: 'Paying, buying and rebooking. The last five minutes decide whether there is a next visit.' },
  { slug: 'post-departure', label: 'After the visit', blurb: 'Feedback, complaints, aftercare and getting them back. The part most spas leave to chance.' },
]

export const STAGE_LABEL: Record<JourneyStage, string> =
  Object.fromEntries(JOURNEY_STAGES.map(stage => [stage.slug, stage.label])) as Record<JourneyStage, string>

// Reference prefixes that are management whatever the title says. Configuring
// a payment gateway is not a departure procedure because it has the word
// payment in it, and pre-opening work is not pre-arrival.
const MANAGEMENT_PREFIXES = new Set([
  'SYS', 'FIN', 'HR', 'TRN', 'SEC', 'HSE', 'FAC', 'MAINT', 'PROC',
  'GOV', 'AUD', 'QUAL', 'ASSET', 'DES', 'COM', 'OPS', 'PRE', 'LIN',
])

// Where a department's work sits when the title gives nothing away.
const PREFIX_FALLBACK: Record<string, JourneyStage> = {
  REC: 'arrival', THER: 'experience', GYM: 'experience', CLS: 'experience',
  PT: 'experience', HK: 'experience', CLN: 'experience',
  RTL: 'departure', RET: 'departure', MEM: 'management',
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
  if (MANAGEMENT_PREFIXES.has(prefix)) return 'management'

  const title = entry.title.toLowerCase()
  for (const [stage, signals] of SIGNALS) {
    if (signals.some(signal => title.includes(signal))) return stage
  }
  return PREFIX_FALLBACK[prefix] || 'management'
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
