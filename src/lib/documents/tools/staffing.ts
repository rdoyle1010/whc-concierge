import { buildWorkbook, type Cell, type Sheet } from '../xlsx'

// What the rota costs, and whether it matches the demand.
//
// The spreadsheet most spas keep is a rota. A rota says who is in. It does
// not say whether the hours match the bookings, what the hours cost against
// the revenue they can produce, or what it costs to cover the holiday and
// sickness that are certain to happen.
//
// Three mistakes are near universal. Cover is budgeted at the wage rate
// rather than at wage plus on-costs, so payroll comes in over every month and
// nobody can say why. Holiday and sickness are treated as surprises rather
// than as a percentage that is known in advance. And utilisation is measured
// against hours worked rather than against hours rostered, which flatters it
// by exactly the amount of the problem.

const SETUP = 'Setup'

const SETUP_FIELDS: { label: string; hint: string; style: 'money' | 'percent' | 'number' }[] = [
  {
    label: 'Therapist base hourly rate',
    hint: 'The rate on the contract. On-costs are added below rather than built into this, so both are visible.',
    style: 'money',
  },
  {
    label: 'Reception base hourly rate',
    hint: 'As above, for the desk.',
    style: 'money',
  },
  {
    label: 'Management base hourly rate',
    hint: 'Salaried roles converted to an hourly figure, so a management hour on the floor costs what it costs.',
    style: 'money',
  },
  {
    label: 'On-costs, as a percentage of wage',
    hint: 'Employer national insurance, pension and any levy. Usually between fifteen and twenty-five per cent, and the single most common thing left out of a rota budget.',
    style: 'percent',
  },
  {
    label: 'Holiday entitlement, as a percentage of hours',
    hint: 'Statutory holiday expressed as a share of working time. These hours are paid and not worked, so they have to be covered by somebody.',
    style: 'percent',
  },
  {
    label: 'Expected absence, as a percentage of hours',
    hint: 'Sickness and unplanned absence, from your own last twelve months rather than from an industry figure.',
    style: 'percent',
  },
  {
    label: 'Treatment rooms in service',
    hint: 'Rooms you can actually sell, not rooms that exist.',
    style: 'number',
  },
  {
    label: 'Opening hours per day',
    hint: 'The hours the treatment floor is open and sellable.',
    style: 'number',
  },
  {
    label: 'Target therapist utilisation',
    hint: 'Treatment hours sold as a share of hours rostered. Sixty-five to seventy-five is a healthy spa. Anything above eighty-five usually means somebody is not taking breaks.',
    style: 'percent',
  },
  {
    label: 'Average treatment value, net of VAT',
    hint: 'From the costings workbook, or from your own trading. Used to say what an unsold rostered hour costs.',
    style: 'money',
  },
]

const at = (label: string) => `${SETUP}!$B$${5 + SETUP_FIELDS.findIndex(field => field.label === label)}`

function setupSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'Setup', style: 'title' }],
    [{ text: 'Ten numbers. Everything else is worked out from them.', style: 'note' }],
    [],
    [{ text: 'What', style: 'header' }, { text: 'Your figure', style: 'header' }, { text: 'What it means', style: 'header' }],
  ]
  for (const field of SETUP_FIELDS) {
    rows.push([
      { text: field.label, style: 'label' },
      { text: '', style: 'input' },
      { text: field.hint, style: 'wrap' },
    ])
  }
  rows.push([])
  rows.push([{
    text: 'The fully loaded cost of an hour is the base rate plus on-costs, plus the share of holiday and '
      + 'absence that somebody else has to cover. That number is usually a third higher than the rate on the '
      + 'contract, and it is the one a rota should be built against.',
    style: 'note',
  }])
  return { name: SETUP, widths: [38, 16, 84], rows, freezeRows: 4 }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ROLES = [
  { name: 'Therapists', rate: 'Therapist base hourly rate' },
  { name: 'Reception', rate: 'Reception base hourly rate' },
  { name: 'Management', rate: 'Management base hourly rate' },
]

