import type { PlanSection } from '../plan-types'
import { checkBlock, exceptionsBlock, howToUse } from './shape'

// The treatment floor, opening and closing.
//
// A therapist's opening checks are mostly about the room being safe and the
// products being what they claim to be. The closing checks are mostly about
// infection control and about the next person finding what they need. Both
// are where a spa quietly fails an audit: the treatment is excellent and the
// wax pot temperature has not been recorded since March.

const CHECKS = 'The checks'
const END = 'Recording and sign-off'

export const THERAPIST_OPENING: PlanSection[] = [
  ...howToUse(
    'Before the first treatment of the day, in every room being used.',
    'The therapist working the room.',
    'The room does not open and the treatment is moved or rebooked.',
  ),
  checkBlock(CHECKS, 'The room',
    'the treatment room setup standard, the infection control assessment and the electrical safety assessment', [
    { check: 'Room is clean, the couch is fresh, and linen is from the clean store rather than from yesterday' },
    { check: 'Floor is dry and clear, and nothing is trailing where a guest will walk in bare feet' },
    { check: 'Temperature and lighting are at the standard for the treatment being given' },
    { check: 'Couch adjusts, locks, and holds at the height you set it to', stop: true },
    { check: 'Every electrical item is undamaged, in date for testing, and is not run from a trailing adaptor', stop: true },
    { check: 'Call point, alarm or means of summoning help is reachable from beside the couch', stop: true },
    { check: 'Door lock or privacy indicator works, and the room cannot be walked into mid-treatment' },
    { check: 'Ventilation is working in any room where product is heated or vapour is used' },
  ]),
  checkBlock(CHECKS, 'Products and equipment',
    'the trolley restock procedure, the COSHH assessment and the product house standards', [
    { check: 'Trolley restocked to the par level for today, including anything the first treatment needs' },
    { check: 'Every product in use is in date, sealed or decanted correctly, and labelled' },
    { check: 'Safety data sheets exist for everything on the trolley, and you know where they are kept' },
    { check: 'Wax pot temperature checked and recorded before the first use, not after it', stop: true },
    { check: 'Hot stones, heated mitts or anything applied warm is tested at the stated temperature', stop: true },
    { check: 'Single-use items are stocked, and reusable items have been through the stated cleaning cycle' },
    { check: 'Disinfectant, hand hygiene and clinical waste provision are in place and not empty' },
  ]),
  checkBlock(CHECKS, 'Your day',
    'the consultation and consent procedure, the contraindication procedure and the treatment delivery standard', [
    { check: 'Today’s bookings read: treatment, duration, and any note carried from a previous visit' },
    { check: 'Consultation and consent forms are available for every guest, including repeat guests' },
    { check: 'Any guest with a flagged medical note, allergy or contraindication is known before they arrive' },
    { check: 'You hold a current certificate for every treatment on your list today' },
    { check: 'Uniform, hands and nails meet the standard, and no jewellery is worn that cannot be cleaned' },
  ]),
  ...exceptionsBlock(END),
]

export const THERAPIST_CLOSING: PlanSection[] = [
  ...howToUse(
    'After the last treatment of the day, in every room used.',
    'The therapist who worked the room.',
    'The duty manager is told before you leave the floor.',
  ),
  checkBlock(CHECKS, 'Infection control',
    'the infection control and water hygiene assessment, the cleaning standards and the COSHH assessment', [
    { check: 'Couch, trolley and every surface a guest or a hand touched has been cleaned with the stated product' },
    { check: 'Dwell time for the disinfectant was actually allowed rather than wiped straight off' },
    { check: 'Used linen is in the soiled store, not on a chair, and clean linen is covered' },
    { check: 'Clinical and general waste separated and removed, and sharps disposed of correctly if used' },
    { check: 'Reusable implements cleaned and put through the stated cycle, and the cycle is recorded' },
    { check: 'Any treatment involving broken skin, blood or body fluid has been recorded as the procedure requires' },
  ]),
  checkBlock(CHECKS, 'Equipment and product',
    'the electrical safety assessment, the stock control procedure and the COSHH assessment', [
    { check: 'Wax pots, heaters, steamers and hot cabinets switched off at the appliance', stop: true },
    { check: 'Anything faulty is tagged, taken out of use, and reported rather than left for the next person', stop: true },
    { check: 'Chemicals and flammable products returned to the stated store, closed and upright' },
    { check: 'Backbar checked, and anything running low is on the order list tonight' },
    { check: 'Retail stock used or sold from the room is recorded' },
  ]),
  checkBlock(CHECKS, 'Leaving it right for tomorrow',
    'the treatment room setup standard and the handover procedure', [
    { check: 'Room reset to the setup standard, not merely tidied' },
    { check: 'Linen and consumables restocked for tomorrow morning, or the shortfall is written down' },
    { check: 'Treatment notes completed for every guest today, while you still remember them' },
    { check: 'Anything a colleague needs to know about a guest, a room or a piece of equipment is handed over' },
    { check: 'Lights, music and ventilation set as the closing standard requires' },
  ]),
  ...exceptionsBlock(END),
]
