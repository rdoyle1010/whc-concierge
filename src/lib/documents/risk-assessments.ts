import type { Hazard, PlanSection } from './plan-types'

// Risk assessments for a luxury spa, by area.
//
// Written hazard-led rather than building-led, which is the difference
// between a template that can be sold twice and a template that describes one
// hotel. A register naming three ice plunge pools and a specific terrace is
// that property's document: another spa reading it either deletes half of it
// or, worse, keeps it.
//
// Nothing here is scored. The likelihood, the severity and the number that
// follows are a judgement made by a competent person standing in the room,
// and a pre-scored assessment is a property filing somebody else's opinion of
// its own premises. It is also the one document in this library with a legal
// life of its own: an assessment nobody assessed, signed by somebody who only
// read it, is the failure that ends up in front of a coroner.
//
// The controls are offered as things to tick once seen, never as statements
// that they are in place. Printing "non-slip flooring fitted" on a document
// for a spa nobody has visited asserts something that may not be true, and
// the assertion is exactly what gets relied on afterwards.

export const METHOD_SECTION: PlanSection = {
  heading: 'How to complete this assessment',
  intro:
    'Walk the area with this document in your hand. Do not complete it at a desk: an assessment written from '
    + 'memory reads exactly like one written from observation, and only one of them finds anything.',
  bullets: [
    'Tick a control only when you have seen it, working, today. An unticked control is a gap, and the gap is the point of the exercise.',
    'Score likelihood 1 to 5, where 1 is very unlikely and 5 is almost certain, for this area as it actually operates rather than as it should.',
    'Score severity 1 to 5, where 1 is minor and needs no first aid and 5 is a fatality or a permanent injury.',
    'Multiply the two. 1 to 6 is low, 8 to 12 is medium, 15 to 25 is high. A high score is not a number to record, it is a thing to stop or control before the area is used again.',
    'Where further controls are needed, name a person and a date. A control with no owner is a note, and a note changes nothing.',
    'Score the residual level assuming the further controls are in place. Where the residual is still high, escalate it rather than accepting it.',
    'Add any hazard specific to this building. This list is a starting point and is not exhaustive, and the hazard nobody thought of is the one that hurts somebody.',
  ],
  mustBeChecked: true,
}

export const REVIEW_SECTION: PlanSection = {
  heading: 'Review and sign-off',
  facts: [
    { label: 'Assessed by, and their competence to do so', long: true, hint: 'Training, qualification or experience that makes this person the right one to have done it.' },
    { label: 'Date assessed' },
    { label: 'Reviewed by, and their role' },
    { label: 'Review date', hint: 'Annually at a minimum, and immediately after any incident, near miss, change of layout, change of equipment or change of team.' },
    { label: 'How the team is told what this assessment found', long: true, hint: 'A risk assessment nobody has been briefed on changes nothing about how the area is used.' },
    { label: 'Where this assessment is held, and who can reach it' },
  ],
  mustBeChecked: true,
}

const area = (heading: string, intro: string, hazards: Hazard[]): PlanSection[] => [
  METHOD_SECTION,
  { heading, intro, hazards, mustBeChecked: true },
  REVIEW_SECTION,
]

// ---------------------------------------------------------------------------

