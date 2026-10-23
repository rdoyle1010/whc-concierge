import type { PolicyEntry } from './types'

// Safety and compliance.
//
// The six an assessor asks for by name, written as positions rather than as
// procedure summaries. Each one names the decision somebody has to be able to
// take at eight on a Sunday morning without a manager in the building, which
// is the moment a policy either works or turns out to be wallpaper.

export const SAFETY_POLICIES: PolicyEntry[] = [
  {
    reference: 'SAF-HEALTHSAFETY-POL-801',
    title: 'Health and Safety Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Safety and compliance',
    purpose:
      'To state how this spa keeps guests, the team and contractors safe, and who is accountable for each '
      + 'part of it.',
    appliesTo:
      'Everybody who works in or on behalf of the spa, including agency staff, freelancers, contractors and '
      + 'anybody delivering a service on the premises.',
    position: [
      'Nobody is asked to do anything here that has not been assessed, and nobody is asked to do anything '
      + 'they have not been trained and signed off to do.',
      'Safety is not traded against service. An area that should be closed is closed, a machine that should '
      + 'be out of use is out of use, and a treatment that should not go ahead does not, whatever it costs '
      + 'in the moment and whoever is inconvenienced.',
      'Anybody may stop an unsafe activity. Nobody has to be senior to do it, nobody is required to justify '
      + 'it first, and nobody is penalised for doing it in good faith and being wrong.',
      'A hazard that is reported is acted on and the person who reported it is told what happened. A hazard '
      + 'that is reported and ignored teaches a team to stop reporting.',
    ],
    rules: [
      {
        area: 'Assessment and control',
        items: [
          'Every area, substance and activity has a current written risk assessment, reviewed at least annually.',
          'An assessment is reviewed immediately after an incident, a change to the operation, or a change to the equipment or product used.',
          'Controls are verified in place rather than assumed: an assessment signed without walking the area is not an assessment.',
          'Where a control cannot be put in place, the activity stops until it can.',
        ],
      },
      {
        area: 'Competence',
        items: [
          'Nobody works unsupervised before induction is complete and recorded.',
          'No treatment, equipment or plant task is carried out by anybody not signed off for it.',
          'Competence has an expiry. An expired competence is the same as no competence.',
          'Contractors show competence, insurance and a method statement before work starts, not afterwards.',
        ],
      },
      {
        area: 'Day to day',
        items: [
          'Opening and closing safety checks are completed honestly and recorded at the time.',
          'Any check marked as a stop check decides whether an area opens, and is not a judgement call.',
          'Defects are logged, not mentioned. A verbal report is not a report.',
          'Personal protective equipment is provided, and using it is not optional.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'Overall accountability for health and safety in the spa, and for the resources to deliver it.' },
      { role: 'Spa Manager', duty: 'Risk assessments current, checks completed, defects closed, training in date.' },
      { role: 'Supervisors and duty managers', duty: 'Acting on a hazard or an out-of-range reading on shift, including closing an area.' },
      { role: 'Everybody', duty: 'Working to the procedure, using the equipment provided, and reporting what they find.' },
      { role: '[The competent person the property appoints]', duty: 'Advising on the property obligations and reviewing this policy against them.' },
    ],
    records: [
      'Current risk assessments, with review dates and who reviewed them',
      'Induction and training records, with expiry dates',
      'Opening, closing and periodic check records',
      'Defect log, with dates raised and closed',
      'Incident and near miss reports, and the investigation into each',
      'Statutory inspection and certification records',
      'Contractor competence, insurance and permits',
    ],
    breach: [
      'Working outside a procedure or without the required competence is a disciplinary matter, up to and including dismissal for a deliberate act that put somebody at risk.',
      'Signing a check that was not carried out is treated as falsification of a safety record, not as an administrative error.',
      'Overriding somebody who stopped an unsafe activity is treated as the more serious matter of the two.',
      'A contractor working without the required paperwork is removed from site and the arrangement reviewed.',
    ],
    reviewTriggers: [
      'Any reportable incident, or any incident that could have been one',
      'A change to the premises, the plant, the equipment or the treatment menu',
      'A change to the team structure or to who holds a competent person role',
      'An enforcement visit, an insurer requirement or an audit finding',
    ],
  },

  {
    reference: 'SAF-SAFEGUARDING-POL-802',
    title: 'Safeguarding Children and Vulnerable Adults Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Safety and compliance',
    purpose:
      'To state how this spa protects children and vulnerable adults using it, and what anybody who has a '
      + 'concern is expected to do about it.',
    appliesTo:
      'Everybody working in or on behalf of the spa, whether or not their role normally involves contact with '
      + 'children or vulnerable adults.',
    position: [
      'A concern about a child or a vulnerable adult is acted on. It is never held, never resolved informally, '
      + 'and never left until somebody more senior is next in.',
      'It is not for anybody here to decide whether a concern is founded. It is for them to report it '
      + 'accurately and promptly to the safeguarding lead, who refers it on under the property procedure.',
      'A concern is reported even when it is about a colleague, and especially then. Loyalty to a colleague is '
      + 'never a reason to delay.',
      'Anybody raising a concern in good faith is protected, whatever the outcome.',
    ],
    rules: [
      {
        area: 'Access and supervision',
        items: [
          'Age limits for each area are set by the property, published, and applied without exception.',
          'A child within the permitted age is accompanied by a responsible adult at [the ratio the property sets].',
          'No treatment is given to anybody under eighteen without documented consent from a person with parental responsibility.',
          'For any treatment on a minor, a second appropriate adult is present throughout.',
          'A vulnerable adult is supported in whatever way they ask for, and never assumed to need less privacy or less explanation.',
        ],
      },
      {
        area: 'Raising a concern',
        items: [
          'Report to the safeguarding lead the same day, and in writing.',
          'Record what was seen or said in the words used, without interpretation or conclusion.',
          'Do not investigate, do not question the person further, and do not contact a family member.',
          'Do not promise confidentiality. Say that you have to pass it on and who to.',
          'Where a child or adult is in immediate danger, call the emergency services first and the safeguarding lead second.',
        ],
      },
      {
        area: 'Recruitment and training',
        items: [
          'Roles involving contact with children or vulnerable adults are recruited with the checks the property determines are required.',
          'Safeguarding awareness is part of induction for everybody, before unsupervised work.',
          'The safeguarding lead and deputy are named, published, and reachable whenever the spa is open.',
        ],
      },
    ],
    responsibilities: [
      { role: '[Safeguarding lead]', duty: 'Receiving concerns, deciding on referral, recording, and liaising with external agencies.' },
      { role: '[Deputy safeguarding lead]', duty: 'The same, whenever the lead is unavailable.' },
      { role: 'Spa Director', duty: 'That a lead and deputy exist, are trained, and are reachable during opening hours.' },
      { role: 'Everybody', duty: 'Recognising a concern and reporting it the same day.' },
    ],
    records: [
      'Safeguarding concern reports, held securely and separately from personnel and guest files',
      'Referral decisions and the reasons for them',
      'Consent records for any treatment on a person under eighteen',
      'Recruitment checks for roles the property determines require them',
      'Training records for safeguarding awareness, and for the lead and deputy',
    ],
    breach: [
      'Failing to report a concern is a disciplinary matter and may be a criminal one.',
      'Investigating or attempting to resolve a concern personally is treated as a serious breach, because it can destroy the account of a child.',
      'Treating a minor without documented consent or without a second adult present is gross misconduct.',
      'Discouraging somebody from raising a concern is treated as the most serious breach of this policy.',
    ],
    reviewTriggers: [
      'Any safeguarding concern raised, whatever its outcome',
      'A change in the safeguarding lead or deputy',
      'A change to who the spa admits, including a change to age limits',
      'Guidance issued by the local safeguarding arrangements',
    ],
  },

  {
    reference: 'SAF-LONEWORKING-POL-803',
    title: 'Lone Working Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Safety and compliance',
    purpose:
      'To state when somebody may work alone in this spa, what has to be in place before they do, and what is '
      + 'never done alone.',
    appliesTo:
      'Anybody working without another member of the team on the premises or within sight and hearing, '
      + 'including early openers, late closers, therapists with a single late booking, and maintenance.',
    position: [
      'Lone working is permitted only where it has been assessed for that task, in that area, at that time, '
      + 'and where the controls in the assessment are actually in place.',
      'Some things are never done alone, whatever the commercial pressure: entering the plant room, handling '
      + 'pool chemicals, working at height, supervising water, and giving a treatment to a guest who has '
      + 'arrived intoxicated or is behaving in a way that concerns the therapist.',
      'Anybody working alone may end the situation at any point. Declining a late booking, refusing entry, or '
      + 'closing early because they are alone and uncomfortable is supported, and is never questioned '
      + 'afterwards as a commercial decision.',
      'A lone worker is checked on. Not knowing somebody is still in the building is the failure this policy '
      + 'exists to prevent.',
    ],
    rules: [
      {
        area: 'Before it happens',
        items: [
          'A lone working assessment exists for the task and the person has read it.',
          'A means of raising an alarm is available and tested: [the system the property uses].',
          'Somebody outside the building knows they are there, what they are doing, and when they expect to finish.',
          'Access is controlled: nobody unexpected can enter, and the lone worker can see who is at the door.',
        ],
      },
      {
        area: 'During',
        items: [
          'Check in at [the interval the property sets], and a missed check-in is escalated rather than assumed.',
          'Doors that should be secured stay secured, including during a delivery.',
          'No treatment is given to a guest the lone worker has not met and is not comfortable being alone with.',
          'Cash handling and banking are not done alone at the edges of the day.',
        ],
      },
      {
        area: 'Never alone',
        items: [
          'Plant room entry, chemical handling or dosing.',
          'Any work at height, in a confined space, or on live equipment.',
          'Supervising a pool or thermal area that is open to guests.',
          'Opening the spa where opening requires a stop check that a second person must witness.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Manager', duty: 'Rostering so that lone working is the exception, and that where it happens it is assessed and controlled.' },
      { role: 'Duty manager', duty: 'Knowing who is alone in the building and confirming they left.' },
      { role: 'The lone worker', duty: 'Following the assessment, checking in, and stopping where they are uncomfortable.' },
    ],
    records: [
      'Lone working risk assessments by task and area',
      'The record of who was alone, when, and that they checked out',
      'Alarm and communication system test records',
      'Any incident, near miss or refusal, and what was done about it',
    ],
    breach: [
      'Rostering somebody alone for a task on the never-alone list is a management failure and is treated as one.',
      'Working alone on a never-alone task, even willingly, is a disciplinary matter: consent does not make it safe.',
      'Failing to check in, or failing to escalate a missed check-in, is treated seriously because the whole control depends on it.',
      'Pressuring somebody to take a late booking they have declined is a breach by the person applying the pressure.',
    ],
    reviewTriggers: [
      'Any incident, near miss or refusal involving a lone worker',
      'A change to opening hours, the rota pattern or the building',
      'A change to the alarm or communication system',
    ],
  },

  {
    reference: 'SAF-INFECTION-POL-804',
    title: 'Infection Prevention and Control Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Safety and compliance',
    purpose:
      'To state how this spa prevents the transmission of infection between guests, between guests and the '
      + 'team, and through the water and the equipment.',
    appliesTo: 'Everybody working in the spa, and anybody contracted to clean, launder or maintain it.',
    position: [
      'The standard does not move with how busy the day is. The last treatment of a Saturday is given in a '
      + 'room prepared the same way as the first of a Tuesday.',
      'Anything that touches a guest is single use, or has been through a documented cleaning or sterilisation '
      + 'cycle. There is no third category.',
      'A treatment does not go ahead where the guest or the therapist has a condition that makes it unsafe for '
      + 'either of them, and declining it is supported.',
      'Water safety is managed as an infection control matter, not only as a plant matter.',
    ],
    rules: [
      {
        area: 'Hands, skin and personal',
        items: [
          'Hands are washed or sanitised before and after every guest, and after every task that requires it.',
          'Cuts and abrasions are covered with a waterproof dressing before contact.',
          'Nails, jewellery and uniform meet the standard, because each of them carries.',
          'Anybody with symptoms that could transmit does not treat, and reports it rather than working through it.',
        ],
      },
      {
        area: 'Rooms, linen and equipment',
        items: [
          'Couches, surfaces and contact points are cleaned between every guest, with the correct product and contact time.',
          'Linen is single use per guest, and clean and used linen are separated at every point.',
          'Implements are single use or sterilised to the documented cycle, with the cycle recorded.',
          'Colour coding is followed for cloths and equipment without exception.',
          'Products are not double dipped, and anything decanted is labelled and dated.',
        ],
      },
      {
        area: 'Water and wet areas',
        items: [
          'Water quality is tested and recorded at the stated frequency, and an out-of-range reading closes the area.',
          'Showers, spouts and little-used outlets are flushed under the water safety plan.',
          'Foot spas, basins and any circulating system are cleaned and disinfected to schedule and recorded.',
          'Thermal cabins are cleaned between sessions to the standard and shut down as the procedure requires.',
        ],
      },
      {
        area: 'Waste and spills',
        items: [
          'Clinical waste and sharps are handled and disposed of under the property arrangements, never into general waste.',
          'A body fluid spill is dealt with under the spill procedure, by somebody trained, with the area closed until it is done.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Manager', duty: 'The standard, the audit, and acting on what the audit finds.' },
      { role: 'Spa Head Housekeeper', duty: 'Cleaning schedules, chemicals, colour coding and linen separation.' },
      { role: 'Therapists', duty: 'Room and implement hygiene, personal hygiene, and declining a treatment where it is unsafe.' },
      { role: 'Pool team and maintenance', duty: 'Water quality, flushing and plant hygiene under the water safety plan.' },
    ],
    records: [
      'Cleaning schedules and completion records by area',
      'Sterilisation cycle records',
      'Water test results and the action taken on any out-of-range reading',
      'Flushing records under the water safety plan',
      'Training records for infection control, COSHH and spill response',
      'Any suspected transmission, reaction or complaint, and the investigation',
    ],
    breach: [
      'Reusing a single-use item is gross misconduct.',
      'Signing a cleaning or sterilisation record for work not done is treated as falsification of a safety record.',
      'Treating a guest while symptomatic, or treating a guest whose condition contraindicates it, is a disciplinary matter.',
      'Failing to close an area on an out-of-range water reading is a serious breach whatever the commercial cost of closing.',
    ],
    reviewTriggers: [
      'Any suspected transmission, infection or reaction linked to the spa',
      'A change to the treatment menu, the products or the equipment',
      'A change to the laundry or cleaning contractor',
      'Guidance from a public health body or the property insurer',
    ],
  },

  {
    reference: 'SAF-INCIDENT-POL-805',
    title: 'Incident Reporting and Investigation Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Safety and compliance',
    purpose:
      'To state what has to be reported, how quickly, and what the property does with it, so that the same '
      + 'thing does not happen twice.',
    appliesTo: 'Everybody working in or on behalf of the spa.',
    position: [
      'Everything is reported: injuries, near misses, property damage, aggression, and the ones where nothing '
      + 'actually happened. A near miss is the same event with better luck, and it is the cheapest warning a '
      + 'business ever gets.',
      'Reporting is not blame. An investigation asks what allowed this to happen, not who to hold responsible, '
      + 'and a team that believes otherwise stops reporting within a month.',
      'A report is written the same shift, by the person who was there, in their own words. A report written '
      + 'three days later from memory is worth very little and looks worse.',
      'Nothing is altered after the fact. A correction is added and dated; a report is never rewritten.',
    ],
    rules: [
      {
        area: 'What to report',
        items: [
          'Any injury to a guest, a member of the team, a contractor or a visitor, however minor.',
          'Any near miss: the slip that was caught, the machine that stopped, the guest who was helped out of the heat.',
          'Any aggression, threat or abuse towards the team, including from a guest.',
          'Any equipment or plant failure that had or could have had a safety consequence.',
          'Any adverse reaction to a treatment or product.',
          'Any loss, theft or damage to property.',
        ],
      },
      {
        area: 'How',
        items: [
          'Make the person safe and the area safe first. The report comes after that and before the end of the shift.',
          'Record what happened in the order it happened, in plain words, without conclusions about cause.',
          'Take names and contact details of anybody who saw it.',
          'Photograph the scene where it is safe and appropriate to do so, before it is cleared.',
          'Tell the duty manager immediately rather than leaving the form to be found.',
        ],
      },
      {
        area: 'Afterwards',
        items: [
          'The duty manager reviews every report the same shift and escalates anything serious immediately.',
          'Anything reportable to an external authority is escalated under the property procedure without delay.',
          'Every report is investigated proportionately, and every investigation produces an action with an owner and a date.',
          'Actions are closed and the closure recorded. An action list that only grows is not being worked.',
          'Themes are reviewed at least monthly, because three small reports about the same thing are one large one.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Everybody', duty: 'Reporting the same shift, accurately, including near misses.' },
      { role: 'Duty manager', duty: 'Immediate response, review of the report, and escalation of anything serious.' },
      { role: 'Spa Manager', duty: 'Investigation, actions, and closing them to a date.' },
      { role: 'Spa Director', duty: 'External reporting obligations, theme review, and resourcing the actions.' },
    ],
    records: [
      'Incident and near miss reports, retained for the period the property sets',
      'Investigation notes and conclusions',
      'Corrective actions with owners, dates and evidence of closure',
      'External reports made, and to whom',
      'Monthly theme review and what changed as a result',
    ],
    breach: [
      'Not reporting an incident is a disciplinary matter, and is treated more seriously than the incident usually is.',
      'Altering or destroying a report is gross misconduct.',
      'Discouraging somebody from reporting, however informally, is a serious breach by the person doing it.',
      'Closing an action without the work actually being done is treated as falsifying a safety record.',
    ],
    reviewTriggers: [
      'Any serious or reportable incident',
      'A pattern of similar reports',
      'A change to external reporting obligations',
      'An audit finding about reporting or investigation quality',
    ],
  },

  {
    reference: 'SAF-ALCOHOLDRUGS-POL-806',
    title: 'Alcohol, Drugs and Intoxication Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Safety and compliance',
    purpose:
      'To state the position on alcohol and drugs for both the team and guests, in a facility with heat, '
      + 'water and treatments where intoxication is a genuine danger rather than a matter of decorum.',
    appliesTo: 'Everybody working in the spa, and every guest using it.',
    position: [
      'Nobody works here under the influence of alcohol or drugs. In a building with a pool, a plant room and '
      + 'treatments on people, that is a safety rule rather than a conduct rule.',
      'A guest who appears intoxicated is not admitted to the water, the heat experiences or a treatment. This '
      + 'is not a judgement about them and it is not negotiable.',
      'Refusing a guest on these grounds is supported by management every time, including when the guest '
      + 'complains, including when they are a member, and including when they have already paid.',
      'Where alcohol is served in the spa, it is served in a way that does not put somebody into water or onto '
      + 'a treatment couch impaired.',
    ],
    rules: [
      {
        area: 'The team',
        items: [
          'Do not attend work under the influence, and do not consume during a shift or during a break within one.',
          'Declare any prescribed or over-the-counter medication that could affect alertness, judgement or physical work.',
          'Anybody who believes a colleague is impaired reports it to the duty manager rather than covering for them.',
          'A member of the team who asks for help with alcohol or drugs is supported, and asking is not itself a disciplinary matter.',
        ],
      },
      {
        area: 'Guests',
        items: [
          'Assess at arrival and again before any treatment. Intoxication can be missed at a busy desk.',
          'Refuse access to pool, thermal areas and treatments where there is a reasonable belief of intoxication.',
          'Offer water, a seat, somewhere quiet and help arranging transport rather than simply turning somebody out.',
          'Never let an intoxicated guest into the water while deciding what to do.',
          'Record the refusal, the reason and what was offered, and refer the refund question to a manager.',
        ],
      },
      {
        area: 'Where alcohol is served',
        items: [
          'Alcohol is not served to a guest before a treatment or before wet area use, whatever the package includes.',
          'Anything included in a package is served after the treatment element rather than before it.',
          'The team serving it are trained on refusal, and refusing is supported.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Duty manager', duty: 'The decision to refuse, the record of it, and supporting the person who raised it.' },
      { role: 'Reception and hosts', duty: 'Assessing at arrival and escalating a concern rather than admitting and hoping.' },
      { role: 'Therapists', duty: 'Declining a treatment where the guest is impaired, at any point including part way through.' },
      { role: 'Spa Director', duty: 'The position, the training behind it, and backing a refusal afterwards.' },
    ],
    records: [
      'Refusals of admission or treatment, with the reason and what was offered',
      'Reports of suspected impairment in a member of the team, and the action taken',
      'Training records for refusal and for alcohol service where it applies',
      'Any incident involving alcohol or drugs on the premises',
    ],
    breach: [
      'Working under the influence is gross misconduct in a safety critical environment.',
      'Admitting a guest to water or a treatment while believing them impaired is a serious breach, whatever the pressure applied.',
      'Overruling a refusal made in good faith, without a documented reassessment, is a breach by the person overruling it.',
      'Covering for a colleague believed to be impaired is a disciplinary matter.',
    ],
    reviewTriggers: [
      'Any incident involving alcohol or drugs',
      'A change to what the spa serves or to any package including alcohol',
      'A complaint arising from a refusal',
    ],
  },
]
