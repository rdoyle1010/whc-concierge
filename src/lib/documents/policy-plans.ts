import type { PlanDocument, PlanSection } from './plan-types'
import { POLICY_REGISTER, type PolicyEntry } from './policies/register'
import { UK_SPA_FRAMEWORK } from './pool-plans'

// A policy as a document.
//
// Same section machinery as the checklists, the reports and the job
// descriptions, for the same reason: a policy is headings, paragraphs and a
// table, and a second renderer would be the first one written twice and then
// allowed to drift.
//
// The order is deliberate. Position before rules, because a rule nobody
// understands the reason for is a rule that gets worked around on the first
// busy Saturday. Breach near the end rather than hidden, because a policy
// with no stated consequence is a suggestion.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

const POSITION = 'Our position'
const RULES = 'What that means in practice'
const RUNNING = 'Holding it'

export function policy(entry: PolicyEntry): PlanDocument {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  const sections: PlanSection[] = [
    { part: POSITION, heading: 'Why this policy exists', paragraphs: [entry.purpose] },
    { part: POSITION, heading: 'Who it applies to', paragraphs: [entry.appliesTo] },
    { part: POSITION, heading: 'The position', paragraphs: entry.position },
  ]

  for (const group of entry.rules) {
    sections.push({ part: RULES, heading: group.area, bullets: group.items })
  }

  sections.push({
    part: RUNNING,
    heading: 'Who is accountable',
    table: {
      columns: ['Role', 'Accountable for'],
      rows: entry.responsibilities.map(item => [item.role, item.duty]),
    },
  })

  sections.push({
    part: RUNNING,
    heading: 'What has to be recorded',
    intro:
      'A policy nobody can evidence is a policy nobody held. These are the records an assessor, an insurer '
      + 'or an investigator would ask for.',
    bullets: entry.records,
  })

  sections.push({
    part: RUNNING,
    heading: 'When it is breached',
    intro:
      'Stated rather than implied. A policy with no consequence written into it is a suggestion, and the '
      + 'first person to test that finds out it was one.',
    bullets: entry.breach,
  })

  sections.push({
    part: RUNNING,
    heading: 'When this is reviewed',
    intro: 'Annually, and before that whenever any of these happens.',
    bullets: entry.reviewTriggers,
  })

  sections.push({
    part: RUNNING,
    heading: 'Adoption',
    intro:
      'A policy takes effect when a competent person at the property has read it against their own operation '
      + 'and adopted it, not when it was downloaded.',
    table: {
      columns: ['', 'Name', 'Role', 'Date'],
      rows: [
        ['Adopted by', '', '', ''],
        ['Communicated to the team on', '', '', ''],
        ['Next review due', '', '', ''],
      ],
      fillable: true,
    },
  })

  return {
    kind: 'policy',
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
      owner: '[the role the property makes accountable for this policy]',
    },
    governance: [
      'Talent House Collective operational standards',
      'The property’s own obligations, which take precedence over this document',
    ],
    legalFramework: UK_SPA_FRAMEWORK,
    summary:
      `${entry.purpose} It states the position, what follows from it in practice, who is accountable, what has `
      + 'to be recorded, and what happens when it is breached.',
    scope:
      'This states a position a competent operation would hold. It is not legal advice and it does not tell '
      + 'this property what its own obligations are: confirm that against your own advice, your insurer and '
      + 'your regulator, then adopt it. Adapt anything that does not fit this building, and take out anything '
      + 'that does not apply, but do both deliberately and record that you did.',
    sections,
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export const POLICY_PLANS = POLICY_REGISTER.map(entry => ({
  reference: entry.reference,
  build: () => policy(entry),
}))

export const POLICY_ENTRIES = POLICY_REGISTER.map(entry => ({
  reference: entry.reference,
  title: entry.title,
  department: entry.department,
  tier: 'day-1' as const,
  why: 'A written position an assessor, an insurer or an investigator will ask to see.',
}))