export const POOL_SURROUND_HAZARDS: Hazard[] = [
  {
    hazard: 'Slips, trips and falls on a wet surround',
    whoIsAtRisk: 'Guests, staff, contractors',
    controlsToVerify: [
      'Flooring is slip resistant when wet, throughout, including any transition between two surfaces',
      'Standing water drains away rather than pooling, and drains are clear',
      'A cleaning schedule covers the surround during trading hours, not only before opening',
      'Wet floor signage is available and used where a spill occurs',
      'Running is discouraged by signage and by staff intervention, not signage alone',
      'Steps, level changes and ramps are visually distinct and lit',
      'Handrails are present, secure and continuous where fitted',
    ],
    note:
      'Barefoot guests on a wet tiled surround is the single most common injury in a spa. It is rarely severe and '
      + 'it is constant, so the likelihood and the severity usually pull in opposite directions.',
  },
  {
    hazard: 'Drowning or submersion',
    whoIsAtRisk: 'Guests, particularly children and weak swimmers',
    controlsToVerify: [
      'The supervision arrangement is written down, in force, and matches what is actually happening',
      'The floor of the deepest point is clearly visible from the poolside before opening and throughout the day',
      'Depths are marked and legible from the water as well as from the side',
      'Rescue equipment is present, in date and reachable within seconds from anywhere on the surround',
      'Somebody on duty holds a current pool rescue qualification whenever the water is open',
      'The maximum bather load is calculated, posted and enforced',
      'Unaccompanied use by minors is governed by a stated age and ratio',
    ],
    note:
      'A high severity score is not a reason to soften the likelihood. A silent submersion in a busy pool takes '
      + 'under a minute and does not look like the films.',
  },
  {
    hazard: 'Diving or jumping into shallow water',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Diving is prohibited where the depth does not permit it, and the prohibition is signed at every entry point',
      'Staff intervene when it happens rather than relying on the sign',
      'Depth markings are visible from the point somebody would jump from',
      'A spinal board and head immobiliser are available, and somebody on duty is trained to use them',
    ],
    note: 'Low likelihood, catastrophic severity, and entirely preventable by intervention rather than by signage.',
  },
  {
    hazard: 'Entrapment in a drain, grille or suction outlet',
    whoIsAtRisk: 'Guests, particularly children and anyone with long hair',
    controlsToVerify: [
      'Every grille and outlet cover is present, undamaged and secured so it cannot be removed by hand',
      'Covers are checked on a stated frequency and the check is recorded',
      'An emergency stop for circulation is reachable from the poolside and staff know where it is',
      'Any missing or damaged cover closes the pool until it is replaced',
    ],
  },
  {
    hazard: 'Glass or sharp objects in or beside the water',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Glassware is prohibited in wet areas, and the alternative provided is genuinely used',
      'Breakage in or near the water closes the pool until it is cleared by a competent person',
      'A written procedure exists for glass in the water, and the team know it',
    ],
  },
]

export const COLD_PLUNGE_HAZARDS: Hazard[] = [
  {
    hazard: 'Cold water shock and cardiac events',
    whoIsAtRisk: 'Guests, particularly anyone with an undiagnosed cardiac condition',
    controlsToVerify: [
      'A health advisory is displayed at the point of entry, not at reception only',
      'A maximum immersion time is posted and is specific to the temperature in use',
      'Guests are advised to enter gradually and never to submerge the head on entry',
      'Nobody uses the plunge alone when the area is unsupervised',
      'A call point or alarm is reachable from inside the plunge',
      'Staff are briefed on the signs of cold water shock and what to do',
      'Water temperature is monitored and recorded, and a lower than intended temperature stops use',
    ],
    note:
      'The gasp reflex on entry is involuntary and happens before anybody can decide anything. A guest who '
      + 'submerges on entry inhales. The severity is the reason this is assessed separately from the main pool.',
  },
  {
    hazard: 'Slips on a cold, wet surround',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Flooring around the plunge is slip resistant when wet and cold',
      'Drainage carries water away from the walking route',
      'Handholds are fitted at the entry and exit point and are secure',
      'Steps into the plunge are visible, even, and lit',
    ],
  },
  {
    hazard: 'Use after alcohol, heat exposure or a heavy treatment',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Guidance on the order of use is given at the start of the visit, not left to be discovered',
      'Staff are briefed to intervene where somebody appears unwell, unsteady or intoxicated',
      'An alcohol policy for wet areas exists and is applied',
    ],
  },
]

