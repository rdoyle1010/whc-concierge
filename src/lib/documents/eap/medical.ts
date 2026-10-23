import type { PlanAction, PlanSection } from '../plan-types'

// Part C. Medical emergencies.
//
// The ones a spa actually gets. Heat, cold, dehydration, exertion and being
// horizontal for an hour make fainting, cardiac events and low blood sugar
// more likely here than almost anywhere a guest would otherwise be, and the
// person it happens to is usually undressed and alone in a small room.

const PART = 'C. Medical emergencies'

const page = (heading: string, intro: string, actions: PlanAction[]): PlanSection => ({
  part: PART, heading, intro, ownPage: true, actions,
})

export const MEDICAL_SECTIONS: PlanSection[] = [
  {
    ...page(
      'Cardiac arrest',
      'Unresponsive and not breathing normally. Occasional gasping is not breathing. Every minute without '
      + 'compressions costs about a tenth of their chance of surviving.',
      [
        { name: 'Check and shout', action: 'Check for a response and for normal breathing, taking no more than ten seconds. Shout for help immediately.', by: '' },
        { name: 'Call 999 and send for the defibrillator', action: 'Two separate people, at the same moment. Put the phone on speaker and leave it on.', by: '' },
        { name: 'Start compressions', action: 'Centre of the chest, hard and fast, and do not stop except to use the defibrillator. Do not wait for it to arrive before starting.', by: '' },
        { name: 'Use the defibrillator', action: 'Switch it on and follow what it says. Dry the chest first: this is a spa and the casualty will be wet.', by: '' },
        { name: 'Swap over', action: 'Change the person doing compressions every two minutes. Good compressions are exhausting and they deteriorate before the person doing them notices.', by: '' },
        { name: 'Clear the space', action: 'Move other guests out of the area and hold the route to the door clear.', by: '' },
        { name: 'Hand over', action: 'Tell the ambulance crew the time of collapse, the time compressions started, how many shocks were given and anything known about the casualty.', by: '' },
      ],
    ),
    mustBeChecked: true,
  },
  page(
    'Anaphylaxis and severe allergic reaction',
    'Swelling of the face, lips or tongue, difficulty breathing, a widespread rash, or sudden collapse after a '
    + 'product, a treatment or something eaten. Treat as anaphylaxis if in any doubt.',
    [
      { name: 'Stop the cause', action: 'Stop the treatment. Remove the product from the skin with plenty of cool water.', by: '' },
      { name: 'Call 999', action: 'Say the word anaphylaxis. Do not wait to see whether it settles.', by: '' },
      { name: 'Use their adrenaline', action: 'If the guest carries an auto-injector, help them use it, or use it for them into the outer thigh. Note the time.', by: '' },
      { name: 'Position them', action: 'Lie them flat with their legs raised. If they are struggling to breathe, let them sit up. Never stand them up, even if they feel better.', by: '' },
      { name: 'Second dose', action: 'If there is no improvement after five minutes and a second auto-injector is available, use it and note the time.', by: '' },
      { name: 'Keep the product', action: 'Keep the product, the packaging and the batch number. It is the only way to establish what happened.', by: '' },
      { name: 'Stay with them', action: 'Do not leave them alone and do not let them walk to the ambulance.', by: '' },
    ],
  ),
  page(
    'Heat exhaustion and heat stroke',
    'Sauna, steam room, hydrotherapy pool or a hot class. Heat exhaustion is pale, clammy, dizzy and nauseous. '
    + 'Heat stroke is hot, confused or unconscious, and it is an emergency.',
    [
      { name: 'Get them out', action: 'Move them out of the heat to a cool area. Support them: do not let them walk unaided across a wet floor.', by: '' },
      { name: 'Cool them', action: 'Lie them down, raise their legs, remove excess layers and cool them with cool water and air movement.', by: '' },
      { name: 'Give fluids if they are fully alert', action: 'Cool water, sipped. Nothing by mouth if they are drowsy, confused or vomiting.', by: '' },
      { name: 'Judge which it is', action: 'Confusion, hot dry skin, a temperature that will not come down, or any loss of consciousness is heat stroke. Call 999 immediately.', by: '' },
      { name: 'Keep cooling', action: 'Keep cooling until help arrives. Do not stop because they say they feel better.', by: '' },
      { name: 'Do not let them return', action: 'Nobody goes back into a heat experience on the same visit, whatever they say.', by: '' },
      { name: 'Record it', action: 'Log which facility, how long they were in it, the temperature, and what they had eaten or drunk.', by: '' },
    ],
  ),
  page(
    'Cold water shock',
    'A cold plunge, ice bath or cold shower. The gasp reflex on entry is involuntary and happens before anybody '
    + 'can decide anything. A guest who submerges on entry inhales.',
    [
      { name: 'Get them out', action: 'Get them out of the water immediately, using a reaching aid rather than entering if you can.', by: '' },
      { name: 'Check breathing', action: 'Check response and breathing. Anybody who has inhaled water needs an ambulance even if they seem fine.', by: '' },
      { name: 'Call 999', action: 'For any breathing difficulty, chest pain, confusion or loss of consciousness.', by: '' },
      { name: 'Warm them gradually', action: 'Move them somewhere warm, dry them, and wrap them. Do not use a hot shower, a sauna or a hot tub to warm them.', by: '' },
      { name: 'Keep them still', action: 'Keep them horizontal and still. Sudden movement after cold immersion can worsen a cardiac problem.', by: '' },
      { name: 'Watch them', action: 'Do not leave them alone, and do not let them drive. Breathing problems after inhaling water can appear hours later.', by: '' },
    ],
  ),
  page(
    'Fainting and collapse',
    'The single most common medical event in a spa, and it usually happens in the changing room rather than at '
    + 'the poolside, because that is where somebody goes when they start to feel unwell.',
    [
      { name: 'Protect their head', action: 'If they are falling, support them down. A faint onto a tiled wet floor is a head injury.', by: '' },
      { name: 'Lie them flat', action: 'Lie them on their back and raise their legs. Do not sit them up.', by: '' },
      { name: 'Check breathing', action: 'Check they are breathing normally. If not, treat as cardiac arrest.', by: '' },
      { name: 'Give them air', action: 'Loosen anything tight, move people away and open a door or window.', by: '' },
      { name: 'Judge it', action: 'A faint that recovers within a minute with no injury may not need an ambulance. Anything longer, any injury, any confusion or any chest pain does.', by: '' },
      { name: 'Bring them round slowly', action: 'Keep them lying down for several minutes, then sitting, then standing. Standing straight up is how the second faint happens.', by: '' },
      { name: 'Record it and follow up', action: 'Record it, tell them not to use the heat experiences again that day, and offer to call somebody for them.', by: '' },
    ],
  ),
  page(
    'Seizure',
    'Whether or not the guest is known to have epilepsy. Heat, flashing light, exhaustion and low blood sugar can '
    + 'all trigger one.',
    [
      { name: 'Do not restrain', action: 'Do not hold them down and do not put anything in their mouth.', by: '' },
      { name: 'Protect them', action: 'Move furniture and hard objects away, and cushion their head. In water, support their head above the surface and get them out as soon as it is safe.', by: '' },
      { name: 'Time it', action: 'Note the time it started. The length is the single most important thing you will be asked.', by: '' },
      { name: 'Call 999 if', action: 'It lasts more than five minutes, another follows immediately, it happened in water, they are injured, or it is their first.', by: '' },
      { name: 'Recovery position', action: 'Once the convulsions stop, place them on their side and check breathing.', by: '' },
      { name: 'Stay and screen', action: 'Stay with them until they are fully recovered, and screen the area. This is a distressing thing to have witnessed and a humiliating thing to wake from.', by: '' },
    ],
  ),
  page(
    'Diabetic emergency',
    'Sweating, shaking, confusion, aggression or drowsiness. Exercise, heat and a missed meal make low blood '
    + 'sugar more likely in a spa than a guest expects.',
    [
      { name: 'Ask', action: 'Ask whether they are diabetic and whether they have taken their insulin and eaten.', by: '' },
      { name: 'Give sugar if they are fully alert', action: 'A sugary drink, glucose tablets or something sweet. Nothing by mouth if they are drowsy or confused.', by: '' },
      { name: 'Wait and repeat', action: 'Wait ten minutes. If there is no improvement, give more and call 999.', by: '' },
      { name: 'Follow with food', action: 'Once they improve, give something starchy so it does not happen again in twenty minutes.', by: '' },
      { name: 'Call 999 if', action: 'They are drowsy, unconscious, will not improve, or you cannot tell whether it is high or low.', by: '' },
      { name: 'Do not send them back', action: 'No heat experiences and no gym for the rest of the visit.', by: '' },
    ],
  ),
  page(
    'Stroke',
    'Face fallen on one side, an arm that cannot be raised, speech that is slurred or confused. Time is the only '
    + 'thing that matters.',
    [
      { name: 'Test it', action: 'Ask them to smile, to raise both arms, and to repeat a sentence. Any one of those failing is enough.', by: '' },
      { name: 'Call 999 immediately', action: 'Say the word stroke and give the time symptoms started, or the time they were last seen well.', by: '' },
      { name: 'Note the time', action: 'The time symptoms began decides what treatment they can have. Write it down.', by: '' },
      { name: 'Keep them comfortable', action: 'Sit them up slightly supported. Nothing to eat or drink, because swallowing may be affected.', by: '' },
      { name: 'Stay with them', action: 'Stay with them, keep talking to them, and do not let them go home to see how they feel.', by: '' },
    ],
  ),
  page(
    'Choking',
    'In the relaxation lounge, at the refreshment station, or anywhere food or drink is served.',
    [
      { name: 'Ask', action: 'Ask if they are choking. Somebody who can cough forcefully should be encouraged to cough.', by: '' },
      { name: 'Back blows', action: 'If the cough is ineffective, give up to five sharp blows between the shoulder blades with them leaning forward.', by: '' },
      { name: 'Abdominal thrusts', action: 'If that fails, give up to five abdominal thrusts, then alternate. Not on a pregnant guest: use chest thrusts.', by: '' },
      { name: 'Call 999', action: 'Call as soon as back blows do not clear it, and keep going until help arrives.', by: '' },
      { name: 'If they collapse', action: 'Start chest compressions immediately.', by: '' },
      { name: 'Send them to hospital', action: 'Anybody who received abdominal thrusts is checked at hospital, even once the obstruction has cleared.', by: '' },
    ],
  ),
  page(
    'Serious bleeding',
    'Broken glass in a wet area, a fall, or an injury from equipment.',
    [
      { name: 'Protect yourself', action: 'Put gloves on. They are in the first aid kit and the spill kit.', by: '' },
      { name: 'Press hard', action: 'Apply firm direct pressure to the wound with a dressing or the cleanest thing available, and keep pressing.', by: '' },
      { name: 'Raise it', action: 'Raise the injured part above the level of the heart where you can.', by: '' },
      { name: 'Do not remove anything embedded', action: 'Press around an embedded object, not on it.', by: '' },
      { name: 'Call 999', action: 'For bleeding that will not stop, spurting blood, or a casualty who is pale, cold or drowsy.', by: '' },
      { name: 'Clear and clean', action: 'Clear the area of guests, and deal with the blood under the contamination procedure once the casualty is safe.', by: '' },
    ],
  ),
  page(
    'Head, neck or back injury',
    'A fall on a wet surround, a dive into shallow water, or a fall from gym equipment.',
    [
      { name: 'Do not move them', action: 'Tell them not to move and hold their head still with both hands in the position you found it.', by: '' },
      { name: 'In the water', action: 'Support the head and neck in the water. Do not lift them out without a spinal board and enough people to do it properly.', by: '' },
      { name: 'Call 999', action: 'Call for any loss of consciousness, any neck or back pain, any numbness or tingling, or any dive injury.', by: '' },
      { name: 'Keep them warm', action: 'A casualty lying still on a wet floor loses heat quickly. Cover them without moving them.', by: '' },
      { name: 'Watch their breathing', action: 'Keep checking they are breathing normally, and be ready to act if that changes.', by: '' },
      { name: 'Preserve the scene', action: 'Do not clean up, do not move equipment, and photograph the area once the casualty has gone.', by: '' },
    ],
  ),
  page(
    'A guest taken ill during a treatment',
    'Alone, in a small room, undressed, with one therapist. The hardest medical emergency in the spa to manage '
    + 'well, and the one most likely to happen.',
    [
      { name: 'Stop and call for help', action: 'Stop the treatment and call for help using the call point or the door. Do not leave the room to fetch somebody.', by: '' },
      { name: 'Cover them', action: 'Cover the guest properly before anybody else comes in. Their dignity matters and they will remember it.', by: '' },
      { name: 'Treat', action: 'Treat according to what is happening: faint, reaction, cardiac, seizure. Follow the relevant page of this plan.', by: '' },
      { name: 'Get them off the couch safely', action: 'Only if it is safe to do so and with enough people. A treatment couch is narrow and high, and a fall from one is a second injury.', by: '' },
      { name: 'Call 999 if in doubt', action: 'A therapist alone with a collapsed guest should call rather than deliberate.', by: '' },
      { name: 'Clear the corridor', action: 'Move other guests out of the treatment corridor so the crew can get in and nobody is watching.', by: '' },
      { name: 'Look after the therapist', action: 'The therapist does not go straight into their next treatment. Somebody covers it.', by: '' },
    ],
  ),
  page(
    'Needlestick or exposure to blood',
    'A sharp found during cleaning, a splash of blood or body fluid, or a bite.',
    [
      { name: 'Bleed it and wash it', action: 'Encourage the wound to bleed under running water. Do not scrub and do not suck it.', by: '' },
      { name: 'Irrigate splashes', action: 'Eyes, nose or mouth: rinse thoroughly with water or eyewash for several minutes.', by: '' },
      { name: 'Cover it', action: 'Cover the wound with a waterproof dressing.', by: '' },
      { name: 'Report it immediately', action: 'Tell the duty manager on the spot. This is not something to mention at the end of the shift.', by: '' },
      { name: 'Seek advice the same day', action: 'Go to occupational health or accident and emergency the same day. Treatment that prevents infection is time limited.', by: '' },
      { name: 'Keep the object', action: 'Where it is safe, retain the sharp in a sharps container for identification.', by: '' },
      { name: 'Record and investigate', action: 'Record it, and establish how a sharp came to be where it was.', by: '' },
    ],
  ),
]
