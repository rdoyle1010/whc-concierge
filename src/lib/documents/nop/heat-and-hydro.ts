import type { PlanSection } from '../plan-types'

// Part C. Heat, cold and hydrotherapy.
//
// The facilities a spa is actually bought for, and the ones with the least
// written down about them. A pool has HSG179 behind it and everybody knows
// it. A sauna at ninety degrees with a guest asleep in it has almost nothing,
// and the check frequency is the only control that matters.

const PART = 'C. Heat, cold and hydrotherapy'

export const HEAT_SECTIONS: PlanSection[] = [
  {
    part: PART,
    heading: 'Every heat and cold experience, listed',
    intro: 'One row per cabin, pool or shower. Temperatures stated as the operating range, not the set point.',
    mustBeChecked: true,
    table: {
      columns: ['Facility', 'Operating temperature', 'Humidity', 'Capacity', 'Maximum time', 'Checked how often'],
      rows: Array.from({ length: 12 }, () => ['', '', '', '', '', '']),
      fillable: true,
    },
  },
  {
    part: PART,
    heading: 'Saunas and dry heat',
    facts: [
      { label: 'Operating temperature and how it is controlled' },
      { label: 'How temperature is verified independently of the display', hint: 'A display reading the element rather than the room is a display that will be believed.' },
      { label: 'Maximum recommended time, and where it is posted' },
      { label: 'Heater guarding, and how it is checked' },
      { label: 'Where the emergency call point is, and whether it can be reached from the bench' },
      { label: 'How often the cabin is checked, and by whom', hint: 'Opening the door and looking. Somebody who has fainted is not visible through glass and will not press anything.' },
      { label: 'Water and ladle arrangements, where provided' },
      { label: 'Essential oils or infusions used, and who applies them' },
      { label: 'Cleaning schedule, including the benches and the floor beneath them' },
      { label: 'What is checked at closing, and how a cabin is confirmed empty', long: true },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Steam rooms and wet heat',
    facts: [
      { label: 'Operating temperature and humidity' },
      { label: 'Steam outlet position, and how anybody is prevented from leaning on it' },
      { label: 'Visibility inside, and how a guest in difficulty would be seen', long: true, hint: 'This is the hardest facility in the spa to supervise, and the check frequency is the whole control.' },
      { label: 'Emergency call point position' },
      { label: 'Check frequency, and by whom' },
      { label: 'Cleaning and disinfection schedule', hint: 'Warm, wet, and used barefoot. The hygiene regime matters more here than anywhere except the pool.' },
      { label: 'Descaling and maintenance of the steam generator, and by whom' },
      { label: 'Fragrance or eucalyptus dosing, and the product used' },
      { label: 'How the room is confirmed empty at closing' },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Cold plunge, ice and cold experiences',
    facts: [
      { label: 'Operating temperature range' },
      { label: 'Maximum immersion time posted, and for what temperature' },
      { label: 'Health advisory displayed at the point of entry', long: true },
      { label: 'Guidance given on entering: gradually, and never submerging the head' },
      { label: 'Whether the facility may be used when the area is unsupervised', hint: 'Cold water shock is involuntary and happens before anybody can decide anything.' },
      { label: 'Emergency call point position, reachable from inside' },
      { label: 'Water treatment and testing regime for this facility' },
      { label: 'Ice supply and hygiene, where an ice fountain is provided' },
      { label: 'Surround and steps: surface, drainage and handholds' },
      { label: 'Staff briefing on cold water shock, and how often it is repeated' },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Hydrotherapy and spa pools',
    intro:
      'Warm, aerated and agitated is the highest-risk water configuration there is, and a hydrotherapy pool is '
      + 'all three at once. Everything in this section is a water safety control as much as a guest one.',
    facts: [
      { label: 'Operating temperature and how it is controlled and verified' },
      { label: 'Maximum temperature, and what happens above it' },
      { label: 'Maximum immersion time posted' },
      { label: 'Bather load for this pool' },
      { label: 'Turnover period and filtration arrangement' },
      { label: 'Disinfection regime and the levels held', long: true },
      { label: 'Testing frequency, which is higher than a swimming pool', hint: 'Bather load per litre is far higher and temperature works against the disinfectant.' },
      { label: 'Drain down, clean and refill frequency, and who does it', long: true },
      { label: 'Legionella sampling frequency and the laboratory used' },
      { label: 'Air blower and jet operation, and when they run', hint: 'Aerosol is how legionella reaches lungs. When the blowers run matters.' },
      { label: 'Emergency stop for jets and blowers, and where it is' },
      { label: 'What closes the pool immediately', long: true },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Experience showers, buckets and features',
    facts: [
      { label: 'Experience showers provided, and their temperature ranges' },
      { label: 'Drench bucket or similar: safe operation and who may use it' },
      { label: 'Water temperature limits at every outlet, and how they are verified' },
      { label: 'Cleaning and descaling schedule' },
      { label: 'Hygiene arrangements for shared handles, chains and controls' },
      { label: 'Any feature with a height, a step or a moving part, and its controls' },
    ],
  },
  {
    part: PART,
    heading: 'The thermal journey',
    intro:
      'The order guests are advised to use the facilities in, and what the spa tells them about it. Most guests '
      + 'have no idea, and the ones who feel unwell are usually the ones who did it in the wrong order.',
    facts: [
      { label: 'The recommended sequence, and where it is explained to guests', long: true },
      { label: 'Guidance on hydration during a thermal circuit' },
      { label: 'Guidance on rest periods between experiences' },
      { label: 'Advice on alcohol before and during a spa visit', long: true },
      { label: 'Advice on food before and during a spa visit' },
      { label: 'How the team is trained to give this advice consistently', long: true },
      { label: 'How a guest who looks unwell is approached', long: true, hint: 'Somebody overheating does not know they are overheating. Waiting for them to ask is not a control.' },
    ],
  },
  {
    part: PART,
    heading: 'Relaxation areas',
    facts: [
      { label: 'Relaxation spaces provided, and their capacity' },
      { label: 'Supervision or check frequency', hint: 'A guest who falls asleep after a heat experience and a guest who has fainted look identical.' },
      { label: 'Drinking water availability' },
      { label: 'Blanket, robe and towel hygiene arrangements' },
      { label: 'Lighting levels, and whether a guest in difficulty would be seen', long: true },
      { label: 'Noise and phone policy, and how it is enforced' },
      { label: 'How the area is confirmed empty at closing' },
    ],
  },
]
