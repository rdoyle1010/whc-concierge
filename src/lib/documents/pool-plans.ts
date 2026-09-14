import type { PlanDocument } from './plan-types'
import { POOL_NOP_SECTIONS } from './pool-nop'
import { POOL_EAP_SECTIONS } from './pool-eap'

// The two halves of a Pool Safety Operating Procedure, as documents.
//
// They are issued separately because they are used separately: the NOP lives
// in a folder and is read once by each new starter, and the EAP is laminated
// and goes on a wall. Each points at the other, because an emergency plan
// that does not name the bather load and a normal procedure that does not say
// how to raise the alarm are each half an answer.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const POOL_NOP_REFERENCE = 'POOL-SAFETY-NOP-001'
export const POOL_EAP_REFERENCE = 'POOL-SAFETY-EAP-002'

function base(reference: string) {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    reference,
    version: '0.1',
    issued: asDate(issued),
    reviewBy: asDate(review),
    property: '[property name]',
    department: 'POOL AND WET AREAS',
    accountability: {
      author: 'Talent House Collective',
      authorRole: 'Spa operations',
      owner: '[owner role]',
    },
    governance: [
      'HSG179 Health and safety in swimming pools',
      'Talent House Collective operational standards',
    ],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export function poolNop(): PlanDocument {
  return {
    ...base(POOL_NOP_REFERENCE),
    kind: 'nop',
    title: 'Pool and Wet Areas: Normal Operating Procedure',
    summary:
      'How this property runs its pools, plunges, hydrotherapy pools, saunas and steam rooms on an ordinary day: '
      + 'the facilities themselves, the maximum number of people permitted in the water, who supervises and from '
      + 'where, how the water is tested, and how the facility is opened and closed. It is one half of the pool '
      + 'safety operating procedure. The other half is the Emergency Action Plan.',
    scope:
      'Applies to every person who supervises, cleans, tests, doses or manages the wet facilities, and to any '
      + 'outside organisation hiring them. Most of this document is blank when it arrives, and those blanks are '
      + 'the document: the dimensions, depths, loads and positions are facts about one building and no one who '
      + 'has not walked it may state them.',
    sections: POOL_NOP_SECTIONS,
    references: [
      { name: 'Pool and Wet Areas: Emergency Action Plan', reference: POOL_EAP_REFERENCE },
    ],
  }
}

export function poolEap(): PlanDocument {
  return {
    ...base(POOL_EAP_REFERENCE),
    kind: 'eap',
    title: 'Pool and Wet Areas: Emergency Action Plan',
    summary:
      'What each person does, in order, in the first minutes of an emergency in the pool or wet areas. Written to '
      + 'be read at speed by somebody with wet hands: one emergency per page, short actions, a named role against '
      + 'each. It is one half of the pool safety operating procedure. The other half is the Normal Operating '
      + 'Procedure.',
    scope:
      'Applies to every person working in or supervising the wet facilities, and to any outside organisation '
      + 'hiring them. The actions are general and hold in any building. Everything specific to this one - where '
      + 'the alarm is, where the assembly point is, which door the ambulance comes to, who holds the plant room '
      + 'key - is blank, and must be completed and briefed before this plan is relied on.',
    sections: POOL_EAP_SECTIONS,
    references: [
      { name: 'Pool and Wet Areas: Normal Operating Procedure', reference: POOL_NOP_REFERENCE },
    ],
  }
}

export const POOL_PLANS = [
  { reference: POOL_NOP_REFERENCE, build: poolNop },
  { reference: POOL_EAP_REFERENCE, build: poolEap },
]

/**
 * The two plans as catalogue entries, so they can be listed and sold.
 *
 * Deliberately not in LIBRARY_PLAN. That list drives the department packs,
 * and a two-document department would be offered at seventy-eight pounds by
 * the "never more than its parts" rule, which is the right rule applied to
 * the wrong thing: a pool safety operating procedure is the document an
 * insurer asks for first and a consultancy charges four figures to produce.
 * It is priced as its own pack instead.
 */
export const POOL_PLAN_ENTRIES = [
  {
    reference: POOL_NOP_REFERENCE,
    title: 'Pool and Wet Areas: Normal Operating Procedure',
    department: 'POOL AND WET AREAS',
    tier: 'day-1' as const,
    why: 'Required in writing before a pool opens',
  },
  {
    reference: POOL_EAP_REFERENCE,
    title: 'Pool and Wet Areas: Emergency Action Plan',
    department: 'POOL AND WET AREAS',
    tier: 'day-1' as const,
    why: 'Required in writing before a pool opens',
  },
]
