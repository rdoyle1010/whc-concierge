import type { Hazard } from '../plan-types'

// Electrical, fire, work at height, manual handling, slips and noise.
//
// The ordinary industrial hazards, in a building that is wet, hot, barefoot
// and full of people who have paid to relax. Each of those four conditions
// changes the assessment, which is why a generic template does not fit a spa.

export const ELECTRICAL: Hazard[] = [
  {
    hazard: 'Electrical equipment in the pool plant room and wet plant areas',
    whoIsAtRisk: 'Plant operators, maintenance staff, contractors',
    controlsToVerify: [
      'Fixed installation inspection and testing is current, and the certificate is held',
      'Equipment in wet or corrosive areas is rated for it, and its rating is checked at inspection',
      'Residual current protection is fitted and tested where required',
      'A lock-out and tag-out procedure exists for maintenance and is used rather than described',
      'Isolation points are labelled and reachable without entering the hazard',
      'No temporary arrangement, extension lead or taped joint has become permanent',
      'Enclosures and glands are intact, with no corrosion at cable entries',
    ],
    note:
      'A pool plant room is warm, humid and chemically corrosive. Electrical equipment degrades there far faster '
      + 'than the inspection interval written for a dry building assumes.',
  },
  {
    hazard: 'Sauna and steam room heaters and controls',
    whoIsAtRisk: 'Guests, cleaning staff, maintenance staff',
    controlsToVerify: [
      'Heaters are installed and maintained by somebody competent in that equipment',
      'Guards are fitted, secure and undamaged',
      'Thermal cut-outs are present and tested at the stated interval',
      'Controls are outside the cabin, or rated for the environment inside it',
      'The steam generator is serviced and descaled to a schedule',
      'Isolation is possible before any cleaning or maintenance inside the cabin',
      'Nothing combustible has been stored on or near a heater',
    ],
  },
  {
    hazard: 'Mains-powered gym equipment',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Portable appliance testing is current for everything that needs it',
      'Cables are routed so nobody walks on them and nothing is trapped under equipment',
      'Emergency stops work and are tested as part of the daily check',
      'Damaged equipment is unplugged, labelled and taken out of use rather than noted',
      'Cleaning products used on equipment do not enter the electrics',
      'Equipment is not sited where sweat, water bottles or a wet floor can reach the supply',
    ],
  },
  {
    hazard: 'Electrical equipment in treatment rooms and wet treatment areas',
    whoIsAtRisk: 'Guests, therapists',
    controlsToVerify: [
      'Equipment used near water is rated for it and protected accordingly',
      'Facial and body equipment is serviced and tested to the manufacturer schedule',
      'Therapists are trained on each piece and the training is recorded',
      'Any equipment applying current to a guest has its own procedure and contraindications',
      'Sockets are sited away from wet areas and from where a guest lies',
      'Equipment is visually checked before every use, not only at inspection',
    ],
  },
  {
    hazard: 'General electrical installation: lighting, ventilation, hand dryers',
    whoIsAtRisk: 'Guests, staff, contractors',
    controlsToVerify: [
      'Fixed installation testing is current across the spa',
      'Emergency lighting is tested and recorded at the stated frequency',
      'Fittings in wet areas are rated for the environment and are undamaged',
      'Hand dryers and fittings in changing areas are sited and protected appropriately',
      'Access panels and consumer units are secured against guests',
      'Faults are reported, isolated and fixed rather than worked around',
    ],
  },
]