export const HYDROTHERAPY_HAZARDS: Hazard[] = [
  {
    hazard: 'Scalding from water above the intended temperature',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Temperature is thermostatically controlled and independently verified rather than trusted to the display',
      'The maximum temperature is posted where a guest sees it before entering',
      'Temperature is checked and recorded before opening and at stated intervals',
      'An out of range reading closes the facility until it is corrected and rechecked',
      'A high temperature alarm is fitted, or a check frequency exists that substitutes for one',
    ],
  },
  {
    hazard: 'Legionella and other waterborne infection from warm water',
    whoIsAtRisk: 'Guests, staff, anyone with a weakened immune system',
    controlsToVerify: [
      'A written water safety risk assessment exists and is current',
      'A named person is responsible for the water safety regime',
      'Temperatures, disinfection and sampling follow a written regime and are recorded',
      'Dead legs and infrequently used outlets are identified and flushed on a schedule',
      'Spa pools are drained, cleaned and refilled on the frequency the regime states',
      'Sampling results are reviewed by somebody competent and acted on',
    ],
    note:
      'Warm, aerated, agitated water is the highest-risk configuration there is for legionella, and a hydrotherapy '
      + 'pool is all three at once. This one cannot be assessed by looking at it.',
  },
  {
    hazard: 'Overheating, dehydration and fainting',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'A maximum immersion time is posted for the temperature in use',
      'Drinking water is available within sight of the facility',
      'Staff check the area on a stated frequency rather than only when passing',
      'A call point is reachable from inside the pool',
      'Guidance is given on use after alcohol or a heavy meal',
    ],
  },
  {
    hazard: 'Chemical exposure from dosing into an occupied pool',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Manual dosing never happens while the pool is occupied, and this is a written rule rather than a habit',
      'Automatic dosing is calibrated on a stated frequency and the calibration is recorded',
      'A dosing fault alarm exists, or a check frequency substitutes for one',
      'Staff know the procedure for a suspected overdose and it includes clearing the water first',
    ],
  },
]

export const HEAT_EXPERIENCE_HAZARDS: Hazard[] = [
  {
    hazard: 'Heat exhaustion, dehydration and collapse',
    whoIsAtRisk: 'Guests, particularly older guests and anyone with a cardiovascular condition',
    controlsToVerify: [
      'Maximum recommended time is posted at the entrance to each heat experience',
      'A health advisory names the conditions that require medical advice before use',
      'An emergency call point is fitted inside each cabin and is reachable from a bench',
      'Staff check the cabins on a stated frequency, by opening the door and looking, not by glancing through glass',
      'Drinking water is available immediately outside',
      'A cabin is never occupied when the area is closed or unsupervised, and this is checked at closing',
    ],
    note:
      'Somebody who has fainted in a sauna is not visible from outside and is not going to press anything. The '
      + 'check frequency is the control that matters most and it is the one most often reduced when busy.',
  },
  {
    hazard: 'Burns from hot surfaces, heaters and steam outlets',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Heater guards are fitted, secure and undamaged',
      'Steam outlets are positioned or guarded so nobody can sit or lean against them',
      'Benches and backrests are of a material that does not become a burn hazard',
      'Signage warns of hot surfaces at the entrance',
      'A towel is provided and its use on benches is encouraged',
    ],
  },
  {
    hazard: 'Slips inside and at the exit from a heat cabin',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Floor surfaces inside and immediately outside are slip resistant when wet',
      'Lighting inside is sufficient to see the step and the bench',
      'Any step into or out of the cabin is marked and even',
      'Condensation on the floor outside a steam room is managed by drainage or by cleaning frequency',
    ],
  },
  {
    hazard: 'Essential oils, infusions and aromatherapy products',
    whoIsAtRisk: 'Guests, staff, anyone with asthma or an allergy',
    controlsToVerify: [
      'Only products intended for the appliance are used, at the stated dilution',
      'Safety data sheets are held for every product in use',
      'Guests are told what is in use where a session is scented',
      'Staff applying an infusion are trained and do so when the cabin is unoccupied',
    ],
  },
]

