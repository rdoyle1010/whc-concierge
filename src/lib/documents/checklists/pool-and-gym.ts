import type { PlanSection } from '../plan-types'
import { checkBlock, exceptionsBlock, howToUse } from './shape'

// The pool, the thermal suite and the gym floor.
//
// These five were in the build plan from the start, drafted as procedures,
// and stored with steps under headings. Their references end in CHK, so the
// library judged them as checklists, asked for a summary and sections, and
// found neither. Seven documents sat unsignable for weeks because of a three
// letter mismatch between what they were called and what they were written
// as, and no amount of redrafting could resolve it: the drafter was being
// asked for the wrong shape.
//
// So they are written here, as checklists, beside the nine that already
// were. The pool and thermal ones are life safety: a plant room reading
// outside range or a missing pool alarm is not a note for the end of the
// shift, and those checks are marked [STOP].

const CHECKS = 'The checks'
const END = 'Recording and sign-off'

export const POOL_OPENING: PlanSection[] = [
  ...howToUse(
    'Before any guest enters the pool, thermal suite or changing areas, every day.',
    'The duty pool operator, or the person holding the pool responsibility for the shift.',
    'The area does not open. Tell the duty manager before you leave the plant room.',
  ),
  checkBlock(CHECKS, 'Water quality, before anybody is in it',
    'the pool safety operating procedure, the water hygiene assessment and the COSHH assessment', [
    { check: 'Free chlorine or equivalent disinfectant is inside the range stated in the operating procedure', stop: true },
    { check: 'pH is inside the stated range, and the reading is recorded rather than remembered', stop: true },
    { check: 'Combined chlorine is inside range, or the reason and the action taken are written down', stop: true },
    { check: 'Water is clear: the deepest drain cover is visible from the side without stooping', stop: true },
    { check: 'Temperature of pool and of each thermal cabin is inside the stated range' },
    { check: 'Test kit reagents are in date, and the photometer or comparator has a current calibration' },
    { check: 'Yesterday’s closing readings were completed and signed, and nothing was left open overnight' },
  ]),
  checkBlock(CHECKS, 'Plant and chemical safety',
    'the pool safety operating procedure, the plant room procedure and the COSHH assessment', [
    { check: 'Dosing plant is running, with no alarm showing and no manual override left in place', stop: true },
    { check: 'Chemical stock levels are sufficient for the day, and the two chemical types are stored apart', stop: true },
    { check: 'Chemical store is locked, dry, ventilated, and free of spill or crystallised residue' },
    { check: 'Personal protective equipment for the plant room is present, clean and undamaged' },
    { check: 'Circulation and filtration are running at the stated rate, and backwash is up to date' },
    { check: 'No leak, no standing water and no smell of chloramine in the plant room or on the pool hall side' },
  ]),
  checkBlock(CHECKS, 'The area a guest walks into',
    'the pool safety operating procedure, the slips assessment and the emergency action plan', [
    { check: 'Rescue equipment is present, undamaged and in its stated position', stop: true },
    { check: 'Pool alarm or means of raising an alarm works when tested from the poolside', stop: true },
    { check: 'First aid provision is stocked, in date and reachable without leaving the area unsupervised', stop: true },
    { check: 'Depth markings, hazard signage and safety signage are present, clean and readable' },
    { check: 'Floors are clean and free of standing water beyond the drainage, and mats are flat and laid correctly' },
    { check: 'Ladders, steps, handrails and grab rails are secure and undamaged' },
    { check: 'Thermal cabin doors open from the inside, and every cabin is empty before it is brought to temperature' },
    { check: 'Lighting is working throughout, including underwater and in the changing areas' },
    { check: 'The person on duty holds the current qualification the operating procedure requires', stop: true },
  ]),
  ...exceptionsBlock(END),
]

