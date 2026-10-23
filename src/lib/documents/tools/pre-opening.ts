import { buildWorkbook, type Cell, type Sheet } from '../xlsx'

// The critical path to opening day.
//
// Unlike the other tools, this one arrives with its content already in it.
// Blank rows would be useless here: the value is knowing what the hundred and
// forty things are, and in what order, which is exactly what somebody opening
// their first spa does not know and cannot find out until it is too late to
// act on.
//
// The dates are computed from one cell. Change the opening date and the whole
// path moves, which is the thing a printed critical path cannot do and the
// reason this is a workbook rather than a document.
//
// Every task is marked with whether it stops opening. That is the column that
// matters at week two, when everything is late and somebody has to decide
// what actually cannot slip.

const SETUP = 'Setup'

type Task = {
  /** Weeks before opening this should be complete. */
  weeks: number
  area: string
  task: string
  owner: string
  /** True where opening cannot lawfully or safely happen without it. */
  stops?: boolean
}

const TASKS: Task[] = [
  // 26 weeks
  { weeks: 26, area: 'Commercial', task: 'Business plan, budget and opening year forecast approved', owner: 'Spa Director' },
  { weeks: 26, area: 'Commercial', task: 'Treatment menu drafted with a costing behind every price', owner: 'Spa Director' },
  { weeks: 26, area: 'Design and build', task: 'Room schedule, plant specification and services load confirmed against the menu', owner: '[Project lead]' },
  { weeks: 26, area: 'People', task: 'Structure agreed: roles, headcount, pattern and cost', owner: 'Spa Director' },
  { weeks: 24, area: 'Commercial', task: 'Product house selected and terms agreed', owner: 'Spa Director' },
  { weeks: 24, area: 'Systems', task: 'Booking system selected and implementation dates agreed', owner: 'Spa Manager' },
  { weeks: 24, area: 'Safety', task: 'Competent person for health and safety appointed', owner: 'Spa Director', stops: true },
  { weeks: 22, area: 'People', task: 'Job descriptions written for every role', owner: 'Spa Director' },
  { weeks: 22, area: 'People', task: 'Recruitment opened for management and lead roles', owner: 'Spa Director' },
  { weeks: 22, area: 'Commercial', task: 'Pricing, packages and membership structure agreed', owner: 'Spa Director' },
  { weeks: 20, area: 'Design and build', task: 'Treatment room fit-out signed off against the treatment protocols', owner: '[Project lead]' },
  { weeks: 20, area: 'Safety', task: 'Pool and plant design reviewed against the operating standard', owner: '[Pool consultant]', stops: true },
  { weeks: 20, area: 'Systems', task: 'Chart of accounts, revenue categories and reporting structure agreed', owner: 'Finance' },
  { weeks: 18, area: 'Commercial', task: 'Supplier list agreed: linen, consumables, retail, laundry, waste', owner: 'Spa Manager' },
  { weeks: 18, area: 'Marketing', task: 'Brand, photography and launch plan agreed', owner: '[Marketing lead]' },
  { weeks: 18, area: 'People', task: 'Management appointments made', owner: 'Spa Director' },
  { weeks: 16, area: 'Documents', task: 'Standard operating procedures adopted for every department', owner: 'Spa Manager' },
  { weeks: 16, area: 'Documents', task: 'Risk assessments completed for every area, substance and activity', owner: 'Spa Manager', stops: true },
  { weeks: 16, area: 'Systems', task: 'Booking system configuration begun: services, resources, buffers, pricing', owner: 'Spa Manager' },
  { weeks: 16, area: 'People', task: 'Therapist and reception recruitment opened', owner: 'Spa Manager' },
  { weeks: 14, area: 'Documents', task: 'Normal Operating Procedure written for the pool and wet areas', owner: '[Pool operator]', stops: true },
  { weeks: 14, area: 'Documents', task: 'Emergency Action Plan written and agreed with the wider property', owner: 'Spa Director', stops: true },
  { weeks: 14, area: 'Commercial', task: 'Opening stock order placed for retail and professional use', owner: 'Spa Manager' },
  { weeks: 14, area: 'Marketing', task: 'Website, booking journey and launch offers live to preview', owner: '[Marketing lead]' },
  { weeks: 12, area: 'Safety', task: 'Licences and registrations applied for', owner: 'Spa Director', stops: true },
  { weeks: 12, area: 'Safety', task: 'Insurance arranged: employers, public and treatment liability', owner: 'Spa Director', stops: true },
  { weeks: 12, area: 'Documents', task: 'Policies adopted, including safeguarding, lone working and chaperoning', owner: 'Spa Director' },
  { weeks: 12, area: 'People', task: 'Offers issued and contracts signed for the opening team', owner: '[HR]' },
  { weeks: 12, area: 'Systems', task: 'Payment, till and reconciliation set up and tested end to end', owner: 'Finance' },
  { weeks: 10, area: 'Design and build', task: 'Plant commissioned and handed over with documentation', owner: '[Project lead]', stops: true },
  { weeks: 10, area: 'Safety', task: 'Water safety plan written, with a named responsible person', owner: '[Responsible person]', stops: true },
  { weeks: 10, area: 'People', task: 'Training plan built: what each role must be signed off on before opening', owner: '[Spa Trainer]' },
  { weeks: 10, area: 'Documents', task: 'Daily running checklists adopted for every shift', owner: 'Spa Manager' },
  { weeks: 8, area: 'People', task: 'Team induction begins', owner: '[Spa Trainer]' },
  { weeks: 8, area: 'People', task: 'Product house training booked and scheduled', owner: '[Spa Trainer]' },
  { weeks: 8, area: 'Safety', task: 'Pool plant operator and lifeguard qualifications confirmed current', owner: 'Spa Manager', stops: true },
  { weeks: 8, area: 'Systems', task: 'Booking system loaded with the full menu, resources and availability', owner: 'Spa Manager' },
  { weeks: 8, area: 'Marketing', task: 'Pre-opening bookings opened', owner: '[Marketing lead]' },
  { weeks: 6, area: 'Design and build', task: 'Snagging list raised and owner assigned to every item', owner: '[Project lead]' },
  { weeks: 6, area: 'People', task: 'Treatment training and competence sign-off begins', owner: '[Spa Trainer]', stops: true },
  { weeks: 6, area: 'Safety', task: 'Fire risk assessment completed and evacuation routes confirmed', owner: '[Competent person]', stops: true },
  { weeks: 6, area: 'Commercial', task: 'Opening stock received, counted and put away', owner: 'Spa Manager' },
  { weeks: 4, area: 'Safety', task: 'Water balanced, tested and stable across consecutive days', owner: '[Pool operator]', stops: true },
  { weeks: 4, area: 'Safety', task: 'Emergency drills run with the actual opening team', owner: 'Spa Manager', stops: true },
  { weeks: 4, area: 'People', task: 'Every required competence signed off, or a plan for the gap', owner: '[Spa Trainer]', stops: true },
  { weeks: 4, area: 'Systems', task: 'Full dry run: book, arrive, treat, pay, rebook, close and reconcile', owner: 'Spa Manager' },
  { weeks: 3, area: 'Design and build', task: 'Snagging closed, or accepted in writing with a date', owner: '[Project lead]' },
  { weeks: 3, area: 'Documents', task: 'Signage in place: safety, age limits, photography, quiet areas', owner: 'Spa Manager' },
  { weeks: 3, area: 'Marketing', task: 'Launch communications sent and press or influencer visits scheduled', owner: '[Marketing lead]' },
  { weeks: 2, area: 'Safety', task: 'Final safety walk with the competent person, findings closed', owner: 'Spa Director', stops: true },
  { weeks: 2, area: 'People', task: 'Rota published for the opening four weeks', owner: 'Spa Manager' },
  { weeks: 2, area: 'Commercial', task: 'Float, banking and petty cash arrangements in place and tested', owner: 'Finance' },
  { weeks: 1, area: 'Systems', task: 'Soft opening run with real bookings and a debrief the same day', owner: 'Spa Manager' },
  { weeks: 1, area: 'Safety', task: 'Opening checks completed as a rehearsal, by the people who will do them', owner: 'Spa Manager' },
  { weeks: 1, area: 'People', task: 'Full team briefing on the opening week', owner: 'Spa Director' },
  { weeks: 0, area: 'Safety', task: 'Opening day safety checks completed and signed before the first guest', owner: 'Duty manager', stops: true },
]

