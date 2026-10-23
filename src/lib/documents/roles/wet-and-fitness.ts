import type { RoleEntry } from './types'

// The wet area and the gym floor.
//
// These are the roles where a job description has a legal life. A lifeguard
// who is not current, a trainer working outside their qualification, an
// instructor teaching a class nobody screened for: each of those appears in
// an investigation as a question about what the person was told the job was.
// So the certification requirements are stated as essential rather than
// desirable, and the limits of the role are stated as duties.

export const WET_AND_FITNESS: RoleEntry[] = [
  {
    reference: 'POOL-LIFEGUARD-JD-741',
    title: 'Pool Attendant and Lifeguard',
    department: 'POOL TEAM',
    band: 'Wet area and fitness',
    purpose:
      'To keep everybody who enters the water safe, and to keep the wet area at a standard that makes that '
      + 'possible.',
    reportsTo: 'Spa Supervisor',
    responsibleFor: 'Nobody, and everybody in the water.',
    duties: [
      {
        area: 'Supervision',
        items: [
          'Maintain effective supervision of the pool and thermal areas for the whole of your poolside period.',
          'Follow the zone and scanning discipline the operating procedure sets, without drifting from it.',
          'Enforce the pool rules consistently, including with members and with children.',
          'Intervene early: a tired swimmer, a guest too long in the heat, a running child, glass near water.',
          'Respond to an incident under the emergency action plan, and hand over to the emergency services.',
        ],
      },
      {
        area: 'Water and plant',
        items: [
          'Take and record water tests at the stated frequency, at the time they were taken.',
          'Act on any out-of-range reading under the procedure, including closing the pool.',
          'Complete the opening and closing safety checks and record the result honestly.',
          'Check rescue equipment, alarms and first aid provision are present and serviceable.',
        ],
      },
      {
        area: 'The area',
        items: [
          'Keep poolside, changing and thermal areas clean, clear and free of slip hazards.',
          'Manage bather load against the stated maximum.',
          'Report any defect immediately and make the area safe in the meantime.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Never has a conversation that takes their eyes off the water.',
      'Records a reading at the moment it was taken, not at the end of the shift.',
      'Closes the pool when the procedure says to, and is supported for it.',
      'Speaks to a guest about a rule without making a scene of it.',
    ],
    measuredBy: [
      'Currency of lifeguard qualification and ongoing competency assessments',
      'Water test records: completed, on time, acted on',
      'Opening and closing check completion',
      'Incidents, near misses and how each was handled',
      'Audit findings on supervision practice',
    ],
    essential: [
      'Current National Pool Lifeguard Qualification, or the equivalent the property accepts',
      'Ability to meet the ongoing competency requirement at [the property frequency]',
      'Ability to pass the physical requirements of a rescue',
    ],
    desirable: [
      'Pool plant operator certification',
      'First aid at work certification beyond the lifeguard award',
    ],
    conditions: [
      'Rota including early mornings, evenings, weekends and public holidays.',
      'Poolside periods limited to [the maximum the operating procedure sets] before rotation.',
      'Hot, humid environment. Physically demanding and safety critical.',
    ],
  },

  {
    reference: 'GYM-PERSONALTRAINER-JD-742',
    title: 'Personal Trainer',
    department: 'GYM FLOOR TEAM - PERSONAL TRAINERS',
    band: 'Wet area and fitness',
    purpose:
      'To get results for the people who train with them, and to keep the floor safe for everybody who does '
      + 'not.',
    reportsTo: 'Fitness Manager',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Clients',
        items: [
          'Screen every client before training them, and act on what the screening finds.',
          'Build a programme against a stated goal and review it against progress rather than against effort.',
          'Deliver sessions to time, with technique corrected rather than counted.',
          'Refer anything outside your scope to a medical professional, and never diagnose.',
          'Keep client records: screening, consent, programme and progress.',
        ],
      },
      {
        area: 'The floor',
        items: [
          'Deliver inductions so that a member can train safely without you.',
          'Supervise the floor during your rostered hours: technique, racking, safety.',
          'Report and tag out faulty equipment immediately.',
          'Respond to a medical emergency on the floor under the emergency action plan.',
        ],
      },
      {
        area: 'Commercial',
        items: [
          'Convert inductions and floor conversations into paid sessions.',
          'Manage your own diary, retention and rebooking within the property system.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Corrects a member they are not being paid to train.',
      'Says no to a client goal that is not safe, and offers one that is.',
      'Keeps a client for a year rather than selling a block of ten.',
    ],
    measuredBy: [
      'Personal training revenue and session volume',
      'Induction to paid session conversion',
      'Client retention over three and twelve months',
      'Screening and record completeness',
      'Floor incidents and equipment faults raised',
    ],
    essential: [
      'Level 3 personal training qualification or equivalent',
      'Current first aid certification',
      'Professional indemnity and public liability insurance as the property requires',
    ],
    desirable: [
      'Level 4 or specialist qualifications',
      'Experience in a spa or luxury club rather than a high-volume gym',
    ],
    conditions: [
      'Rota covering early mornings, evenings and weekends.',
      'Physically active throughout. [State whether employed or self-employed here.]',
    ],
  },

  {
    reference: 'GYM-CLASSINSTRUCTOR-JD-743',
    title: 'Group Exercise Instructor',
    department: 'GYM FLOOR TEAM - PERSONAL TRAINERS',
    band: 'Wet area and fitness',
    purpose:
      'To teach classes that people come back to, at an intensity everybody in the room can survive.',
    reportsTo: 'Fitness Manager',
    responsibleFor: 'Everybody in the studio for the length of the class.',
    duties: [
      {
        area: 'The class',
        items: [
          'Teach [the class types you are qualified for] to the timetable and to the advertised level.',
          'Check the register at the start and know who is in the room.',
          'Ask about injuries, pregnancy and first-time attendance before starting, every class.',
          'Offer a regression and a progression for every exercise, so the room is one class not three.',
          'Manage the studio: capacity, spacing, equipment condition and the emergency exit.',
        ],
      },
      {
        area: 'Around it',
        items: [
          'Set up and reset the studio, including cleaning shared equipment.',
          'Report an equipment fault rather than working around it.',
          'Cover or arrange cover under the property procedure, never by informal swap.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'The person at the back gets as much attention as the person at the front.',
      'Asks the injury question even when the class is all regulars.',
      'The class is the level it was advertised as, so a beginner who booked one is not humiliated.',
    ],
    measuredBy: [
      'Attendance against studio capacity',
      'Repeat attendance for their classes',
      'Member feedback',
      'Register completion and incidents in class',
    ],
    essential: [
      'Current qualification for each class type taught',
      'Current first aid certification',
      'Insurance as the property requires',
    ],
    desirable: [
      'Multiple class disciplines',
      'Experience teaching mixed-ability groups',
    ],
    conditions: [
      'Sessional or rota work, concentrated in early mornings, evenings and weekends.',
      'Physically demanding. [State whether employed or sessional here.]',
    ],
  },
]
