import type { PlanSection } from './plan-types'

// The Emergency Action Plan for a spa's pools and wet areas.
//
// The other half of the Pool Safety Operating Procedure, and the half that
// gets read at speed by somebody whose hands are shaking. That changes how it
// is written: short actions in the order they happen, a named role against
// each, and one emergency per page so nobody is turning a sheet over while
// somebody is in the water.
//
// Every action here is a general one that holds in any building. Everything
// that is specific to a building - where the alarm is, where the assembly
// point is, which door the ambulance comes to, who has the plant room key -
// is a blank, and the property fills it in. An evacuation route invented by
// somebody who has never seen the building is the single most dangerous thing
// this platform could produce, and it would be believed because it is typeset.

export const POOL_EAP_SECTIONS: PlanSection[] = [

  {
    heading: 'Before anything else',
    intro:
      'Complete this page and put it where it can be read without unlocking anything. Nothing else in this plan '
      + 'works until these are filled in and every member of the team knows them without looking.',
    mustBeChecked: true,
    facts: [
      { label: 'Emergency telephone, and where it is' },
      { label: 'How the alarm is raised', long: true, hint: 'The word, the whistle signal, the button, and where each one is.' },
      { label: 'What the alarm sounds like, and what each signal means', long: true },
      { label: 'Assembly point' },
      { label: 'Address the emergency services are given', long: true, hint: 'The exact wording, including the entrance they should come to.' },
      { label: 'Which door or gate the ambulance uses, and who meets it' },
      { label: 'Duty manager, and how they are reached at any hour' },
      { label: 'On-site first aiders on duty, and how to find them' },
      { label: 'Nearest defibrillator' },
      { label: 'Pool plant isolation point, and who holds the key' },
      { label: 'Main electrical isolation point' },
      { label: 'Out of hours escalation contact' },
    ],
  },

  {
    heading: 'What every emergency has in common',
    paragraphs: [
      'Raise the alarm before doing anything else. One person acting alone and silently is the most common way '
      + 'a recoverable incident becomes a serious one.',
      'Clear the water when any emergency is declared, unless doing so would put somebody in more danger. '
      + 'Bathers still in the water are bathers somebody has to watch while dealing with the incident.',
      'One person leads. Everybody else takes an instruction from them. Two people improvising in parallel is '
      + 'worse than either of them acting alone.',
      'Do not move a casualty unless leaving them where they are puts them in further danger.',
      'Nothing is put back to normal until the person leading says so, and nothing is tidied away before it has '
      + 'been recorded.',
    ],
  },

  {
    heading: 'Casualty in the water',
    ownPage: true,
    mustBeChecked: true,
    intro: 'Somebody in difficulty, face down, motionless, or not responding.',
    actions: [
      { name: 'Raise the alarm', action: 'Alert the team in the agreed way before entering the water. Never attempt a rescue without the rest of the team knowing it is happening.', by: '' },
      { name: 'Clear the water', action: 'Get every other bather out of every pool. A second casualty while the first is being recovered is the scenario that overwhelms a small team.', by: '' },
      { name: 'Reach or throw first', action: 'Use the reaching pole or throwing aid where the casualty can be reached. Enter the water only where it is necessary and you are competent to do so.', by: '' },
      { name: 'Suspect a spinal injury', action: 'Where the casualty may have struck their head or entered the water badly, support the head and neck in the water and do not lift them out without the spinal board and enough people.', by: '' },
      { name: 'Recover and assess', action: 'Remove the casualty by the shortest safe route. Check response, airway and breathing.', by: '' },
      { name: 'Start resuscitation', action: 'Begin rescue breaths and chest compressions if not breathing normally. Send for the defibrillator at the same moment, not afterwards.', by: '' },
      { name: 'Call an ambulance', action: 'Dial 999, give the agreed address and entrance, and stay on the line. Send somebody to meet the ambulance and hold the doors.', by: '' },
      { name: 'Manage everybody else', action: 'Move other guests away from the area, into a space where they are supervised and not watching.', by: '' },
      { name: 'Record it', action: 'Write down what happened, the times, who did what, and who witnessed it, before anybody goes home. Report under RIDDOR where it applies.', by: '' },
    ],
  },

  {
    heading: 'Chemical release or suspected exposure',
    ownPage: true,
    mustBeChecked: true,
    intro:
      'A smell of chlorine over the water, eye or throat irritation among bathers, a spill, a delivery gone wrong, '
      + 'or a dosing fault. Treat every one as serious until proven otherwise.',
    actions: [
      { name: 'Clear the area', action: 'Evacuate the pool hall and wet areas immediately. Do not wait to establish what has been released.', by: '' },
      { name: 'Do not enter', action: 'Nobody enters the plant room or the affected area. A gas release has injured more rescuers than bathers.', by: '' },
      { name: 'Isolate if safe', action: 'Where the isolation point is outside the affected area and you are competent to use it, isolate the dosing plant.', by: '' },
      { name: 'Ventilate', action: 'Increase ventilation from outside the space where the controls allow it.', by: '' },
      { name: 'Call for help', action: 'Dial 999 and say a chemical release is suspected at a swimming pool. Name the chemicals held if you know them.', by: '' },
      { name: 'Account for everyone', action: 'Check at the assembly point that everybody who was in the wet areas is out, including changing rooms, saunas and steam rooms.', by: '' },
      { name: 'Treat anyone affected', action: 'Move anybody with symptoms into fresh air. Irrigate eyes with clean water. Anybody with breathing symptoms goes to hospital even if they feel better.', by: '' },
      { name: 'Stay closed', action: 'The facility does not reopen until a competent person has established the cause, corrected it and confirmed the water and air are safe.', by: '' },
    ],
  },

  {
    heading: 'Faecal or vomit contamination',
    ownPage: true,
    intro:
      'Common, routinely handled badly, and the one where the cost of getting it wrong is an outbreak traced back '
      + 'to your pool.',
    actions: [
      { name: 'Clear the pool', action: 'Everybody out of the affected pool immediately. Do not allow anyone to re-enter while it is being dealt with.', by: '' },
      { name: 'Identify what it is', action: 'Formed stool, diarrhoea or vomit. The three have different responses and the difference decides how long the pool stays shut.', by: '' },
      { name: 'Remove it', action: 'Remove solid matter with a scoop, wearing gloves. Do not use the vacuum for solid matter, and disinfect the scoop afterwards.', by: '' },
      { name: 'Treat the water', action: 'Raise the disinfectant level and hold it for the period the treatment regime states, correcting pH first so the disinfectant works.', by: '' },
      { name: 'Wait the full period', action: 'Hold the pool closed for the full contact time and the turnover period. Diarrhoea and vomit need considerably longer than formed stool.', by: '' },
      { name: 'Test before reopening', action: 'Confirm disinfectant, pH and clarity are within range and record the readings before anybody re-enters.', by: '' },
      { name: 'Record it', action: 'Log the incident, what was found, what was done, the times and the readings. This is what an environmental health officer asks to see.', by: '' },
    ],
  },

  {
    heading: 'Fire or evacuation',
    ownPage: true,
    mustBeChecked: true,
    intro:
      'Wet, barefoot and partly clothed people evacuating in cold weather is a spa-specific problem that general '
      + 'fire plans do not address.',
    actions: [
      { name: 'Raise the alarm', action: 'Operate the nearest call point and alert the team.', by: '' },
      { name: 'Clear the water', action: 'Get everybody out of every pool, sauna and steam room. Check the enclosed spaces by opening them, not by shouting into them.', by: '' },
      { name: 'Evacuate by the route', action: 'Take guests out by the designated route to the assembly point. Take blankets or robes where they are to hand and it does not delay anybody.', by: '' },
      { name: 'Check every space', action: 'Sweep changing rooms, cubicles, toilets, treatment rooms, relaxation areas and the plant room corridor. Somebody mid-treatment will not have heard the alarm the way you did.', by: '' },
      { name: 'Account for everyone', action: 'Use the booking list and the locker or key record to account for every guest and every member of staff.', by: '' },
      { name: 'Report to the fire service', action: 'Tell them immediately about anybody unaccounted for, and about the plant room and the chemicals held in it.', by: '' },
      { name: 'Keep them warm', action: 'Somebody wet in cold weather becomes a casualty within minutes. Get people indoors or into vehicles as soon as it is safe.', by: '' },
      { name: 'Do not go back', action: 'Nobody re-enters for belongings, phones or anything else until the fire service releases the building.', by: '' },
    ],
  },

  {
    heading: 'Serious injury or sudden illness on the premises',
    ownPage: true,
    intro:
      'Cardiac events, cold water shock, heat exhaustion, fainting, slips and falls. Heat, cold and dehydration '
      + 'make these more likely in a spa than almost anywhere else.',
    actions: [
      { name: 'Send for the first aider', action: 'Call the nearest qualified first aider and the duty manager at the same time, not one after the other.', by: '' },
      { name: 'Make it safe', action: 'Stop whatever caused it. Turn off a jet, clear the area, get people out of the sauna or the plunge.', by: '' },
      { name: 'Assess and treat', action: 'Check response, airway and breathing. Treat within your training and no further.', by: '' },
      { name: 'Get the defibrillator', action: 'For anybody unresponsive and not breathing normally, send somebody for the defibrillator immediately and start compressions.', by: '' },
      { name: 'Call an ambulance', action: 'Dial 999 where there is any doubt. Send somebody to meet it and hold the doors.', by: '' },
      { name: 'Protect their dignity', action: 'Screen the area, move other guests away, and cover the casualty. This is a person in a swimming costume in a public space.', by: '' },
      { name: 'Record it', action: 'Complete the accident record before the end of the shift, while the detail is accurate. Report under RIDDOR where it applies.', by: '' },
    ],
  },

  {
    heading: 'Loss of water clarity',
    ownPage: true,
    intro:
      'If the bottom of the pool cannot be seen clearly, a casualty on it cannot be seen either. This is a closure, '
      + 'not a maintenance note.',
    actions: [
      { name: 'Clear the pool', action: 'Everybody out. Clarity is not a matter of appearance: it is the difference between finding somebody and not.', by: '' },
      { name: 'Confirm the pool is empty', action: 'Do not rely on looking. Count bathers out against the count in, and physically check the floor by pole where clarity is very poor.', by: '' },
      { name: 'Test the water', action: 'Test disinfectant, pH, alkalinity and turbidity, and record.', by: '' },
      { name: 'Find the cause', action: 'Check the filtration, the circulation and the dosing. A clarity failure is usually a plant failure, and the plant does not fix itself.', by: '' },
      { name: 'Stay closed', action: 'The pool remains closed until the floor of the deepest point is clearly visible from the poolside and the readings are in range.', by: '' },
      { name: 'Record it', action: 'Log the closure, the readings, the cause and the time of reopening.', by: '' },
    ],
  },

  {
    heading: 'Lighting or power failure',
    ownPage: true,
    actions: [
      { name: 'Clear the water', action: 'Get everybody out of every pool immediately. Supervision in the dark is not supervision.', by: '' },
      { name: 'Keep them still', action: 'Ask guests to stay where they are until somebody reaches them. Wet floors, steps and unfamiliar routes in darkness cause the second incident.', by: '' },
      { name: 'Use the emergency lighting', action: 'Check emergency lighting has operated and how long it is rated for.', by: '' },
      { name: 'Escort guests out', action: 'Escort people from the wet areas to the changing rooms and then to a lit space, checking enclosed spaces as you go.', by: '' },
      { name: 'Check the plant', action: 'Establish whether circulation and dosing have stopped. Water quality begins to fall the moment circulation does.', by: '' },
      { name: 'Do not reopen on partial power', action: 'The facility reopens when lighting, circulation and alarms are all working, and the water has been tested.', by: '' },
    ],
  },

  {
    heading: 'Missing person, particularly a child',
    ownPage: true,
    actions: [
      { name: 'Search the water first', action: 'Search every pool, plunge and feature before anything else, including under any cover and in any area not visible from the poolside.', by: '' },
      { name: 'Raise the alarm', action: 'Alert every member of the team at once and appoint somebody to lead the search.', by: '' },
      { name: 'Clear and hold the water', action: 'Get bathers out and keep them out so the water can be seen and searched properly.', by: '' },
      { name: 'Secure the exits', action: 'Cover the doors so the search area does not keep growing while you search it.', by: '' },
      { name: 'Search the enclosed spaces', action: 'Saunas, steam rooms, cubicles, toilets, lockers, treatment rooms and anywhere a child could shut a door behind them. Open each one, do not call into it.', by: '' },
      { name: 'Call the police', action: 'Where the person is not found quickly, call 999. Do not wait to be certain before asking for help.', by: '' },
      { name: 'Record it', action: 'Write down the time reported, the description, where was searched, by whom and when.', by: '' },
    ],
  },

  {
    heading: 'Structural failure, glass breakage or equipment failure',
    ownPage: true,
    actions: [
      { name: 'Clear and isolate', action: 'Clear the affected area and stop anybody entering it. Isolate the equipment where the control is outside the danger.', by: '' },
      { name: 'Glass in or near the water', action: 'Close the pool. Glass on a pool floor cannot be found reliably by eye and is a laceration injury to a barefoot guest.', by: '' },
      { name: 'Do not clear it yourself', action: 'Where the failure is structural, ceiling, glazing or a fixed installation, keep everybody clear and call a competent person. Do not test it by standing under it.', by: '' },
      { name: 'Record and report', action: 'Log it, photograph it and report it. A structural failure in a pool hall is a dangerous occurrence under RIDDOR in several circumstances.', by: '' },
      { name: 'Reopen on authority', action: 'The area reopens when a competent person has inspected it and said so in writing.', by: '' },
    ],
  },

  {
    heading: 'Disorderly or threatening behaviour',
    ownPage: true,
    actions: [
      { name: 'Do not go alone', action: 'Never approach alone. Get another member of the team and tell the duty manager before you speak to anybody.', by: '' },
      { name: 'Protect the other guests', action: 'Move other bathers away from the area first. The priority is everybody else, not resolving the behaviour.', by: '' },
      { name: 'Ask once, calmly', action: 'State what has to stop and what happens if it does not. Do not negotiate, argue, or match the tone.', by: '' },
      { name: 'Withdraw and escalate', action: 'Where it does not stop, or anybody feels unsafe, withdraw and call the duty manager. Nobody is expected to stand their ground.', by: '' },
      { name: 'Call the police', action: 'Dial 999 for any threat of violence, any weapon, or anybody who will not leave.', by: '' },
      { name: 'Record it', action: 'Write it down the same day, including what was said, by whom, and who saw it.', by: '' },
    ],
  },

  {
    heading: 'After any emergency',
    intro: 'The half that gets skipped because everybody wants to go home.',
    actions: [
      { name: 'Record it properly', action: 'Complete the incident record before the end of the shift, while the times and the sequence are still accurate.', by: '' },
      { name: 'Take witness accounts', action: 'Ask anybody who saw it to write down what they saw, in their own words, on the day.', by: '' },
      { name: 'Preserve the scene', action: 'Leave equipment, readings and the area as they are until they have been recorded. Keep any relevant footage before it is overwritten.', by: '' },
      { name: 'Report externally', action: 'Report under RIDDOR where it applies, and notify the insurer and [property leadership contact].', by: '' },
      { name: 'Look after the team', action: 'Anybody involved in a serious incident is sent home with somebody, not left to close up. Follow it up the next day.', by: '' },
      { name: 'Debrief', action: 'Hold a debrief within a week: what happened, what worked, what did not, and what changes as a result.', by: '' },
      { name: 'Change the plan', action: 'Where the debrief finds a gap, change this document, re-brief the team and record that you did.', by: '' },
    ],
  },

  {
    heading: 'Drills and briefing',
    facts: [
      { label: 'Drill frequency, by scenario', hint: 'A rescue drill is not the same as a fire drill, and both are needed.' },
      { label: 'Who must attend, and what happens if they cannot' },
      { label: 'Who runs the drill and records it' },
      { label: 'Where drill records are kept' },
      { label: 'How a new starter is briefed on this plan before working poolside', long: true },
      { label: 'How the team is told when this plan changes', long: true },
    ],
    mustBeChecked: true,
  },
]