export const TREATMENT_ROOM_HAZARDS: Hazard[] = [
  {
    hazard: 'Allergic or adverse reaction to a product',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'A consultation is completed and recorded before every treatment, not only for new guests',
      'Contraindications are checked against the treatment, and a treatment is declined where they apply',
      'Patch testing is carried out where the product or treatment requires it, with the stated interval before treatment',
      'Safety data sheets or product information are held for everything in use',
      'The therapist knows what to do if a reaction begins mid-treatment, and where the first aid kit is',
      'Reactions are recorded and reviewed rather than mentioned and forgotten',
    ],
  },
  {
    hazard: 'Burns from hot stones, wax, heated equipment or hot towels',
    whoIsAtRisk: 'Guests, therapists',
    controlsToVerify: [
      'Equipment is thermostatically controlled and the temperature is checked before it touches a guest',
      'A written maximum temperature exists for each heated item',
      'Equipment is checked and recorded, and faulty equipment is removed from use rather than worked around',
      'Therapists are trained on each heated treatment and the training is recorded',
      'The guest is asked to confirm the temperature is comfortable rather than assumed to say so',
    ],
  },
  {
    hazard: 'Cross-infection between guests',
    whoIsAtRisk: 'Guests, therapists',
    controlsToVerify: [
      'Couches, equipment and reusable items are cleaned between every guest to a written standard',
      'Single-use items are genuinely single use',
      'Linen is changed between guests and soiled linen is handled and stored separately',
      'Hand hygiene facilities are available in or immediately outside the room',
      'Therapists with an infection, a cut or a skin condition on the hands do not treat, and know they do not',
      'Any implement that could break the skin is single use or sterilised to a written procedure',
    ],
  },
  {
    hazard: 'Musculoskeletal injury to the therapist',
    whoIsAtRisk: 'Therapists',
    controlsToVerify: [
      'Couch height is adjustable and therapists are trained to set it for themselves rather than for the room',
      'Treatment timings allow a break between treatments rather than back to back all day',
      'A limit exists on consecutive deep tissue or heavy treatments in one shift',
      'Therapists report early symptoms without it affecting their rota, and those reports are acted on',
      'Trolleys are available for moving stock and linen',
    ],
    note:
      'The most likely injury in a spa is to a therapist, over years, and it ends careers. It rarely appears on a '
      + 'register because it never produces an incident to report.',
  },
  {
    hazard: 'A guest alone in a room with a therapist',
    whoIsAtRisk: 'Guests, therapists',
    controlsToVerify: [
      'A written policy covers draping, consent and what is explained before a treatment begins',
      'A guest can call for help from the couch, or is checked on a stated frequency',
      'A chaperone can be requested and this is offered rather than only permitted',
      'Room doors are unlocked from the inside at all times',
      'A procedure exists for a complaint or an allegation, and every therapist knows it protects them too',
    ],
  },
]

export const CHANGING_AREA_HAZARDS: Hazard[] = [
  {
    hazard: 'Slips on wet floors in changing and shower areas',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Flooring is slip resistant when wet throughout, including inside cubicles',
      'Drainage prevents pooling and drains are clear',
      'A check frequency exists for peak times, not only at opening and closing',
      'Benches and seating are secure and dry enough to use',
      'Wet and dry areas are separated where the layout allows it',
    ],
  },
  {
    hazard: 'A guest taken unwell alone in a cubicle or shower',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Cubicle doors can be opened from outside in an emergency',
      'A call point or alarm is fitted in the changing area',
      'Staff check the area on a stated frequency and at closing, opening every cubicle',
      'The closing check is recorded rather than assumed',
    ],
    note:
      'A guest who faints after a heat experience does it in the changing room more often than at the poolside, '
      + 'because that is where they go when they start to feel unwell.',
  },
  {
    hazard: 'Lockers, valuables and personal property',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Lockers are sound, and a master override exists and is controlled',
      'The terms on which property is accepted are displayed',
      'A procedure exists for a locker that will not open with a guest inside the building',
      'Lost property is recorded and held to a written procedure',
    ],
  },
  {
    hazard: 'Hot water scalding at showers and basins',
    whoIsAtRisk: 'Guests, particularly children and older guests',
    controlsToVerify: [
      'Outlet temperatures are limited by thermostatic control and checked on a stated frequency',
      'Checks are recorded and an out of range reading takes the outlet out of use',
      'Any outlet with no thermostatic control is identified and signed',
    ],
  },
]

