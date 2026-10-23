import type { PlanSection } from '../plan-types'

// A checklist is a procedure reduced to what somebody actually does.
//
// The procedures in this library are the reference. Nobody reads a reference
// at seven in the morning with a trolley to restock and a guest arriving at
// half past, so a checklist is the same standard in the form of a line with a
// box beside it, and the line has to be checkable by looking rather than by
// remembering.
//
// Three rules run through all of them.
//
// A check states what good looks like, not what to do. "Water clarity: the
// deepest drain cover is visible from the side" is a check. "Check the water"
// is a reminder to have an opinion.
//
// Every check names where it came from. A checklist detached from the
// procedure it enforces drifts within a year, because somebody adds a line
// they think is sensible and nobody takes one away. Each part says which
// procedures, assessments and policies it is drawn from, so when one of those
// changes there is a way to find what else has to change.
//
// And nothing here is scored or pre-ticked. A checklist arriving with boxes
// already marked is a document that teaches a team the boxes do not matter.

export type Check = {
  /** What good looks like, in a form somebody can confirm by looking. */
  check: string
  /** Set only where a failure cannot wait for the end of the shift. */
  stop?: boolean
}

/** The columns a person fills in beside each check. */
const DAILY_COLUMNS = ['Check', 'Done', 'Time', 'By']

/**
 * One block of checks.
 *
 * The source line is not decoration. It is how somebody maintaining this
 * finds every checklist affected when a procedure changes, and it is how an
 * assessor satisfies themselves that the daily routine and the written
 * procedure are the same thing rather than two documents that agree by
 * accident.
 */
export function checkBlock(
  part: string,
  heading: string,
  drawnFrom: string,
  checks: Check[],
): PlanSection {
  return {
    part,
    heading,
    intro: `Drawn from ${drawnFrom}.`,
    table: {
      columns: DAILY_COLUMNS,
      rows: checks.map(item => [item.stop ? `${item.check}  [STOP]` : item.check, '', '', '']),
      fillable: true,
    },
  }
}

/** A block of checks recorded once a week rather than once a shift. */
export function weeklyBlock(
  part: string,
  heading: string,
  drawnFrom: string,
  checks: Check[],
): PlanSection {
  return {
    part,
    heading,
    intro: `Drawn from ${drawnFrom}.`,
    table: {
      columns: ['Check', 'Week 1', 'Week 2', 'Week 3', 'Week 4'],
      rows: checks.map(item => [item.check, '', '', '', '']),
      fillable: true,
    },
  }
}

/**
 * The block every checklist ends with.
 *
 * A checklist with no room to record a failure is a checklist that trains
 * people to tick anyway. The point of the exercise is the exceptions: a
 * fortnight of clean sheets says either that everything is well run or that
 * nobody is really looking, and the two are indistinguishable unless there is
 * somewhere to write the third thing.
 */
export function exceptionsBlock(part: string): PlanSection[] {
  return [
    {
      part,
      heading: 'Anything that failed, and what was done about it',
      intro:
        'Every check that could not be signed off goes here, with what was done and who was told. A sheet with '
        + 'nothing in this box for a fortnight is either a very well run spa or a checklist nobody is really '
        + 'reading, and from the outside those look identical.',
      table: {
        columns: ['What failed', 'What was done', 'Who was told', 'Time', 'Closed'],
        rows: Array.from({ length: 6 }, () => ['', '', '', '', '']),
        fillable: true,
      },
    },
    {
      part,
      heading: 'Signed',
      intro:
        'Signing this says the checks above were carried out and the answers are true. It is not a formality: '
        + 'this sheet is the record an assessor asks for, and a signature against a check nobody made is worse '
        + 'than no sheet at all.',
      facts: [
        { label: 'Date' },
        { label: 'Shift' },
        { label: 'Completed by (name)' },
        { label: 'Completed by (signature)' },
        { label: 'Checked by (name)' },
        { label: 'Checked by (signature)' },
      ],
    },
  ]
}

/** The part every checklist opens with, written once. */
export function howToUse(when: string, who: string, escalate: string): PlanSection[] {
  return [
    {
      part: 'How to use this checklist',
      heading: 'When this is done and who does it',
      facts: [
        { label: 'When it is run', value: when },
        { label: 'Who runs it', value: who },
        { label: 'Who it goes to when finished', hint: 'The role, not a name, so it survives the person leaving.' },
        { label: 'Where completed sheets are kept', hint: 'And for how long. Twelve months is the usual minimum.' },
      ],
    },
    {
      part: 'How to use this checklist',
      heading: 'What to do when a check fails',
      paragraphs: [
        'Tick nothing you have not seen. A box ticked from memory is the one an assessor finds, and it '
        + 'discredits every other box on the sheet.',
        `A check marked [STOP] cannot be worked around. If it fails, the area stays closed until it is put `
        + `right and a manager has confirmed it. ${escalate}`,
        'Everything else that fails is recorded in the exceptions block at the end, with what was done about '
        + 'it. Recording a failure is doing the job properly. Hiding one is not.',
      ],
    },
  ]
}