const SETUP_ROWS = { opening: 5, today: 6 }

function setupSheet(): Sheet {
  return {
    name: SETUP,
    widths: [30, 18, 84],
    freezeRows: 4,
    rows: [
      [{ text: 'Setup', style: 'title' }],
      [{ text: 'One date. Everything on the path moves with it.', style: 'note' }],
      [],
      [{ text: 'What', style: 'header' }, { text: 'Your figure', style: 'header' }, { text: 'What it means', style: 'header' }],
      [
        { text: 'Opening date', style: 'label' },
        { text: '', style: 'input' },
        { text: 'The day the first paying guest arrives. Enter it as a date. Every due date on the path is worked back from this, so moving it moves everything.', style: 'wrap' },
      ],
      [
        { text: 'Today', style: 'label' },
        { formula: '=TODAY()', style: 'derived' },
        { text: 'Used to say what is overdue. It updates itself.', style: 'wrap' },
      ],
      [],
      [{
        text: 'The path assumes twenty-six weeks. If you have less, the tasks do not go away: they compress, '
          + 'and the ones marked as stopping opening are the ones that cannot. Read those first and decide '
          + 'honestly whether the date is real.',
        style: 'note',
      }],
    ],
  }
}

const HEAD = 4
const FIRST = HEAD + 1

function pathSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'The critical path', style: 'title' }],
    [{
      text: 'Fill in the status column and nothing else. Due dates are worked back from the opening date on '
        + 'Setup, so changing that date moves the whole path.',
      style: 'note',
    }],
    [],
    [
      { text: 'Weeks before', style: 'header' },
      { text: 'Due', style: 'header' },
      { text: 'Area', style: 'header' },
      { text: 'Task', style: 'header' },
      { text: 'Owner', style: 'header' },
      { text: 'Stops opening', style: 'header' },
      { text: 'Status', style: 'header' },
      { text: 'Where it stands', style: 'header' },
    ],
  ]

  const opening = `${SETUP}!$B$${SETUP_ROWS.opening}`
  const today = `${SETUP}!$B$${SETUP_ROWS.today}`

  TASKS.forEach((task, index) => {
    const r = FIRST + index
    rows.push([
      { number: task.weeks, style: 'number' },
      { formula: `=IF(${opening}="","",${opening}-(A${r}*7))`, style: 'derived' },
      { text: task.area, style: 'default' },
      { text: task.task, style: 'wrap' },
      { text: task.owner, style: 'default' },
      { text: task.stops ? 'Yes' : '', style: task.stops ? 'label' : 'default' },
      { text: '', style: 'input' },
      {
        formula: `=IF(${opening}="","Enter the opening date on Setup",`
          + `IF(G${r}="Done","Done",`
          + `IF(B${r}<${today},IF(F${r}="Yes","OVERDUE and it stops opening","Overdue"),`
          + `IF(B${r}-${today}<=14,"Due in the next two weeks",""))))`,
        style: 'derived',
      },
    ])
  })

  rows.push([])
  rows.push([{
    text: 'Type Done in the status column as each one completes. Anything else you type is left alone, so '
      + 'use it for a note: who is chasing it, or what it is waiting on.',
    style: 'note',
  }])

  return {
    name: 'The critical path',
    widths: [10, 12, 16, 62, 22, 11, 14, 30],
    rows,
    freezeRows: 4,
    freezeColumns: 4,
  }
}