export const PLANT_AND_CHEMICAL_HAZARDS: Hazard[] = [
  {
    hazard: 'Chemical release, including the mixing of incompatible chemicals',
    whoIsAtRisk: 'Staff, guests, contractors, anybody in the building',
    controlsToVerify: [
      'Incompatible chemicals are physically separated, with bunding or separate stores, not merely labelled',
      'Every container is labelled and no chemical is decanted into an unlabelled container',
      'Safety data sheets are held for everything on site and are accessible without entering the store',
      'Only named, trained people hold a key, and the list is current',
      'Ventilation to the store and plant room is working and is checked',
      'A spill kit appropriate to the chemicals held is present and staff are trained to use it',
      'A gas detection or alarm system is fitted where the assessment requires one',
      'Emergency stop and isolation points are labelled and reachable from outside the hazard',
    ],
    note:
      'This is the highest consequence hazard in the building and the one fewest people are competent to assess. '
      + 'If nobody available holds that competence, that is the finding, and the further control is to obtain it.',
  },
  {
    hazard: 'Delivery and decanting of chemicals',
    whoIsAtRisk: 'Staff, delivery drivers, guests in adjacent areas',
    controlsToVerify: [
      'Deliveries are accepted only by a named, trained person',
      'A delivery is never accepted into an occupied or unsupervised area',
      'The delivery route avoids guest areas, or the guest area is cleared for the delivery',
      'Personal protective equipment is worn and is the right specification for the chemical',
      'Quantities held are limited to what the store is assessed for',
      'A written procedure covers what happens if the wrong chemical arrives',
    ],
  },
  {
    hazard: 'Confined space, plant room access and lone working',
    whoIsAtRisk: 'Staff, contractors',
    controlsToVerify: [
      'A written procedure governs who may enter, when, and whether alone',
      'Somebody knows when a person enters the plant room and when they are expected out',
      'Lone working in the plant room is prohibited, or governed by a check-in arrangement that is used',
      'Lighting and emergency lighting are working',
      'Contractors are inducted before entry, every time, and their competence is verified',
    ],
  },
  {
    hazard: 'Electrical and mechanical hazards around plant',
    whoIsAtRisk: 'Staff, contractors',
    controlsToVerify: [
      'Fixed installation and portable appliance testing are current and recorded',
      'Guards on pumps and moving parts are fitted and undamaged',
      'A lock-out procedure exists for maintenance and is used rather than described',
      'Water and electrical services are separated, and no temporary arrangement has become permanent',
    ],
  },
]

