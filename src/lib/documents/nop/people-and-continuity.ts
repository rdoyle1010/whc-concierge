import type { PlanSection } from '../plan-types'

// Parts J, K and L.
//
// Children, security, data, incidents and the days the spa cannot open. Every
// one of these is written down somewhere in a hotel and almost never in the
// spa, which is where the difference actually bites: a lost child in a pool
// hall is not the same problem as a lost child in a lobby.

const PEOPLE = 'J. Children, groups and guest conduct'
const SECURITY = 'K. Security, keys and information'
const CONTINUITY = 'L. Incidents, complaints and continuity'

export const PEOPLE_SECTIONS: PlanSection[] = [
  {
    part: PEOPLE,
    heading: 'Children and young people',
    intro:
      'The area most spas are least clear on, and the one where being unclear is most obvious to a parent at the '
      + 'desk. Every age and ratio below must be a decision, not a guess made per booking.',
    mustBeChecked: true,
    table: {
      columns: ['Facility', 'Minimum age', 'Accompanied ratio', 'Restricted hours', 'Not permitted at all'],
      rows: [
        ['Swimming pool', '', '', '', ''],
        ['Cold plunge and ice', '', '', '', ''],
        ['Hydrotherapy pool', '', '', '', ''],
        ['Sauna', '', '', '', ''],
        ['Steam room', '', '', '', ''],
        ['Experience showers', '', '', '', ''],
        ['Relaxation areas', '', '', '', ''],
        ['Gym', '', '', '', ''],
        ['Studio classes', '', '', '', ''],
        ['Treatments', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    facts: [
      { label: 'How age is established at the desk, and whether it is ever checked' },
      { label: 'How the ratio is enforced once a family is in the water', long: true, hint: 'An adult in the changing room while a child is in the pool is a ratio nobody is meeting.' },
      { label: 'Family or adult-only sessions, and how they are separated' },
      { label: 'What happens when a child is found using a facility they may not use', long: true },
      { label: 'Safeguarding lead, and how they are reached out of hours' },
      { label: 'What a member of staff does if they are concerned about a child', long: true },
      { label: 'Whether any member of staff requires a criminal record check, and who holds the record' },
      { label: 'Lost child procedure, and how it differs from a missing adult', long: true },
    ],
  },
  {
    part: PEOPLE,
    heading: 'Groups, events and exclusive hire',
    facts: [
      { label: 'Whether the spa is hired exclusively, and to whom' },
      { label: 'Maximum group size, and whether it changes the supervision required', long: true },
      { label: 'What a group organiser is told in writing before the booking is confirmed', long: true },
      { label: 'Who supervises during a group booking, and whether that is the spa or the organiser' },
      { label: 'Alcohol at group bookings, and the policy on it', long: true, hint: 'Hen parties and wet areas is the combination that produces the incident, and it is entirely foreseeable.' },
      { label: 'Additional staffing for a group booking, and who decides' },
      { label: 'What the spa will refuse, and who has authority to refuse it' },
      { label: 'Insurance position for an external organiser using the facilities' },
    ],
    mustBeChecked: true,
  },
  {
    part: PEOPLE,
    heading: 'Guest conduct and refusal of service',
    facts: [
      { label: 'Conditions of use, and where a guest can read them before arriving' },
      { label: 'Behaviour that results in being asked to leave', long: true },
      { label: 'Who has authority to refuse entry or ask somebody to leave' },
      { label: 'How that conversation is conducted, and never alone', long: true },
      { label: 'Intoxication: how it is identified and what follows', long: true },
      { label: 'Photography and phone policy, and how it is enforced in changing areas', long: true },
      { label: 'What happens to the booking and the payment when somebody is asked to leave' },
      { label: 'How an incident of this kind is recorded, and who reviews them' },
      { label: 'Support given to a member of staff after a difficult encounter', long: true },
    ],
    mustBeChecked: true,
  },
]

export const SECURITY_SECTIONS: PlanSection[] = [
  {
    part: SECURITY,
    heading: 'Keys, access and security',
    table: {
      columns: ['Area or asset', 'Access controlled how', 'Who holds access', 'Issued by', 'Reviewed'],
      rows: [
        ['Spa main entrance', '', '', '', ''],
        ['Plant room', '', '', '', ''],
        ['Chemical store', '', '', '', ''],
        ['Treatment rooms', '', '', '', ''],
        ['Retail stock', '', '', '', ''],
        ['Locker master override', '', '', '', ''],
        ['Office and records', '', '', '', ''],
        ['Till and cash', '', '', '', ''],
        ['Booking system administration', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    facts: [
      { label: 'What happens when a key or access card is lost', long: true },
      { label: 'How access is removed when somebody leaves', hint: 'The commonest security failure in any operation, and it is a list nobody owns.' },
      { label: 'Who reviews the access list, and how often' },
      { label: 'Out of hours security arrangement' },
      { label: 'Alarm system, who is keyholder and who responds' },
    ],
    mustBeChecked: true,
  },
  {
    part: SECURITY,
    heading: 'Surveillance and privacy',
    intro:
      'A spa has cameras and changing rooms in the same building, which makes this a section that has to be right '
      + 'rather than assumed.',
    facts: [
      { label: 'Whether CCTV operates in the spa, and precisely where', long: true },
      { label: 'Areas where there is no surveillance, stated explicitly', long: true, hint: 'Changing rooms, cubicles, toilets and treatment rooms. Saying where there is none is as important as saying where there is.' },
      { label: 'Who can view the footage, and how a request to view it is handled' },
      { label: 'How long footage is retained' },
      { label: 'How guests are told cameras operate' },
      { label: 'Staff photography and social media policy for spa areas', long: true },
      { label: 'What happens if a guest is found photographing in a changing area', long: true },
    ],
    mustBeChecked: true,
  },
  {
    part: SECURITY,
    heading: 'Guest information and data',
    facts: [
      { label: 'What guest information the spa holds, and where' },
      { label: 'Health information held, and how it is separated and protected', long: true, hint: 'Health data is special category. A consultation form on a reception desk is a breach waiting to be reported.' },
      { label: 'Who may see a consultation record, and on what basis' },
      { label: 'How long each kind of record is kept, and how it is destroyed' },
      { label: 'How a guest asks for their record, and who handles the request' },
      { label: 'What happens if records are lost, taken or sent to the wrong person', long: true },
      { label: 'Who the property reports a data breach to, and within what time' },
      { label: 'Training given on this, and to whom' },
    ],
    mustBeChecked: true,
  },
]

export const CONTINUITY_SECTIONS: PlanSection[] = [
  {
    part: CONTINUITY,
    heading: 'Incidents, accidents and near misses',
    intro:
      'The near miss is the one that gets skipped, and it is the only free information an operation ever gets: '
      + 'the same event, without the injury.',
    actions: [
      { name: 'Deal with it first', action: 'Treat the casualty, make the area safe, and only then start writing.', by: '' },
      { name: 'Record it the same day', action: 'Complete the record before the end of the shift, while the times and the sequence are accurate.', by: '' },
      { name: 'Take witness accounts', action: 'Ask anybody who saw it to write down what they saw in their own words, on the day.', by: '' },
      { name: 'Preserve what matters', action: 'Keep readings, equipment and any footage before it is overwritten, and photograph the scene.', by: '' },
      { name: 'Decide on reporting', action: 'Establish whether it is reportable to the enforcing authority and to the insurer. Where there is doubt, ask rather than assume it is not.', by: '' },
      { name: 'Investigate the cause', action: 'Ask why it was possible, not who did it. Human error alone is never the root cause.', by: '' },
      { name: 'Act and close it', action: 'Agree a corrective action with a named owner and a date, verify it worked, and only then close it.', by: '' },
    ],
    mustBeChecked: true,
  },
  {
    part: CONTINUITY,
    heading: 'Reporting to the authorities',
    facts: [
      { label: 'Who decides whether an incident is reportable' },
      { label: 'Where the current reporting criteria are held, and who checks them', long: true, hint: 'The criteria change. A copy printed three years ago is a copy somebody will rely on.' },
      { label: 'Time limits the property works to' },
      { label: 'Who makes the report, and who is told that it has been made' },
      { label: 'The local authority or enforcing body for these premises' },
      { label: 'Who deals with an unannounced visit from an inspector, and what they are shown', long: true },
      { label: 'Insurer notification requirements and the time limit' },
    ],
    mustBeChecked: true,
  },
  {
    part: CONTINUITY,
    heading: 'Complaints',
    facts: [
      { label: 'How a guest makes a complaint, in person and afterwards' },
      { label: 'Who handles it, and within what time' },
      { label: 'Complaints that must be escalated immediately', long: true, hint: 'Anything alleging injury, illness, a reaction or the conduct of a therapist.' },
      { label: 'What is never said or offered without authority', long: true, hint: 'An admission or a payment made at the desk becomes the property’s position afterwards.' },
      { label: 'Where complaints are recorded and who reviews the pattern' },
      { label: 'How a complaint that is also an incident is handled as both' },
    ],
  },
  {
    part: CONTINUITY,
    heading: 'Closure and reopening',
    intro:
      'Planned or unplanned, closing a spa is easy and reopening one is not. Water stands, systems stop, '
      + 'competence lapses and nobody is quite sure what state anything is in.',
    facts: [
      { label: 'What closes the spa entirely, and who decides', long: true },
      { label: 'How guests and bookings are handled on an unplanned closure' },
      { label: 'What is done to the water systems during a closure', long: true, hint: 'Stagnant warm water is the highest-risk condition there is, and reopening is when it reaches people.' },
      { label: 'Flushing and disinfection before reopening, and who signs it off', long: true },
      { label: 'Sampling required before reopening, and the result required' },
      { label: 'Equipment checks before reopening' },
      { label: 'Competence and training checks before reopening', hint: 'A team that has not practised a rescue for three months is not the team that closed.' },
      { label: 'Who authorises reopening, and what they sign' },
    ],
    mustBeChecked: true,
  },
  {
    part: CONTINUITY,
    heading: 'Insurance and certification',
    table: {
      columns: ['Cover or certificate', 'Provider', 'Reference', 'Expires', 'Held by'],
      rows: [
        ['Employers liability insurance', '', '', '', ''],
        ['Public liability insurance', '', '', '', ''],
        ['Treatment liability insurance', '', '', '', ''],
        ['Professional indemnity', '', '', '', ''],
        ['Fire risk assessment', '', '', '', ''],
        ['Water safety risk assessment', '', '', '', ''],
        ['Electrical installation certificate', '', '', '', ''],
        ['Gas safety certificate', '', '', '', ''],
        ['Lifting equipment inspection', '', '', '', ''],
        ['Premises licence', '', '', '', ''],
        ['Music licence', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    facts: [
      { label: 'Who checks these expiries, and how often' },
      { label: 'What happens when one lapses', long: true },
    ],
    mustBeChecked: true,
  },
]
