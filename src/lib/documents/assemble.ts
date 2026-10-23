import type { SopDocument } from './types'

// Turning a draft into a document.
//
// The fields an assessor checks first are ours rather than the model's. The
// reference it is filed under, the version, the day it was issued and the day
// it must be looked at again: a model inventing a review date would be
// inventing the one field an inspector reads before anything else.
//
// So the drafted content is spread last but over a fixed base, and the fields
// below are set here, in one place, whether the draft came back from a single
// press of a button or from a batch of four hundred and sixty. Two paths
// assembling documents slightly differently is how a library ends up with
// two shapes in it and nobody able to say which is right.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function documentFromDraft(
  row: { reference: string; title: string; version?: string | null; department?: string | null; kind?: string | null },
  draft: Partial<SopDocument>,
): Record<string, unknown> {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    // Spread first, so nothing below can be overwritten by the draft.
    ...draft,
    kind: row.kind === 'checklist' ? 'sop' : (row.kind || 'sop'),
    reference: row.reference,
    title: row.title,
    version: row.version || '0.1',
    issued: asDate(issued),
    reviewBy: asDate(review),
    property: '[property name]',
    department: row.department || '',
    accountability: {
      author: 'Talent House Collective',
      authorRole: 'Spa operations',
      owner: '[owner role]',
    },
    governance: [
      'Brand operating standards',
      'Talent House Collective operational standards',
    ],
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Drafted, version 0.1.' }],
  }
}