function loadedCost(rateField: string): string {
  // Base, plus on-costs, plus the holiday and absence somebody has to cover.
  return `(${at(rateField)}*(1+${at('On-costs, as a percentage of wage')})`
    + `*(1+${at('Holiday entitlement, as a percentage of hours')}`
    + `+${at('Expected absence, as a percentage of hours')}))`
}

function costOfAnHourSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'What an hour really costs', style: 'title' }],
    [{
      text: 'Nothing to fill in here. This is the arithmetic most rota budgets leave out, shown once so that '
        + 'the number on the rota sheet is not a surprise.',
      style: 'note',
    }],
    [],
    [
      { text: 'Role', style: 'header' },
      { text: 'Base rate', style: 'header' },
      { text: 'Plus on-costs', style: 'header' },
      { text: 'Plus holiday and absence cover', style: 'header' },
      { text: 'Uplift on the contract rate', style: 'header' },
    ],
  ]
  ROLES.forEach((role, index) => {
    const r = 5 + index
    rows.push([
      { text: role.name, style: 'label' },
      { formula: `=${at(role.rate)}`, style: 'derivedMoney' },
      { formula: `=${at(role.rate)}*(1+${at('On-costs, as a percentage of wage')})`, style: 'derivedMoney' },
      { formula: `=${loadedCost(role.rate)}`, style: 'derivedMoney' },
      { formula: `=IFERROR(D${r}/B${r}-1,"")`, style: 'derivedPercent' },
    ])
  })
  rows.push([])
  rows.push([{
    text: 'The last column is the number to remember. A rota costed at the contract rate is under by that '
      + 'much, every week, and the variance appears at month end with no obvious cause.',
    style: 'note',
  }])
  return { name: 'What an hour really costs', widths: [22, 14, 16, 26, 20], rows, freezeRows: 4 }
}

const ROTA_HEAD = 4
const ROTA_FIRST = ROTA_HEAD + 1

function rotaSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'The week', style: 'title' }],
    [{
      text: 'Hours rostered by role and by day, and the treatment hours you expect to sell. Fill in the white '
        + 'columns. One week at a time: copy the sheet for a different trading pattern rather than averaging '
        + 'a quiet week with a busy one.',
      style: 'note',
    }],
    [],
    [
      { text: 'Day', style: 'header' },
      { text: 'Therapist hours rostered', style: 'header' },
      { text: 'Reception hours rostered', style: 'header' },
      { text: 'Management hours rostered', style: 'header' },
      { text: 'Treatment hours you expect to sell', style: 'header' },
      { text: 'Room hours available', style: 'header' },
      { text: 'Rota cost', style: 'header' },
      { text: 'Expected revenue', style: 'header' },
      { text: 'Payroll as a share of revenue', style: 'header' },
      { text: 'Therapist utilisation', style: 'header' },
      { text: 'Unsold rostered hours', style: 'header' },
      { text: 'What those hours cost you', style: 'header' },
    ],
  ]

  DAYS.forEach((day, index) => {
    const r = ROTA_FIRST + index
    rows.push([
      { text: day, style: 'label' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      {
        formula: `=${at('Treatment rooms in service')}*${at('Opening hours per day')}`,
        style: 'derivedNumber',
      },
      {
        formula: `=B${r}*${loadedCost('Therapist base hourly rate')}`
          + `+C${r}*${loadedCost('Reception base hourly rate')}`
          + `+D${r}*${loadedCost('Management base hourly rate')}`,
        style: 'derivedMoney',
      },
      { formula: `=E${r}*${at('Average treatment value, net of VAT')}`, style: 'derivedMoney' },
      { formula: `=IFERROR(G${r}/H${r},"")`, style: 'derivedPercent' },
      { formula: `=IFERROR(E${r}/B${r},"")`, style: 'derivedPercent' },
      { formula: `=IF(B${r}="","",MAX(0,B${r}-E${r}))`, style: 'derivedNumber' },
      { formula: `=K${r}*${loadedCost('Therapist base hourly rate')}`, style: 'derivedMoney' },
    ])
  })

  const last = ROTA_FIRST + DAYS.length - 1
  rows.push([
    { text: 'Week', style: 'label' },
    { formula: `=SUM(B${ROTA_FIRST}:B${last})`, style: 'derivedNumber' },
    { formula: `=SUM(C${ROTA_FIRST}:C${last})`, style: 'derivedNumber' },
    { formula: `=SUM(D${ROTA_FIRST}:D${last})`, style: 'derivedNumber' },
    { formula: `=SUM(E${ROTA_FIRST}:E${last})`, style: 'derivedNumber' },
    { formula: `=SUM(F${ROTA_FIRST}:F${last})`, style: 'derivedNumber' },
    { formula: `=SUM(G${ROTA_FIRST}:G${last})`, style: 'derivedMoney' },
    { formula: `=SUM(H${ROTA_FIRST}:H${last})`, style: 'derivedMoney' },
    { formula: `=IFERROR(G${last + 1}/H${last + 1},"")`, style: 'derivedPercent' },
    { formula: `=IFERROR(E${last + 1}/B${last + 1},"")`, style: 'derivedPercent' },
    { formula: `=SUM(K${ROTA_FIRST}:K${last})`, style: 'derivedNumber' },
    { formula: `=SUM(L${ROTA_FIRST}:L${last})`, style: 'derivedMoney' },
  ])

  rows.push([])
  rows.push([{
    text: 'Read the last two columns together. Unsold rostered hours are the ones you paid for and could not '
      + 'sell, and the pounds beside them are what that cost. A day that looks fine on payroll percentage can '
      + 'still be carrying four hours nobody needed.',
    style: 'note',
  }])

  return {
    name: 'The week',
    widths: [12, 14, 14, 15, 16, 14, 13, 14, 16, 14, 14, 16],
    rows,
    freezeRows: 4,
    freezeColumns: 1,
  }
}

function decisionsSheet(): Sheet {
  const total = ROTA_FIRST + DAYS.length
  const line = (
    label: string,
    formula: string,
    style: 'derivedMoney' | 'derivedPercent' | 'derivedNumber',
    note: string,
  ): Cell[] => [{ text: label, style: 'label' }, { formula, style }, { text: note, style: 'wrap' }]

  return {
    name: 'What to do about it',
    widths: [40, 18, 82],
    freezeRows: 4,
    rows: [
      [{ text: 'What to do about it', style: 'title' }],
      [{ text: 'Read this once the week is filled in.', style: 'note' }],
      [],
      [{ text: 'Measure', style: 'header' }, { text: 'Your figure', style: 'header' }, { text: 'What it tells you', style: 'header' }],

      line('Payroll as a share of revenue', `='The week'!I${total}`, 'derivedPercent',
        'The headline. A treatment-led spa usually sits between thirty and forty-five per cent. Well above that is either too many hours or too little revenue per hour, and the next two lines tell you which.'),
      line('Therapist utilisation', `='The week'!J${total}`, 'derivedPercent',
        'Treatment hours sold against hours rostered. Below target means hours; at or above target with high payroll means price.'),
      line('Against your target', `=IFERROR('The week'!J${total}-${at('Target therapist utilisation')},"")`, 'derivedPercent',
        'The gap. Negative means you are rostering hours the diary is not filling.'),
      line('Unsold rostered hours this week', `='The week'!K${total}`, 'derivedNumber',
        'Paid for and not sold. This is the number a rota conversation should start from.'),
      line('What they cost', `='The week'!L${total}`, 'derivedMoney',
        'At the fully loaded rate. Multiply by fifty-two to see what the pattern costs across a year.'),
      line('Cost of the same hours across a year', `='The week'!L${total}*52`, 'derivedMoney',
        'Usually the largest single number in this workbook, and the one nobody has calculated.'),
      line('Room hours you never opened for', `=IFERROR('The week'!F${total}-'The week'!B${total},"")`, 'derivedNumber',
        'Rooms available against therapists rostered. A positive number is capacity you own and are not staffing: the opposite problem, and often more expensive.'),
      line('Revenue if you hit target utilisation',
        `=IFERROR('The week'!B${total}*${at('Target therapist utilisation')}*${at('Average treatment value, net of VAT')},"")`,
        'derivedMoney',
        'The same rota, worked at target. The difference between this and your expected revenue is what the diary is costing you rather than the rota.'),
      line('Payroll at that revenue', `=IFERROR('The week'!G${total}/H4,"")`, 'derivedPercent',
        'What payroll percentage would be if the same hours were sold at target. If this looks healthy, the problem is demand rather than establishment.'),
      [],
      [{
        text: 'Three questions worth asking of this sheet. Which single day carries the most unsold rostered '
          + 'hours, and what would happen if that day started an hour later. Whether the room hours you cannot '
          + 'staff are worth recruiting for or worth closing. And whether a payroll percentage that looks high '
          + 'is a rota problem or a price problem, which is the question the last two lines answer.',
        style: 'note',
      }],
      [],
      [{ text: 'Working', style: 'section' }],
      [{ text: 'Revenue at target utilisation, used above.', style: 'note' },
        { formula: `=IFERROR('The week'!B${total}*${at('Target therapist utilisation')}*${at('Average treatment value, net of VAT')},"")`, style: 'derivedMoney' }],
    ],
  }
}

