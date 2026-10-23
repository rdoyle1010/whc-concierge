import type { PlanDocument } from './plan-types'
import { HIRING_REGISTER, type HiringEntry } from './hiring/register'
import { UK_SPA_FRAMEWORK } from './pool-plans'

// A hiring instrument as a document.
//
// Filed as a guide, because that is what it is: something somebody reads in
// order to do a thing well, rather than a procedure they follow to do it
// correctly. The distinction matters at the point of use. A procedure is
// complied with; a guide is used.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function hiringDocument(entry: HiringEntry): PlanDocument {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    kind: 'guide',
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
      owner: '[the role the property makes accountable for hiring]',
    },
    governance: [
      'Talent House Collective operational standards',
      'The property’s own recruitment, equality and data protection policies',
    ],
    legalFramework: UK_SPA_FRAMEWORK,
    summary: `${entry.purpose} ${entry.whenToUse}`,
    scope:
      'Use the same instrument for every candidate for a role. That is the whole of what makes a hiring '
      + 'decision defensible: not that the questions were clever, but that everybody was asked the same ones '
      + 'and scored against the same thing. Adapt it to your property and to the role, then use the adapted '
      + 'version consistently rather than improvising per candidate.',
    sections: entry.sections,
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export const HIRING_PLANS = HIRING_REGISTER.map(entry => ({
  reference: entry.reference,
  build: () => hiringDocument(entry),
}))

export const HIRING_ENTRIES = HIRING_REGISTER.map(entry => ({
  reference: entry.reference,
  title: entry.title,
  department: entry.department,
  tier: 'day-1' as const,
  why: 'Used in a room with a candidate in it.',
}))