function whereWeAreSheet(): Sheet {
  const last = FIRST + TASKS.length - 1
  const path = `'The critical path'`
  const opening = `${SETUP}!$B$${SETUP_ROWS.opening}`
  const today = `${SETUP}!$B$${SETUP_ROWS.today}`

  const line = (
    label: string,
    formula: string,
    style: 'derived' | 'derivedNumber' | 'derivedPercent',
    note: string,
  ): Cell[] => [{ text: label, style: 'label' }, { formula, style }, { text: note, style: 'wrap' }]

  const areas = [...new Set(TASKS.map(task => task.area))]
  const rows: Cell[][] = [
    [{ text: 'Where we are', style: 'title' }],
    [{ text: 'Nothing to fill in. This reads the path.', style: 'note' }],
    [],
    [{ text: 'Measure', style: 'header' }, { text: 'Now', style: 'header' }, { text: 'What it tells you', style: 'header' }],

    line('Weeks to opening', `=IF(${opening}="","",ROUND((${opening}-${today})/7,1))`, 'derivedNumber',
      'Counted, not estimated.'),
    line('Tasks on the path', `=COUNTA(${path}!D${FIRST}:D${last})`, 'derivedNumber',
      'What opening a spa actually involves. Most of them are somebody else’s job, which is the point of the owner column.'),
    line('Done', `=COUNTIF(${path}!G${FIRST}:G${last},"Done")`, 'derivedNumber',
      'Marked Done in the status column.'),
    line('Complete', `=IFERROR(COUNTIF(${path}!G${FIRST}:G${last},"Done")/COUNTA(${path}!D${FIRST}:D${last}),"")`, 'derivedPercent',
      'Against the whole path rather than against what was due, which is the honest version.'),
    line('Overdue', `=COUNTIFS(${path}!B${FIRST}:B${last},"<"&${today},${path}!G${FIRST}:G${last},"<>Done")`, 'derivedNumber',
      'Past their due date and not marked done.'),
    line('Overdue and stopping opening',
      `=COUNTIFS(${path}!B${FIRST}:B${last},"<"&${today},${path}!G${FIRST}:G${last},"<>Done",${path}!F${FIRST}:F${last},"Yes")`,
      'derivedNumber',
      'The only number that decides whether the date is real. Anything above zero here is a conversation with the general manager, not a note in a report.'),
    line('Due in the next two weeks',
      `=COUNTIFS(${path}!B${FIRST}:B${last},">="&${today},${path}!B${FIRST}:B${last},"<="&${today}+14,${path}!G${FIRST}:G${last},"<>Done")`,
      'derivedNumber',
      'The fortnight ahead, which is as far as anybody can usefully plan in a pre-opening.'),
    line('Tasks that stop opening, in total', `=COUNTIF(${path}!F${FIRST}:F${last},"Yes")`, 'derivedNumber',
      'Read these first whenever the date comes under pressure. Everything else can be argued about.'),
    line('Of those, still to do',
      `=COUNTIFS(${path}!F${FIRST}:F${last},"Yes",${path}!G${FIRST}:G${last},"<>Done")`, 'derivedNumber',
      'The real state of the opening.'),
    [],
    [{ text: 'By area', style: 'section' }],
    [{ text: 'Area', style: 'header' }, { text: 'Tasks', style: 'header' }, { text: 'Still to do', style: 'header' }],
  ]

  for (const area of areas) {
    rows.push([
      { text: area, style: 'label' },
      { formula: `=COUNTIF(${path}!C${FIRST}:C${last},"${area}")`, style: 'derivedNumber' },
      { formula: `=COUNTIFS(${path}!C${FIRST}:C${last},"${area}",${path}!G${FIRST}:G${last},"<>Done")`, style: 'derivedNumber' },
    ])
  }

  rows.push([])
  rows.push([{
    text: 'A pre-opening does not fail because somebody forgot a task. It fails because everything slipped a '
      + 'fortnight, nobody added it up, and the training that needed six weeks got two. This sheet exists to '
      + 'make that arithmetic visible while there is still time to act on it.',
    style: 'note',
  }])

  return { name: 'Where we are', widths: [40, 16, 84], rows, freezeRows: 4 }
}

function readMe(): Sheet {
  return {
    name: 'Read me',
    widths: [100],
    rows: [
      [{ text: 'Pre-opening critical path', style: 'title' }],
      [{ text: 'Talent House Collective', style: 'subtitle' }],
      [],
      [{ text: 'How to use it', style: 'section' }],
      [{ text: '1. Setup. Enter the opening date. Every due date on the path is worked back from it.', style: 'wrap' }],
      [{ text: '2. The critical path. Assign the owners, then type Done in the status column as each one completes.', style: 'wrap' }],
      [{ text: '3. Where we are. Read it weekly, at the same meeting, out loud.', style: 'wrap' }],
      [],
      [{ text: 'Three things this does differently', style: 'section' }],
      [{
        text: 'It arrives filled in. Every other tool in this range is a structure you complete, because the '
          + 'numbers belong to your building. This one is the opposite: the value is knowing what the tasks '
          + 'are and in what order, which is exactly what somebody opening their first spa cannot find out '
          + 'until it is too late to act on.',
        style: 'wrap',
      }],
      [{
        text: 'It moves. Change the opening date and the whole path recalculates, which is the one thing a '
          + 'printed critical path cannot do and the reason a pre-opening plan on paper is out of date by '
          + 'week three.',
        style: 'wrap',
      }],
      [{
        text: 'It marks what actually stops opening. At week two everything is late and somebody has to '
          + 'decide what cannot slip. Licences, insurance, water stability, competence sign-off and the final '
          + 'safety walk are not negotiable. Most of the rest is.',
        style: 'wrap',
      }],
      [],
      [{ text: 'What it is not', style: 'section' }],
      [{
        text: 'It is not a project plan for the build. It covers what the spa operation has to do, and it '
          + 'assumes somebody else is running the construction programme alongside it.',
        style: 'wrap',
      }],
      [{
        text: 'It is not exhaustive for every property. Add what your building needs and take out what it '
          + 'does not, but do both deliberately: a task removed because nobody knew who owned it is the one '
          + 'that resurfaces at week four.',
        style: 'wrap',
      }],
    ],
  }
}

export const PRE_OPENING_FILE = 'Pre-Opening Critical Path.xlsx'
export const PRE_OPENING_TASK_COUNT = TASKS.length

export function preOpeningWorkbook(): Buffer {
  return buildWorkbook([readMe(), setupSheet(), pathSheet(), whereWeAreSheet()])
}