function readMe(): Sheet {
  return {
    name: 'Read me',
    widths: [100],
    rows: [
      [{ text: 'Staffing, rota and cover', style: 'title' }],
      [{ text: 'Talent House Collective', style: 'subtitle' }],
      [],
      [{ text: 'In what order', style: 'section' }],
      [{ text: '1. Setup. Ten numbers, including the on-costs most rota budgets leave out.', style: 'wrap' }],
      [{ text: '2. What an hour really costs. Nothing to fill in. Read it once.', style: 'wrap' }],
      [{ text: '3. The week. Hours rostered by role and by day, and the treatment hours you expect to sell.', style: 'wrap' }],
      [{ text: '4. What to do about it. The questions the numbers answer.', style: 'wrap' }],
      [],
      [{ text: 'Three things this does differently', style: 'section' }],
      [{
        text: 'It costs an hour at wage plus on-costs plus the share of holiday and absence somebody has to '
          + 'cover. That is usually a third above the contract rate, and it is why payroll comes in over '
          + 'budget in a spa that is rostering exactly what it planned.',
        style: 'wrap',
      }],
      [{
        text: 'It measures utilisation against hours rostered rather than against hours worked. Measuring '
          + 'against hours worked removes the problem from the measurement: the hours nobody sold are the '
          + 'ones you are trying to find.',
        style: 'wrap',
      }],
      [{
        text: 'It separates a rota problem from a price problem. A high payroll percentage can be too many '
          + 'hours or too little revenue per hour, and the last two lines of the final sheet tell you which '
          + 'one you have.',
        style: 'wrap',
      }],
      [],
      [{ text: 'What it is not', style: 'section' }],
      [{
        text: 'It is not a rota. It does not name people, hold shifts or manage leave. It says what a shape '
          + 'of week costs and what it can earn, which is the decision made before a rota is written.',
        style: 'wrap',
      }],
      [{
        text: 'Nothing is pre-filled. Use your own last twelve months for absence rather than an industry '
          + 'figure: the point of the sheet is your building, not a benchmark.',
        style: 'wrap',
      }],
    ],
  }
}

export const STAFFING_FILE = 'Staffing, Rota and Cover.xlsx'

export function staffingWorkbook(): Buffer {
  return buildWorkbook([readMe(), setupSheet(), costOfAnHourSheet(), rotaSheet(), decisionsSheet()])
}
