import type { PlanSection } from '../plan-types'
import { checkBlock, exceptionsBlock, howToUse } from './shape'

// Cleaning, opening and closing.
//
// The two shifts have opposite jobs. The opening team is making the building
// presentable and safe for a guest who has not arrived yet. The closing team
// is doing the work that cannot be done with guests in the building, and is
// the last person to see a room before it is locked, which makes them the
// most useful pair of eyes a spa has and the least often asked.

const CHECKS = 'The checks'
const END = 'Recording and sign-off'

export const CLEANING_OPENING: PlanSection[] = [
  ...howToUse(
    'Before the doors open, every day.',
    'The cleaning team on the opening shift.',
    'The duty manager decides whether that area opens.',
  ),
  checkBlock(CHECKS, 'Wet areas',
    'the wet area cleaning standard, the slips and trips assessment and the infection control assessment', [
    { check: 'Pool surround, changing room and shower floors cleaned, rinsed and left slip resistant', stop: true },
    { check: 'No standing water anywhere a guest walks barefoot, and drains are running freely' },
    { check: 'Showers, benches, grab rails and door handles cleaned with the stated product' },
    { check: 'Any sign of mould, scale or biofilm reported rather than only wiped' },
    { check: 'Thermal cabins wiped down, and nothing is left inside from yesterday' },
    { check: 'Chemicals used are the stated ones, correctly diluted, and stored back in the locked store', stop: true },
  ]),
  checkBlock(CHECKS, 'Changing rooms and toilets',
    'the toilet and vanity check rotation, the amenities stocking procedure and the infection control assessment', [
    { check: 'Every cubicle, toilet, basin and vanity cleaned and dry' },
    { check: 'Soap, sanitiser, paper and amenities stocked to the par level, not merely present' },
    { check: 'Bins emptied and relined, including the sanitary bins' },
    { check: 'Mirrors, lockers and seating cleaned and free of marks' },
    { check: 'Hairdryers and any shared equipment cleaned and working' },
    { check: 'Lockers checked for anything left overnight, and anything found is handed in as lost property' },
  ]),
  checkBlock(CHECKS, 'Front of house and back of house',
    'the public area checks, the deep cleaning programme and the fire safety assessment', [
    { check: 'Entrance, reception, corridors and relaxation area cleaned and presentable' },
    { check: 'Glass, doors and touch points cleaned' },
    { check: 'Escape routes and fire doors clear, with nothing stored against them', stop: true },
    { check: 'Cleaning trolley and equipment are not left where a guest can reach them' },
    { check: 'Any area that could not be cleaned properly is reported before opening, not after' },
  ]),
  ...exceptionsBlock(END),
]

export const CLEANING_CLOSING: PlanSection[] = [
  ...howToUse(
    'After the last guest has left, every day.',
    'The cleaning team on the closing shift.',
    'The duty manager is told before the building is locked.',
  ),
  checkBlock(CHECKS, 'The deep work that cannot be done with guests in',
    'the deep cleaning programme, the descale rotation and the infection control assessment', [
    { check: 'Showers and wet area drains cleaned and descaled to the rotation' },
    { check: 'Thermal cabins cleaned as the manufacturer and the procedure require' },
    { check: 'Floors machine cleaned or mopped through, and left to dry properly before locking' },
    { check: 'Treatment rooms checked behind the therapist: surfaces, floor, bin, linen' },
    { check: 'Gym and studio equipment, mats and touch points cleaned' },
    { check: 'Anything on the deep clean rotation due today is done and initialled' },
  ]),
  checkBlock(CHECKS, 'Waste, linen and stock',
    'the waste segregation procedure, the linen procedure and the COSHH assessment', [
    { check: 'All waste removed, segregated correctly, and taken to the stated point' },
    { check: 'Soiled linen bagged and moved to the collection point, and clean linen left covered' },
    { check: 'Linen counted against the par level, and any shortage reported tonight' },
    { check: 'Chemicals returned to the locked store, closed, upright and not decanted into unlabelled bottles', stop: true },
    { check: 'Cleaning equipment cleaned, dried and stored, and mop heads changed to the rotation' },
  ]),
  checkBlock(CHECKS, 'What you are the last to see',
    'the closing procedure, the fire safety assessment and the maintenance reporting procedure', [
    { check: 'Every room and cabin is empty of people before it is switched down and closed', stop: true },
    { check: 'Lights, taps and equipment off, and nothing left running that should not be' },
    { check: 'Fire doors closed, escape routes clear, nothing blocking an exit', stop: true },
    { check: 'Any damage, leak, fault or smell reported tonight with where it is and what it looks like' },
    { check: 'Anything found belonging to a guest is logged as lost property rather than left where it was' },
  ]),
  ...exceptionsBlock(END),
]