export const GYM_AND_STUDIO_HAZARDS: Hazard[] = [
  {
    hazard: 'Injury from equipment, including from incorrect use',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'An induction is required before unsupervised use, and it is enforced rather than offered',
      'Equipment is inspected and serviced to a schedule, and the records are held',
      'Faulty equipment is taken out of use and labelled, not left with a note on it',
      'Safety clips, collars and stops are present on every relevant machine',
      'Free weights are stored on racks and the floor around them is clear',
      'Emergency stops on cardiovascular equipment work and are checked',
    ],
  },
  {
    hazard: 'Cardiac event or collapse during exercise',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'A health screening is completed before first use and is repeated at a stated interval',
      'A defibrillator is available, in date, and staff are trained to use it',
      'Staff can see or check the area on a stated frequency, including any studio in use',
      'An emergency call point is reachable from the gym floor',
      'Unsupervised access hours are assessed separately and the additional controls are stated',
    ],
    note:
      'A spa gym is used by people who have just been in a sauna or a hot pool. That combination raises the risk '
      + 'above the general gym case and is usually not assessed at all.',
  },
  {
    hazard: 'Heat, hydration and air quality in a studio',
    whoIsAtRisk: 'Guests, instructors',
    controlsToVerify: [
      'Ventilation and temperature are adequate for the class type and are monitored',
      'Drinking water is available in the room',
      'Class sizes are limited to a stated maximum for the room',
      'Instructors are briefed to watch for and act on signs of distress',
      'Hot or heated classes carry their own assessment and their own maximum time',
    ],
  },
]

export const FRONT_OF_HOUSE_HAZARDS: Hazard[] = [
  {
    hazard: 'Manual handling of deliveries, stock and linen',
    whoIsAtRisk: 'Staff',
    controlsToVerify: [
      'Manual handling training is completed and refreshed at a stated interval',
      'Trolleys and lifting aids are available and in working order',
      'Heavy items are stored between knee and shoulder height',
      'Delivery sizes are limited, or a two-person rule applies above a stated weight',
      'Staff know they may refuse a lift they are not confident in',
    ],
  },
  {
    hazard: 'Display screen and reception workstation use',
    whoIsAtRisk: 'Reception and administrative staff',
    controlsToVerify: [
      'Workstation assessments are completed for anybody who uses a screen for long periods',
      'Seating is adjustable and adjusted for the person, not left where the last shift put it',
      'Breaks away from the screen are possible in practice as well as in policy',
    ],
  },
  {
    hazard: 'Aggressive or threatening behaviour towards staff',
    whoIsAtRisk: 'Reception and spa staff',
    controlsToVerify: [
      'Staff are trained on de-escalation and on when to withdraw',
      'A member of staff can summon help from the desk without leaving it',
      'No member of staff is required to work alone at times when this is more likely',
      'Incidents are recorded and reviewed rather than absorbed as part of the job',
      'A written procedure covers refusing entry and asking somebody to leave',
    ],
  },
  {
    hazard: 'Lone working at opening, closing and during quiet periods',
    whoIsAtRisk: 'Staff',
    controlsToVerify: [
      'A lone working procedure exists and states what may not be done alone',
      'A check-in arrangement operates at opening and closing and is actually used',
      'Wet areas are never opened to guests with one member of staff on site, unless the assessment says otherwise',
      'A means of raising an alarm is carried rather than fixed to a wall',
    ],
  },
]

export const FIRE_AND_EGRESS_HAZARDS: Hazard[] = [
  {
    hazard: 'Fire, and evacuating wet, barefoot and undressed people',
    whoIsAtRisk: 'Guests, staff, contractors',
    controlsToVerify: [
      'A current fire risk assessment exists for the premises and this area is within its scope',
      'Escape routes are unobstructed, and nothing stored in them has become permanent',
      'Signage and emergency lighting are present, working and tested on a schedule',
      'Detection reaches wet areas, saunas, steam rooms and treatment rooms',
      'A procedure exists for sweeping enclosed spaces, opening each one rather than calling into it',
      'Robes, blankets or foil blankets are available at or near the assembly point',
      'A means of accounting for guests exists and is usable at speed',
      'Drills are held at a stated frequency and include the wet areas',
    ],
    note:
      'Evacuating a spa is not evacuating an office. Guests are wet, barefoot, partly clothed, mid-treatment, '
      + 'behind closed doors, and in some cases will not have heard the alarm at all.',
  },
  {
    hazard: 'Guests who cannot evacuate unaided',
    whoIsAtRisk: 'Guests with a disability, limited mobility, or who are mid-treatment',
    controlsToVerify: [
      'Personal emergency evacuation arrangements exist for guests who need them',
      'Staff know how to identify who may need help, before an emergency rather than during one',
      'Evacuation equipment is available where the layout requires it, and staff are trained to use it',
      'Refuge points, where they exist, are identified and have a means of communication',
    ],
  },
  {
    hazard: 'Loss of power, lighting or ventilation',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Emergency lighting covers the wet areas and the escape routes, and is tested and recorded',
      'A written procedure covers clearing the water on a power failure',
      'The effect on circulation, dosing and water quality is understood and written down',
      'Torches are available at stated points and are checked',
    ],
  },
]

