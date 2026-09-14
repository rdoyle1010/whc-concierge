import type { PlanDocument } from './plan-types'
import { RISK_REGISTER, type RegisterEntry } from './ra/register'
import { UK_SPA_FRAMEWORK } from './pool-plans'

// The register as documents.
//
// Organised by hazard type rather than by area, which is how an inspector
// reads one and how the frameworks are written. By-area produced the
// duplication that kills a register: manual handling appeared in five of the
// twelve, and every copy drifted from every other.
//
// Sold as a suite and not singly. An assessment of the chemicals and none of
// the fire is not half a job, it is a register with a hole in it, and a
// property buying one category would buy the one it already worries about.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function riskAssessment(entry: RegisterEntry): PlanDocument {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    kind: 'risk-assessment',
    reference: entry.reference,
    title: entry.title,
    version: '0.1',
    issued: asDate(issued),
    reviewBy: asDate(review),
    property: '[property name]',
    department: 'HEALTH AND SAFETY',
    accountability: {
      author: 'Talent House Collective',
      authorRole: 'Spa operations',
      owner: '[owner role]',
    },
    governance: [
      'Management of Health and Safety at Work Regulations',
      'Talent House Collective operational standards',
    ],
    legalFramework: UK_SPA_FRAMEWORK,
    summary:
      `${entry.intro} It sets out the hazards a competent operation would expect to find, the controls that `
      + 'should be in place against each, and the structure to record your own judgement of the risk.',
    scope:
      'Nothing in this document is scored. The likelihood, the severity and the number that follows are a '
      + 'judgement made by a person who has stood in the room, and a pre-scored assessment is a property filing '
      + 'somebody else\u2019s opinion of its own premises. The hazards listed are a starting point and are not '
      + 'exhaustive: add anything specific to this building, this equipment and this team.',
    sections: entry.sections,
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export const RISK_ASSESSMENT_PLANS = RISK_REGISTER.map(entry => ({
  reference: entry.reference,
  build: () => riskAssessment(entry),
}))

/** Catalogue entries, so the suite can be listed and sold. */
export const RISK_ASSESSMENT_ENTRIES = RISK_REGISTER.map(entry => ({
  reference: entry.reference,
  title: entry.title,
  department: 'HEALTH AND SAFETY',
  tier: 'day-1' as const,
  why: 'A written risk assessment is required before the area is used',
}))
