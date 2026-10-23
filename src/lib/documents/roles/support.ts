import type { RoleEntry } from './types'

// The roles a spa does not run for a day without, and usually values least.
//
// A cleaner who cuts a corner in a wet area creates a legionella risk and a
// slip claim. A maintenance technician who signs a check they did not do
// creates the same. These are written with that stated, because a job
// description that treats them as unskilled is the first step towards
// recruiting for them as though they were.

export const SUPPORT: RoleEntry[] = [
  {
    reference: 'CLN-SPACLEANER-JD-751',
    title: 'Spa Cleaner',
    department: 'HOUSEKEEPING TEAM',
    band: 'Support and back of house',
    purpose:
      'To keep the spa clean to a standard a guest notices and an inspector can verify, in the areas where '
      + 'poor cleaning causes infection and injury rather than complaint.',
    reportsTo: 'Spa Head Housekeeper',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Cleaning',
        items: [
          'Clean treatment rooms, changing areas, wet areas, relaxation areas and back of house to the schedule.',
          'Follow the colour coding without exception, including when equipment is short.',
          'Use the correct chemical at the correct dilution with the correct contact time.',
          'Give the attention to detail that matters in a wet area: drains, grouting, benches, cabin interiors.',
          'Complete and sign the cleaning record for what you actually did.',
        ],
      },
      {
        area: 'Safety',
        items: [
          'Use PPE as the assessment requires, every time.',
          'Sign, cordon or close an area you have made wet, and stay until it is safe or signed.',
          'Never decant a chemical into an unlabelled container, and never mix two.',
          'Report a defect, a leak, a broken fitting or anything that could hurt somebody, immediately.',
          'Handle clinical and sharps waste under the procedure, and never by hand into a general bin.',
        ],
      },
      {
        area: 'Between areas',
        items: [
          'Keep clean and used linen separated at every point.',
          'Restock consumables so the next shift does not start short.',
          'Work around guests quietly, and leave an area rather than disturb a treatment.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'The corners are done, not just the middle.',
      'Signs the record for what was done, and leaves it blank when something was not.',
      'Puts a wet floor sign out before mopping, not after.',
      'Notices the tile that has come loose and reports it.',
    ],
    measuredBy: [
      'Cleaning audit scores for their areas',
      'Guest feedback mentioning cleanliness',
      'Record completion and honesty on spot check',
      'Chemical and PPE compliance at audit',
      'Defects reported rather than found later',
    ],
    essential: [
      'Ability to follow a written cleaning schedule and record accurately',
      'Willingness to complete COSHH and infection control training before starting',
      'Physically able to work standing, bending and carrying for a full shift',
    ],
    desirable: [
      'Cleaning experience in a spa, pool, clinical or food environment',
      'Existing COSHH awareness',
    ],
    conditions: [
      'Early starts, late finishes and weekends on a rota.',
      'Hot, humid and wet environments. Exposure to cleaning chemicals, with PPE provided.',
    ],
  },

  {
    reference: 'HK-LINENATTENDANT-JD-752',
    title: 'Spa Linen Attendant',
    department: 'HOUSEKEEPING TEAM',
    band: 'Support and back of house',
    purpose:
      'To make sure that every therapist, every room and every guest has the linen they need, clean, and that '
      + 'nobody ever has to go looking for a towel.',
    reportsTo: 'Spa Head Housekeeper',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Linen',
        items: [
          'Receive, count and check laundry deliveries against the docket, and report shortfalls the same day.',
          'Stock treatment rooms, changing areas and the wet area to par through the shift.',
          'Collect used linen continuously rather than at the end of the day.',
          'Keep clean and used linen physically separated at every point, including in transit.',
          'Condemn stained or damaged linen rather than returning it to circulation.',
        ],
      },
      {
        area: 'Records and stock',
        items: [
          'Record what goes out and what comes back, so a loss is visible before the stock count.',
          'Keep the linen store clean, dry, ordered and secure.',
          'Flag when par levels are wrong for the trading pattern rather than absorbing it daily.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'A therapist has never had to go and find linen mid-treatment.',
      'The count matches the docket because they checked it, not because they signed it.',
      'The store is tidy at the end of a busy Saturday.',
    ],
    measuredBy: [
      'Linen availability: stock-outs during service',
      'Losses and condemned items against volume',
      'Delivery discrepancies identified and reported',
      'Store audit results',
    ],
    essential: [
      'Reliable, methodical, and accurate with a count',
      'Physically able to lift and carry linen throughout a shift',
    ],
    desirable: [
      'Hotel or spa housekeeping experience',
    ],
    conditions: [
      'Early starts and weekends on a rota. Repetitive lifting and carrying.',
    ],
  },

  {
    reference: 'MAINT-TECHNICIAN-JD-753',
    title: 'Spa Maintenance Technician',
    department: 'MAINTENANCE & ENGINEERING TEAM',
    band: 'Support and back of house',
    purpose:
      'To keep the plant, the equipment and the building working, and to keep the records that prove it was '
      + 'checked rather than assumed.',
    reportsTo: '[Chief Engineer, or the role the property places this under]',
    responsibleFor: 'Nobody. Contractors on site are supervised under permit.',
    duties: [
      {
        area: 'Planned work',
        items: [
          'Carry out the planned maintenance schedule for spa plant, equipment and fabric.',
          'Take and record plant readings at the stated frequency, including water and temperature.',
          'Complete anti-scald, temperature and legionella control checks under the property water safety plan.',
          'Service or arrange service for equipment against the manufacturer interval, not against habit.',
        ],
      },
      {
        area: 'Reactive work',
        items: [
          'Respond to faults by priority, and make safe before repairing where you cannot do both.',
          'Isolate and tag out anything unsafe, and never restore it on a visual check alone.',
          'Close a job with what was actually done, so a repeat fault is visible as a repeat.',
        ],
      },
      {
        area: 'Contractors and compliance',
        items: [
          'Issue and supervise permits to work, including hot work and confined space.',
          'Check contractor competence, insurance and method statement before work starts.',
          'Keep the statutory inspection and certification records current and to hand.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'The log is filled in at the time, in the plant room, not at a desk afterwards.',
      'Tags out a machine and takes the complaint rather than leaving it in use.',
      'Knows which fault has come back three times and says so.',
      'Does not let a contractor start without the paperwork, however senior they are.',
    ],
    measuredBy: [
      'Planned maintenance completed within interval',
      'Reactive response and resolution times',
      'Repeat faults by asset',
      'Statutory records current at audit',
      'Water and plant readings complete and in range',
    ],
    essential: [
      'Relevant trade or building services qualification, or equivalent experience',
      'Experience with pool plant, water systems or wet area services',
      'Ability to keep accurate written records',
    ],
    desirable: [
      'Pool plant operator certification',
      'Legionella responsible person training',
      'Electrical testing qualification',
    ],
    conditions: [
      'Rota including weekends. On call for faults as the property requires.',
      'Plant rooms, confined spaces and work at height, under the relevant safe systems of work.',
    ],
  },

  {
    reference: 'TRN-SPATRAINER-JD-754',
    title: 'Spa Trainer',
    department: 'TRAINING TEAM',
    band: 'Support and back of house',
    purpose:
      'To make sure everybody in the spa is competent at what they are asked to do, and that there is a record '
      + 'proving it.',
    reportsTo: 'Spa Director',
    responsibleFor: 'The training plan, rather than a team',
    duties: [
      {
        area: 'Delivery',
        items: [
          'Deliver induction for every new starter before they work unsupervised.',
          'Deliver treatment, product, system and service training to the property standard.',
          'Observe and assess competence in the real environment, not only in a classroom.',
          'Retrain after an incident, a complaint theme or a procedure change.',
        ],
      },
      {
        area: 'The record',
        items: [
          'Own the training matrix: every role against every required competence, with expiry dates.',
          'Chase and evidence refreshers before they expire rather than after.',
          'Hold the evidence an assessor, an insurer or an investigator would ask for.',
          'Report currency monthly, by department, with the gaps named.',
        ],
      },
      {
        area: 'Improvement',
        items: [
          'Turn recurring complaints and audit findings into training rather than into reminders.',
          'Keep material current with product houses, protocols and regulation.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Can produce a competence record in under a minute when somebody asks for it.',
      'Signs somebody off because they watched them do it, not because they attended.',
      'Refuses to sign off somebody who is not there yet, and says what is missing.',
    ],
    measuredBy: [
      'Training currency: percentage of required competences in date',
      'Induction completed before unsupervised work, every time',
      'Time from procedure change to team trained',
      'Audit findings relating to competence',
      'Complaint themes that reduce after training',
    ],
    essential: [
      'Training or assessing qualification, or substantial equivalent experience',
      'Credibility on the treatment floor: a relevant technical qualification',
      'Organised enough to own a matrix and chase expiries',
    ],
    desirable: [
      'Assessor or internal quality assurance qualification',
      'Experience with [the product houses the property carries]',
    ],
    conditions: [
      'Rota including some weekends and evenings, because that is when the team is available.',
    ],
  },
]
