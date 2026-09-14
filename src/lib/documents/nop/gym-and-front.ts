import type { PlanSection } from '../plan-types'

// Parts E and F. The gym, the studio, and everything in front of house.
//
// A spa gym is not a gym. It is used by people who have just come out of a
// sauna or a hot pool, often on holiday, often having had a drink, and often
// with no induction because they are a hotel guest for one night. Almost
// nothing written for a health club addresses that.

const GYM = 'E. Gym, studio and fitness'
const FRONT = 'F. Reception, retail and back of house'

export const GYM_SECTIONS: PlanSection[] = [
  {
    part: GYM,
    heading: 'The gym and studio',
    facts: [
      { label: 'Gym floor area and its stated capacity' },
      { label: 'Operating hours, and any unsupervised access hours', long: true, hint: 'Unsupervised access is a different operation with different controls, and it needs its own risk assessment.' },
      { label: 'Who may use the gym, and from what age' },
      { label: 'Minimum age for unaccompanied use, and the ratio below it' },
      { label: 'Supervision arrangement during staffed hours' },
      { label: 'Studio spaces, their capacity and what they are used for' },
      { label: 'Ventilation and temperature, and how they are monitored' },
      { label: 'Emergency call point positions on the gym floor and in each studio' },
      { label: 'Defibrillator location, and whether it is reachable from the gym within a minute' },
    ],
    mustBeChecked: true,
  },
  {
    part: GYM,
    heading: 'Induction and screening',
    facts: [
      { label: 'Whether an induction is required before unsupervised use, and how it is enforced', long: true },
      { label: 'What the induction covers' },
      { label: 'How induction is recorded, and for how long it stands' },
      { label: 'Health screening completed before first use', long: true },
      { label: 'How a hotel guest staying one night is handled', long: true, hint: 'This is the case that breaks most gym procedures: no membership, no induction, one night, and a sauna beforehand.' },
      { label: 'Guidance given about using the gym after heat or cold experiences', long: true },
      { label: 'Guidance about alcohol before using the gym' },
      { label: 'Who may refuse access, and on what grounds' },
    ],
    mustBeChecked: true,
  },
  {
    part: GYM,
    heading: 'Equipment',
    table: {
      columns: ['Equipment type', 'Quantity', 'Daily check by', 'Serviced by', 'Frequency'],
      rows: [
        ['Treadmills', '', '', '', ''],
        ['Cross trainers and bikes', '', '', '', ''],
        ['Rowing machines', '', '', '', ''],
        ['Resistance machines', '', '', '', ''],
        ['Free weights and racks', '', '', '', ''],
        ['Benches', '', '', '', ''],
        ['Cable and functional equipment', '', '', '', ''],
        ['Mats and small equipment', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
  },
  {
    part: GYM,
    heading: 'Daily gym checks',
    actions: [
      { name: 'Walk the floor', action: 'Check every machine for damage, loose fixings, frayed cables and worn belts. Check emergency stops on cardiovascular equipment.', by: '' },
      { name: 'Check the weights', action: 'Confirm free weights are racked, collars and clips are present, and the floor around the racks is clear.', by: '' },
      { name: 'Check the environment', action: 'Check temperature, ventilation, lighting and that the floor is clean and dry.', by: '' },
      { name: 'Check the safety equipment', action: 'Confirm the call point works, the first aid kit is stocked and the defibrillator is in date.', by: '' },
      { name: 'Take faults out of use', action: 'Anything faulty is unplugged where applicable, labelled out of use, and reported. Not left with a handwritten note.', by: '' },
      { name: 'Record it', action: 'Sign the check. An unsigned check is a check nobody did.', by: '' },
    ],
  },
  {
    part: GYM,
    heading: 'Classes and instruction',
    facts: [
      { label: 'Classes offered, and the qualification required to instruct each' },
      { label: 'Maximum class size per studio' },
      { label: 'Health screening required before a class' },
      { label: 'How an instructor is briefed on emergency procedures for this building', long: true },
      { label: 'Insurance position for instructors, including any who are self-employed', long: true },
      { label: 'Heated or hot classes: their own temperature limits, hydration and maximum duration', long: true },
      { label: 'Equipment used in classes, and who checks it' },
      { label: 'What an instructor does if a participant is in difficulty', long: true },
    ],
    mustBeChecked: true,
  },
]

export const FRONT_SECTIONS: PlanSection[] = [
  {
    part: FRONT,
    heading: 'Arrival and admission',
    actions: [
      { name: 'Confirm the booking', action: 'Confirm who the guest is, what they have booked and which facilities they may use.', by: '' },
      { name: 'Screen', action: 'Complete the health screening for the facilities they will use, and act on anything disclosed.', by: '' },
      { name: 'Explain the conditions of use', action: 'Cover the rules, the thermal journey, maximum times, where to find staff and how to raise the alarm.', by: '' },
      { name: 'Issue and record', action: 'Issue the locker, robe and any wristband, and record what was issued to whom.', by: '' },
      { name: 'Note anything relevant', action: 'Pass anything the team needs to know to the spa floor, discreetly and without recording more than is necessary.', by: '' },
    ],
  },
  {
    part: FRONT,
    heading: 'Reception, bookings and the desk',
    facts: [
      { label: 'Booking system in use, and who has access' },
      { label: 'How a treatment is matched to a qualified therapist at the point of booking', long: true },
      { label: 'How a double booking or an unqualified allocation is prevented', long: true },
      { label: 'Minimum staffing at the desk' },
      { label: 'Cash handling and reconciliation, in outline' },
      { label: 'Where guest records are held, and who may see them' },
      { label: 'How long guest records are kept, and how they are disposed of' },
      { label: 'What is done about a guest who arrives intoxicated', long: true },
      { label: 'What is done about a guest who refuses to leave', long: true },
      { label: 'How a member of staff at the desk summons help without leaving it' },
    ],
    mustBeChecked: true,
  },
  {
    part: FRONT,
    heading: 'Changing rooms and lockers',
    facts: [
      { label: 'Changing facilities provided, and their capacity' },
      { label: 'Locker system, and who holds the master override' },
      { label: 'Check frequency during trading hours, including opening every cubicle', hint: 'A guest who faints after a heat experience does it here more often than at the poolside.' },
      { label: 'How a cubicle door is opened from outside in an emergency' },
      { label: 'Call point or alarm position in the changing area' },
      { label: 'Hot water temperature limits at showers and basins, and how they are verified' },
      { label: 'Cleaning schedule during trading hours, not only at opening' },
      { label: 'Lost property procedure, and how long property is held' },
      { label: 'Policy on photography and phones in changing areas, and how it is enforced' },
      { label: 'Closing check: every cubicle, locker bank, shower and toilet', long: true },
    ],
    mustBeChecked: true,
  },
  {
    part: FRONT,
    heading: 'Retail',
    facts: [
      { label: 'Products sold, and where they are stored' },
      { label: 'Stock control system and reconciliation frequency' },
      { label: 'High value stock security' },
      { label: 'Advice given at the point of sale, and what may not be claimed about a product', long: true, hint: 'A product described as treating a condition is a medical claim, and it is the spa that made it.' },
      { label: 'Returns and reactions: what happens when a guest reports a reaction to something bought', long: true },
      { label: 'Testers and hygiene at the display' },
    ],
  },
  {
    part: FRONT,
    heading: 'Food, drink and refreshment',
    facts: [
      { label: 'What is served in the spa, and by whom' },
      { label: 'Allergen information: how it is held and how it is given', long: true, hint: 'This is a legal requirement with its own enforcement, and a spa serving a cake is within it.' },
      { label: 'Food hygiene responsibility, and who holds the qualification' },
      { label: 'Glassware policy in wet areas, and what is used instead' },
      { label: 'Alcohol served in the spa, and the policy on it', long: true },
      { label: 'Drinking water availability throughout the spa' },
      { label: 'Cleaning and waste arrangements for food areas' },
    ],
    mustBeChecked: true,
  },
  {
    part: FRONT,
    heading: 'Guest information and signage',
    intro:
      'Every rule in this document that a guest is expected to follow has to reach them somehow. A rule they were '
      + 'never told is not a control, it is an explanation prepared for afterwards.',
    table: {
      columns: ['Information', 'Where it is displayed', 'Also given how', 'Checked by', 'Frequency'],
      rows: [
        ['Conditions of use', '', '', '', ''],
        ['Health advisory for heat and cold', '', '', '', ''],
        ['Maximum times for each facility', '', '', '', ''],
        ['Pool depths and no diving', '', '', '', ''],
        ['Supervision of children', '', '', '', ''],
        ['Bather load or capacity', '', '', '', ''],
        ['How to raise the alarm', '', '', '', ''],
        ['Fire exits and assembly point', '', '', '', ''],
        ['No glass in wet areas', '', '', '', ''],
        ['Photography and phone policy', '', '', '', ''],
        ['Shower before entering the water', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
]
