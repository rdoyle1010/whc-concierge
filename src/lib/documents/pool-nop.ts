import type { PlanSection } from './plan-types'

// The Normal Operating Procedure for a spa's pools and wet areas.
//
// Under HSG179 a pool operator needs a written Pool Safety Operating
// Procedure, of which this is one half: how the pool runs on an ordinary day.
// The other half is the Emergency Action Plan, which is a separate document
// because it gets laminated and put on a wall.
//
// Almost every value here is blank, and that is the document rather than a
// shortcoming of it. A NOP is a statement of facts about one building: the
// length of the pool, the depth at each end, the bather load, where a
// supervisor stands and what they can see from there. Any of those invented
// by somebody who has not walked the building would be worse than no document
// at all, because a plausible wrong number gets believed, trained against and
// produced to an assessor.
//
// What is stated here is the structure, the discipline and the industry norms
// that hold everywhere: that a bather load has to be calculated and written
// down, that water is tested before opening and at intervals through the day,
// that a supervisor's zone has to be one they can actually see. The property
// supplies the facts. We supply the questions, in the order HSG179 asks them.

const PART = 'B. Pool and wet areas'

export const POOL_NOP_SECTIONS: PlanSection[] = [

  {
    part: PART,
    heading: 'The pools and wet facilities',
    intro:
      'Complete one row for every pool, plunge, hydrotherapy pool, sauna, steam room and experience shower on '
      + 'the premises. A facility missing from this table is a facility nobody has written a procedure for.',
    mustBeChecked: true,
    table: {
      columns: ['Facility', 'Dimensions', 'Depth, shallow to deep', 'Volume', 'Temperature range', 'Turnover period'],
      rows: Array.from({ length: 8 }, () => ['', '', '', '', '', '']),
      fillable: true,
    },
  },

  {
    part: PART,
    heading: 'Features, and the hazards they carry',
    intro:
      'Anything that changes how the water behaves or how a bather enters it. Each one alters supervision, and '
      + 'several of them alter the bather load.',
    facts: [
      { label: 'Moveable floor or boom, and its operating procedure', long: true },
      { label: 'Flumes, slides or water features, and their controls', long: true },
      { label: 'Air or water jets, counter-current units, and their stop controls', long: true },
      { label: 'Diving or jumping permitted, and from where', hint: 'State clearly if it is prohibited, and how that is enforced.' },
      { label: 'Steps, handrails, ramps and level-access entry points' },
      { label: 'Deep water areas and how they are marked' },
      { label: 'Lighting levels, and underwater lighting where fitted' },
      { label: 'Where the pool floor is visible from, and where it is not', long: true, hint: 'Glare, reflection and blind spots decide where a supervisor has to stand.' },
    ],
  },

  {
    part: PART,
    heading: 'Maximum bather load',
    intro:
      'The number of people permitted in the water at one time, calculated for this pool and written down. It is '
      + 'the first figure an assessor asks for and the first one a busy Saturday breaks.',
    facts: [
      { label: 'Maximum bather load, main pool', hint: 'Calculated from water area, depth profile and the activity. Show the calculation.' },
      { label: 'Maximum bather load, each other pool or plunge', long: true },
      { label: 'How the load is calculated', long: true, hint: 'A number with no method behind it cannot be defended or recalculated when the operation changes.' },
      { label: 'How occupancy is counted and by whom' },
      { label: 'What happens when the load is reached', long: true, hint: 'Who decides, what they say, and how people are held or turned away.' },
      { label: 'Reduced load conditions', long: true, hint: 'Poor clarity, reduced supervision, a feature out of use, a hire booking.' },
    ],
    mustBeChecked: true,
  },

  {
    part: PART,
    heading: 'Supervision',
    intro:
      'Who watches the water, from where, and what they can see from there. Constant poolside supervision and '
      + 'a defined alternative are different arrangements with different consequences, and the property must '
      + 'state which is in force and when.',
    facts: [
      { label: 'Level of supervision in force', long: true, hint: 'Constant lifeguard supervision, or a documented alternative with the risk assessment that supports it.' },
      { label: 'Hours during which each level applies' },
      { label: 'Number of supervisors required, by time and by occupancy' },
      { label: 'Supervision zones, and what is visible from each', long: true, hint: 'A zone somebody cannot see the floor of is not a zone.' },
      { label: 'Maximum time on a zone before rotation', hint: 'Effective scanning falls away well before an hour. State the rotation and hold to it.' },
      { label: 'Qualifications required, and who currently holds them', long: true },
      { label: 'How supervision is maintained during breaks and handovers' },
      { label: 'What happens if a supervisor is unavailable', long: true, hint: 'Closing the water is a legitimate answer and usually the correct one.' },
    ],
    mustBeChecked: true,
  },

  {
    part: PART,
    heading: 'Admission, and who may not swim unaccompanied',
    facts: [
      { label: 'Minimum age for unaccompanied use' },
      { label: 'Adult to child ratios, by age' },
      { label: 'Health conditions that require advice before use', long: true, hint: 'Cardiac conditions, pregnancy, epilepsy, recent surgery, and anything specific to your facilities.' },
      { label: 'Where the conditions of use are displayed' },
      { label: 'How non-swimmers are identified and managed' },
      { label: 'Alcohol policy, and how it is enforced', hint: 'Spa operations that serve alcohol need this written down and applied.' },
      { label: 'Maximum immersion times, where posted', hint: 'Cold plunge, sauna, steam and hydrotherapy each need their own.' },
    ],
  },

  {
    part: PART,
    heading: 'Water quality testing',
    intro:
      'Tested before opening, at intervals through the day, and recorded every time. A reading taken and not '
      + 'written down did not happen, which is the position the property is in when it is asked to prove it.',
    facts: [
      { label: 'Parameters tested, and the acceptable range for each', long: true, hint: 'Free and combined chlorine or equivalent, pH, temperature, alkalinity, clarity.' },
      { label: 'Testing frequency, per pool', hint: 'Before opening and at stated intervals through operating hours, more often at high bather load.' },
      { label: 'Who is competent to test, and their training record' },
      { label: 'Where results are recorded, and for how long they are kept' },
      { label: 'Action when a reading is out of range', long: true, hint: 'Who is told, what is adjusted, whether the pool closes, and who decides.' },
      { label: 'When the pool must be closed on a reading', long: true },
      { label: 'Microbiological sampling frequency and laboratory used' },
    ],
    mustBeChecked: true,
  },

  {
    part: PART,
    heading: 'Chemical handling and plant',
    intro:
      'The plant room is the highest-consequence area in the building and the one fewest people are competent '
      + 'to enter. Everything here is property-specific and none of it may be assumed.',
    facts: [
      { label: 'Treatment system in use', long: true, hint: 'Named by type rather than brand: automatic dosing, manual, ozone, UV, salt.' },
      { label: 'Chemicals held, and where', long: true },
      { label: 'Who is competent to dose, and their qualification' },
      { label: 'Personal protective equipment required, and where it is kept' },
      { label: 'Location of safety data sheets' },
      { label: 'Emergency stop and isolation points, and where they are' },
      { label: 'Eyewash and emergency shower locations' },
      { label: 'Delivery procedure, including who may accept a delivery', long: true },
      { label: 'Backwash procedure and frequency' },
      { label: 'Never to be mixed, and how that is enforced physically', long: true, hint: 'Separation, locks and labelling, not a note on a wall.' },
    ],
    mustBeChecked: true,
  },

  {
    part: PART,
    heading: 'Rescue and first aid equipment',
    intro: 'Listed, located, and checked on a stated frequency by a named role.',
    table: {
      columns: ['Equipment', 'Location', 'Quantity', 'Checked by', 'Frequency'],
      rows: [
        ['Reaching pole or torpedo buoy', '', '', '', ''],
        ['Throwing aid', '', '', '', ''],
        ['Spinal board and head immobiliser', '', '', '', ''],
        ['First aid kit', '', '', '', ''],
        ['Automated external defibrillator', '', '', '', ''],
        ['Emergency alarm or call points', '', '', '', ''],
        ['Emergency telephone', '', '', '', ''],
        ['Oxygen, where provided', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },

  {
    part: PART,
    heading: 'Opening the facility',
    intro: 'In order, every day, by a named role, recorded.',
    actions: [
      { name: 'Water test', action: 'Test every pool and record the results before any bather enters. A reading outside range stops the opening until it is corrected and retested.', by: '' },
      { name: 'Clarity check', action: 'Confirm the floor of the deepest point is clearly visible from the poolside. Where it is not, the pool does not open.', by: '' },
      { name: 'Walk the wet areas', action: 'Check for damage, standing water, loose tiles, missing grilles, blocked drains and anything left in the water overnight.', by: '' },
      { name: 'Rescue equipment', action: 'Confirm every item on the equipment list is present, in place, and serviceable.', by: '' },
      { name: 'Alarms and communications', action: 'Test the emergency alarm and confirm the emergency telephone is working.', by: '' },
      { name: 'Temperatures', action: 'Check and record water and air temperatures against the stated range for each facility.', by: '' },
      { name: 'Supervision in place', action: 'Confirm the required number of qualified supervisors is on duty before the first bather enters.', by: '' },
      { name: 'Record and open', action: 'Sign the opening record. The facility does not open until every line above is complete.', by: '' },
    ],
  },

  {
    part: PART,
    heading: 'Through the day',
    actions: [
      { name: 'Test to schedule', action: 'Test and record water quality at the stated intervals, and again after any significant change in bather load.', by: '' },
      { name: 'Rotate supervision', action: 'Rotate supervisors between zones at the stated interval so nobody scans one area beyond the point they can do it well.', by: '' },
      { name: 'Watch the load', action: 'Count occupancy and act at the stated maximum. Do not allow the count to be an estimate at the busiest hour of the week.', by: '' },
      { name: 'Check the wet areas', action: 'Walk the changing rooms, showers and surrounds at the stated interval, checking for standing water and hazards.', by: '' },
      { name: 'Record everything', action: 'Complete the log as each check happens rather than at the end of the shift.', by: '' },
    ],
  },

  {
    part: PART,
    heading: 'Closing the facility',
    actions: [
      { name: 'Clear the water', action: 'Check every pool, plunge and feature is empty, including any area not visible from the main poolside.', by: '' },
      { name: 'Check the wet areas', action: 'Check saunas, steam rooms, showers, changing rooms, lockers and cubicles. Somebody asleep in a sauna is the failure this step exists for.', by: '' },
      { name: 'Final water test', action: 'Test and record, and set any overnight dosing or backwash required.', by: '' },
      { name: 'Secure', action: 'Cover or secure pools where applicable, secure the plant room, and set the alarm.', by: '' },
      { name: 'Record and hand over', action: 'Sign the closing record and note anything the next shift must know.', by: '' },
    ],
  },

  {
    part: PART,
    heading: 'Training and competence',
    facts: [
      { label: 'Induction required before working poolside', long: true },
      { label: 'Qualifications required for each role', long: true },
      { label: 'Refresher and competency check frequency', hint: 'Pool rescue competence decays quickly. Monthly practice is the industry norm.' },
      { label: 'Emergency drill frequency, and who attends' },
      { label: 'Where training records are held' },
      { label: 'Who verifies a qualification is current, and how often' },
    ],
    mustBeChecked: true,
  },

  {
    part: PART,
    heading: 'Hire to outside organisations',
    intro:
      'A hirer running a session in your water is operating under your procedures unless something in writing '
      + 'says otherwise, and that written agreement is where the confusion gets settled before an incident.',
    facts: [
      { label: 'Whether the facility is hired out, and to whom' },
      { label: 'Supervision responsibility during a hire', long: true, hint: 'State explicitly who provides lifeguards, and what happens if the hirer does not.' },
      { label: 'What the hirer must provide in writing before a session', long: true, hint: 'Qualifications, insurance, their own risk assessment and emergency arrangements.' },
      { label: 'Bather load during hire, where different' },
      { label: 'Who holds the emergency responsibility during a hire' },
    ],
  },

]
