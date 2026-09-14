import type { PlanDocument } from './plan-types'
import { FINANCE_REGISTER, type ReportEntry } from './finance/register'

// The reporting pack as documents.
//
// What a spa director lacks is almost never a spreadsheet. It is agreement on
// which numbers, measured how, compared against what, and what somebody is
// expected to do when one of them moves. That is a document, and it is the
// part nobody writes because it is not anybody's job.
//
// Sold as a pack and not singly, and the reason is not commercial. The
// measure definitions only hold if every report uses the same ones. A spa
// that buys the therapist report and not the capacity report will be
// computing utilisation two ways within a quarter, and the argument that
// follows at month end is the exact thing this pack exists to end.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function report(entry: ReportEntry): PlanDocument {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    kind: 'report',
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
    governance: ['Talent House Collective commercial standards'],
    summary:
      `${entry.intro} Produced ${entry.cadence.toLowerCase()}. It states the decision it exists to drive, `
      + 'defines every line precisely enough that two people cannot compute it differently, and says plainly '
      + 'what a bad number usually means.',
    scope:
      'Every figure is blank. Nothing here is a benchmark and nothing is a target: a printed number would be '
      + 'somebody else’s spa, and the fastest way to make a report useless is to fill it in for the person '
      + 'who has to own it. The definitions are the part to keep. Agree them once, write them down here, and '
      + 'the monthly meeting stops being an argument about how utilisation was calculated.',
    sections: entry.sections,
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export const FINANCE_PLANS = FINANCE_REGISTER.map(entry => ({
  reference: entry.reference,
  build: () => report(entry),
}))

export const FINANCE_ENTRIES = FINANCE_REGISTER.map(entry => ({
  reference: entry.reference,
  title: entry.title,
  department: entry.department,
  tier: 'month-1' as const,
  why: `${entry.cadence} management reporting.`,
}))
