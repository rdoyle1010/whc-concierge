import type { Hazard } from '../plan-types'

// Infection control, water safety, lone working, display screens, violence,
// ergonomics, vulnerable people, contractors and first aid.
//
// The half of a spa register that is about people rather than equipment, and
// the half most often missing. Every one of these has hurt somebody in a spa
// and almost none of them produce an incident report when they do.

export const INFECTION: Hazard[] = [
  {
    hazard: 'Legionella in hot and cold water systems',
    whoIsAtRisk: 'Guests, staff, anybody with a weakened immune system',
    controlsToVerify: [
      'A written water safety risk assessment exists and is current',
      'A responsible person is named, and a competent person or contractor advises',
      'Temperature monitoring covers the outlets the assessment identifies, at the stated frequency',
      'Infrequently used outlets are identified and flushed on a schedule, and it is recorded',
      'Showerheads are cleaned and descaled at the stated frequency',
      'Cold water tanks are inspected and the inspection is recorded',
      'Sampling results are reviewed by somebody competent and acted on',
      'Reopening after any closure follows a written flushing and disinfection procedure',
    ],
    note:
      'The commonest dead leg in a spa is a treatment room out of use for a fortnight. It has a shower, it is '
      + 'warm, and nobody is flushing it because nobody is in it.',
  },
  {
    hazard: 'Legionella and pseudomonas in spa pools and hydrotherapy pools',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Spa pools are assessed separately from swimming pools, because they behave differently',
      'Disinfection is held continuously and tested far more often than a swimming pool',
      'The pool is drained, cleaned and refilled at the stated frequency, and it is recorded',
      'Filters are cleaned and disinfected to schedule',
      'Microbiological sampling is carried out and results are reviewed',
      'Air blowers and jets are not run continuously when the pool is unoccupied',
      'A written response exists for an adverse sample result',
    ],
    note:
      'Warm, aerated and agitated is the worst configuration there is, and a hydrotherapy pool is all three at '
      + 'once. This one cannot be assessed by looking at the water.',
  },
  {
    hazard: 'Cryptosporidium and other pool water contamination',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Disinfectant and pH are held in range and tested at the stated frequency, and recorded',
      'A written contamination procedure distinguishes formed stool from diarrhoea',
      'Coagulation and filtration are understood as the control for cryptosporidium, not disinfectant alone',
      'Turnover and filtration are adequate for the bather load',
      'Guests are asked to shower before entering, and to stay away if they have had diarrhoea recently',
      'A closure procedure exists that nobody can shorten because the pool looks fine',
      'Staff know that several guests reporting illness is an outbreak, not a coincidence',
    ],
  },
  {
    hazard: 'Blood and body fluid spillage',
    whoIsAtRisk: 'Staff, guests',
    controlsToVerify: [
      'A spill kit is available in the spa and staff know where it is',
      'A written procedure covers spillage on a surface and in water separately',
      'Gloves and eye protection are in the kit and are used',
      'Contaminated material is disposed of as clinical waste, with a contract in place',
      'Staff know what to do about a splash or a needlestick, and that it is reported the same day',
      'Vaccination is offered where the assessment identifies a need',
    ],
  },
  {
    hazard: 'Fungal infection: athlete’s foot, verrucae and similar',
    whoIsAtRisk: 'Guests, staff working barefoot or in wet areas',
    controlsToVerify: [
      'Wet area floors are cleaned and disinfected at a frequency suited to barefoot use',
      'Changing room and shower floors are included, not only the poolside',
      'Slippers or footwear are provided or encouraged where appropriate',
      'Shared mats and duckboards are cleaned and disinfected, or removed',
      'Staff working barefoot in wet areas have their own footwear guidance',
      'Guests with a visible verruca or infection are handled by a written policy rather than by improvisation',
    ],
  },
  {
    hazard: 'Sharps and needlestick injury',
    whoIsAtRisk: 'Cleaners, spa attendants, housekeeping, therapists',
    controlsToVerify: [
      'Staff know never to put a hand into a bin or a pocket of linen they cannot see into',
      'A sharps container is available where any sharp is used, and a disposal contract is in place',
      'Sharps found during cleaning have a written procedure that does not involve picking them up by hand',
      'Tongs or a scoop are available for retrieving a found sharp',
      'Staff know what to do after a needlestick and that it is reported the same day, not at the end of the shift',
      'Occupational health or accident and emergency access is known and immediate',
      'Hepatitis B vaccination is offered where the assessment identifies a need',
      'Any treatment that could break the skin uses single-use items with a disposal route',
    ],
    note:
      'A spa has no obvious reason to have sharps in it, which is exactly why nobody is expecting one and why '
      + 'the bin gets emptied by hand.',
  },
  {
    hazard: 'Handling soiled linen',
    whoIsAtRisk: 'Spa attendants, housekeeping, laundry staff',
    controlsToVerify: [
      'Soiled linen is bagged at the point of use and never sorted by hand',
      'Gloves are provided and worn',
      'Linen contaminated with blood or body fluid is bagged separately and identified',
      'Clean and soiled linen are stored and transported separately',
      'Wash process and temperature are specified and verified with the laundry',
      'Hand hygiene facilities are available where linen is handled',
    ],
  },
  {
    hazard: 'Cross-contamination between guests in treatment rooms',
    whoIsAtRisk: 'Guests, therapists',
    controlsToVerify: [
      'Couches, equipment and reusable items are cleaned between every guest to a written standard',
      'Single-use items are genuinely single use',
      'Linen is changed between every guest',
      'Hand hygiene facilities are in or immediately outside the room',
      'Therapists with an infection, a cut or a skin condition on the hands do not treat, and know they do not',
      'Any implement that could break the skin is single use or sterilised to a written procedure',
      'Product is never returned from a guest to the container',
    ],
  },
]