export const FIRE: Hazard[] = [
  {
    hazard: 'Fire in the pool chemical store',
    whoIsAtRisk: 'Staff, guests, firefighters',
    controlsToVerify: [
      'Chemicals held are known to the fire risk assessment and to the fire service',
      'Oxidising chemicals are stored away from combustible materials and from fuel',
      'The store is fire separated to the standard the assessment requires',
      'Nothing else is stored in the chemical store, including cardboard, linen and cleaning equipment',
      'Detection covers the store',
      'Fire service information about the chemicals held is available at the entrance',
      'Extinguishers appropriate to these chemicals are provided, and staff know water may be wrong',
    ],
    note:
      'Pool chemicals do not merely burn: several of them supply oxygen to a fire and react violently with water. '
      + 'This is the one place in the building where the wrong extinguisher makes things worse.',
  },
  {
    hazard: 'Fire in or from a sauna',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'The heater is installed to specification with the correct clearances',
      'Thermal cut-outs are fitted and tested',
      'Nothing is ever stored in the cabin, including towels, robes and cleaning equipment',
      'Timber and benches are inspected for charring or damage',
      'Detection covers the sauna and is of a type suitable for the temperature',
      'The sauna is isolated at closing where the assessment requires it',
      'Essential oils and infusions are used only as the appliance intends',
    ],
    note:
      'A wooden box at ninety degrees with an electric element in it. Sauna fires are rare and they are almost '
      + 'always something left on the heater.',
  },
  {
    hazard: 'Fire in linen stores and laundry holding areas',
    whoIsAtRisk: 'Staff, guests',
    controlsToVerify: [
      'Linen is not stored in escape routes, plant rooms or under stairs',
      'Soiled linen is not held in quantity in unventilated spaces',
      'Tumble dryer lint filters are cleaned every cycle and ducting is cleaned to a schedule',
      'Linen contaminated with oils is handled per the risk of spontaneous combustion',
      'Detection covers stores and laundry areas',
      'Storage is kept clear of heat sources and electrical fittings',
    ],
    note:
      'Massage oil on linen in a warm dryer or a full trolley is a genuine spontaneous combustion risk, and it is '
      + 'the one hotel laundry fire cause that spa operations reproduce exactly.',
  },
  {
    hazard: 'Fire in the gym or studio',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Escape routes from the gym and every studio are unobstructed by equipment',
      'Equipment is not sited where it blocks an exit or a route to one',
      'Detection and alarm are audible over class music',
      'Class participants can hear and will respond to an alarm, which is tested in a drill',
      'Electrical equipment is tested and cables are routed safely',
      'The studio has a second means of escape or the assessment justifies why not',
    ],
  },
  {
    hazard: 'Means of escape from wet, barefoot and undressed guests',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Escape routes from wet areas are suitable to be used barefoot and wet',
      'Routes are unobstructed, and nothing stored in them has become permanent',
      'Fire doors close properly and are not wedged, including in humid areas where they swell',
      'Emergency lighting covers the wet areas, heat cabins and treatment corridor',
      'Detection reaches saunas, steam rooms, treatment rooms and changing cubicles',
      'A written sweep procedure covers opening every enclosed space rather than calling into it',
      'Robes, blankets or foil blankets are available at or near the assembly point',
      'A means of accounting for guests exists and is usable at speed',
      'Drills include the wet areas and are held at the stated frequency',
    ],
    note:
      'Evacuating a spa is not evacuating an office. Guests are wet, barefoot, partly clothed, mid-treatment, '
      + 'behind closed doors, and some will not have heard the alarm at all.',
  },
  {
    hazard: 'Alcohol gel dispensers on escape routes',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Dispensers are included in the fire risk assessment',
      'They are not sited where they would obstruct an escape route or add fuel to it',
      'They are away from ignition sources and electrical fittings',
      'Bulk stock is within the quantity the assessment permits',
    ],
  },
]

