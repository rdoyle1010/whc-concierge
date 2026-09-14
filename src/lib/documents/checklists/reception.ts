import type { PlanSection } from '../plan-types'
import { checkBlock, exceptionsBlock, howToUse } from './shape'

// The desk, across three shifts.
//
// Split because the work genuinely is three different jobs. Opening is
// readiness: the systems, the float, the diary and the building. Mid shift is
// flow: the day is running and the failures are different ones. Late is
// closing down safely and leaving tomorrow set up, which is the shift most
// often done badly because everybody wants to go home.

const OPEN = 'How to use this checklist'
const CHECKS = 'The checks'
const END = 'Recording and sign-off'

export const RECEPTION_OPENING: PlanSection[] = [
  ...howToUse(
    'Before the doors open, every day.',
    'The first receptionist on shift.',
    'The duty manager decides whether the spa opens.',
  ),
  checkBlock(CHECKS, 'Systems and the diary',
    'the booking system daily log-in procedure, the system outage contingency and the data consent procedure', [
    { check: 'Booking system is up, and you are logged in on your own account rather than a shared one' },
    { check: 'Card terminal connects and a test transaction or a terminal check completes' },
    { check: 'Printer has paper, and a test receipt prints legibly' },
    { check: 'Today is read end to end: every booking has a room, a therapist and a duration' },
    { check: 'Double bookings, overlaps and gaps shorter than the changeover time are resolved before opening' },
    { check: 'Every guest flagged for a medical, accessibility or contraindication note is identified now' },
    { check: 'Group, corporate and hotel guest bookings are confirmed against the rooming or event list' },
    { check: 'Anything needing a deposit, a balance or a voucher is identified before the guest arrives' },
  ]),
  checkBlock(CHECKS, 'Money',
    'the daily cash float setup procedure and the cash discrepancy investigation procedure', [
    { check: 'Float counted, agrees to the stated amount, and is signed for by the person taking it' },
    { check: 'Any discrepancy is reported before the first transaction, not at the end of the day' },
    { check: 'Safe is locked, and the key or code is held only by somebody authorised to hold it' },
    { check: 'Yesterday’s banking was completed and the paperwork is filed' },
  ]),
  checkBlock(CHECKS, 'The building a guest walks into',
    'the housekeeping public area procedure, the slips and trips assessment and the fire safety assessment', [
    { check: 'Every escape route is clear, and every fire door closes fully and is not propped', stop: true },
    { check: 'Floors in the entrance, corridor and changing areas are dry, and wet floor signage is available' },
    { check: 'Lighting works everywhere a guest walks, including the changing rooms and any stairs' },
    { check: 'Reception, seating and retail display are clean, stocked and free of yesterday’s clutter' },
    { check: 'Music and lighting are set to the opening standard rather than to whatever was left on' },
    { check: 'Temperature in the reception and relaxation areas is within the stated range' },
    { check: 'First aid kit is in place, sealed or stocked, and the named first aider on shift is known' },
    { check: 'Accident book, incident forms and the emergency contact list are to hand and current' },
  ]),
  checkBlock(CHECKS, 'Ready for the first guest',
    'the arrival and check-in procedure, the locker allocation procedure and the consultation procedure', [
    { check: 'Lockers are unlocked, empty, and the key or wristband system is complete with none missing' },
    { check: 'Robes, towels and slippers are stocked to the stated par level for today’s bookings' },
    { check: 'Consultation forms are available, and the digital version loads if you use one' },
    { check: 'Water, refreshments and anything offered on arrival are set up and in date' },
    { check: 'Today’s therapist and treatment availability is known, including any late change' },
    { check: 'Facility closures, maintenance work or anything a guest should be told at check-in is written down' },
  ]),
  ...exceptionsBlock(END),
]