export const POOL_CLOSING: PlanSection[] = [
  ...howToUse(
    'After the last guest has left the wet area, every day.',
    'The duty pool operator, or the person holding the pool responsibility for the shift.',
    'Do not lock up. Tell the duty manager before you leave the building.',
  ),
  checkBlock(CHECKS, 'Everybody is out',
    'the pool safety operating procedure and the emergency action plan', [
    { check: 'Pool, every thermal cabin, every relaxation area and both changing areas are physically walked and confirmed empty', stop: true },
    { check: 'Lockers are checked for anything left, and anything found goes to lost property with the date' },
    { check: 'Access to the wet area is secured so nobody can enter unsupervised overnight', stop: true },
  ]),
  checkBlock(CHECKS, 'Water and plant, left safe',
    'the pool safety operating procedure, the water hygiene assessment and the plant room procedure', [
    { check: 'Closing water readings taken and recorded, with any out of range result acted on and written up', stop: true },
    { check: 'Dosing plant left in its stated overnight state, with no manual override left on', stop: true },
    { check: 'Chemical store locked, and any delivery taken today is booked in and put away correctly' },
    { check: 'Backwash or overnight cycle set as the procedure requires for tonight' },
    { check: 'Covers, where used, are on and secured' },
    { check: 'Any defect found today is logged rather than passed on verbally, with who was told and when' },
  ]),
  checkBlock(CHECKS, 'The area, left ready',
    'the cleaning standards, the infection control assessment and the slips assessment', [
    { check: 'Wet area cleaned to the stated standard, including drains, benches and cabin interiors' },
    { check: 'Used linen removed and clean stock replenished for the morning' },
    { check: 'Floors left as dry as the drainage allows, and any wet floor signage removed or left correctly' },
    { check: 'Thermal cabins shut down or set as the procedure requires overnight' },
    { check: 'Rescue equipment returned to position and nothing borrowed for another area' },
    { check: 'Lighting, doors and any ventilation left as the building procedure requires' },
  ]),
  ...exceptionsBlock(END),
]

export const WATER_HOURLY: PlanSection[] = [
  ...howToUse(
    'Every hour the wet area is open, at the interval stated in the pool safety operating procedure.',
    'The duty pool operator, or the person holding the pool responsibility for that hour.',
    'Act on it now rather than at the next test, and tell the duty manager before the area takes another guest.',
  ),
  checkBlock(CHECKS, 'The reading',
    'the pool safety operating procedure and the water hygiene assessment', [
    { check: 'Free chlorine or equivalent disinfectant is inside the stated range', stop: true },
    { check: 'pH is inside the stated range', stop: true },
    { check: 'Combined chlorine is inside the stated range' },
    { check: 'Water temperature is inside the stated range' },
    { check: 'Clarity is unchanged: the deepest drain cover is still visible from the side' },
    { check: 'The reading is written down at the time it was taken, not reconstructed at the end of the shift', stop: true },
  ]),
  checkBlock(CHECKS, 'The bathing load and the area',
    'the pool safety operating procedure, the slips assessment and the emergency action plan', [
    { check: 'Number of bathers is at or below the maximum stated for this pool', stop: true },
    { check: 'Rescue equipment is still in position and undamaged' },
    { check: 'Poolside and changing floors are free of anything that has been dropped, spilled or broken' },
    { check: 'No guest is in difficulty, unsupervised where supervision is required, or in a cabin beyond the stated time' },
    { check: 'Thermal cabin temperatures are inside range and the doors still open from the inside' },
  ]),
  checkBlock(CHECKS, 'When a reading is out of range',
    'the pool safety operating procedure and the plant room procedure', [
    { check: 'The action taken is recorded against the reading, with the time' },
    { check: 'A retest is taken after the stated settling period and recorded separately', stop: true },
    { check: 'If the retest is still out of range, the area is closed to bathers and the duty manager is told', stop: true },
    { check: 'Nothing is dosed by hand without the training, the equipment and the authorisation the procedure requires', stop: true },
  ]),
  ...exceptionsBlock(END),
]

