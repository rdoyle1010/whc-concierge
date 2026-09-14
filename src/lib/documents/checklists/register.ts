import type { PlanSection } from '../plan-types'
import { RECEPTION_OPENING, RECEPTION_MID, RECEPTION_LATE } from './reception'
import { THERAPIST_OPENING, THERAPIST_CLOSING } from './therapists'
import { CLEANING_OPENING, CLEANING_CLOSING } from './cleaning'
import { MANAGER_DAILY, MANAGER_WEEKLY } from './management'

// The nine checklists, as a suite.
//
// Sold together for the same reason the risk assessments are. A spa with a
// therapist checklist and no cleaning checklist has not half solved the
// problem: it has a signed record of the part that was already being done
// well and nothing about the part that was not. The failures cross shifts,
// and so does the evidence an assessor asks for.
//
// They are deliberately not in any department pack. A checklist system is a
// system, and selling reception three sheets while nobody checks the plant
// room is the arrangement that produces a spa where everything is ticked and
// nothing is verified.

export type ChecklistEntry = {
  reference: string
  title: string
  department: string
  /** One line for the shop, and the first line of the document. */
  intro: string
  /** What this is drawn from, in one line, named on the cover. */
  drawnFrom: string
  sections: PlanSection[]
}

export const CHECKLIST_REGISTER: ChecklistEntry[] = [
  {
    reference: 'REC-OPENING-CHK-501',
    title: 'Checklist: Reception Opening Shift',
    department: 'RECEPTION TEAM',
    intro:
      'Everything the first person on the desk confirms before the doors open: the systems, the float, the '
      + 'diary read end to end, and the building a guest is about to walk into.',
    drawnFrom: 'the reception opening and booking procedures, the fire and slips assessments, and the cash handling procedures',
    sections: RECEPTION_OPENING,
  },
  {
    reference: 'REC-MIDSHIFT-CHK-502',
    title: 'Checklist: Reception Mid Shift',
    department: 'RECEPTION TEAM',
    intro:
      'The checks that matter once the day is running rather than before it starts: delays told to guests '
      + 'before they notice, the floor reset between visits, and the money spot-checked while it can still be '
      + 'explained.',
    drawnFrom: 'the service delay, rebooking, hourly area check and revenue procedures',
    sections: RECEPTION_MID,
  },
  {
    reference: 'REC-CLOSING-CHK-503',
    title: 'Checklist: Reception Late Shift and Close',
    department: 'RECEPTION TEAM',
    intro:
      'The shift most often done badly, because everybody wants to go home. Emptying the building, closing the '
      + 'money properly, setting tomorrow up, and locking a spa that is genuinely safe to leave.',
    drawnFrom: 'the end-of-day close, banking, lone working and securing procedures',
    sections: RECEPTION_LATE,
  },
  {
    reference: 'THER-OPENING-CHK-504',
    title: 'Checklist: Therapist Opening',
    department: 'SPA THERAPISTS',
    intro:
      'Room, products and equipment confirmed before the first guest, including the wax pot temperature and '
      + 'the call point, which are the two most often signed for and least often checked.',
    drawnFrom: 'the treatment room setup standard, the infection control, electrical and COSHH assessments, and the consultation procedures',
    sections: THERAPIST_OPENING,
  },
  {
    reference: 'THER-CLOSING-CHK-505',
    title: 'Checklist: Therapist Closing',
    department: 'SPA THERAPISTS',
    intro:
      'Infection control done properly rather than quickly, equipment off at the appliance, and the room left '
      + 'to the setup standard rather than merely tidied.',
    drawnFrom: 'the infection control and water hygiene assessment, the cleaning standards, and the electrical safety assessment',
    sections: THERAPIST_CLOSING,
  },
  {
    reference: 'CLN-OPENING-CHK-506',
    title: 'Checklist: Cleaning Opening Shift',
    department: 'HOUSEKEEPING TEAM',
    intro:
      'Wet areas left slip resistant, changing rooms stocked to par rather than merely supplied, and every '
      + 'escape route confirmed clear before a single guest is in the building.',
    drawnFrom: 'the wet area cleaning standard, the slips and infection control assessments, and the amenities stocking procedure',
    sections: CLEANING_OPENING,
  },
  {
    reference: 'CLN-CLOSING-CHK-507',
    title: 'Checklist: Cleaning Closing Shift',
    department: 'HOUSEKEEPING TEAM',
    intro:
      'The deep work that cannot be done with guests in the building, and the last honest look at every room '
      + 'before it is locked. The closing cleaner sees more of a spa than anybody and is asked about it least.',
    drawnFrom: 'the deep cleaning programme, the descale rotation, the waste segregation procedure and the COSHH assessment',
    sections: CLEANING_CLOSING,
  },
  {
    reference: 'OPS-DUTYDAY-CHK-508',
    title: 'Checklist: Duty Manager Daily',
    department: 'SPA MANAGEMENT TEAM',
    intro:
      'A walk, not a desk exercise. It verifies the shift sheets rather than collecting them, because a '
      + 'checklist system nobody checks becomes a signing exercise in about six weeks.',
    drawnFrom: 'the duty manager rounds, daily risk review, briefing, escalation and incident reporting procedures',
    sections: MANAGER_DAILY,
  },
  {
    reference: 'OPS-WEEKLY-CHK-509',
    title: 'Checklist: Weekly Maintenance, Safety and Training',
    department: 'SPA MANAGEMENT TEAM',
    intro:
      'The compliance spine. Maintenance, health and safety, certification and training are the things that '
      + 'fail slowly and invisibly, and they are the first thing an assessor asks for. Four weeks to a sheet, '
      + 'so a blank column is a conversation rather than an oversight.',
    drawnFrom: 'the planned maintenance schedule, the risk assessment suite, the incident procedures and the training and certification records',
    sections: MANAGER_WEEKLY,
  },
]