export const RECEPTION_MID: PlanSection[] = [
  ...howToUse(
    'Once mid-morning and once mid-afternoon, or at each shift handover.',
    'The receptionist on duty at the time.',
    'The duty manager is told immediately rather than at the end of the shift.',
  ),
  checkBlock(CHECKS, 'The day as it is actually running',
    'the service delay communication procedure, the rebooking procedure and the no-show procedure', [
    { check: 'Every treatment running late has had the guest told, by a person, before they noticed' },
    { check: 'No-shows and late cancellations are recorded in the system, not left for the close' },
    { check: 'Walk-in and same-day availability is known and correct in what you are telling people' },
    { check: 'Rebooking has been offered at every departure so far, not only to the guests who asked' },
    { check: 'Any guest flagged this morning for a medical or accessibility note has been handled' },
  ]),
  checkBlock(CHECKS, 'The floor between visits',
    'the hourly public area check procedure, the changing room standards and the slips and trips assessment', [
    { check: 'Changing rooms, showers and toilets checked, reset and restocked within the last hour' },
    { check: 'Wet floors have been dealt with rather than signed, and signage removed once dry' },
    { check: 'Used towels and robes cleared, and clean stock still above the par level for the rest of the day' },
    { check: 'Relaxation area reset: no used cups, no left belongings, no lights or music drifted off standard' },
    { check: 'Retail display fronted, and anything sold out is either restocked or taken off display' },
  ]),
  checkBlock(CHECKS, 'Money and the desk',
    'the daily revenue close procedure and the complimentary service approval procedure', [
    { check: 'Cash in the drawer spot-checked against the till reading, and any difference reported now' },
    { check: 'Every discount, upgrade and complimentary treatment given today has an approval recorded against it' },
    { check: 'Vouchers sold or redeemed are entered in the system rather than held on a note' },
    { check: 'Card terminal is still connecting, and any failure has been escalated' },
  ]),
  ...exceptionsBlock(END),
]

export const RECEPTION_LATE: PlanSection[] = [
  ...howToUse(
    'From the last treatment of the day until the building is locked.',
    'The receptionist closing, with the duty manager.',
    'Nobody leaves until a manager has confirmed it.',
  ),
  checkBlock(CHECKS, 'Closing the day down',
    'the end-of-day close procedure, the daily revenue close and the lone working assessment', [
    { check: 'Every guest is out of the building, including the changing rooms, thermal suite and relaxation area', stop: true },
    { check: 'Lockers checked one by one, emptied, and anything left is logged as lost property' },
    { check: 'Nobody is left working alone in a way the lone working arrangement does not allow', stop: true },
    { check: 'Every treatment recorded today has been paid for, or has a written reason why not' },
  ]),
  checkBlock(CHECKS, 'Money',
    'the daily revenue close procedure, the banking procedure and the cash discrepancy procedure', [
    { check: 'Till closed, cash counted twice, and the total agrees to the system before anything is moved' },
    { check: 'Any discrepancy is written down tonight with the amount and the shift, not carried to tomorrow' },
    { check: 'Takings secured as the procedure requires, and the safe is locked' },
    { check: 'Float set for tomorrow, counted, and left where the opening shift will find it' },
    { check: 'Daily revenue report run, checked for obvious errors, and sent to the stated recipients' },
  ]),
  checkBlock(CHECKS, 'Tomorrow',
    'the opening procedure and the forward booking procedure', [
    { check: 'Tomorrow read end to end: every booking has a room, a therapist and a duration' },
    { check: 'Any gap that could still be sold is flagged to whoever handles same-day and early bookings' },
    { check: 'Therapist availability for tomorrow is confirmed, including anybody who called in today' },
    { check: 'Anything a guest arriving tomorrow needs to be told is written where the opening shift will see it' },
  ]),
  checkBlock(CHECKS, 'Locking up',
    'the closing and securing procedure, the fire safety assessment and the security incident procedure', [
    { check: 'All treatment rooms, the gym, the studio and the thermal suite are empty and switched down', stop: true },
    { check: 'Equipment, heaters, wax pots and appliances are off at the appliance, not only at the switch', stop: true },
    { check: 'Fire doors closed, escape routes clear, and nothing left blocking an exit', stop: true },
    { check: 'Windows and external doors secured, and the alarm set' },
    { check: 'Keys returned to the stated place and signed back in' },
  ]),
  ...exceptionsBlock(END),
]

export const RECEPTION_PARTS = { OPEN, CHECKS, END }
