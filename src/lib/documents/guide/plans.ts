import type { PlanDocument } from '../plan-types'
import { GUIDE_SECTIONS } from './completing'
import { TRAINING_SECTIONS } from './training'

// The two documents that come free with the safety operating procedure.
//
// Free deliberately. A guide that costs extra is a guide the person who needs
// it most does not buy, and a customer who never completes what they bought
// does not buy anything else. They are also the best sales asset in the
// library: somebody who reads the first three pages of the guide knows
// exactly what they are getting and why the blanks are blanks.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const GUIDE_REFERENCE = 'SPA-OPERATIONS-GDE-003'
export const TRAINING_REFERENCE = 'SPA-OPERATIONS-TRG-004'

function base(reference: string) {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    reference,
    version: '0.1',
    issued: asDate(issued),
    reviewBy: asDate(review),
    // Ours rather than theirs. A guide is not a controlled document of the
    // property's, and asking them to complete a property name on the front of
    // it is asking them to adopt our advice as their procedure.
    property: 'Talent House Collective',
    department: 'SPA OPERATIONS',
    accountability: {
      author: 'Talent House Collective',
      authorRole: 'Spa operations',
      owner: 'Talent House Collective',
    },
    governance: ['Talent House Collective operational standards'],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued, version 0.1.' }],
  }
}

export function completionGuide(): PlanDocument {
  return {
    ...base(GUIDE_REFERENCE),
    kind: 'guide',
    title: 'How to Complete Your Spa Safety Operating Procedure',
    summary:
      'A companion to the Normal Operating Procedure and the Emergency Action Plan. Who should complete them, '
      + 'how long it honestly takes, how to work through each part, the six mistakes that produce a document '
      + 'which looks finished and is not, what an inspector asks for and where each answer lives, and how to '
      + 'keep the whole thing alive once it is signed.',
    scope:
      'Read this first. It is guidance rather than a controlled document: nothing in it needs completing, '
      + 'signing or filing, and it does not form part of your procedures. Included free with the safety '
      + 'operating procedure.',
    sections: GUIDE_SECTIONS,
    references: [
      { name: 'Spa and Wellness: Normal Operating Procedure', reference: 'SPA-OPERATIONS-NOP-001' },
      { name: 'Spa and Wellness: Emergency Action Plan', reference: 'SPA-OPERATIONS-EAP-002' },
      { name: 'Training Your Team on the Safety Operating Procedure', reference: TRAINING_REFERENCE },
    ],
  }
}

export function trainingGuide(): PlanDocument {
  return {
    ...base(TRAINING_REFERENCE),
    kind: 'training',
    title: 'Training Your Team on the Safety Operating Procedure',
    summary:
      'Seven session plans somebody can run without designing them first, a training matrix, what a new starter '
      + 'must know before their first shift alone, how to run a drill that is worth running, how to assess '
      + 'competence rather than attendance, and an annual plan to put on the rota.',
    scope:
      'The gap between a signed procedure and a team that follows it. A spa with excellent documents and a team '
      + 'who have never practised a rescue is in a worse position than one with neither, because it has written '
      + 'evidence that it knew what should happen. Included free with the safety operating procedure.',
    sections: TRAINING_SECTIONS,
    references: [
      { name: 'Spa and Wellness: Normal Operating Procedure', reference: 'SPA-OPERATIONS-NOP-001' },
      { name: 'Spa and Wellness: Emergency Action Plan', reference: 'SPA-OPERATIONS-EAP-002' },
      { name: 'How to Complete Your Spa Safety Operating Procedure', reference: GUIDE_REFERENCE },
    ],
  }
}

export const GUIDE_PLANS = [
  { reference: GUIDE_REFERENCE, build: completionGuide },
  { reference: TRAINING_REFERENCE, build: trainingGuide },
]

/** Catalogue entries. Free, and sold with nothing, because they go with the pack. */
export const GUIDE_ENTRIES = [
  {
    reference: GUIDE_REFERENCE,
    title: 'How to Complete Your Spa Safety Operating Procedure',
    department: 'SPA OPERATIONS',
    tier: 'day-1' as const,
    why: 'Included free with the safety operating procedure',
  },
  {
    reference: TRAINING_REFERENCE,
    title: 'Training Your Team on the Safety Operating Procedure',
    department: 'SPA OPERATIONS',
    tier: 'day-1' as const,
    why: 'Included free with the safety operating procedure',
  },
]