export const PEOPLE_HAZARDS: Hazard[] = [
  {
    hazard: 'Lone working on early and late shifts',
    whoIsAtRisk: 'Cleaners, reception staff, spa attendants, therapists',
    controlsToVerify: [
      'A written lone working procedure states what may not be done alone',
      'A check-in arrangement operates at opening and closing and is actually used',
      'Wet areas are never open to guests with one member of staff on site, unless the assessment says otherwise',
      'A means of raising an alarm is carried rather than fixed to a wall',
      'Somebody offsite knows who is in the building and when they are due out',
      'A treatment is never delivered with nobody else on the premises',
      'External doors are secured so somebody working alone cannot be walked in on',
    ],
    note:
      'The two hazards overlap: somebody alone is more likely to be assaulted and less likely to be found if '
      + 'they collapse. Both are worse in a building with locked doors and running water.',
  },
  {
    hazard: 'Lone working in the pool plant room',
    whoIsAtRisk: 'Plant operators, maintenance staff',
    controlsToVerify: [
      'A written procedure states whether plant room entry may be done alone at all',
      'Somebody knows when a person enters and when they are expected out',
      'A means of raising an alarm works from inside the plant room, over the noise',
      'Chemical handling is never done alone where the assessment requires two people',
      'Entry to any confined space or balance tank is never done alone, under permit',
      'A failure to check out triggers somebody going to look',
    ],
  },
  {
    hazard: 'Violence and aggression towards guest-facing staff',
    whoIsAtRisk: 'Reception, spa attendants, therapists, instructors',
    controlsToVerify: [
      'Staff are trained on de-escalation and on when to withdraw',
      'Withdrawing is explicitly permitted and nobody is expected to stand their ground',
      'Help can be summoned from the desk without leaving it',
      'Two people handle any request to leave, never one',
      'Incidents are recorded and reviewed for patterns rather than absorbed as part of the job',
      'Support is given afterwards and the person is not sent straight back to the desk',
      'Alcohol and intoxication policy is written and applied',
    ],
  },
  {
    hazard: 'Inappropriate behaviour towards therapists during treatments',
    whoIsAtRisk: 'Therapists',
    controlsToVerify: [
      'A written policy covers what a therapist does, and ending the treatment is explicitly permitted',
      'A therapist can summon help without leaving the room',
      'Draping and consent are covered in the procedure and in training',
      'A guest who behaves inappropriately is recorded and refused future bookings by a written process',
      'Support and follow-up are given to the therapist, the same day',
      'New and younger therapists are briefed on this specifically before their first treatment alone',
    ],
    note:
      'It happens, it is under-reported, and the reason it is under-reported is that the therapist is not sure '
      + 'they are allowed to stop. Writing that down is the control.',
  },
  {
    hazard: 'Display screen equipment at reception and office workstations',
    whoIsAtRisk: 'Reception and administrative staff',
    controlsToVerify: [
      'Workstation assessments are completed for anybody who uses a screen for long periods',
      'Seating is adjustable and adjusted for the person rather than left where the last shift put it',
      'Screens are positioned to avoid glare, including from pool hall glazing',
      'Breaks away from the screen are possible in practice as well as in policy',
      'Eye test provision is offered where the regulations require it',
      'A standing desk position is available where somebody is at the desk all day',
    ],
  },
  {
    hazard: 'Repetitive strain and musculoskeletal injury in therapists',
    whoIsAtRisk: 'Therapists',
    controlsToVerify: [
      'Couch height is adjustable and therapists are trained to set it for themselves',
      'Maximum treatment hours and consecutive treatments are set, and the booking system enforces them',
      'A limit exists on consecutive deep tissue or heavy treatments',
      'Rotas vary treatment type through a shift rather than blocking one type together',
      'A break between treatments is real rather than nominal',
      'Therapists report early symptoms without it affecting their rota, and those reports are acted on',
      'Occupational health referral is available and is used',
      'Hand, wrist and thumb technique is covered in training and periodically reviewed',
    ],
    note:
      'The most likely injury in a spa, over years, and it ends careers. It almost never appears on a register '
      + 'because it never produces an incident to report.',
  },
]

