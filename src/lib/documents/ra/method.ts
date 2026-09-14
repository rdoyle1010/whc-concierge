import type { PlanSection } from '../plan-types'

// How to use the register, on the front of every assessment.
//
// A risk assessment handed to somebody who has never done one produces a
// column of fives and a signature. The method is the part that decides
// whether the rest of it is worth anything, and it belongs in front of the
// hazards rather than in a covering email nobody keeps.

export const HOW_TO_USE: PlanSection = {
  part: 'How to use this assessment',
  heading: 'Before you start',
  intro:
    'Walk the area with this document in your hand. Do not complete it at a desk: an assessment written from '
    + 'memory reads exactly like one written from observation, and only one of them finds anything.',
  bullets: [
    'Take somebody who works in the area with you. They know what actually happens on a Saturday, which is not always what the procedure says.',
    'Tick a control only when you have seen it, working, today. An unticked control is a gap, and finding gaps is the point of the exercise.',
    'Score the area as it actually operates, not as it should. An assessment of the ideal version of your spa protects nobody in the real one.',
    'Where a hazard does not apply to this property, write not applicable and say why. Do not leave it blank: a blank looks like a question nobody got to.',
    'Add any hazard specific to this building. This list is a starting point and is not exhaustive, and the hazard nobody thought of is the one that hurts somebody.',
    'Where a score comes out high, act before you finish the assessment. Do not write it down and carry on to the next page.',
  ],
  mustBeChecked: true,
}

export const SCORING: PlanSection = {
  part: 'How to use this assessment',
  heading: 'Scoring, and what each band means',
  intro:
    'Likelihood multiplied by severity. Likelihood is how likely this is to happen here, as things stand. '
    + 'Severity is how bad it would be if it did, not how bad it usually is.',
  riskMatrix: true,
  bullets: [
    'Likelihood 1 is very unlikely, 3 is possible, 5 is almost certain or already happening.',
    'Severity 1 needs no first aid, 3 is an injury needing treatment, 5 is a fatality or a permanent injury.',
    'Score the severity of the realistic worst outcome, not the average one. A slip on a pool surround is usually a bruise and occasionally a head injury.',
    'A high severity does not justify softening the likelihood to keep the number down. That is the most common way a register ends up all green.',
    'Where further controls are needed, name a person and a date. A control with no owner is a note, and a note changes nothing.',
    'Score the residual level assuming those controls are in place. Where the residual is still high, escalate it rather than accepting it.',
  ],
}

export const SIGN_OFF: PlanSection = {
  part: 'Review and sign-off',
  heading: 'Who did this, and when it is looked at again',
  facts: [
    { label: 'Assessed by, and their competence to do so', long: true, hint: 'The training, qualification or experience that makes this person the right one to have done it.' },
    { label: 'Who walked the area with them' },
    { label: 'Date assessed' },
    { label: 'Reviewed and approved by, and their role' },
    { label: 'Review date', hint: 'Annually at a minimum, and immediately after any incident, near miss, change of layout, change of equipment or change of team.' },
    { label: 'What would trigger a review before it is due', long: true },
    { label: 'How the team is told what this assessment found', long: true, hint: 'An assessment nobody has been briefed on changes nothing about how the area is used.' },
    { label: 'Where this assessment is held, and who can reach it' },
    { label: 'Which procedures and training records this assessment connects to', long: true, hint: 'If an incident happens, the chain from assessment to procedure to training to record is what demonstrates control.' },
  ],
  mustBeChecked: true,
}

export const ACTION_PLAN: PlanSection = {
  part: 'Review and sign-off',
  heading: 'Action plan',
  intro:
    'Every further control identified in this assessment, in one place, with an owner and a date. This is the '
    + 'page an inspector turns to, because it is the only one that shows whether anything happened.',
  table: {
    columns: ['Hazard', 'Action required', 'Owner', 'Target date', 'Completed', 'Verified by'],
    rows: Array.from({ length: 14 }, () => ['', '', '', '', '', '']),
    fillable: true,
  },
  mustBeChecked: true,
}
