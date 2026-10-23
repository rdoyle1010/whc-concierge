import type { RoleEntry } from './types'

// The roles that own the result.
//
// The common failure in spa leadership job descriptions is that they read as
// senior versions of a therapist job description: more duties, longer list,
// same shape. A director is not a therapist with more to do. The duties here
// are written as accountabilities, and the measures are commercial, because
// that is what the job is actually assessed on when it is assessed honestly.

export const LEADERSHIP: RoleEntry[] = [
  {
    reference: 'MGT-SPADIRECTOR-JD-701',
    title: 'Spa Director',
    department: 'SPA MANAGEMENT TEAM',
    band: 'Leadership',
    purpose:
      'To own the commercial and operational result of the spa: what it earns, what it costs, what a guest '
      + 'experiences, and whether it is safe and compliant while doing all three.',
    reportsTo: '[General Manager, or the role the property places this under]',
    responsibleFor: 'Spa Manager, and through them the whole spa team',
    duties: [
      {
        area: 'Commercial',
        items: [
          'Own the spa profit and loss: revenue, payroll, cost of sales and gross operating profit against budget.',
          'Build the annual budget and the monthly forecast, and explain the variance rather than report it.',
          'Set the treatment menu and its pricing from a costing, not from what the competition charges.',
          'Own yield: capacity used, discount given, and the trade between the two.',
          'Approve any discount, complimentary or rate outside the published structure, and record why.',
          'Own membership as a business: acquisition, retention, churn and the lifetime value behind the price.',
          'Hold retail to a plan, a margin and a stock position rather than to whatever the supplier pushes.',
        ],
      },
      {
        area: 'Guest and brand',
        items: [
          'Set the standard for the guest experience end to end, and audit it rather than assume it.',
          'Own the response to any complaint that reaches a second contact or a public review.',
          'Represent the spa to the hotel executive, the brand, the owner and the press.',
          'Approve the marketing calendar and hold each campaign to what it was supposed to return.',
        ],
      },
      {
        area: 'People',
        items: [
          'Own the structure: how many people, in what roles, on what pattern, at what cost.',
          'Recruit and develop the management layer, and hold succession for every senior role.',
          'Chair the training plan and confirm every competence a treatment or a hazard requires is current.',
          'Handle disciplinary and grievance matters at the level the property procedure places with this role.',
        ],
      },
      {
        area: 'Safety and governance',
        items: [
          'Hold accountability for the spa safety operating procedure and the emergency action plan.',
          'Confirm every risk assessment is current, reviewed and signed by a competent person.',
          'Own the audit cycle and close every corrective action to a date.',
          'Ensure water quality, plant, chemical handling and licensing obligations are met and recorded.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Can state this month’s revenue, payroll percentage and forward position without looking them up.',
      'Walks the floor daily and is recognised by the team and by regular guests.',
      'Raises a problem with a proposal attached rather than escalating it as a question.',
      'Makes a decision with the information available and records why, rather than waiting for certainty.',
      'Is the calmest person in the room during an incident, and the most specific afterwards.',
      'Develops a successor rather than becoming indispensable.',
    ],
    measuredBy: [
      'Gross operating profit against budget',
      'Revenue per available treatment hour, and treatment room occupancy',
      'Payroll as a percentage of revenue',
      'Membership retention and net member movement',
      'Guest satisfaction and rebooking rate',
      'Audit outcomes, open corrective actions, and reportable incidents',
      'Team turnover and time to fill a vacancy',
    ],
    essential: [
      'Experience running a spa or wellness operation with accountability for a profit and loss',
      'Evidence of building a budget and delivering against it',
      'Working knowledge of the safety obligations of a wet and heat facility',
      'Experience leading a management layer rather than a team directly',
    ],
    desirable: [
      'Luxury hotel or resort background',
      'Pre-opening or refurbishment experience',
      'A therapy qualification, for credibility on the floor rather than for delivery',
      'Pool plant operator certification',
    ],
    conditions: [
      'Full time. Weekend, evening and public holiday presence as the operation requires.',
      'On call for serious incidents as the property procedure sets out.',
      'Time on the treatment floor, poolside and in the plant room, not only at a desk.',
    ],
  },

  {
    reference: 'MGT-SPAMANAGER-JD-702',
    title: 'Spa Manager',
    department: 'SPA MANAGEMENT TEAM',
    band: 'Leadership',
    purpose:
      'To run the spa day to day so that it delivers the standard, the revenue and the safety record the '
      + 'Spa Director is accountable for.',
    reportsTo: 'Spa Director',
    responsibleFor: 'Spa Supervisors, therapists, reception, and the wet area team',
    duties: [
      {
        area: 'Running the operation',
        items: [
          'Own the rota: cover against demand, cost against budget, and the skills each shift needs.',
          'Run the daily briefing and the weekly operations review.',
          'Hold the standard on the floor: treatment delivery, room readiness, timing and handover.',
          'Manage the diary commercially: fill, gaps, buffers and the treatments that go where.',
          'Resolve any complaint that cannot be settled by the person who received it.',
        ],
      },
      {
        area: 'Commercial',
        items: [
          'Deliver the revenue target for treatments, retail and membership.',
          'Hold therapist utilisation and retail attachment to target, by person and by week.',
          'Manage stock: professional usage, retail levels, orders and the count.',
          'Approve discounts within the limit the property sets, and refer anything above it.',
        ],
      },
      {
        area: 'People',
        items: [
          'Recruit, induct and develop the team, and complete probation reviews on time.',
          'Own the training matrix: who is signed off on what, and what has expired.',
          'Hold performance conversations that reference the measures in the job description.',
          'Manage absence, lateness and conduct at the first stage.',
        ],
      },
      {
        area: 'Safety',
        items: [
          'Confirm the opening and closing checks are completed honestly, not just signed.',
          'Act on any out-of-range water reading, plant fault or equipment defect the same shift.',
          'Report and investigate incidents and near misses, and close the actions.',
          'Keep risk assessments current for the areas and activities in scope.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Knows before the shift starts where the gaps are and has already worked the diary.',
      'Is on the floor at the times the floor is hardest, not at the times the office is quietest.',
      'Holds a standard the same way with a friend as with a new starter.',
      'Escalates early with facts, and never escalates something they could have decided.',
      'Reads a report rather than waiting to be told what it says.',
    ],
    measuredBy: [
      'Treatment revenue and retail revenue against target',
      'Therapist utilisation against rostered hours',
      'Payroll cost against the rota budget',
      'Checklist completion and audit score',
      'Complaint volume and time to resolution',
      'Team turnover and training currency',
    ],
    essential: [
      'Experience managing a spa team, including rostering and performance',
      'Confidence reading a revenue and payroll report and acting on it',
      'Practical understanding of the safety obligations of the areas in scope',
    ],
    desirable: [
      'A recognised therapy qualification',
      'Pool plant operator certification',
      'Experience with [the booking system the property uses]',
    ],
    conditions: [
      'Full time, including weekends, evenings and public holidays on a rota.',
      'Duty management shifts as the property requires.',
      'Physically active role: on the floor for most of the shift.',
    ],
  },

  {
    reference: 'MGT-ASSTMANAGER-JD-703',
    title: 'Assistant Spa Manager',
    department: 'SPA MANAGEMENT TEAM',
    band: 'Leadership',
    purpose:
      'To hold the operation to standard in the Spa Manager’s absence, and to carry a defined part of the '
      + 'operation as their own the rest of the time.',
    reportsTo: 'Spa Manager',
    responsibleFor: 'The team on shift, and [the area the property allocates to this role]',
    duties: [
      {
        area: 'On shift',
        items: [
          'Take duty management shifts, including opening and closing the spa.',
          'Run the briefing, allocate the floor, and manage the diary through the day.',
          'Handle guest recovery within the authority the property sets.',
          'Complete the duty manager walk and act on what it finds.',
        ],
      },
      {
        area: 'Their own area',
        items: [
          'Own one defined area end to end: [retail, membership, training, or the wet area].',
          'Report on it weekly with numbers rather than with impressions.',
          'Propose and run improvements in it rather than waiting to be directed.',
        ],
      },
      {
        area: 'Team',
        items: [
          'Coach on the floor in the moment, and record what was coached.',
          'Complete induction and sign off basic competences for new starters.',
          'Cover the Spa Manager’s responsibilities during absence and leave.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Takes a decision on shift rather than saving it for the manager.',
      'Is trusted by the team and does not trade that trust for popularity.',
      'Leaves a written handover that the next duty manager can act on.',
      'Knows the numbers for their own area without being asked for them.',
    ],
    measuredBy: [
      'Shift standards: checklists completed, issues closed, handover quality',
      'Performance of their allocated area against its target',
      'Guest feedback on shifts they ran',
      'Competence sign-offs completed on time',
    ],
    essential: [
      'Supervisory experience in a spa, salon, leisure or hospitality operation',
      'Confidence taking charge of a shift and of an incident',
    ],
    desirable: [
      'A therapy or fitness qualification',
      'First aid at work certification',
      'Pool plant operator certification',
    ],
    conditions: [
      'Full time on a rota including weekends, evenings and public holidays.',
      'Opening and closing shifts, and lone working at the edges of the day where the property allows it.',
    ],
  },

  {
    reference: 'MGT-FITNESSMANAGER-JD-704',
    title: 'Fitness Manager',
    department: 'GYM FLOOR TEAM - PERSONAL TRAINERS',
    band: 'Leadership',
    purpose:
      'To run the gym floor and the class programme so that they are safe, well used, and commercially worth '
      + 'the space they occupy.',
    reportsTo: 'Spa Director',
    responsibleFor: 'Personal trainers, group exercise instructors and the gym floor team',
    duties: [
      {
        area: 'The floor',
        items: [
          'Own equipment safety: the asset register, service intervals, and anything tagged out.',
          'Set and hold the floor standard: layout, cleanliness, racking and signage.',
          'Confirm inductions are completed before anybody trains unsupervised.',
          'Own the emergency response on the floor, including the defibrillator and first aid provision.',
        ],
      },
      {
        area: 'Programme',
        items: [
          'Build the class timetable against demand, capacity and instructor cost.',
          'Recruit and quality-assure instructors, including any freelance cover.',
          'Review attendance by class and retire what does not fill.',
        ],
      },
      {
        area: 'Commercial',
        items: [
          'Deliver personal training revenue and the conversion from induction to paid session.',
          'Support membership acquisition and retention with the fitness offer.',
          'Manage equipment capital planning against asset life and replacement cost.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Finds a fault before a member does, and takes the machine out of use without being asked twice.',
      'Knows attendance by class and does something about the empty ones.',
      'Coaches instructors rather than only scheduling them.',
    ],
    measuredBy: [
      'Personal training revenue and induction conversion',
      'Class attendance against capacity',
      'Equipment availability and open maintenance requests',
      'Member retention attributable to fitness',
      'Incidents on the floor, and time to close corrective actions',
    ],
    essential: [
      'Level 3 personal training qualification or equivalent',
      'Experience managing a gym floor and a class programme',
      'Current first aid at work certification',
    ],
    desirable: [
      'Level 4 specialist qualification',
      'Experience with member management and retention',
      'Experience of an equipment tender or refurbishment',
    ],
    conditions: [
      'Full time on a rota covering early mornings, evenings and weekends.',
      'Physically active. Includes moving and checking equipment.',
    ],
  },
]
