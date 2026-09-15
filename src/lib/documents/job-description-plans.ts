import type { PlanDocument, PlanSection } from './plan-types'
import { ROLE_REGISTER, type RoleEntry } from './roles/register'
import { UK_SPA_FRAMEWORK } from './pool-plans'

// A job description as a document.
//
// Built on the same section machinery as the checklists and the reports,
// because that is what it is: headings, bullets and a table. Writing a
// separate renderer for it would be writing that one twice, and it would be
// the one that quietly stopped matching the others.
//
// The layout is the argument. A duty list alone is useless three times over:
// at interview there is nothing to assess against, at appraisal nothing to
// measure against, and at a tribunal nothing to show the person was told what
// the job was. So purpose comes first, the duties are grouped rather than
// listed flat, and what good looks like and how it is measured sit after them
// where an appraisal can actually use them.
//
// Terms are a table of blanks. Salary, hours and notice belong to one
// property and to one contract, and a plausible figure typed into a document
// that sits next to a contract is a liability rather than a convenience.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

const ABOUT = 'The role'
const WORK = 'The work'
const STANDARD = 'How it is judged'
const TERMS = 'Terms'

export function jobDescription(entry: RoleEntry): PlanDocument {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  const sections: PlanSection[] = [
    {
      part: ABOUT,
      heading: 'Purpose of the role',
      paragraphs: [entry.purpose],
    },
    {
      part: ABOUT,
      heading: 'Where it sits',
      table: {
        columns: ['', ''],
        rows: [
          ['Job title', entry.title],
          ['Department', entry.department],
          ['Reports to', entry.reportsTo],
          ['Responsible for', entry.responsibleFor],
          ['Location', '[property name]'],
        ],
      },
    },
  ]

  for (const group of entry.duties) {
    sections.push({ part: WORK, heading: group.area, bullets: group.items })
  }

  sections.push({
    part: STANDARD,
    heading: 'What good looks like',
    intro:
      'Written as behaviour somebody can observe, because an adjective cannot be assessed at interview or '
      + 'discussed at a review.',
    bullets: entry.whatGoodLooksLike,
  })

  sections.push({
    part: STANDARD,
    heading: 'How the role is measured',
    intro:
      'These are the measures this role is accountable for. An appraisal held against them is a conversation '
      + 'about numbers rather than about impressions.',
    bullets: entry.measuredBy,
  })

  sections.push({
    part: STANDARD,
    heading: 'Essential',
    intro: 'Without these, the role cannot be done, or cannot lawfully be done.',
    bullets: entry.essential,
  })

  sections.push({
    part: STANDARD,
    heading: 'Desirable',
    intro:
      'Wanted rather than required, and the distinction is the point: a bar that moves between two candidates '
      + 'is a bar that will be asked about.',
    bullets: entry.desirable,
  })

  sections.push({
    part: TERMS,
    heading: 'Working conditions',
    bullets: entry.conditions,
  })

  sections.push({
    part: TERMS,
    heading: 'Terms to complete',
    intro:
      'These belong to one property and to one contract. Nobody writing this document knows them, and a '
      + 'plausible figure in a document that sits beside a contract is a liability rather than a convenience.',
    table: {
      columns: ['Term', 'To complete'],
      rows: [
        ['Salary or hourly rate', ''],
        ['Contracted hours', ''],
        ['Pattern of work', ''],
        ['Holiday entitlement', ''],
        ['Notice period', ''],
        ['Probation period', ''],
        ['Service charge, commission or bonus', ''],
        ['Benefits', ''],
        ['Reports to, by name', ''],
      ],
      fillable: true,
    },
  })

  sections.push({
    part: TERMS,
    heading: 'Acceptance',
    intro:
      'A job description is only evidence of what somebody was told if they signed it. Issued at appointment '
      + 'and reissued whenever the role changes materially, rather than once and forgotten.',
    table: {
      columns: ['', 'Name', 'Signature', 'Date'],
      rows: [
        ['Post holder', '', '', ''],
        ['On behalf of the property', '', '', ''],
      ],
      fillable: true,
    },
  })

  return {
    kind: 'job-description',
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
      owner: '[the manager this role reports to]',
    },
    governance: [
      'Talent House Collective operational standards',
      'The property’s own contract of employment, which takes precedence over this document',
    ],
    legalFramework: UK_SPA_FRAMEWORK,
    summary:
      `What the ${entry.title} role is for, what it does, what good looks like in it, and how it is measured. `
      + 'Written to be used three times: at interview as the thing a candidate is assessed against, at '
      + 'appraisal as the thing performance is discussed against, and at appointment as the record of what '
      + 'the person was told the job was.',
    scope:
      'This describes the role, not the contract. Pay, hours, notice and benefits are stated in the contract '
      + 'of employment and are left blank here deliberately. Add anything specific to this property and take '
      + 'out anything that does not apply, then reissue it: a job description that no longer matches the job '
      + 'is worse than none, because it is the version that gets produced when there is a dispute.',
    sections,
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export const JOB_DESCRIPTION_PLANS = ROLE_REGISTER.map(entry => ({
  reference: entry.reference,
  build: () => jobDescription(entry),
}))

/** The shop entries, so a role is listed and searchable like anything else. */
export const JOB_DESCRIPTION_ENTRIES = ROLE_REGISTER.map(entry => ({
  reference: entry.reference,
  title: entry.title,
  department: entry.department,
  tier: 'day-1' as const,
  why: 'Every role needs one before somebody is appointed to it.',
}))
