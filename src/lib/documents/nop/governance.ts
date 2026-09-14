import type { PlanSection } from '../plan-types'

// Part A. Who is accountable, who is competent, and how the operation is run.
//
// Every part after this one describes a facility. This one describes the
// organisation around them, and it is the part an assessor reads first: a spa
// with immaculate pool procedures and nobody named as accountable for them is
// a spa that will be found out by the first serious question.

const PART = 'A. Governance and accountability'

export const GOVERNANCE_SECTIONS: PlanSection[] = [
  {
    part: PART,
    heading: 'The operation this document covers',
    intro:
      'Complete this before anything else. Every later section assumes somebody has stated what the spa actually '
      + 'consists of, and a facility missing from here is a facility with no procedure behind it.',
    mustBeChecked: true,
    facts: [
      { label: 'Trading name of the spa, and the legal entity operating it', long: true },
      { label: 'Full address, and the address given to emergency services', long: true },
      { label: 'Opening hours, by day', long: true },
      { label: 'Who may use the spa', long: true, hint: 'Hotel guests, members, day guests, residents, staff, and any difference in what each may use.' },
      { label: 'Maximum occupancy of the spa as a whole', hint: 'Separate from the bather load of any individual pool. Usually set by fire, not by water.' },
      { label: 'Minimum age for entry, and for each facility where it differs', long: true },
      { label: 'Any facility operated by a third party rather than the spa', long: true, hint: 'A gym franchise, a hairdresser, a clinic. State who is responsible for what.' },
    ],
  },
  {
    part: PART,
    heading: 'Every facility, listed',
    intro:
      'One row for every distinct space a guest or a member of staff uses. If it is not on this list it has no '
      + 'procedure, no risk assessment, no cleaning schedule and nobody checking it.',
    mustBeChecked: true,
    table: {
      columns: ['Facility', 'Location', 'Capacity', 'Operating hours', 'Responsible role'],
      rows: Array.from({ length: 22 }, () => ['', '', '', '', '']),
      fillable: true,
    },
  },
  {
    part: PART,
    heading: 'Who is accountable',
    intro:
      'Roles, not names, in the first column. Names change and the document should not need reissuing when '
      + 'somebody leaves, but the name column has to be filled in or the role is accountable to nobody.',
    table: {
      columns: ['Responsibility', 'Role accountable', 'Name', 'Deputy'],
      rows: [
        ['Overall responsibility for health and safety in the spa', '', '', ''],
        ['Day to day operation of the spa', '', '', ''],
        ['Pool safety and the pool safety operating procedure', '', '', ''],
        ['Water quality and testing', '', '', ''],
        ['Pool plant and dosing', '', '', ''],
        ['Water safety and legionella control', '', '', ''],
        ['Chemical storage and COSHH', '', '', ''],
        ['Fire safety in the spa', '', '', ''],
        ['First aid provision', '', '', ''],
        ['Training and competence records', '', '', ''],
        ['Risk assessments and their review', '', '', ''],
        ['Incident reporting and investigation', '', '', ''],
        ['Cleaning and hygiene standards', '', '', ''],
        ['Equipment maintenance and inspection', '', '', ''],
        ['Contractor control and induction', '', '', ''],
        ['Guest health screening and contraindications', '', '', ''],
        ['Data protection and guest records', '', '', ''],
        ['Accessibility and reasonable adjustments', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Competence: who may do what',
    intro:
      'A qualification held is not the same as a competence current. State what is required, who holds it, and '
      + 'when it expires, and check the expiry rather than assume it.',
    table: {
      columns: ['Task', 'Qualification or training required', 'Who holds it', 'Expires', 'Verified by'],
      rows: [
        ['Supervise the pool', '', '', '', ''],
        ['Perform a pool rescue', '', '', '', ''],
        ['Test pool water', '', '', '', ''],
        ['Dose chemicals or operate the plant', '', '', '', ''],
        ['Accept a chemical delivery', '', '', '', ''],
        ['Act as first aider', '', '', '', ''],
        ['Use the defibrillator', '', '', '', ''],
        ['Deliver each treatment on the menu', '', '', '', ''],
        ['Deliver treatments requiring additional insurance', '', '', '', ''],
        ['Induct a guest onto gym equipment', '', '', '', ''],
        ['Instruct a class', '', '', '', ''],
        ['Act as duty manager', '', '', '', ''],
        ['Lead an evacuation', '', '', '', ''],
        ['Carry out a risk assessment', '', '', '', ''],
        ['Work alone in the spa', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Staffing levels',
    intro:
      'The minimum the spa operates with, not the number usually on the rota. A minimum that has never been '
      + 'tested against a Saturday is a number somebody will go below on the first difficult week.',
    facts: [
      { label: 'Minimum staff on duty for the spa to open', long: true },
      { label: 'Minimum for each facility to be open', long: true, hint: 'The pool and the gym may have different answers, and the answer may change with occupancy.' },
      { label: 'What closes first when the minimum cannot be met', long: true, hint: 'Decided in advance and written down, because it will otherwise be decided at seven in the morning by whoever is there.' },
      { label: 'Who has authority to close a facility' },
      { label: 'Arrangements for breaks, so a facility is never left uncovered' },
      { label: 'Lone working: what may and may not be done alone', long: true },
      { label: 'How cover is arranged at short notice' },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Handover between shifts',
    intro: 'The half hour where things get lost.',
    actions: [
      { name: 'Read the log', action: 'The incoming shift reads the day log before taking over, including anything left open from the previous shift.', by: '' },
      { name: 'Walk the facilities', action: 'Walk the wet areas, gym and treatment corridor together, so the outgoing shift can point at anything that needs watching.', by: '' },
      { name: 'Check what is out of use', action: 'Confirm what is closed, why, who is dealing with it and when it is expected back.', by: '' },
      { name: 'Confirm cover', action: 'Confirm who holds each qualification on the incoming shift, and that the facilities open match the cover available.', by: '' },
      { name: 'Count the equipment', action: 'Confirm rescue equipment, first aid kit and defibrillator are present and serviceable.', by: '' },
      { name: 'Sign it', action: 'Both parties sign the handover. An unsigned handover is a shift nobody accepted responsibility for.', by: '' },
    ],
  },
  {
    part: PART,
    heading: 'Contractors and visitors',
    facts: [
      { label: 'Who may authorise a contractor on site' },
      { label: 'What is checked before a contractor starts', long: true, hint: 'Competence, insurance, method statement, risk assessment, and their own permit requirements.' },
      { label: 'Induction given to every contractor, and where it is recorded', long: true },
      { label: 'Work that may not happen while guests are present', long: true },
      { label: 'Permit to work arrangements, and for what kinds of work', long: true, hint: 'Hot work, confined space, work at height, isolation of plant.' },
      { label: 'How contractors are signed in and out, and who checks they have gone' },
      { label: 'Who checks the work before the area reopens' },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Accessibility and reasonable adjustments',
    intro:
      'A spa that cannot say how a wheelchair user reaches the pool has not thought about it, and thinking about '
      + 'it at the moment somebody arrives is too late for them and for the team.',
    facts: [
      { label: 'Step-free access to each facility, and where there is none', long: true },
      { label: 'Pool access for guests with limited mobility', long: true, hint: 'Hoist, steps with handrails, ramp, or none. State which and whether it needs booking.' },
      { label: 'Accessible changing and toilet facilities, and where they are' },
      { label: 'How a guest tells you what they need before they arrive' },
      { label: 'Adjustments the spa can make, and who decides' },
      { label: 'Evacuation arrangements for guests who cannot use the normal route', long: true },
      { label: 'Assistance dogs: where they may go and where they may not', long: true },
      { label: 'How the team is trained on this', long: true },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Guest health screening',
    intro:
      'The spa asks, the guest answers, and somebody acts on the answer. The third step is the one that gets '
      + 'skipped, and it is the only one that protects anybody.',
    facts: [
      { label: 'What every guest is asked before using the spa', long: true },
      { label: 'What every guest is asked before a treatment', long: true },
      { label: 'Where the answers are recorded, and for how long they are kept' },
      { label: 'Conditions that require advice before use of any facility', long: true, hint: 'Cardiac conditions, pregnancy, epilepsy, recent surgery, high or low blood pressure, diabetes.' },
      { label: 'Who decides when a guest should not use a facility, and how that conversation is handled', long: true },
      { label: 'How a refusal is recorded' },
      { label: 'How medical information is protected', long: true, hint: 'It is special category data and a paper form on a reception desk is a breach waiting to be reported.' },
    ],
    mustBeChecked: true,
  },
]