export const OUTDOOR_AREA_HAZARDS: Hazard[] = [
  {
    hazard: 'Uneven surfaces, ice and poor light outdoors',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Paths and terraces are even, and any change of level is marked and lit',
      'A winter procedure covers ice and standing water on routes guests use',
      'Lighting covers every route a guest could take, including the one they should not',
      'Outdoor routes used barefoot or in a robe are assessed as such rather than as paths',
      'Seasonal inspection is scheduled and recorded',
    ],
  },
  {
    hazard: 'Outdoor heat and cold experiences',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Outdoor pools, hot tubs and cold plunges carry the same controls as their indoor equivalents',
      'The route between a heat experience and the building is assessed for cold exposure',
      'Supervision arrangements cover the outdoor area, or it is closed when they cannot',
      'A means of raising an alarm exists outdoors',
      'The area is checked and cleared at closing, in the dark, with a torch',
    ],
  },
  {
    hazard: 'Weather, furniture and falling objects',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Parasols, screens and light furniture are secured or taken in at a stated wind condition',
      'Trees and overhanging structures are inspected on a schedule by somebody competent',
      'A written trigger exists for closing the outdoor area on weather grounds, and who decides',
    ],
  },
]

export const CLEANING_HAZARDS: Hazard[] = [
  {
    hazard: 'Exposure to cleaning chemicals',
    whoIsAtRisk: 'Cleaning and spa staff',
    controlsToVerify: [
      'A COSHH assessment exists for every product in use and is current',
      'Safety data sheets are held and accessible to the person using the product',
      'Dilution is controlled by a dosing system or by measured equipment, not by judgement',
      'Personal protective equipment is provided, is the right specification, and is worn',
      'Products are never decanted into unlabelled containers',
      'Staff are trained on each product before they use it, and the training is recorded',
      'No two products are used together, and staff know why that rule is absolute',
    ],
  },
  {
    hazard: 'Cleaning in occupied wet areas',
    whoIsAtRisk: 'Guests, cleaning staff',
    controlsToVerify: [
      'Products used in occupied areas are assessed as suitable for use around guests',
      'Wet floor signage is used and removed once the floor is dry',
      'Equipment and trailing cables never cross a guest route',
      'Deep cleaning with stronger products happens only when the area is closed and ventilated',
    ],
  },
  {
    hazard: 'Handling soiled linen, waste and sharps',
    whoIsAtRisk: 'Cleaning and spa staff',
    controlsToVerify: [
      'Soiled linen is handled with gloves, bagged at the point of use and never sorted by hand',
      'A procedure exists for blood and body fluid spillages, with a kit available',
      'Sharps, where any are used, have a sharps bin and a disposal contract',
      'Staff know what to do about a needlestick or a splash injury, and that it is reported the same day',
      'Hepatitis B vaccination is offered where the assessment identifies a need',
    ],
  },
]

// ---------------------------------------------------------------------------

export type RiskAssessmentTemplate = {
  reference: string
  title: string
  intro: string
  hazards: Hazard[]
}

