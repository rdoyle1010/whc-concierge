import type { PlanSection } from '../plan-types'
import { checkBlock, weeklyBlock, exceptionsBlock, howToUse } from './shape'

// The manager's two checklists.
//
// The daily one is a walk, not a desk exercise. Its whole value is that
// somebody senior physically looks at the things the shift checklists claim
// are true, because a checklist system with no verification degrades into a
// signing exercise within about six weeks.
//
// The weekly one is the compliance spine: maintenance, health and safety,
// training and certification. These are the things that fail slowly and
// invisibly, and that an assessor asks for first because they are the honest
// test of whether a spa is run or merely open.

const CHECKS = 'The checks'
const END = 'Recording and sign-off'

export const MANAGER_DAILY: PlanSection[] = [
  ...howToUse(
    'Once a day, on shift, walking the building.',
    'The duty manager.',
    'You are the escalation. Decide, record the decision, and tell whoever needs to know.',
  ),
  checkBlock(CHECKS, 'Before the day starts',
    'the daily leadership briefing, the duty manager rounds procedure and the daily risk review', [
    { check: 'Opening checklists for reception, therapists and cleaning are completed and signed, not blank' },
    { check: 'Every [STOP] check on those sheets passed, or the area is closed and you know why' },
    { check: 'Briefing held: today’s numbers, VIPs, groups, closures, staffing and anything carried from yesterday' },
    { check: 'Staffing against today’s bookings is workable, and gaps are covered rather than hoped about' },
    { check: 'Yesterday’s exceptions were closed, or have an owner and a date' },
  ]),
  checkBlock(CHECKS, 'The walk',
    'the duty manager rounds procedure, the daily risk review and the standards audit', [
    { check: 'You walked the wet areas, changing rooms, treatment corridor, gym and relaxation area yourself' },
    { check: 'Water quality has been tested and recorded today, by somebody competent to do it', stop: true },
    { check: 'Plant room checked, and readings are within range and written down', stop: true },
    { check: 'Chemical store is locked, stock is correct, and nothing is decanted or unlabelled', stop: true },
    { check: 'Escape routes clear, fire doors closed, alarm panel showing no fault', stop: true },
    { check: 'First aid provision and the trained first aider on shift are both actually present', stop: true },
    { check: 'You picked two checks at random from a shift sheet and confirmed them yourself' },
  ]),
  checkBlock(CHECKS, 'The commercial day',
    'the daily flash report, the discount approval procedure and the guest feedback review', [
    { check: 'Today’s forecast against capacity is known, and unsold time has been acted on rather than noted' },
    { check: 'Discounts, upgrades and complimentary treatments given today are approved and recorded' },
    { check: 'Guest feedback and complaints since yesterday have been read and answered or assigned' },
    { check: 'Rebooking and retail performance today is known by the team, not only by you' },
  ]),
  checkBlock(CHECKS, 'Before you hand over',
    'the handover procedure, the escalation protocol and the incident reporting procedure', [
    { check: 'Every incident, accident or near miss today is written up, not only discussed' },
    { check: 'Anything reported as faulty has an owner and a date, or has been fixed' },
    { check: 'Closing checklists are with the closing team and the closing manager knows what is outstanding' },
    { check: 'Handover written and given to a person, not left on a desk' },
  ]),
  ...exceptionsBlock(END),
]

export const MANAGER_WEEKLY: PlanSection[] = [
  ...howToUse(
    'Once a week, on a fixed day. Four weeks fit on one sheet.',
    'The spa manager or the nominated deputy.',
    'Anything that cannot be resolved this week goes on the action tracker with an owner and a date.',
  ),
  {
    part: 'How to use this checklist',
    heading: 'Why this one is different',
    paragraphs: [
      'The daily checklists catch what fails suddenly. This one catches what fails slowly, which is almost '
      + 'everything that ends in an enforcement notice: a certificate that expired in March, a test that has '
      + 'not been recorded since the person who used to do it left, a piece of equipment that has been on the '
      + 'list for eleven weeks.',
      'Four weeks fit on one sheet deliberately. A single blank column is invisible. A blank column with three '
      + 'filled ones beside it is a conversation.',
    ],
  },
  weeklyBlock(CHECKS, 'Maintenance and the building',
    'the planned preventive maintenance schedule, the contractor permit procedure and the asset register', [
    { check: 'Planned maintenance due this week is done, and signed off by whoever did it' },
    { check: 'Outstanding faults reviewed: each has an owner, a date, and none is older than the agreed limit' },
    { check: 'Contractors on site this week held a permit and signed in and out' },
    { check: 'Water temperature and anti-scald controls checked and recorded' },
    { check: 'Plant room readings reviewed for drift, not only for today’s value' },
    { check: 'Equipment taken out of use is still out of use, tagged, and being dealt with' },
    { check: 'Asset register updated for anything added, moved or disposed of' },
  ]),
  weeklyBlock(CHECKS, 'Health, safety and compliance',
    'the accident and incident reporting procedure, the risk assessment suite and the fire safety assessment', [
    { check: 'Accidents, incidents and near misses this week reviewed for pattern, not only recorded' },
    { check: 'Anything reportable has been reported, within the time the regulations allow' },
    { check: 'Fire alarm test carried out and recorded, and the result is in the log' },
    { check: 'Emergency lighting, call points and evacuation equipment checked to the schedule' },
    { check: 'Water testing records reviewed for the week, including any out-of-range result and what was done' },
    { check: 'Chemical stock, delivery and storage checked against the COSHH assessment' },
    { check: 'First aid supplies checked and restocked, and the in-date trained first aider cover for next week is known' },
    { check: 'Risk assessments due for review this month have been identified, and any change in the operation is reflected' },
  ]),
  weeklyBlock(CHECKS, 'Training and certification',
    'the training records procedure, the competency sign-off procedure and the therapist certification requirements', [
    { check: 'Certification expiring in the next ninety days is identified and booked, not merely noticed' },
    { check: 'Every therapist on the rota next week holds a current certificate for everything they are booked to do', stop: true },
    { check: 'Pool and plant qualifications held by somebody actually working next week, not by somebody on leave', stop: true },
    { check: 'First aid and defibrillator training current, with cover on every shift pattern' },
    { check: 'New starters this week have completed induction, and it is recorded rather than remembered' },
    { check: 'Refresher training due this month is booked' },
    { check: 'Any training gap that cannot be closed has been escalated with what it stops the team doing' },
  ]),
  weeklyBlock(CHECKS, 'Standards and the guest',
    'the weekly operations review, the standards audit and the complaints procedure', [
    { check: 'Shift checklists for the week reviewed: completed, signed, and exceptions actually closed' },
    { check: 'Two checks verified at random against the building, by you' },
    { check: 'Complaints this week reviewed by type and root cause, not only by resolution' },
    { check: 'Guest feedback scores and comments read, and anything repeated is on the action tracker' },
    { check: 'Cleanliness or standards audit carried out to the stated frequency' },
    { check: 'Actions from last week’s review closed, or carried with a reason' },
  ]),
  {
    part: END,
    heading: 'Actions carried forward',
    intro:
      'Every reporting meeting should end with an action, an owner, a date and what it is worth. A review that '
      + 'ends with a list of observations is a review nobody needs to attend.',
    table: {
      columns: ['Action', 'Owner', 'By when', 'What it is worth', 'Closed'],
      rows: Array.from({ length: 8 }, () => ['', '', '', '', '']),
      fillable: true,
    },
  },
  ...exceptionsBlock(END),
]
