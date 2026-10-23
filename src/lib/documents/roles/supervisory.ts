import type { RoleEntry } from './types'

// The layer between a manager and the floor.
//
// Supervisory roles are usually written as a manager job description with the
// pay and the authority taken out, which is why people in them either behave
// like a manager without the mandate or like a team member with a title.
// These state the authority explicitly: what they may decide, and what they
// must refer.

export const SUPERVISORY: RoleEntry[] = [
  {
    reference: 'SUP-SPASUPERVISOR-JD-731',
    title: 'Spa Supervisor',
    department: 'SPA SUPERVISORS',
    band: 'Supervisory',
    purpose:
      'To hold the standard on shift and to be the first decision maker on the floor, so that a problem is '
      + 'solved where it happens rather than carried to a manager the next morning.',
    reportsTo: 'Assistant Spa Manager',
    responsibleFor: 'The team on shift',
    duties: [
      {
        area: 'On shift',
        items: [
          'Run the shift: allocation, breaks, cover and the diary as it changes.',
          'Complete the duty walk and act on what it finds rather than logging it for somebody else.',
          'Take the decisions inside your authority: [the limit the property sets for goodwill and exceptions].',
          'Refer anything above that limit immediately rather than at the end of the shift.',
          'Hand over in writing at the end of every shift.',
        ],
      },
      {
        area: 'Standards',
        items: [
          'Check the opening and closing checklists were completed honestly, not merely signed.',
          'Observe delivery on the floor and coach in the moment.',
          'Escalate a repeated standards concern about an individual to the manager, with dates.',
        ],
      },
      {
        area: 'Safety',
        items: [
          'Be the first responder for an incident on shift, and complete the report before leaving.',
          'Act on any out-of-range reading, defect or hazard immediately, including closing an area.',
          'Never reopen an area on a visual check where the procedure requires a reading.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Closes an area when the reading says so, and takes the argument afterwards.',
      'Decides rather than collects decisions for the manager.',
      'The handover reads like somebody wrote it for the person taking over, not for the file.',
    ],
    measuredBy: [
      'Checklist completion and audit score on their shifts',
      'Incidents handled and reports completed on time',
      'Guest feedback and complaints resolved at first contact',
      'Shift revenue and utilisation where the rota is theirs',
    ],
    essential: [
      'Experience in a spa, leisure or hospitality operation with responsibility for others',
      'Confidence taking charge of an incident',
      'Current first aid at work certification, or ability to gain it',
    ],
    desirable: [
      'A therapy or fitness qualification',
      'Pool plant operator certification',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays. Opening and closing shifts.',
    ],
  },

  {
    reference: 'REC-RECEPTION-SUPERVISOR-JD-732',
    title: 'Reception Supervisor',
    department: 'RECEPTION TEAM',
    band: 'Supervisory',
    purpose:
      'To own the desk: the people on it, the standard it holds, and the revenue it is capable of taking.',
    reportsTo: 'Spa Manager',
    responsibleFor: 'Receptionists, senior receptionists and spa hosts',
    duties: [
      {
        area: 'The team',
        items: [
          'Build the reception rota against demand and against the payroll budget.',
          'Recruit, induct and develop the reception team, and complete probation reviews on time.',
          'Hold performance conversations against the measures in the job description.',
          'Own the training plan for the desk, including system and product training.',
        ],
      },
      {
        area: 'The desk',
        items: [
          'Own conversion, rebooking and desk revenue, by person and by week.',
          'Set and audit the telephone, email and greeting standards.',
          'Own the diary rules: buffers, resources, allocation and how gaps are worked.',
          'Own cash handling: floats, banking, discrepancies and the audit trail.',
        ],
      },
      {
        area: 'Guests',
        items: [
          'Handle escalated complaints and own the response within [the property authority].',
          'Review feedback weekly and act on the themes rather than the loudest single review.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'The desk performs the same on a Sunday as on a Tuesday.',
      'Can name each receptionist’s conversion rate and what they are working on.',
      'Fixes a recurring guest complaint at its cause rather than apologising for it repeatedly.',
    ],
    measuredBy: [
      'Enquiry to booking conversion across the team',
      'Rebooking rate at departure',
      'Desk revenue: retail, vouchers, upgrades',
      'Cash accuracy and discrepancy frequency',
      'Reception turnover and training currency',
    ],
    essential: [
      'Experience supervising a reception or front of house team',
      'Confident with rotas, payroll cost and a booking system',
      'Evidence of improving a commercial measure at a desk',
    ],
    desirable: [
      'Spa or luxury hotel background',
      'Experience with [the booking system the property uses]',
    ],
    conditions: [
      'Full time on a rota including weekends and public holidays.',
    ],
  },

  {
    reference: 'RET-RETAILSUPERVISOR-JD-733',
    title: 'Retail Supervisor',
    department: 'RETAIL TEAM',
    band: 'Supervisory',
    purpose:
      'To make retail a business rather than a shelf: the right range, in stock, sold by people who know '
      + 'what they are recommending.',
    reportsTo: 'Spa Manager',
    responsibleFor: 'The retail standard across the team, rather than a team of their own',
    duties: [
      {
        area: 'Range and stock',
        items: [
          'Own the range plan: what is carried, at what depth, and what comes off.',
          'Manage ordering against sales rather than against supplier minimums.',
          'Run the stock count, investigate discrepancies, and act on shrinkage.',
          'Manage tester stock, professional usage and anything written off.',
          'Track margin by line and by house, and challenge what does not earn its space.',
        ],
      },
      {
        area: 'Selling',
        items: [
          'Train therapists and reception on the range so that a recommendation is credible.',
          'Set and audit merchandising standards, including at the desk and in treatment rooms.',
          'Own the retail element of every promotion, and know what each one returned.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Knows which three lines make most of the margin and which three are dead.',
      'Takes a line off the shelf rather than discounting it forever.',
      'Therapists can explain the product because this person taught them, not the supplier.',
    ],
    measuredBy: [
      'Retail revenue and retail spend per treated guest',
      'Gross margin percentage',
      'Stock discrepancy and value of dead stock',
      'Retail attachment rate across the treatment team',
    ],
    essential: [
      'Retail experience including stock control and margin',
      'Confidence training others to sell',
    ],
    desirable: [
      'Spa or beauty retail background',
      'Experience with [the product houses the property carries]',
    ],
    conditions: [
      'Rota including weekends. Includes stock counts outside trading hours.',
    ],
  },

  {
    reference: 'HK-HEADHOUSEKEEPER-JD-734',
    title: 'Spa Head Housekeeper',
    department: 'HOUSEKEEPING TEAM',
    band: 'Supervisory',
    purpose:
      'To own cleanliness and linen across the spa, which is the standard a guest judges first and the one an '
      + 'inspector judges hardest.',
    reportsTo: 'Spa Manager',
    responsibleFor: 'Spa cleaners and linen attendants',
    duties: [
      {
        area: 'Standards',
        items: [
          'Set and audit the cleaning standard for every area, including the ones guests do not see.',
          'Own the deep clean cycle and the schedule behind it.',
          'Own infection control practice, including colour coding and clinical waste.',
          'Manage COSHH: storage, decanting, labelling, data sheets and training.',
        ],
      },
      {
        area: 'Linen',
        items: [
          'Own par levels, the laundry relationship, and the cost per piece.',
          'Manage stock rotation, condemning and replacement.',
          'Keep clean and used linen separated at every point, without exception.',
        ],
      },
      {
        area: 'Team',
        items: [
          'Build the cleaning rota to cover opening, through-day and closing requirements.',
          'Recruit, induct and train the team, including on chemicals and equipment.',
          'Complete the checks that confirm work was done rather than signed for.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'The areas guests do not see are as clean as the ones they do.',
      'Knows the cost per piece of linen and challenges it.',
      'Finds the standard slipping before a guest or an auditor does.',
    ],
    measuredBy: [
      'Cleaning audit scores by area',
      'Guest feedback mentioning cleanliness',
      'Linen cost per treatment and per occupied hour',
      'Stock losses and condemned linen',
      'COSHH compliance at audit',
    ],
    essential: [
      'Housekeeping supervisory experience, ideally in a wet or clinical environment',
      'Working knowledge of COSHH and infection control',
    ],
    desirable: [
      'Spa or hotel background',
      'Experience managing a laundry contract',
    ],
    conditions: [
      'Early starts and weekend working on a rota.',
      'Physically active. Exposure to cleaning chemicals with PPE provided.',
    ],
  },
]