export const HEIGHT_AND_HANDLING: Hazard[] = [
  {
    hazard: 'Working at height: shelf stacking in linen and chemical stores',
    whoIsAtRisk: 'Staff',
    controlsToVerify: [
      'Step stools or platforms are provided and are in good condition',
      'Nobody climbs on shelving, chairs, boxes or trolleys',
      'Heavy items are stored between knee and shoulder height, never above',
      'Shelving is secured to the wall and is within its load rating',
      'Lighting in stores is adequate to see what is being reached for',
      'Staff are told not to carry while climbing and have a way to pass items up',
    ],
  },
  {
    hazard: 'Working at height: maintenance to lighting, ventilation and the pool hall ceiling',
    whoIsAtRisk: 'Maintenance staff, contractors, guests below',
    controlsToVerify: [
      'Work at height is planned, and the equipment is suitable for the height and the surface',
      'Nobody works over water without a specific assessment and arrangement',
      'The area below is cleared and guests are excluded for the duration',
      'Ladder and access equipment is inspected and the inspection is recorded',
      'Contractors provide a method statement and it is checked before work starts',
      'Work over a pool considers what happens if a tool or a fitting drops into it',
      'Pool hall structures are inspected on a schedule for corrosion of fixings',
    ],
    note:
      'Pool hall atmospheres corrode fixings invisibly. The reason to look up is not the person working, it is '
      + 'what they are working on.',
  },
  {
    hazard: 'Manual handling of soiled and clean linen',
    whoIsAtRisk: 'Spa attendants, housekeeping, laundry staff',
    controlsToVerify: [
      'Trolleys are provided, are in working order and are the right height',
      'Bags are filled to a weight limit rather than to capacity',
      'Wet linen is recognised as far heavier than dry and is handled accordingly',
      'Routes between the spa and the laundry are clear, level and wide enough for a trolley',
      'Manual handling training is completed and refreshed',
      'Nobody is expected to carry bags up or down stairs',
      'Soiled linen is not sorted by hand',
    ],
  },
  {
    hazard: 'Manual handling of pool chemical containers, drums and intermediate bulk containers',
    whoIsAtRisk: 'Plant operators, delivery drivers',
    controlsToVerify: [
      'Mechanical aids are available and used for drums and bulk containers',
      'Nobody moves a full container by hand where an aid exists',
      'Delivery quantities and container sizes are chosen with handling in mind',
      'The route from the delivery point to the store is level, clear and non-slip',
      'A dropped or damaged container has a written response',
      'Handling is never done alone where the assessment requires two people',
    ],
  },
  {
    hazard: 'Manual handling of furniture, treatment beds and gym equipment',
    whoIsAtRisk: 'Therapists, spa attendants, maintenance staff',
    controlsToVerify: [
      'Nobody moves a treatment couch or heavy equipment alone',
      'Equipment that is moved regularly is on castors or has a moving aid',
      'Studio equipment set-up is shared rather than falling to whoever opens',
      'Staff are trained and know they may refuse a lift they are not confident in',
      'Room changes and event set-ups are planned rather than done at speed before a booking',
    ],
  },
]

export const SLIPS: Hazard[] = [
  {
    hazard: 'Slips on the pool deck and surround',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Flooring is slip resistant when wet, throughout, including every transition between surfaces',
      'Standing water drains away rather than pooling, and drains are clear',
      'Cleaning covers the surround during trading hours, not only before opening',
      'Wet floor signage is available and used, and removed when dry',
      'Running is discouraged by staff intervention, not by signage alone',
      'Steps, level changes and ramps are visually distinct and lit',
      'Handrails are present, secure and continuous where fitted',
      'Slip resistance is reassessed after any resurfacing, resealing or change of cleaning product',
    ],
    note:
      'The most common injury in a spa, rarely severe, and constant. The cleaning product matters as much as the '
      + 'floor: several leave a film that reduces slip resistance on a surface that tested well when new.',
  },
  {
    hazard: 'Slips in changing rooms, showers and wet changing areas',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Flooring is slip resistant when wet throughout, including inside cubicles',
      'Drainage prevents pooling and drains are clear',
      'A check frequency covers peak times, not only opening and closing',
      'Benches and seating are secure, and the floor beneath them is not a trap for water',
      'Wet and dry areas are separated where the layout allows',
      'Lighting is adequate, including inside cubicles',
    ],
  },
  {
    hazard: 'Slips in the thermal suite, between heat and cold experiences',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'Floors between experiences are slip resistant when wet and when cold',
      'Condensation outside a steam room is managed by drainage or cleaning frequency',
      'Steps into and out of every cabin are even, marked and lit',
      'The route between a heat experience and a cold plunge is short, clear and non-slip',
      'Handholds are fitted at plunge entries and are secure',
      'Lighting is adequate despite the mood the design intends',
    ],
    note:
      'A guest coming out of a sauna is dizzy, warm and heading for cold water. Low lighting is a design choice '
      + 'that is also a control that has been removed.',
  },
  {
    hazard: 'Trips and falls on the gym floor',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Free weights are racked and the floor around racks is clear',
      'Cables, mats and small equipment are stored rather than left out',
      'Flooring is intact, with no lifting edges or worn patches',
      'Spilled water and sweat are dealt with promptly',
      'Circulation space between machines meets the manufacturer requirement',
      'Lighting is adequate across the whole floor, including corners',
    ],
  },
  {
    hazard: 'Slips and trips in treatment rooms',
    whoIsAtRisk: 'Guests, therapists',
    controlsToVerify: [
      'Floors are non-slip, including where oil or water may reach them',
      'Oil and product spills are cleaned immediately rather than at the end of the treatment',
      'Lighting is sufficient for a guest to get on and off the couch safely',
      'Cables from equipment do not cross the route to the couch',
      'A step is provided where the couch is high, and it is stable',
      'Guests are not left to get off a couch unaided after a treatment that leaves them light headed',
    ],
    note:
      'A guest getting off a high couch, oiled, in low light, having been horizontal for an hour. It is the '
      + 'combination rather than any one of them.',
  },
]