export const VULNERABLE: Hazard[] = [
  {
    hazard: 'New and expectant mothers on the staff',
    whoIsAtRisk: 'Pregnant employees, new mothers, the unborn child',
    controlsToVerify: [
      'A specific assessment is carried out as soon as the property is told, and repeated as the pregnancy progresses',
      'Chemical handling, particularly pool chemicals, is reviewed and usually removed',
      'Work in heat, including thermal suites and hot classes, is reviewed and restricted',
      'Manual handling and prolonged standing are reviewed, including a full day of treatments',
      'Rest facilities are available, and the right to them is known',
      'Night and lone working are reviewed',
      'Adjustments are recorded and reviewed rather than agreed verbally',
      'Facilities for a returning mother who is breastfeeding are provided',
    ],
    note:
      'Heat and chemicals are both specifically relevant, and a spa is the one workplace where a pregnant '
      + 'employee is exposed to both in the same shift.',
  },
  {
    hazard: 'Vulnerable guests: children, older guests and disabled guests',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Age limits and supervision ratios are set for every facility and enforced rather than posted',
      'Health screening identifies who should not use which facility, and the answer is acted on',
      'Step-free access and pool access arrangements are stated, and their absence is stated honestly',
      'Personal emergency evacuation arrangements exist for guests who need them',
      'Staff know how to identify who may need help before an emergency rather than during one',
      'Facilities most likely to affect somebody with a cardiac condition are separately signed and advised',
      'Assistance dogs have a written policy covering where they may and may not go',
      'Staff are trained on this, and the training is recorded',
    ],
  },
  {
    hazard: 'Young workers, new starters and work experience',
    whoIsAtRisk: 'Employees under eighteen, new starters, apprentices',
    controlsToVerify: [
      'A specific assessment exists for anybody under eighteen',
      'Chemical handling and plant room access are prohibited or restricted for young workers',
      'Nobody works alone or supervises water before they are assessed as competent to',
      'Induction covers the emergency plan before the first shift, not in the first month',
      'Supervision arrangements are named rather than assumed',
      'Working hours and break entitlements for young workers are known and applied',
      'A new starter knows they may say they do not know how to do something',
    ],
  },
  {
    hazard: 'Contractors, delivery drivers and visiting workers',
    whoIsAtRisk: 'Contractors, staff, guests',
    controlsToVerify: [
      'Competence and insurance are checked before work starts, every time',
      'A method statement and risk assessment are provided and read rather than filed',
      'Induction is given on every visit and is recorded',
      'Permit to work arrangements exist for hot work, confined space, height and isolation',
      'Work that may not happen while guests are present is defined',
      'Contractors are signed in and out, and somebody confirms they have gone',
      'The work is checked before the area reopens, by somebody from the property',
      'Laundry and chemical deliveries have their own agreed route and time',
    ],
  },
  {
    hazard: 'First aid provision: is it adequate for this operation',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'A first aid needs assessment has been carried out for the spa specifically, not inherited from the hotel',
      'It accounts for water, heat, cold, exertion and the treatment rooms',
      'The number of trained first aiders covers every hour the spa is open, including quiet periods',
      'Qualifications are current and somebody checks the expiry dates',
      'A defibrillator is available, in date, and reachable from the pool within a minute',
      'Kits are stocked, in date, and checked on a recorded schedule',
      'Somebody on every shift can carry out a pool rescue and knows the spinal procedure',
      'The assessment is reviewed when the operation, the facilities or the hours change',
    ],
    note:
      'A needs assessment written for a hotel does not cover a spa. The hazards are different, the casualty is '
      + 'usually undressed and wet, and the response time to a pool is measured in seconds.',
  },
]