export const RISK_ASSESSMENTS: RiskAssessmentTemplate[] = [
  {
    reference: 'SPA-POOL-SURROUND-RA-001',
    title: 'Risk Assessment: Swimming Pool and Pool Surround',
    intro: 'Every pool of swimming depth, its surround, its entry points and the walkways serving it.',
    hazards: POOL_SURROUND_HAZARDS,
  },
  {
    reference: 'SPA-COLD-PLUNGE-RA-002',
    title: 'Risk Assessment: Cold Plunge and Ice Experiences',
    intro: 'Every cold plunge pool, ice bath, ice fountain and cold experience shower, and the area around them.',
    hazards: COLD_PLUNGE_HAZARDS,
  },
  {
    reference: 'SPA-HYDRO-POOL-RA-003',
    title: 'Risk Assessment: Hydrotherapy and Spa Pools',
    intro: 'Every warm, aerated or agitated pool, including hydrotherapy pools, spa baths, vitality pools and hot tubs.',
    hazards: HYDROTHERAPY_HAZARDS,
  },
  {
    reference: 'SPA-HEAT-EXPERIENCE-RA-004',
    title: 'Risk Assessment: Saunas, Steam Rooms and Heat Experiences',
    intro: 'Every sauna, steam room, laconium, caldarium, infrared cabin and heated experience space.',
    hazards: HEAT_EXPERIENCE_HAZARDS,
  },
  {
    reference: 'SPA-TREATMENT-ROOM-RA-005',
    title: 'Risk Assessment: Treatment Rooms',
    intro: 'Every treatment room, including doubles, and the treatments delivered in them.',
    hazards: TREATMENT_ROOM_HAZARDS,
  },
  {
    reference: 'SPA-CHANGING-AREAS-RA-006',
    title: 'Risk Assessment: Changing Rooms, Showers and Lockers',
    intro: 'Every changing area, shower, cubicle, locker bank and the routes between them and the wet areas.',
    hazards: CHANGING_AREA_HAZARDS,
  },
  {
    reference: 'SPA-PLANT-CHEMICAL-RA-007',
    title: 'Risk Assessment: Plant Room and Chemical Store',
    intro: 'The pool plant room, the chemical store, the delivery route and every area only trained staff may enter.',
    hazards: PLANT_AND_CHEMICAL_HAZARDS,
  },
  {
    reference: 'SPA-GYM-STUDIO-RA-008',
    title: 'Risk Assessment: Gym and Fitness Studio',
    intro: 'The gym floor, the equipment on it, and any studio used for classes.',
    hazards: GYM_AND_STUDIO_HAZARDS,
  },
  {
    reference: 'SPA-FRONT-OF-HOUSE-RA-009',
    title: 'Risk Assessment: Reception, Retail and Back of House',
    intro: 'The reception desk, the retail area, offices, stores and the work done in them.',
    hazards: FRONT_OF_HOUSE_HAZARDS,
  },
  {
    reference: 'SPA-FIRE-EGRESS-RA-010',
    title: 'Risk Assessment: Fire, Evacuation and Emergency Egress',
    intro:
      'Applies across every area of the spa. It does not replace the premises fire risk assessment: it covers what '
      + 'is different about evacuating a spa, and it should be read alongside it.',
    hazards: FIRE_AND_EGRESS_HAZARDS,
  },
  {
    reference: 'SPA-OUTDOOR-AREAS-RA-011',
    title: 'Risk Assessment: Outdoor Areas, Terraces and Gardens',
    intro: 'Every outdoor space guests use, and the routes between them and the building.',
    hazards: OUTDOOR_AREA_HAZARDS,
  },
  {
    reference: 'SPA-CLEANING-COSHH-RA-012',
    title: 'Risk Assessment: Cleaning, Chemicals and Waste',
    intro: 'Cleaning across every area, the products used to do it, and the handling of linen, waste and spillages.',
    hazards: CLEANING_HAZARDS,
  },
]

export function riskAssessmentSections(template: RiskAssessmentTemplate): PlanSection[] {
  return area('Hazards, controls and risk rating', template.intro, template.hazards)
}
