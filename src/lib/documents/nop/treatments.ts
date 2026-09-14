import type { PlanSection } from '../plan-types'

// Part D. Treatments.
//
// The revenue, and the part of the operation where a guest is alone in a room
// with a member of staff, undressed, for an hour. It carries clinical risk,
// safeguarding risk and a professional indemnity position, and most spa
// operating procedures say almost nothing about it.

const PART = 'D. Treatments and therapy'

export const TREATMENT_SECTIONS: PlanSection[] = [
  {
    part: PART,
    heading: 'The treatment menu',
    intro:
      'Every treatment offered, with what is required to deliver it. A treatment on the menu that nobody on the '
      + 'rota is qualified for is a booking waiting to be cancelled or, worse, delivered anyway.',
    mustBeChecked: true,
    table: {
      columns: ['Treatment', 'Duration', 'Qualification required', 'Insurance required', 'Patch test needed'],
      rows: Array.from({ length: 20 }, () => ['', '', '', '', '']),
      fillable: true,
    },
  },
  {
    part: PART,
    heading: 'Consultation and consent',
    facts: [
      { label: 'What every guest is asked before a treatment', long: true },
      { label: 'How consent is recorded, and for what' },
      { label: 'Treatments requiring written consent rather than verbal', long: true },
      { label: 'How often a consultation is repeated for a returning guest' },
      { label: 'Contraindications checked, and who checks them', long: true },
      { label: 'Who may decide to decline or modify a treatment' },
      { label: 'How a declined treatment is recorded and handled with the guest', long: true },
      { label: 'Patch testing: which treatments, what interval, and how it is recorded', long: true },
      { label: 'Treatment of guests under eighteen, and what is required', long: true, hint: 'Parental consent, presence, and which treatments are not offered at all.' },
      { label: 'Treatment during pregnancy: what is offered, modified and declined', long: true },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'In the treatment room',
    actions: [
      { name: 'Prepare the room', action: 'Set the couch height for yourself, check every heated item against its stated maximum, confirm linen is fresh and the room is clean.', by: '' },
      { name: 'Greet and consult', action: 'Complete the consultation, check contraindications against the treatment booked, and confirm what the treatment involves before the guest undresses.', by: '' },
      { name: 'Explain the draping', action: 'Explain what will be uncovered, when, and how it will be covered. Do this before you leave the room, not once they are on the couch.', by: '' },
      { name: 'Leave the room', action: 'Leave the guest to undress in private, knock before returning, and wait to be invited in.', by: '' },
      { name: 'Check through the treatment', action: 'Check comfort, pressure and temperature at the start and at intervals. Ask rather than assume they will say.', by: '' },
      { name: 'Finish and leave', action: 'Tell the guest the treatment has finished, cover them, and leave them to dress in private.', by: '' },
      { name: 'Aftercare', action: 'Give aftercare advice, including hydration, what to avoid and for how long, and anything to watch for.', by: '' },
      { name: 'Record it', action: 'Record the treatment, anything noted on the skin or body, and any reaction, against the guest record on the same day.', by: '' },
      { name: 'Turn the room', action: 'Change all linen, clean and disinfect the couch and every item touched, and reset to the standard before the next guest.', by: '' },
    ],
  },
  {
    part: PART,
    heading: 'Professional boundaries and safeguarding',
    intro:
      'This protects the therapist as much as the guest, and it is the section that is missing when something goes '
      + 'wrong and there is nothing written down on either side.',
    facts: [
      { label: 'Draping policy, stated treatment by treatment where it differs', long: true },
      { label: 'How a guest can summon help from the couch' },
      { label: 'Check frequency where no call point exists' },
      { label: 'Chaperone policy: when one is offered and how one is requested', long: true },
      { label: 'Door policy: locked, unlocked, engaged', hint: 'A door that cannot be opened from outside is a door nobody can reach a collapsed guest through.' },
      { label: 'What a therapist does if a guest behaves inappropriately', long: true, hint: 'Ending the treatment must be explicitly permitted, or a therapist will stay in the room.' },
      { label: 'What happens after such an incident: who is told, what is recorded, what support is given', long: true },
      { label: 'How an allegation against a therapist is handled', long: true },
      { label: 'Safeguarding lead for the property, and how they are reached' },
      { label: 'Training on boundaries, and how often it is repeated' },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Products, stock and hygiene',
    facts: [
      { label: 'Product houses in use, and where safety data or product information is held' },
      { label: 'How products are stored, and any that need particular conditions' },
      { label: 'Shelf life and opened-product life, and how it is tracked', long: true },
      { label: 'Decanting policy', hint: 'A decanted product with no label is a product nobody can identify after a reaction.' },
      { label: 'Cleaning and disinfection between guests, item by item', long: true },
      { label: 'Linen handling: clean storage, soiled storage, and laundry arrangements', long: true },
      { label: 'Single-use items, and confirmation they are genuinely single use' },
      { label: 'Any implement that could break the skin, and how it is sterilised or disposed of', long: true },
      { label: 'Hand hygiene facilities available to therapists' },
      { label: 'What a therapist does about a cut, a skin condition or an infection on their hands', long: true },
    ],
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Heated and specialist equipment',
    table: {
      columns: ['Equipment', 'Maximum temperature', 'Checked before use by', 'Serviced how often', 'Training required'],
      rows: [
        ['Hot stone heater', '', '', '', ''],
        ['Wax heater', '', '', '', ''],
        ['Towel warmer', '', '', '', ''],
        ['Heated couch or blanket', '', '', '', ''],
        ['Steam or vapour unit', '', '', '', ''],
        ['Electrical facial equipment', '', '', '', ''],
        ['Body wrap equipment', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Adverse reactions',
    actions: [
      { name: 'Stop', action: 'Stop the treatment at the first sign of a reaction. Do not finish the section you are on.', by: '' },
      { name: 'Remove the product', action: 'Remove the product from the skin with the method the product house states, usually plenty of cool water.', by: '' },
      { name: 'Assess', action: 'Check for spreading redness, swelling, difficulty breathing or swelling of the face, lips or tongue. Any of those is an emergency.', by: '' },
      { name: 'Call for help', action: 'For any breathing or facial swelling, call 999 immediately. For anything else, call the first aider and the duty manager.', by: '' },
      { name: 'Keep the product', action: 'Keep the product and its batch details. It is the only way to establish what happened.', by: '' },
      { name: 'Record it', action: 'Record the reaction, the product, the timings and what was done, on the day, against the guest record and the incident log.', by: '' },
      { name: 'Follow up', action: 'Contact the guest the next day. Report to the product house and to the insurer where the reaction was serious.', by: '' },
    ],
  },
  {
    part: PART,
    heading: 'Therapist wellbeing',
    intro:
      'The most likely injury in a spa is to a therapist, over years, and it ends careers. It almost never appears '
      + 'on a risk register because it never produces an incident to report.',
    facts: [
      { label: 'Maximum treatment hours in a shift, and maximum consecutive treatments' },
      { label: 'Minimum break between treatments, and whether the booking system enforces it', hint: 'A policy the diary can overbook is not a policy.' },
      { label: 'Limit on consecutive deep tissue or heavy treatments' },
      { label: 'Couch height adjustment, and the training given on setting it' },
      { label: 'How a therapist reports early symptoms, and what happens when they do', long: true },
      { label: 'Rota arrangements that vary treatment type through a shift' },
      { label: 'Occupational health referral route' },
    ],
  },
]
