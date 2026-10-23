import type { PlanAction, PlanSection } from '../plan-types'

// Parts E, F and G. Chemicals, contamination and the building itself.
//
// The emergencies that do not involve a casualty, at least not at first. Each
// one is a decision about whether to close, and the decision is easier to
// make at three in the afternoon if it was written down at some point.

const CHEM = 'E. Chemical and plant emergencies'
const HEALTH = 'F. Contamination and public health'
const BUILDING = 'G. Building and facility failures'

const page = (part: string) => (heading: string, intro: string, actions: PlanAction[]): PlanSection => ({
  part, heading, intro, ownPage: true, actions,
})

const chem = page(CHEM)
const health = page(HEALTH)
const building = page(BUILDING)

export const CHEMICAL_SECTIONS: PlanSection[] = [
  {
    ...chem(
      'Chlorine gas release',
      'A sharp smell over the water, eyes and throats stinging, coughing among bathers, or an alarm. Usually '
      + 'caused by acid and hypochlorite meeting. It has injured more rescuers than bathers.',
      [
        { name: 'Evacuate immediately', action: 'Clear the pool hall and every wet area at once. Do not wait to establish what has been released.', by: '' },
        { name: 'Nobody enters', action: 'Nobody goes into the plant room or the affected area. Not to look, not to isolate, not to help.', by: '' },
        { name: 'Isolate only from outside', action: 'Isolate dosing only if the control is outside the affected area and you are competent to use it.', by: '' },
        { name: 'Ventilate from outside', action: 'Increase ventilation using controls outside the space. Open external doors if that does not draw gas into occupied areas.', by: '' },
        { name: 'Call 999', action: 'Say a chlorine gas release is suspected at a swimming pool, and name the chemicals held.', by: '' },
        { name: 'Account for everybody', action: 'Check saunas, steam rooms, changing rooms and treatment rooms are clear, and count at the assembly point.', by: '' },
        { name: 'Treat anybody affected', action: 'Fresh air, irrigate eyes with clean water. Anybody with breathing symptoms goes to hospital even if they improve.', by: '' },
        { name: 'Stay closed', action: 'Nothing reopens until a competent person has found the cause, corrected it, and confirmed air and water are safe.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  chem(
    'Chemical spillage',
    'A drum, a container or a dosing line. Small enough to deal with, or not, and knowing the difference is the '
    + 'whole of this page.',
    [
      { name: 'Clear the area', action: 'Move everybody away and stop anybody walking through it or tracking it elsewhere.', by: '' },
      { name: 'Decide whether it is yours to deal with', action: 'Only somebody trained, wearing the right protection, with the right spill kit, deals with a spill. Anything else is left and escalated.', by: '' },
      { name: 'Identify it', action: 'Identify the chemical from the label or the delivery note. Do not identify it by smell.', by: '' },
      { name: 'Never mix', action: 'Never use water on a spill without checking the safety data sheet. Some chemicals react violently with it.', by: '' },
      { name: 'Contain it', action: 'Use the spill kit to contain and absorb. Keep it out of drains: a chemical discharge is reportable in its own right.', by: '' },
      { name: 'Ventilate', action: 'Increase ventilation and keep people out until the air is clear.', by: '' },
      { name: 'Dispose properly', action: 'Bag the absorbed material as hazardous waste and use the disposal route in the normal operating procedure.', by: '' },
      { name: 'Record and investigate', action: 'Record it and establish how it happened. A spill is almost always a handling or a storage failure.', by: '' },
    ],
  ),
  chem(
    'Dosing failure or overdose',
    'A reading far outside range, an alarm, or bathers complaining of stinging eyes and skin.',
    [
      { name: 'Clear the water', action: 'Get everybody out of the affected water immediately.', by: '' },
      { name: 'Stop the dosing', action: 'Isolate dosing to that body of water, only if the control is safe to reach.', by: '' },
      { name: 'Test', action: 'Test the water and record the readings. Test again after ten minutes to see which way it is moving.', by: '' },
      { name: 'Do not correct blindly', action: 'Adding a corrective chemical without knowing the cause can make it worse. Get the competent person.', by: '' },
      { name: 'Treat anybody affected', action: 'Rinse skin and eyes with clean water. Anybody with breathing symptoms or persistent pain goes to hospital.', by: '' },
      { name: 'Stay closed', action: 'The pool stays closed until readings are in range on two consecutive tests and the cause is understood.', by: '' },
      { name: 'Record it', action: 'Record the readings, the times, who was in the water and what was done.', by: '' },
    ],
  ),
  chem(
    'Ventilation failure in a wet area or plant room',
    'Less dramatic than a gas release and the reason one happens.',
    [
      { name: 'Treat it as urgent', action: 'A pool hall or plant room without ventilation accumulates chloramines and worse. This is not a maintenance note for Monday.', by: '' },
      { name: 'Close the plant room', action: 'Nobody enters the plant room until ventilation is restored or forced ventilation is arranged.', by: '' },
      { name: 'Judge the pool hall', action: 'Where air quality is noticeably worse, or anybody reports irritation, clear the water and close.', by: '' },
      { name: 'Open what you safely can', action: 'Open external doors and windows where that does not create a security or fire risk.', by: '' },
      { name: 'Escalate', action: 'Call maintenance and the ventilation contractor, and tell the duty manager it affects whether the spa can open.', by: '' },
      { name: 'Reopen on evidence', action: 'Reopen when ventilation is confirmed working, not when it sounds like it is running.', by: '' },
    ],
  ),
  chem(
    'Plant, filtration or circulation failure',
    'Water quality begins to fall the moment circulation stops, and it does so invisibly.',
    [
      { name: 'Establish what has stopped', action: 'Circulation, filtration, dosing, heating, or all of them. Each has a different urgency.', by: '' },
      { name: 'Test the water', action: 'Test immediately and then at short intervals, and record. Falling disinfectant is the thing to watch.', by: '' },
      { name: 'Decide on closure', action: 'Circulation stopped means the pool closes. Filtration or dosing stopped means it closes as soon as readings move out of range.', by: '' },
      { name: 'Call it in', action: 'Call maintenance and the pool plant contractor, and tell the duty manager how long the spa can stay open.', by: '' },
      { name: 'Do not run manually without competence', action: 'Manual dosing to hold a pool open, by somebody not trained to do it, is how an overdose happens.', by: '' },
      { name: 'Reopen properly', action: 'Reopen when the plant is running, the readings are in range on consecutive tests, and clarity is confirmed.', by: '' },
    ],
  ),
]

export const HEALTH_SECTIONS: PlanSection[] = [
  {
    ...health(
      'Solid faecal contamination',
      'The easier of the two, and still a closure. Formed stool carries less risk than diarrhoea, and the '
      + 'difference decides how long the pool is shut.',
      [
        { name: 'Clear the pool', action: 'Everybody out of the affected water. Nobody re-enters until it is finished.', by: '' },
        { name: 'Identify it', action: 'Confirm it is formed rather than loose. If there is any doubt, treat it as diarrhoea.', by: '' },
        { name: 'Remove it', action: 'Remove it with a scoop, wearing gloves. Not the vacuum. Disinfect the scoop afterwards.', by: '' },
        { name: 'Treat the water', action: 'Correct pH first so the disinfectant works, then raise the disinfectant level and hold it for the stated time.', by: '' },
        { name: 'Wait the full period', action: 'Hold for the full contact time and at least one turnover. Do not shorten it because the pool looks fine.', by: '' },
        { name: 'Test before reopening', action: 'Confirm disinfectant, pH and clarity are in range and record the readings.', by: '' },
        { name: 'Record it', action: 'Log what was found, what was done, the times and the readings. This is what an environmental health officer asks to see.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  {
    ...health(
      'Diarrhoeal contamination and cryptosporidium',
      'The serious one. Cryptosporidium resists normal disinfection, survives for days, and is how a pool causes '
      + 'an outbreak traced back to it weeks later.',
      [
        { name: 'Clear the pool immediately', action: 'Everybody out. Close the pool and do not allow anybody back in.', by: '' },
        { name: 'Remove what you can', action: 'Remove solid matter with a scoop, wearing gloves and eye protection.', by: '' },
        { name: 'Get the competent person', action: 'This treatment is beyond a routine correction. Involve whoever is responsible for water treatment before doing anything else.', by: '' },
        { name: 'Treat to the written regime', action: 'Correct pH, raise disinfectant, filter, and follow the property’s written regime for this contamination. Coagulation and filtration matter as much as disinfectant.', by: '' },
        { name: 'Expect a long closure', action: 'This is measured in hours, and often the rest of the day. A short closure is a closure that did not work.', by: '' },
        { name: 'Backwash and consider dilution', action: 'Backwash thoroughly to waste and add fresh water. Do not return backwash to the pool.', by: '' },
        { name: 'Test and sample', action: 'Confirm readings before reopening, and take a microbiological sample where the regime requires it.', by: '' },
        { name: 'Tell the authorities if needed', action: 'Where several bathers report illness, contact environmental health. Do not wait to be contacted.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  health(
    'Vomit in the water',
    'Treated as contamination, not as a cleaning job.',
    [
      { name: 'Clear the pool', action: 'Everybody out of the affected water.', by: '' },
      { name: 'Establish whether it is a real risk', action: 'Vomit from a guest who has swallowed water is lower risk than vomit from somebody who is ill. If in doubt, treat it as illness.', by: '' },
      { name: 'Remove and treat', action: 'Remove solid matter, correct pH, raise disinfectant and hold for the stated period.', by: '' },
      { name: 'Watch for a pattern', action: 'Several guests vomiting on the same day is an outbreak, not a coincidence, and it is escalated immediately.', by: '' },
      { name: 'Test before reopening', action: 'Confirm and record the readings.', by: '' },
      { name: 'Record it', action: 'Log it with the times and the readings.', by: '' },
    ],
  ),
  health(
    'Blood in the water or on a surface',
    'Lower risk in a properly disinfected pool than most people assume, and still handled properly every time.',
    [
      { name: 'Clear the immediate area', action: 'Move guests away. A small amount of blood in a well-disinfected pool does not usually require closure, but the area does.', by: '' },
      { name: 'Protect yourself', action: 'Gloves, and eye protection where there is any chance of splashing.', by: '' },
      { name: 'Use the spill kit', action: 'Use the blood and body fluid kit. Absorb, disinfect, and dispose as clinical waste.', by: '' },
      { name: 'Check the water', action: 'Confirm disinfectant and pH are in range. If they are not, close the pool and correct them.', by: '' },
      { name: 'Treat the casualty', action: 'Somebody is bleeding. Deal with them as well as with the blood.', by: '' },
      { name: 'Record it', action: 'Record it, including any staff exposure, which is reported the same day.', by: '' },
    ],
  ),
  {
    ...health(
      'Suspected legionella or an outbreak of illness',
      'Several guests or staff unwell with chest symptoms or a fever after using the spa. Rare, serious, and the '
      + 'response is out of your hands quickly, which is the point.',
      [
        { name: 'Escalate immediately', action: 'Tell the duty manager and the responsible person for water safety at once. This is not a wait and see.', by: '' },
        { name: 'Close the suspected source', action: 'Close spa pools, hydrotherapy pools and any aerosol-producing facility straight away.', by: '' },
        { name: 'Do not disturb the system', action: 'Do not drain, clean, flush or shock-dose before advice. It destroys the evidence needed to find the source.', by: '' },
        { name: 'Contact the authorities', action: 'Contact environmental health and the enforcing authority. Where guests are ill, do this rather than wait for them to contact you.', by: '' },
        { name: 'Gather the records', action: 'Pull together the water safety risk assessment, temperature records, sampling results and maintenance logs.', by: '' },
        { name: 'Identify who was exposed', action: 'Establish who used the facility and over what period, from bookings and access records.', by: '' },
        { name: 'One voice', action: 'One named person speaks to guests, to the authorities and to anybody outside the property.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  health(
    'Loss of water clarity',
    'If the bottom of the pool cannot be seen clearly, a casualty on it cannot be seen either. This is a closure, '
    + 'not a maintenance note.',
    [
      { name: 'Clear the pool', action: 'Everybody out. Clarity is the difference between finding somebody and not.', by: '' },
      { name: 'Confirm it is empty', action: 'Count bathers out against the count in, and check the floor by pole where clarity is very poor.', by: '' },
      { name: 'Test the water', action: 'Test disinfectant, pH, alkalinity and turbidity, and record.', by: '' },
      { name: 'Find the cause', action: 'Check filtration, circulation and dosing. A clarity failure is usually a plant failure.', by: '' },
      { name: 'Stay closed', action: 'The pool reopens when the floor of the deepest point is clearly visible from the side and readings are in range.', by: '' },
      { name: 'Record it', action: 'Log the closure, the readings, the cause and the reopening time.', by: '' },
    ],
  ),
]

export const BUILDING_SECTIONS: PlanSection[] = [
  building(
    'Power failure',
    'Lighting, circulation, dosing and alarms all stop at once, and the spa becomes dark, wet and unsupervised.',
    [
      { name: 'Clear the water', action: 'Get everybody out of every pool immediately. Supervision in the dark is not supervision.', by: '' },
      { name: 'Keep people still', action: 'Ask guests to stay where they are until somebody reaches them. Wet floors and steps in darkness cause the second incident.', by: '' },
      { name: 'Check emergency lighting', action: 'Confirm it operated and remember how long it is rated for. It is usually less than people assume.', by: '' },
      { name: 'Sweep with torches', action: 'Escort guests out of the wet areas and heat cabins, opening every enclosed space as you go.', by: '' },
      { name: 'Check the plant', action: 'Establish whether circulation and dosing have stopped, and start testing the water.', by: '' },
      { name: 'Do not reopen on partial power', action: 'Reopen when lighting, circulation, ventilation and alarms are all working and the water has been tested.', by: '' },
    ],
  ),
  building(
    'Flood or water ingress',
    'A burst pipe, a failed pool fitting, a blocked drain or weather.',
    [
      { name: 'Make it safe electrically', action: 'Water and electricity together is the first risk. Isolate power to affected areas if it is safe to reach the isolation point.', by: '' },
      { name: 'Clear the area', action: 'Move guests out of the affected area and stop anybody walking through standing water.', by: '' },
      { name: 'Stop the source', action: 'Close the stopcock or isolate the affected system if you can do so safely.', by: '' },
      { name: 'Protect what is below', action: 'Water finds the floor below. Check the plant room, stores and any space underneath.', by: '' },
      { name: 'Call it in', action: 'Call maintenance and the duty manager, and escalate to the plumbing contractor where it is not stopping.', by: '' },
      { name: 'Do not reopen wet', action: 'The area stays closed until it is dry, safe and the electrical installation has been checked where water reached it.', by: '' },
    ],
  ),
  building(
    'Gas leak or smell of gas',
    'Where there is a gas supply to a boiler, a plant room or a kitchen.',
    [
      { name: 'Do not touch anything electrical', action: 'No light switches, no plugs, no phones in the affected area. A spark is the ignition source.', by: '' },
      { name: 'Evacuate', action: 'Evacuate the area and, where the smell is strong or spreading, the building.', by: '' },
      { name: 'Ventilate', action: 'Open doors and windows on your way out.', by: '' },
      { name: 'Turn it off if safe', action: 'Turn off the gas at the meter or isolation point only if it is on your way out and safe to reach.', by: '' },
      { name: 'Call from outside', action: 'Call the gas emergency service from outside the building, then 999 if anybody is affected.', by: '' },
      { name: 'Keep everybody out', action: 'Nobody re-enters until the gas supplier says so. Not for belongings, not for anything.', by: '' },
    ],
  ),
  building(
    'Loss of water supply, heating or hot water',
    'Not an emergency in itself, and it becomes one quickly in a spa.',
    [
      { name: 'Establish what is lost and where', action: 'Cold supply, hot supply, heating, or the pool heating. Each affects different facilities.', by: '' },
      { name: 'Judge each facility', action: 'No showers means the wet areas close: guests must shower before entering the water. No pool heating is uncomfortable rather than unsafe.', by: '' },
      { name: 'Protect the water systems', action: 'A loss of supply can draw in contamination. Involve whoever is responsible for water safety before restoring supply.', by: '' },
      { name: 'Flush before use', action: 'When supply returns, flush outlets before anybody uses them, and follow the property’s written procedure.', by: '' },
      { name: 'Communicate', action: 'Tell guests what is unavailable and for how long, and decide what happens to bookings.', by: '' },
    ],
  ),
  building(
    'Structural failure, ceiling or glass',
    'A pool hall is a corrosive environment, and fixings in one degrade in ways nobody sees.',
    [
      { name: 'Clear and hold', action: 'Clear the area and stop anybody entering it. Do not test it by standing underneath.', by: '' },
      { name: 'Glass in or near the water', action: 'Close the pool. Glass on a pool floor cannot be found reliably by eye and is a laceration to a barefoot guest.', by: '' },
      { name: 'Do not clear it yourself', action: 'Structural, ceiling or glazing failure is for a competent person. Keep everybody clear and call one.', by: '' },
      { name: 'Check for casualties', action: 'Check nobody was under it and nobody has left with an injury they did not mention.', by: '' },
      { name: 'Record and report', action: 'Photograph it and report it. A structural failure in a pool hall is reportable in several circumstances.', by: '' },
      { name: 'Reopen in writing', action: 'The area reopens when a competent person has inspected it and said so in writing.', by: '' },
    ],
  ),
  building(
    'Lift entrapment',
    'Where a lift serves the spa, and particularly where it is the accessible route.',
    [
      { name: 'Talk to them', action: 'Establish contact and tell them help is coming. Keep talking: the worst part of being stuck in a lift is silence.', by: '' },
      { name: 'Call the lift engineer', action: 'Use the emergency release contract. Nobody attempts to open the doors themselves.', by: '' },
      { name: 'Ask about the people inside', action: 'Ask whether anybody is unwell, pregnant, claustrophobic or a child alone, and tell the engineer.', by: '' },
      { name: 'Call 999 if needed', action: 'Where somebody inside is unwell, call an ambulance at the same time as the engineer.', by: '' },
      { name: 'Stay with them', action: 'Somebody stays at the doors until they are out.', by: '' },
      { name: 'Check the accessible route', action: 'While the lift is out, establish how a guest with limited mobility leaves the spa, including in a fire.', by: '' },
    ],
  ),
  building(
    'Severe weather',
    'Snow, ice, high wind or extreme heat, and the decision about whether to open at all.',
    [
      { name: 'Decide early', action: 'Decide on outdoor facilities before guests arrive, not while they are standing on a frozen terrace.', by: '' },
      { name: 'Close the outdoor areas', action: 'Close outdoor pools, hot tubs and saunas in ice, lightning or high wind, and secure or take in loose furniture.', by: '' },
      { name: 'Treat the routes', action: 'Grit and clear the routes guests use, including the ones used barefoot or in a robe.', by: '' },
      { name: 'Check staffing', action: 'Establish who can get in. A spa that cannot meet its minimum staffing does not open.', by: '' },
      { name: 'Watch the building', action: 'Check for water ingress, roof problems and blocked drains during and after.', by: '' },
      { name: 'Communicate', action: 'Tell guests what is closed and why, and decide what happens to bookings.', by: '' },
    ],
  ),
]