export const GYM_OPENING: PlanSection[] = [
  ...howToUse(
    'Before the gym floor or studio opens to any member or guest, every day.',
    'The first member of the gym floor team on shift.',
    'The affected equipment is tagged out, or the floor does not open. Tell the duty manager.',
  ),
  checkBlock(CHECKS, 'The equipment',
    'the preventive maintenance procedure, the gym floor safety assessment and the manufacturer schedules', [
    { check: 'Every cardio machine powers on, runs, and stops on its emergency stop when tested', stop: true },
    { check: 'Safety keys, tethers and stop cords are present on every machine that takes one', stop: true },
    { check: 'Cables, pulleys, belts and straps are undamaged, with no fraying and no exposed wire', stop: true },
    { check: 'Pins, collars and adjustment mechanisms are present, and nothing is held together temporarily' },
    { check: 'Racks, benches and frames are stable, bolted, and not moving under load' },
    { check: 'Anything tagged out is still tagged out and has not been quietly put back into use', stop: true },
    { check: 'Free weights are racked, matched, and nothing is left on a bar from last night' },
  ]),
  checkBlock(CHECKS, 'The floor and the environment',
    'the gym floor safety assessment, the slips assessment and the cleaning standards', [
    { check: 'Flooring is clean, dry, flat, and no matting is lifting or curling at an edge' },
    { check: 'Walkways between equipment are clear, at the spacing the layout requires' },
    { check: 'Temperature, ventilation and lighting are at the stated standard for the floor and studio' },
    { check: 'Mirrors, glass and studio fittings are intact, with no chip or crack anywhere reachable' },
    { check: 'Cleaning stations are stocked: wipes or spray, cloths, and a bin that is not already full' },
    { check: 'Water point is working and clean, and cups or refill provision are stocked' },
  ]),
  checkBlock(CHECKS, 'Safety and the day ahead',
    'the emergency action plan, the induction procedure and the class booking procedure', [
    { check: 'First aid kit and, where held, the defibrillator are present, sealed, in date and reachable', stop: true },
    { check: 'Emergency call point or means of summoning help works when tested', stop: true },
    { check: 'Emergency exits from the floor and the studio are clear and unlocked', stop: true },
    { check: 'Today’s classes, inductions and personal training sessions are known, with the studio set for the first one' },
    { check: 'Signage on safe use, supervision and age restrictions is in place and readable' },
    { check: 'The person opening holds the current qualification the procedure requires to supervise the floor' },
  ]),
  ...exceptionsBlock(END),
]

export const GYM_CLOSING: PlanSection[] = [
  ...howToUse(
    'After the last member has left the gym floor and studio, every day.',
    'The last member of the gym floor team on shift.',
    'Do not lock up. Tell the duty manager before you leave the building.',
  ),
  checkBlock(CHECKS, 'Everybody is out and the floor is safe',
    'the gym floor safety assessment and the emergency action plan', [
    { check: 'Gym floor, studio, and any changing area in your charge are physically walked and confirmed empty', stop: true },
    { check: 'Nobody is left training alone after staffed hours unless the lone working procedure allows it', stop: true },
    { check: 'Anything found is taken to lost property and logged with the date' },
  ]),
  checkBlock(CHECKS, 'Equipment, left as it should be found',
    'the preventive maintenance procedure, the cleaning standards and the manufacturer schedules', [
    { check: 'Free weights racked to their correct positions, and every bar stripped' },
    { check: 'Machines wiped down to the stated standard, including handles, grips and contact points' },
    { check: 'Any fault found today is raised as a maintenance request before you leave, not mentioned in passing', stop: true },
    { check: 'Anything unsafe is tagged out and physically isolated where the machine allows it', stop: true },
    { check: 'Studio equipment returned to its store, stacked as the storage standard requires' },
    { check: 'Cardio machines shut down or left as the manufacturer instruction requires overnight' },
  ]),
  checkBlock(CHECKS, 'The area, left ready',
    'the cleaning standards, the security procedure and the energy and building procedure', [
    { check: 'Floors cleaned, mats cleaned, and bins emptied rather than left for the morning' },
    { check: 'Cleaning stations restocked for the opening shift' },
    { check: 'Water point cleaned and refilled, and cups restocked' },
    { check: 'Lighting, audio, air handling and screens left as the building procedure requires' },
    { check: 'Emergency exits secured to the standard that still allows escape from inside', stop: true },
    { check: 'Floor and studio secured, and access left as the security procedure requires' },
  ]),
  ...exceptionsBlock(END),
]
