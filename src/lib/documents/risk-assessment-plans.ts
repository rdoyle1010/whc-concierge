import type { PlanDocument } from './plan-types'
import { RISK_ASSESSMENTS, riskAssessmentSections, type RiskAssessmentTemplate } from './risk-assessments'

// The twelve risk assessments as documents.
//
// Held as one suite rather than sold singly, because an assessment of the
// pool and none of the plant room is not half a job: it is a register with a
// hole in it, and the hole is where the consequence is.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function riskAssessment(template: RiskAssessmentTemplate): PlanDocument {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    kind: 'risk-assessment',
    reference: template.reference,
    title: template.title,
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
    summary:
      `${template.intro} It sets out the hazards a competent operation would expect to find, the controls that `
      + 'should be in place against each, and the structure to record your own judgement of the risk.',
    scope:
      'Nothing in this document is scored. The likelihood, the severity and the number that follows are a '
      + 'judgement made by a person who has stood in the room, and a pre-scored assessment is a property filing '
      + 'somebody else’s opinion of its own premises. The hazards listed are a starting point and are not '
      + 'exhaustive: add anything specific to this building, this equipment and this team.',
    sections: riskAssessmentSections(template),
    references: [],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export const RISK_ASSESSMENT_PLANS = RISK_ASSESSMENTS.map(template => ({
  reference: template.reference,
  build: () => riskAssessment(template),
}))

/** Catalogue entries, so the suite can be listed and sold. */
export const RISK_ASSESSMENT_ENTRIES = RISK_ASSESSMENTS.map(template => ({
  reference: template.reference,
  title: template.title,
  department: 'HEALTH AND SAFETY',
  tier: 'day-1' as const,
  why: 'A written risk assessment is required before the area is used',
}))
