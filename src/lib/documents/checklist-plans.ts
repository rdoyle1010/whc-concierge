import type { PlanDocument } from './plan-types'
import { CHECKLIST_REGISTER, type ChecklistEntry } from './checklists/register'
import { UK_SPA_FRAMEWORK } from './pool-plans'

// The checklists as documents.
//
// A checklist is the procedure in the form somebody uses it. The library
// already holds the procedures, and a spa that has bought them still runs the
// day on a sheet somebody printed in 2019 with the old brand on it, because
// nobody turns a forty-page procedure into a morning routine for free.
//
// Each one names the procedures and assessments it is drawn from, block by
// block. That is not provenance for its own sake: it is how somebody finds
// every checklist affected when a procedure changes, and it is how an
// assessor satisfies themselves that the daily routine and the written
// standard are the same thing rather than two documents that agree by luck.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function checklist(entry: ChecklistEntry): PlanDocument {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    kind: 'checklist',
    reference: entry.reference,
    title: entry.title,
    version: '0.1',
    issued: asDate(issued),
    reviewBy: asDate(review),
    property: '[property name]',
    department: entry.department,
    accountability: {
      author: 'Talent House Collective',
      authorRole: 'Spa operations',
      owner: '[owner role]',
    },
    governance: [
      'Talent House Collective operational standards',
      'The property’s own procedures, assessments and policies',
    ],
    legalFramework: UK_SPA_FRAMEWORK,
    summary:
      `${entry.intro} It is drawn from ${entry.drawnFrom}, and each block names its source so that a change to `
      + 'a procedure can be traced to every checklist it affects.',
    scope:
      'Add anything specific to this building and take out anything that does not apply, but do both '
      + 'deliberately. A checklist grows by one line every time somebody has a bad week and shrinks only when '
      + 'a person sits down with it, which is how a spa ends up with a forty-line morning routine nobody '
      + 'completes honestly. Checks marked [STOP] are the exception: those are the ones where the answer '
      + 'decides whether an area opens, and they are not yours to soften.',
    sections: entry.sections,
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export const CHECKLIST_PLANS = CHECKLIST_REGISTER.map(entry => ({
  reference: entry.reference,
  build: () => checklist(entry),
}))

/** The shop entries, so a checklist is listed and searchable like anything else. */
export const CHECKLIST_ENTRIES = CHECKLIST_REGISTER.map(entry => ({
  reference: entry.reference,
  title: entry.title,
  department: entry.department,
  tier: 'day-1' as const,
  why: 'The daily running sheet for that shift.',
}))
