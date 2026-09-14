import type { PlanSection } from '../plan-types'

// Part M. The blank sheets.
//
// A procedure that says "record the reading" and provides nowhere to record it
// is a procedure that produces a reading written on a paper towel. These are
// the sheets, ready to print, one per page, so the document is the system
// rather than a description of one.

const PART = 'M. Record sheets'

const sheet = (heading: string, intro: string, columns: string[], rows: number): PlanSection => ({
  part: PART,
  heading,
  intro,
  ownPage: true,
  table: { columns, rows: Array.from({ length: rows }, () => columns.map(() => '')), fillable: true },
})

export const APPENDIX_SECTIONS: PlanSection[] = [
  sheet(
    'Daily water test record',
    'One line per test, per body of water. Completed at the time of the test, not at the end of the shift.',
    ['Date', 'Time', 'Water body', 'Disinfectant', 'pH', 'Temp', 'Clarity', 'Action taken', 'Tested by'],
    26,
  ),
  sheet(
    'Opening check record',
    'Signed before the spa opens. Anything not complete is a facility that does not open.',
    ['Date', 'Plant running', 'Water tested', 'Clarity', 'Facilities walked', 'Safety equipment', 'Fire routes', 'Staffing', 'Signed'],
    24,
  ),
  sheet(
    'Closing check record',
    'Every pool, every cabin, every cubicle, every studio. Opened and looked into, not glanced at.',
    ['Date', 'Water clear', 'Heat cabins', 'Changing', 'Gym', 'Treatment rooms', 'Plant secure', 'Building secure', 'Signed'],
    24,
  ),
  sheet(
    'Heat experience check record',
    'The check that matters most in a spa, because somebody in difficulty in a sauna is invisible from outside.',
    ['Date', 'Time', 'Facility', 'Temperature', 'Occupied', 'Condition', 'Action', 'Checked by'],
    26,
  ),
  sheet(
    'Rescue and first aid equipment check',
    'Weekly, by a named person, against the equipment list in Part B.',
    ['Date', 'Item', 'Location', 'Present', 'Serviceable', 'In date', 'Action', 'Checked by'],
    24,
  ),
  sheet(
    'Gym equipment check record',
    'Daily, before the gym opens. Faults are labelled out of use, not noted for later.',
    ['Date', 'Equipment', 'Condition', 'Emergency stop', 'Fault found', 'Taken out of use', 'Reported to', 'Checked by'],
    24,
  ),
  sheet(
    'Training and competence record',
    'One line per person per competence. The expiry column is the one that matters.',
    ['Name', 'Role', 'Competence', 'Trained on', 'Assessed by', 'Outcome', 'Next due'],
    24,
  ),
  sheet(
    'Emergency drill record',
    'What was practised, who attended, what went wrong and what changed as a result.',
    ['Date', 'Scenario', 'Attended by', 'Time taken', 'What did not work', 'Action agreed', 'Owner', 'Led by'],
    16,
  ),
  sheet(
    'Incident, accident and near miss record',
    'Completed on the day. A near miss is the same event without the injury, and it is free information.',
    ['Date', 'Time', 'Location', 'Type', 'Who', 'What happened', 'First aid given', 'Reported to', 'Recorded by'],
    18,
  ),
  sheet(
    'Contractor induction and permit record',
    'Every contractor, every visit. Signed in, inducted, signed out, and somebody confirmed they had gone.',
    ['Date', 'Company', 'Name', 'Work', 'Induction given', 'Permit', 'Signed in', 'Signed out', 'Authorised by'],
    18,
  ),
  sheet(
    'Cleaning and deep clean record',
    'Routine cleaning holds a standard. Deep cleaning restores one. Both belong here.',
    ['Date', 'Area', 'Routine or deep', 'Products used', 'Completed by', 'Checked by', 'Defects raised'],
    22,
  ),
  sheet(
    'Water safety and flushing record',
    'Temperatures, flushing of infrequently used outlets, and sampling. The dead leg in a spa is a treatment room out of use for a fortnight.',
    ['Date', 'Outlet or system', 'Action', 'Temperature', 'Duration', 'Result', 'Completed by'],
    22,
  ),
  sheet(
    'Maintenance and defect log',
    'Raised on the day it is found. A defect mentioned verbally is a defect found again at the next inspection.',
    ['Date raised', 'Area', 'Defect', 'Raised by', 'Action taken', 'Target date', 'Closed on', 'Closed by'],
    20,
  ),
  sheet(
    'Document briefing record',
    'Every person who works in the spa signs to confirm they have read this document and know what it asks of them.',
    ['Name', 'Role', 'Version read', 'Date', 'Briefed by', 'Signature'],
    22,
  ),
]
