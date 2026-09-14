import type { PlanSection } from '../plan-types'

// A management report, as a template rather than as a spreadsheet.
//
// A spreadsheet is the right tool for the arithmetic and the wrong one for
// the argument. What a spa director actually lacks is not a place to put the
// numbers: it is agreement on which numbers, measured how, compared against
// what, and what somebody is expected to do when one of them moves. That is a
// document, and it is the part that never gets written because it is not
// anybody's job.
//
// So each report here states the decision it drives, defines every line so
// two people cannot compute it differently, gives the shape to fill in, and
// says plainly what a bad number means. The measure definitions are the
// valuable part and the part most often argued about at month end.

export type Metric = {
  /** The line as it appears on the report. */
  name: string
  /** How it is calculated, precisely enough that two people agree. */
  how: string
}

/** The comparison columns. Revenue against last year alone tells you nothing. */
const COLUMNS = ['Measure', 'This period', 'Last period', 'Same period last year', 'Budget', 'Variance']

/**
 * The block of numbers.
 *
 * Six columns because four of them are the point. A figure on its own is a
 * fact; a figure against budget, against the previous period and against the
 * same period last year is a finding. Most spa reporting shows the first and
 * calls it a report.
 */
export function figures(heading: string, intro: string, metrics: Metric[]): PlanSection {
  return {
    part: 'The figures',
    heading,
    intro,
    table: {
      columns: COLUMNS,
      rows: metrics.map(metric => [metric.name, '', '', '', '', '']),
      fillable: true,
    },
  }
}

/** How each line is worked out, so two people cannot produce two answers. */
export function definitions(metrics: Metric[]): PlanSection {
  return {
    part: 'How each line is calculated',
    heading: 'How each line is calculated',
    intro:
      'Written down because the argument at month end is almost never about the number. It is about whether '
      + 'utilisation counted rostered hours or available hours, and whether the retail figure included the '
      + 'products used in treatment. Agree these once and the meeting is about the business.',
    table: {
      columns: ['Measure', 'How it is calculated'],
      rows: metrics.map(metric => [metric.name, metric.how]),
    },
  }
}

/** What the report is for, which is not the same as what is on it. */
export function purpose(decision: string, cadence: string, owner: string, reads: string[]): PlanSection[] {
  return [
    {
      part: 'What this report is for',
      heading: 'What this report is for',
      paragraphs: [
        `The decision it exists to drive: ${decision}`,
        'A report that drives no decision is a report that should be stopped. If nobody can name what changes '
        + 'because of this one, take it off the pack rather than keep producing it out of habit.',
      ],
      facts: [
        { label: 'How often it is produced', value: cadence },
        { label: 'Who produces it', value: owner },
        { label: 'Who it goes to', hint: 'Roles, not names, so it survives somebody leaving.' },
        { label: 'When it is due', hint: 'A report that arrives after the decision was taken is a history lesson.' },
        { label: 'Where the data comes from', hint: 'Name the system and the report inside it.' },
      ],
    },
    {
      part: 'What this report is for',
      heading: 'How to read it',
      intro: 'What a good number looks like, and what a bad one usually means.',
      bullets: reads,
    },
  ]
}

/** Every report ends the same way, because a number with no owner changes nothing. */
export function actionsBlock(): PlanSection[] {
  return [
    {
      part: 'What it means, and what happens next',
      heading: 'What this period is telling you',
      intro:
        'Three or four sentences, written by the person who produced it, before the meeting rather than during '
        + 'it. A pack circulated with no commentary gets interpreted in the room by whoever speaks first.',
      facts: [
        { label: 'The headline', long: true },
        { label: 'What moved, and why', long: true },
        { label: 'What we are doing about it', long: true },
      ],
    },
    {
      part: 'What it means, and what happens next',
      heading: 'Actions',
      intro:
        'Every reporting meeting ends with an action, an owner, a date and what it is expected to be worth. '
        + 'An action with no number against it never gets prioritised against one that has.',
      table: {
        columns: ['Action', 'Owner', 'By when', 'Expected impact', 'Closed'],
        rows: Array.from({ length: 6 }, () => ['', '', '', '', '']),
        fillable: true,
      },
    },
    {
      part: 'What it means, and what happens next',
      heading: 'Prepared and reviewed',
      facts: [
        { label: 'Period covered' },
        { label: 'Prepared by' },
        { label: 'Date prepared' },
        { label: 'Reviewed by' },
        { label: 'Date reviewed' },
      ],
    },
  ]
}
