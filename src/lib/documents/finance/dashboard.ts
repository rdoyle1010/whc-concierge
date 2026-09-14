import type { PlanSection } from '../plan-types'
import { definitions, purpose, actionsBlock, type Metric } from './shape'

// One page, fifteen numbers, and a way into the rest.
//
// Eighteen reports is the right amount of reporting and the wrong amount of
// reading. A director who has to open eighteen documents to know how the
// month went will open three, and they will be the three that are easiest to
// interpret rather than the three that matter.
//
// So the pack has a front page. Fifteen headline measures, each with the
// report it drills into, and nothing on it that does not either describe the
// result or predict the next one.

const HEADLINE: Metric[] = [
  { name: 'Total revenue', how: 'All revenue lines, net. Drills into the daily trading report.' },
  { name: 'Variance to budget', how: 'Money and percentage. Read second, never first: it measures the forecast as much as the month.' },
  { name: 'RevPATH', how: 'Revenue per available treatment hour. The performance figure. Drills into the revenue and capacity report.' },
  { name: 'Treatment room utilisation', how: 'Hours sold over hours available. Drills into capacity.' },
  { name: 'Therapist utilisation', how: 'Hours sold over hours rostered. Drills into therapist productivity.' },
  { name: 'Average treatment value', how: 'Treatment revenue over treatments delivered. Drills into treatment performance.' },
  { name: 'Retail capture rate', how: 'Buying guests over treated guests. Drills into retail.' },
  { name: 'Retail spend per guest', how: 'Retail revenue over all treated guests. Drills into retail.' },
  { name: 'Rebooking rate', how: 'Guests leaving with a future booking. Drills into the guest report.' },
  { name: 'Membership recurring revenue', how: 'Live monthly contract value. Drills into the membership dashboard.' },
  { name: 'Membership churn', how: 'Cancellations over opening members. Drills into membership.' },
  { name: 'Payroll percentage', how: 'Total payroll over total revenue. Drills into payroll and labour productivity.' },
  { name: 'Guest repeat rate', how: 'Returning guests over total guests. Drills into the guest report.' },
  { name: 'Forward occupancy, 30 days', how: 'Booked hours over available hours for the month ahead. The only forward-looking figure here. Drills into pace.' },
  { name: 'Gross operating profit', how: 'Revenue less all departmental cost. Drills into the profit and loss.' },
]

export const DIRECTOR_DASHBOARD: PlanSection[] = [
  ...purpose(
    'one page that says how the month went and where to look next.',
    'Monthly, on the same date each month.',
    'The spa director or spa manager.',
    [
      'Fifteen numbers, each with a report behind it. If a measure cannot be traced to a report in this pack, it does not belong on the page.',
      'Read RevPATH before revenue. Revenue tells you what happened; revenue against the capacity you paid for tells you how well you did it.',
      'Forward occupancy is the only line here you can still change. Everything else is history by the time this is printed.',
      'Three colours, and use them honestly. A measure coloured amber for four months running is not amber, it is the new normal and needs a decision.',
      'If this dashboard takes more than five minutes to read, it has too much on it. Take something off rather than add a second page.',
    ],
  ),
  {
    part: 'The figures',
    heading: 'The fifteen',
    intro:
      'One line each, with the trend arrow and a status. Fill in the status honestly: a page of green with a '
      + 'profit and loss that says otherwise is a page nobody will trust again.',
    table: {
      columns: ['Measure', 'This month', 'Last month', 'Last year', 'Budget', 'Status'],
      rows: HEADLINE.map(metric => [metric.name, '', '', '', '', '']),
      fillable: true,
    },
  },
  {
    part: 'The figures',
    heading: 'The three things that matter this month',
    intro:
      'Written before the meeting, by the person who produced the pack. A dashboard circulated without this '
      + 'gets interpreted in the room by whoever speaks first and most confidently.',
    facts: [
      { label: 'What went well, and why', long: true },
      { label: 'What did not, and why', long: true },
      { label: 'What we are changing, and what it is worth', long: true },
    ],
  },
  definitions(HEADLINE),
  ...actionsBlock(),
]

export const ACTION_TRACKER: PlanSection[] = [
  ...purpose(
    'that every decision taken in a reporting meeting actually happens.',
    'Maintained continuously, reviewed at every reporting meeting.',
    'The spa manager.',
    [
      'Not a financial report, and the one that decides whether any of the others were worth producing.',
      'Every action needs four things: what, who, when, and what it is expected to be worth. An action with no expected impact never gets prioritised against one that has.',
      'One owner per action. Two owners is nobody.',
      'Carry-overs are the finding. An action carried three times is either not important or not possible, and either answer means take it off the list.',
      'Close actions with evidence rather than with an assertion. "Done" is not a status anybody can check six months later.',
    ],
  ),
  {
    part: 'The figures',
    heading: 'Open actions',
    intro: 'Everything currently owed, oldest first, so age is visible without anybody having to sort it.',
    table: {
      columns: ['Action', 'Owner', 'Raised', 'Due', 'Expected impact', 'Status'],
      rows: Array.from({ length: 16 }, () => ['', '', '', '', '', '']),
      fillable: true,
    },
  },
  {
    part: 'The figures',
    heading: 'Closed this period',
    intro:
      'With the evidence, not with a tick. Closing an action is a statement that something changed, and the '
      + 'evidence column is what makes that statement worth anything in six months.',
    table: {
      columns: ['Action', 'Owner', 'Closed on', 'Evidence', 'Impact seen'],
      rows: Array.from({ length: 8 }, () => ['', '', '', '', '']),
      fillable: true,
    },
  },
  {
    part: 'The figures',
    heading: 'Carried over, and why',
    intro:
      'An action carried a third time is either not important or not possible. Both answers end the same way: '
      + 'take it off the list and say so, rather than moving it down the page for another quarter.',
    table: {
      columns: ['Action', 'Owner', 'Times carried', 'Why', 'Keep or drop'],
      rows: Array.from({ length: 6 }, () => ['', '', '', '', '']),
      fillable: true,
    },
  },
  ...actionsBlock(),
]
