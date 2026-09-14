import type { PlanAction, PlanSection } from './plan-types'

// Parts B and D. Water emergencies, and getting everybody out of the building.
//
// The two sets of pages where a spa differs most from anywhere else. A
// casualty in water is recovered differently from one on a floor, and
// evacuating people who are wet, barefoot, partly clothed and behind closed
// doors is not the problem a general fire plan was written for.

const WATER = 'B. Water emergencies'
const FIRE = 'D. Fire and evacuation'

const page = (part: string) => (heading: string, intro: string, actions: PlanAction[]): PlanSection => ({
  part, heading, intro, ownPage: true, actions,
})

const water = page(WATER)
const fire = page(FIRE)

export const POOL_EAP_SECTIONS: PlanSection[] = [
  {
    ...water(
      'Casualty in the water',
      'Somebody face down, motionless, or not responding. A silent submersion takes under a minute and does not '
      + 'look like the films: there is no shouting and no waving.',
      [
        { name: 'Raise the alarm', action: 'Alert the team in the agreed way before entering the water. Never attempt a rescue without the rest of the team knowing it is happening.', by: '' },
        { name: 'Clear the water', action: 'Get every other bather out of every pool. A second casualty while the first is being recovered overwhelms a small team.', by: '' },
        { name: 'Reach or throw first', action: 'Use the reaching pole or throwing aid where you can. Enter the water only where it is necessary and you are competent.', by: '' },
        { name: 'Suspect a spinal injury', action: 'Where they may have struck their head or entered badly, support the head and neck in the water and do not lift them out without the board and enough people.', by: '' },
        { name: 'Recover and assess', action: 'Remove them by the shortest safe route. Check response, airway and breathing.', by: '' },
        { name: 'Start resuscitation', action: 'Begin compressions if they are not breathing normally, and send for the defibrillator at the same moment. Dry the chest before using it.', by: '' },
        { name: 'Call an ambulance', action: 'Dial 999, give the agreed address and entrance, and stay on the line. Send somebody to meet them and hold the doors.', by: '' },
        { name: 'Manage everybody else', action: 'Move other guests into a supervised space away from the area, where they are not watching.', by: '' },
        { name: 'Record it', action: 'Write down what happened, the times, who did what and who witnessed it, before anybody goes home.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  water(
    'A swimmer in difficulty',
    'Still at the surface, still conscious, and the point at which this is easy. Recognising it early is the '
    + 'whole skill: vertical in the water, head back, arms pressing down, and silent.',
    [
      { name: 'Recognise it', action: 'Somebody in difficulty is upright, low in the water and quiet. They cannot call out because they are using every breath to stay up.', by: '' },
      { name: 'Alert the team', action: 'Signal before you act. A rescue attempt nobody knows about is a second casualty waiting to happen.', by: '' },
      { name: 'Reach or throw', action: 'Reach with a pole or throw a buoyant aid. Talk to them and tell them what to hold.', by: '' },
      { name: 'Enter only if you must', action: 'Enter only if reaching and throwing will not work and you are competent. Take a buoyant aid in with you.', by: '' },
      { name: 'Get them out and check them', action: 'Help them out, sit them down, and check breathing and responsiveness. Anybody who swallowed or inhaled water needs medical assessment.', by: '' },
      { name: 'Do not let them carry on', action: 'Nobody goes back in the water that day. Offer to call somebody for them.', by: '' },
      { name: 'Record it', action: 'A near miss is the same event without the injury, and it is free information about supervision or depth.', by: '' },
    ],
  ),
  water(
    'Entrapment on a grille, outlet or fitting',
    'Hair, a limb or a costume caught on a suction outlet. Rare, and it holds somebody under water while they '
    + 'are conscious.',
    [
      { name: 'Shut the circulation off', action: 'Hit the emergency stop for circulation immediately. This is the single action that resolves it.', by: '' },
      { name: 'Raise the alarm', action: 'Alert the team while somebody is going for the stop, not afterwards.', by: '' },
      { name: 'Support them', action: 'Support the casualty so their head is above water while suction is released.', by: '' },
      { name: 'Do not pull', action: 'Do not pull against suction. It causes injury and does not free them.', by: '' },
      { name: 'Free them', action: 'Once suction has stopped, free them, and cut hair or fabric if that is faster.', by: '' },
      { name: 'Get them out and assess', action: 'Assess for injury and for water inhaled, and call an ambulance for anything more than a fright.', by: '' },
      { name: 'Close the pool', action: 'The pool stays closed until the fitting has been inspected by a competent person and the cause established.', by: '' },
      { name: 'Report it', action: 'This is likely to be reportable as a dangerous occurrence, whether or not anybody was injured.', by: '' },
    ],
  ),
  water(
    'Glass in or near the water',
    'A dropped glass on a wet surround, or breakage at the poolside.',
    [
      { name: 'Stop everybody moving', action: 'Ask people nearby to stand still. Barefoot guests walking away from broken glass is how the injury happens.', by: '' },
      { name: 'Clear the area', action: 'Clear a wide area and lead people out by a route away from the glass.', by: '' },
      { name: 'In the water, close the pool', action: 'Glass on a pool floor cannot be found reliably by eye. Close it.', by: '' },
      { name: 'Do not pick it up by hand', action: 'Use a dustpan, a brush and gloves. Never hands, never a towel.', by: '' },
      { name: 'Recover it from the water properly', action: 'Where glass is in the pool, recover it under the property procedure. Where any doubt remains, the pool stays closed until it has been searched.', by: '' },
      { name: 'Check for injuries', action: 'Check whether anybody was cut, including people who have walked away.', by: '' },
      { name: 'Record it', action: 'Record how glass came to be there. That is the failure worth correcting.', by: '' },
    ],
  ),
]

export const FIRE_EAP_SECTIONS: PlanSection[] = [
  {
    ...fire(
      'Fire or evacuation',
      'Wet, barefoot, partly clothed people in cold weather is a spa problem a general fire plan does not address.',
      [
        { name: 'Raise the alarm', action: 'Operate the nearest call point and alert the team.', by: '' },
        { name: 'Clear the water', action: 'Get everybody out of every pool, sauna and steam room. Check enclosed spaces by opening them, not by shouting into them.', by: '' },
        { name: 'Evacuate by the route', action: 'Take guests out by the designated route. Take robes or blankets where they are to hand and it does not delay anybody.', by: '' },
        { name: 'Sweep every space', action: 'Changing rooms, cubicles, toilets, treatment rooms, relaxation areas and the plant corridor. Somebody mid-treatment will not have heard the alarm the way you did.', by: '' },
        { name: 'Account for everyone', action: 'Use the booking list and the locker record to account for every guest and every member of staff.', by: '' },
        { name: 'Report to the fire service', action: 'Tell them immediately about anybody unaccounted for, and about the plant room and the chemicals held in it.', by: '' },
        { name: 'Keep them warm', action: 'Somebody wet in cold weather becomes a casualty within minutes. Get people indoors or into vehicles as soon as it is safe.', by: '' },
        { name: 'Do not go back', action: 'Nobody re-enters for belongings, phones or anything else until the fire service releases the building.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  {
    ...fire(
      'Evacuating somebody who cannot use the normal route',
      'A wheelchair user, a guest with limited mobility, a guest mid-treatment, or somebody who has just fainted. '
      + 'Worked out now, not on the day.',
      [
        { name: 'Know before it happens', action: 'The team should already know who is in the spa today who will need help. That is established at booking and at arrival, not during an alarm.', by: '' },
        { name: 'Assign somebody', action: 'A named person goes to them immediately rather than everybody assuming somebody else has.', by: '' },
        { name: 'Use the agreed route', action: 'Use the route and the equipment in their personal arrangement. Do not improvise with a lift, which may be out of use.', by: '' },
        { name: 'Refuge, if there is one', action: 'Where the building has a refuge point, take them there, stay with them and use the communication point to say where you are.', by: '' },
        { name: 'Tell the fire service', action: 'Tell the fire service exactly where they are, the moment the crew arrives.', by: '' },
        { name: 'Never leave them alone', action: 'Somebody stays with them until they are out of the building.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  fire(
    'Staying put, or a lockdown',
    'Where the property instructs people to remain inside rather than leave, or to secure the area.',
    [
      { name: 'Follow the property instruction', action: 'This is a property-wide decision, not a spa one. Follow the instruction rather than improvising.', by: '' },
      { name: 'Get everybody out of the water', action: 'Clear the pools and the heat experiences so people are dressed, together and able to move.', by: '' },
      { name: 'Move to the agreed area', action: 'Take everybody to the space named in the property plan, away from external glazing and external doors.', by: '' },
      { name: 'Secure what you are told to secure', action: 'Lock or hold the doors named in the plan. Do not lock people into a space they cannot leave in a fire.', by: '' },
      { name: 'Account for everybody', action: 'Count guests and staff and keep the list updated.', by: '' },
      { name: 'Keep them calm and quiet', action: 'Give people something to do. Tell them what is known rather than leaving them to speculate.', by: '' },
      { name: 'Wait to be released', action: 'Nobody leaves until the police or the property lead says so.', by: '' },
    ],
  ),
]