export const ENVIRONMENT: Hazard[] = [
  {
    hazard: 'Noise in the gym and fitness studio',
    whoIsAtRisk: 'Instructors, gym staff, guests',
    controlsToVerify: [
      'Sound levels in classes have been measured rather than estimated',
      'A maximum volume is set and instructors cannot override it',
      'Instructors teaching several classes a day are considered separately from guests attending one',
      'Instructors use amplification rather than raising their voice, protecting the voice as well as hearing',
      'Hearing protection is available where measurement shows it is needed',
      'The alarm remains audible over class music, tested in a drill',
    ],
  },
  {
    hazard: 'Noise in the pool plant room',
    whoIsAtRisk: 'Plant operators, maintenance staff, contractors',
    controlsToVerify: [
      'Noise levels in the plant room have been measured',
      'Hearing protection is provided and worn where measurement requires it',
      'Time spent in the plant room is limited where levels are high',
      'Alarms and the ability to call for help are considered against the noise level',
      'Somebody working alone in there can still be heard, or a check-in arrangement covers it',
    ],
  },
  {
    hazard: 'Heat stress in staff working in thermal areas',
    whoIsAtRisk: 'Spa attendants, cleaners, maintenance staff, therapists',
    controlsToVerify: [
      'Cleaning of heat cabins happens when they are cool, or time inside is limited',
      'Staff working in the pool hall have access to drinking water and cooler areas',
      'Task rotation limits continuous exposure',
      'Staff are told the signs of heat stress in themselves as well as in guests',
      'Uniform is suitable for a hot, humid environment',
      'Nobody enters a hot cabin to clean it alone without somebody knowing',
    ],
    note:
      'Guests are told about maximum times. Staff are in the same environment for a whole shift and are almost '
      + 'never assessed for it.',
  },
  {
    hazard: 'Burns from sauna heaters, steam pipes and hot surfaces',
    whoIsAtRisk: 'Guests, cleaning staff, maintenance staff',
    controlsToVerify: [
      'Heater guards are fitted, secure and undamaged',
      'Steam outlets are positioned or guarded so nobody can lean on them',
      'Exposed pipework in plant and back of house areas is lagged or guarded',
      'Signage warns of hot surfaces at the entrance to each cabin',
      'Cleaning happens after cabins have cooled, and the cooling time is known',
      'Towel and tea urns, hot cabinets and hot towels have their own temperature controls',
    ],
  },
  {
    hazard: 'Chemical discharge to drain',
    whoIsAtRisk: 'The water environment, the property, and its licence to operate',
    controlsToVerify: [
      'Backwash and drain-down discharge arrangements are agreed with the water authority',
      'Nothing is discharged to a surface water drain that should go to foul',
      'Staff know which drain is which, and they are marked',
      'Spillage is contained rather than hosed away',
      'Dechlorination before discharge is carried out where required',
      'A written procedure covers draining a pool, and who authorises it',
    ],
    note:
      'An environmental offence, reportable in its own right, and the one hazard on this register where the harm '
      + 'is not to a person. It is also the one most often caused by somebody tidying up.',
  },
]
