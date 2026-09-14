import type { PlanAction, PlanSection } from '../plan-types'

// Parts H, I, J and K. People, security, afterwards, and practice.
//
// The emergencies where the danger is a person rather than the building, the
// half of an incident that happens once everybody wants to go home, and the
// drills without which none of the preceding pages are anything but paper.

const PEOPLE = 'H. People and security'
const AFTER = 'I. After any emergency'
const DRILL = 'J. Drills, training and review'

const page = (part: string) => (heading: string, intro: string, actions: PlanAction[]): PlanSection => ({
  part, heading, intro, ownPage: true, actions,
})

const people = page(PEOPLE)

export const PEOPLE_EMERGENCY_SECTIONS: PlanSection[] = [
  {
    ...people(
      'Missing child',
      'Search the water first. Every second spent searching the car park is a second not spent on the thing that '
      + 'kills in under a minute.',
      [
        { name: 'Search the water first', action: 'Every pool, plunge, hydrotherapy pool and feature, including under any cover and anywhere not visible from the poolside. Before anything else.', by: '' },
        { name: 'Raise the alarm', action: 'Alert every member of the team at once, and appoint somebody to lead the search.', by: '' },
        { name: 'Clear and hold the water', action: 'Get bathers out and keep them out so the water can be searched properly and stays searchable.', by: '' },
        { name: 'Secure the exits', action: 'Cover the doors so the search area stops growing while you search it.', by: '' },
        { name: 'Search enclosed spaces', action: 'Saunas, steam rooms, cubicles, toilets, lockers, treatment rooms and anywhere a child could shut a door. Open each one.', by: '' },
        { name: 'Get a description', action: 'Name, age, what they are wearing, who they came with, when they were last seen and by whom.', by: '' },
        { name: 'Call 999', action: 'If not found quickly, call the police. Do not wait until you are certain before asking for help.', by: '' },
        { name: 'Record everything', action: 'Times, areas searched, by whom, and when. This will be gone over afterwards.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  people(
    'Missing adult',
    'A booking not returned to, a locker still in use at closing, or a companion who cannot find them.',
    [
      { name: 'Check the water', action: 'Check every body of water first, for the same reason as for a child.', by: '' },
      { name: 'Check the enclosed spaces', action: 'Saunas, steam rooms, cubicles, treatment rooms and relaxation areas. Open every door.', by: '' },
      { name: 'Check the record', action: 'Check the locker record, the booking and whether they signed out.', by: '' },
      { name: 'Consider they may be unwell', action: 'A missing adult in a spa is more often somebody who has fainted behind a door than somebody who has left.', by: '' },
      { name: 'Escalate', action: 'Involve the duty manager and, where the person is vulnerable or the search is not resolving, call the police.', by: '' },
      { name: 'Record it', action: 'Record the times, the areas checked and the outcome.', by: '' },
    ],
  ),
  people(
    'Violent or threatening person',
    'Nobody is expected to stand their ground.',
    [
      { name: 'Never approach alone', action: 'Get another member of the team and tell the duty manager before you speak to anybody.', by: '' },
      { name: 'Protect the other guests', action: 'Move other guests away from the area first. They are the priority, not resolving the behaviour.', by: '' },
      { name: 'Ask once, calmly', action: 'State what has to stop and what happens if it does not. Do not negotiate, argue or match the tone.', by: '' },
      { name: 'Withdraw', action: 'If it does not stop, or anybody feels unsafe, withdraw and escalate. Leaving is always permitted.', by: '' },
      { name: 'Call 999', action: 'For any threat of violence, any weapon, or anybody who will not leave.', by: '' },
      { name: 'Do not detain anybody', action: 'Do not block a door or attempt to hold somebody. Get a description and the direction they left in.', by: '' },
      { name: 'Record it the same day', action: 'What was said, by whom, and who saw it. And check on the member of staff involved.', by: '' },
    ],
  ),
  people(
    'Allegation against a member of staff',
    'Made by a guest, about conduct during a treatment or anywhere in the spa. Handled badly it damages both '
    + 'people involved.',
    [
      { name: 'Take it seriously and take it quietly', action: 'Move the guest somewhere private with a member of the management team. Do not discuss it at the desk.', by: '' },
      { name: 'Do not investigate on the spot', action: 'Listen and record what is said in their words. Do not ask leading questions and do not defend anybody.', by: '' },
      { name: 'Separate', action: 'The member of staff stops work immediately and is taken somewhere separate, without being accused of anything.', by: '' },
      { name: 'Preserve everything', action: 'Keep the booking record, the room allocation, the consultation form and any footage of the corridor.', by: '' },
      { name: 'Escalate immediately', action: 'Tell the property lead and the safeguarding lead the same day. Involve the police where a criminal allegation is made.', by: '' },
      { name: 'Support both people', action: 'Support the guest, and support the member of staff, who is not to be left alone or sent home without a conversation.', by: '' },
      { name: 'Say nothing else', action: 'One named person handles all communication. Nobody else discusses it with anybody.', by: '' },
    ],
  ),
  people(
    'Safeguarding concern',
    'About a child, or about an adult at risk. What is noticed in a changing room is noticed nowhere else.',
    [
      { name: 'Do not investigate', action: 'It is not your job to establish whether it is true. It is your job to pass it on.', by: '' },
      { name: 'Do not promise confidentiality', action: 'If somebody starts to tell you something, do not promise to keep it secret. Explain you will have to tell one person.', by: '' },
      { name: 'Record what was said', action: 'Write down what you saw or were told, in their words, as soon as possible, with the date and time.', by: '' },
      { name: 'Tell the safeguarding lead', action: 'Same day, whatever the hour, using the escalation contact on the first page of this plan.', by: '' },
      { name: 'Call 999 if immediate', action: 'Where somebody is in immediate danger, call the police first and the safeguarding lead second.', by: '' },
      { name: 'Tell nobody else', action: 'Not colleagues, not the person it concerns, not the family.', by: '' },
    ],
  ),
  people(
    'Suspicious package or security threat',
    'Rare, and handled by not touching anything.',
    [
      { name: 'Do not touch or move it', action: 'Do not open it, move it, or put anything on it.', by: '' },
      { name: 'Move people away', action: 'Clear the area and keep people away from it, using the far exit rather than walking past it.', by: '' },
      { name: 'Do not use radios or phones near it', action: 'Move away before you call.', by: '' },
      { name: 'Call 999', action: 'Describe what it is, where it is and why it was thought suspicious.', by: '' },
      { name: 'Follow the property plan', action: 'The property may have its own plan covering evacuation or staying put. Follow it rather than improvising.', by: '' },
      { name: 'Account for everybody', action: 'Where the spa is evacuated, sweep the wet areas and enclosed spaces as for a fire.', by: '' },
    ],
  ),
  people(
    'Theft or loss of property',
    'Common, minor, and handled badly it becomes a complaint about the whole visit.',
    [
      { name: 'Take it seriously', action: 'Take the guest somewhere private and listen properly. Do not start with the terms on the locker.', by: '' },
      { name: 'Search first', action: 'Check the locker, the changing room, lost property and wherever they have been.', by: '' },
      { name: 'Preserve what you can', action: 'Where theft is likely, retain footage of the entrance and corridors before it is overwritten.', by: '' },
      { name: 'Report it', action: 'Advise the guest to report it to the police and give them a reference from your own record.', by: '' },
      { name: 'Record it', action: 'Record what was lost, when it was last seen, and what was done.', by: '' },
      { name: 'Look for a pattern', action: 'Two in a month is not bad luck. Escalate it.', by: '' },
    ],
  ),
]

export const AFTER_SECTIONS: PlanSection[] = [
  {
    part: AFTER,
    heading: 'The half that gets skipped',
    intro: 'Everybody wants to go home. This is where the property either protects itself or does not.',
    actions: [
      { name: 'Record it properly', action: 'Complete the incident record before the end of the shift, while the times and the sequence are still accurate.', by: '' },
      { name: 'Take witness accounts', action: 'Anybody who saw it writes down what they saw, in their own words, on the day, and signs it.', by: '' },
      { name: 'Preserve the scene', action: 'Leave equipment, readings and the area as they are until they have been recorded and photographed.', by: '' },
      { name: 'Secure the footage', action: 'Export and keep any relevant footage before it is overwritten. Systems overwrite in days, not weeks.', by: '' },
      { name: 'Keep the physical evidence', action: 'The product, the container, the equipment, the water sample. Bag it and label it.', by: '' },
      { name: 'Report externally', action: 'Report to the enforcing authority where it applies, and notify the insurer within their time limit.', by: '' },
      { name: 'Tell the property', action: 'Tell the property lead the same day, however it ended.', by: '' },
      { name: 'Look after the team', action: 'Anybody involved in a serious incident is sent home with somebody, not left to close up, and is followed up the next day.', by: '' },
      { name: 'Debrief within a week', action: 'What happened, what worked, what did not, and what changes as a result.', by: '' },
      { name: 'Change the plan', action: 'Where the debrief finds a gap, change this document, re-brief the team, and record that you did.', by: '' },
    ],
    mustBeChecked: true,
  },
  {
    part: AFTER,
    heading: 'Talking to people afterwards',
    intro:
      'What is said in the first hour becomes the property position, whoever said it and whatever they meant.',
    facts: [
      { label: 'Who speaks to the casualty and their family' },
      { label: 'Who speaks to other guests who witnessed it' },
      { label: 'Who speaks to the team' },
      { label: 'Who speaks to anybody outside the property, including a journalist', hint: 'One named person, and everybody else says they cannot help and passes it on.' },
      { label: 'What is never said or offered on the spot', long: true, hint: 'An admission or a payment made at the desk becomes the property’s position afterwards.' },
      { label: 'Social media policy after an incident', long: true },
      { label: 'Who notifies the insurer, and within what time' },
    ],
    mustBeChecked: true,
  },
  {
    part: AFTER,
    heading: 'When to close, and who decides',
    table: {
      columns: ['Situation', 'Closes', 'Decided by', 'Reopened by', 'What must be true first'],
      rows: [
        ['Casualty in the water', '', '', '', ''],
        ['Chemical release', '', '', '', ''],
        ['Diarrhoeal contamination', '', '', '', ''],
        ['Loss of water clarity', '', '', '', ''],
        ['Water reading out of range', '', '', '', ''],
        ['Circulation or filtration failure', '', '', '', ''],
        ['Power or lighting failure', '', '', '', ''],
        ['Ventilation failure', '', '', '', ''],
        ['Glass in the water', '', '', '', ''],
        ['Below minimum staffing', '', '', '', ''],
        ['No qualified supervisor on duty', '', '', '', ''],
        ['Suspected outbreak of illness', '', '', '', ''],
        ['Structural or ceiling failure', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
]

export const DRILL_SECTIONS: PlanSection[] = [
  {
    part: DRILL,
    heading: 'Drills',
    intro:
      'Everything before this page is paper until somebody has done it in the building, at speed, with the '
      + 'equipment that is actually there.',
    facts: [
      { label: 'Drill frequency, by scenario', hint: 'A rescue drill is not a fire drill. Both are needed and they are not interchangeable.' },
      { label: 'Scenarios drilled, and how they are rotated', long: true },
      { label: 'Who must attend, and what happens if they cannot' },
      { label: 'Who runs a drill and who records it' },
      { label: 'Whether drills happen in trading hours', long: true, hint: 'A drill only ever run at seven in the morning is a drill for a spa nobody is in.' },
      { label: 'How the equipment is checked during a drill' },
      { label: 'How long each drill should take, and what is timed' },
      { label: 'What happens when a drill goes badly', long: true, hint: 'Repeating it is the point. A drill that is never failed is not testing anything.' },
      { label: 'Where drill records are kept' },
    ],
    mustBeChecked: true,
  },
  {
    part: DRILL,
    heading: 'Briefing and training on this plan',
    facts: [
      { label: 'How a new starter is briefed before working in the spa', long: true },
      { label: 'What a new starter must know before their first shift alone', long: true },
      { label: 'How agency, contract and seasonal staff are briefed' },
      { label: 'How external instructors and hirers are briefed', long: true },
      { label: 'How often the whole team is re-briefed' },
      { label: 'How the team is told when this plan changes, and how that is recorded', long: true },
      { label: 'Where the current version is displayed, and how an old one is withdrawn' },
      { label: 'Who checks that people actually know it, and how', long: true, hint: 'Asking somebody on a Tuesday where the assembly point is tells you more than any signature sheet.' },
    ],
    mustBeChecked: true,
  },
  {
    part: DRILL,
    heading: 'Review of this plan',
    facts: [
      { label: 'Review frequency', hint: 'Annually at a minimum, and immediately after any incident, any drill that went badly, and any change to the facilities or the team.' },
      { label: 'Who reviews it, and who approves the revision' },
      { label: 'What triggers a review before it is due', long: true },
      { label: 'How a change is tested before it is adopted', long: true },
    ],
  },
]

const sheet = (heading: string, intro: string, columns: string[], rows: number): PlanSection => ({
  part: 'K. Record sheets',
  heading,
  intro,
  ownPage: true,
  table: { columns, rows: Array.from({ length: rows }, () => columns.map(() => '')), fillable: true },
})

export const EAP_APPENDIX_SECTIONS: PlanSection[] = [
  sheet(
    'Incident record',
    'Completed on the day, before anybody goes home.',
    ['Date', 'Time', 'Location', 'Type', 'Who was involved', 'What happened', 'Action taken', 'Reported to', 'Recorded by'],
    16,
  ),
  sheet(
    'Witness statement',
    'In their own words, on the day, signed. One sheet per witness.',
    ['Name', 'Guest or staff', 'Contact', 'Where they were', 'What they saw', 'Time', 'Signature'],
    10,
  ),
  sheet(
    'Emergency timeline',
    'The times as they happen. Nobody remembers them accurately afterwards and they are the first thing asked for.',
    ['Time', 'What happened or was done', 'By whom', 'Noted by'],
    26,
  ),
  sheet(
    'Contamination and closure record',
    'Every closure, what caused it, what was done and the readings before reopening.',
    ['Date', 'Water body', 'Reason', 'Closed at', 'Action taken', 'Readings before reopening', 'Reopened at', 'Authorised by'],
    18,
  ),
  sheet(
    'Drill record',
    'What was practised, who attended, what went wrong and what changed as a result.',
    ['Date', 'Scenario', 'Attended by', 'Time taken', 'What did not work', 'Action agreed', 'Owner', 'Led by'],
    16,
  ),
  sheet(
    'Plan briefing record',
    'Every person who works in the spa signs to confirm they have read this plan and know what it asks of them.',
    ['Name', 'Role', 'Version read', 'Date', 'Briefed by', 'Signature'],
    22,
  ),
]
