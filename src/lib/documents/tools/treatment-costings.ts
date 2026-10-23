import { buildWorkbook, cellRef, type Cell, type Sheet } from '../xlsx'

// What a treatment actually costs, and what it should therefore be priced at.
//
// This is the sheet spa people already keep, badly, in a file called
// pricing_v4_FINAL.xlsx. It is the one calculation that decides whether a
// menu makes money, and it is almost never done properly: a product cost is
// guessed from the bottle rather than the dose, turnaround time is left out
// entirely, and the therapist is costed at their hourly rate rather than at
// their rate plus on-costs. Each of those understates the cost, all three
// together understate it by a third, and the menu is then priced off it.
//
// So: room time rather than treatment time, dose rather than bottle, and
// wage plus on-costs. The number it produces is smaller than the one most
// spas believe, which is the point of producing it.
//
// Every cell a property fills in is styled as an input and every derived one
// is a formula. Nothing here is pre-filled with a plausible figure, because a
// plausible figure in a costing model is worse than a blank one: it gets
// believed, and then it gets priced off.

const SETUP = 'Setup'
const PRODUCTS = 'Products'
const TREATMENTS = 'Treatments'

/** The constants a property states once. Kept short or nobody completes it. */
const SETUP_FIELDS: { label: string; hint: string; style: 'money' | 'percent' }[] = [
  {
    label: 'Therapist cost per hour',
    hint: 'Wage plus employer national insurance, pension and holiday accrual. Not the hourly rate on the contract: that number is roughly a fifth too low and it is the most common reason a menu looks profitable and is not.',
    style: 'money',
  },
  {
    label: 'Treatment room cost per hour',
    hint: 'Rent or rates, heat, light, water and laundry plant for the year, divided by the room hours you can actually sell. A room costs money while it is empty, and a costing that ignores it prices the empty hours into nothing.',
    style: 'money',
  },
  {
    label: 'Laundry cost per treatment',
    hint: 'Couch cover, towels, robe and slippers for one guest, at what your laundry actually charges per piece.',
    style: 'money',
  },
  {
    label: 'Refreshment cost per guest',
    hint: 'Tea, water, fruit, anything included. Small, and it is in every treatment.',
    style: 'money',
  },
  {
    label: 'Therapist commission on treatment',
    hint: 'As a percentage of the net treatment price. Enter zero if you do not pay it.',
    style: 'percent',
  },
  {
    label: 'Card and processing fee',
    hint: 'As a percentage of the price paid. Usually between one and two per cent, and usually forgotten.',
    style: 'percent',
  },
  {
    label: 'Target gross margin',
    hint: 'What a treatment has to return after direct cost. The sheet prices every treatment against this and says which ones miss it.',
    style: 'percent',
  },
  {
    label: 'VAT rate',
    hint: 'Twenty per cent in the United Kingdom. Menu prices are entered including VAT, because that is how a guest sees them, and the margin is worked out on the net.',
    style: 'percent',
  },
]

const TREATMENT_ROWS = 24
const PRODUCT_ROWS = 20

function setupSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'Setup', style: 'title' }],
    [{ text: 'Eight numbers. Everything else on this workbook falls out of them.', style: 'note' }],
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
    text: 'Leave nothing blank. A blank here reads as zero in every treatment below it, '
      + 'and a treatment costed at zero looks like the best one on the menu.',
    style: 'note',
  }])
  return { name: SETUP, widths: [34, 16, 86], rows, freezeRows: 4 }
}

/** Where each setup constant lives, as an absolute reference. */
function setupRefs(): Record<string, string> {
  const at: Record<string, string> = {}
  SETUP_FIELDS.forEach((field, index) => {
    at[field.label] = `${SETUP}!$B$${5 + index}`
  })
  return at
}

function productsSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'Products', style: 'title' }],
    [{
      text: 'Cost per millilitre or gram, so a treatment can be costed on the dose it uses rather than on '
        + 'the bottle it comes out of. This is where most costings go wrong by a factor of five.',
      style: 'note',
    }],
    [],
    [
      { text: 'Product', style: 'header' },
      { text: 'Supplier', style: 'header' },
      { text: 'Pack size (ml or g)', style: 'header' },
      { text: 'Pack cost', style: 'header' },
      { text: 'Cost per ml or g', style: 'header' },
    ],
  ]
  for (let index = 0; index < PRODUCT_ROWS; index += 1) {
    const row = 5 + index
    rows.push([
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'money' },
      { formula: `=IFERROR(D${row}/C${row},"")`, style: 'derivedMoney' },
    ])
  }
  return { name: PRODUCTS, widths: [34, 22, 18, 14, 18], rows, freezeRows: 4 }
}

const COLUMNS: { heading: string; width: number; input?: boolean; style: string }[] = [
  { heading: 'Treatment', width: 32, input: true, style: 'input' },
  { heading: 'Menu price (inc VAT)', width: 15, input: true, style: 'money' },
  { heading: 'Treatment minutes', width: 13, input: true, style: 'number' },
  { heading: 'Turnaround minutes', width: 13, input: true, style: 'number' },
  { heading: 'Room minutes', width: 12, style: 'derivedNumber' },
  { heading: 'Net price', width: 12, style: 'derivedMoney' },
  { heading: 'Product cost', width: 13, input: true, style: 'money' },
  { heading: 'Linen', width: 11, style: 'derivedMoney' },
  { heading: 'Refreshments', width: 12, style: 'derivedMoney' },
  { heading: 'Other consumables', width: 14, input: true, style: 'money' },
  { heading: 'Therapist cost', width: 13, style: 'derivedMoney' },
  { heading: 'Room cost', width: 12, style: 'derivedMoney' },
  { heading: 'Commission', width: 12, style: 'derivedMoney' },
  { heading: 'Card fee', width: 11, style: 'derivedMoney' },
  { heading: 'Total cost', width: 13, style: 'derivedMoney' },
  { heading: 'Gross profit', width: 13, style: 'derivedMoney' },
  { heading: 'Margin', width: 11, style: 'derivedPercent' },
  { heading: 'Profit per room hour', width: 15, style: 'derivedMoney' },
  { heading: 'Price for target margin', width: 16, style: 'derivedMoney' },
  { heading: 'Verdict', width: 18, style: 'derived' },
]

const HEAD = 4
const FIRST = HEAD + 1
const LAST = HEAD + TREATMENT_ROWS

function treatmentsSheet(): Sheet {
  const at = setupRefs()
  const rows: Cell[][] = [
    [{ text: 'Treatments', style: 'title' }],
    [{
      text: 'One row per treatment on your menu. Fill in the white columns: the rest is worked out. '
        + 'Room minutes are treatment plus turnaround, because a room you are stripping is a room you '
        + 'cannot sell.',
      style: 'note',
    }],
    [],
    COLUMNS.map(column => ({ text: column.heading, style: 'header' as const })),
  ]

  for (let index = 0; index < TREATMENT_ROWS; index += 1) {
    const r = FIRST + index
    rows.push([
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { formula: `=IF(A${r}="","",C${r}+D${r})`, style: 'derivedNumber' },
      { formula: `=IF(A${r}="","",B${r}/(1+${at['VAT rate']}))`, style: 'derivedMoney' },
      { text: '', style: 'input' },
      { formula: `=IF(A${r}="","",${at['Laundry cost per treatment']})`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",${at['Refreshment cost per guest']})`, style: 'derivedMoney' },
      { text: '', style: 'input' },
      { formula: `=IF(A${r}="","",(E${r}/60)*${at['Therapist cost per hour']})`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",(E${r}/60)*${at['Treatment room cost per hour']})`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",F${r}*${at['Therapist commission on treatment']})`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",B${r}*${at['Card and processing fee']})`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",SUM(G${r}:N${r}))`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",F${r}-O${r})`, style: 'derivedMoney' },
      { formula: `=IFERROR(P${r}/F${r},"")`, style: 'derivedPercent' },
      { formula: `=IFERROR(P${r}/(E${r}/60),"")`, style: 'derivedMoney' },
      {
        formula: `=IFERROR((O${r}/(1-${at['Target gross margin']}))*(1+${at['VAT rate']}),"")`,
        style: 'derivedMoney',
      },
      {
        formula: `=IF(A${r}="","",IF(Q${r}>=${at['Target gross margin']},"On target",`
          + `IF(Q${r}<0,"Sold at a loss","Below target")))`,
        style: 'derived',
      },
    ])
  }

  rows.push([])
  rows.push([{
    text: 'Price for target margin is what this treatment would have to sell at, including VAT, to hit the '
      + 'margin on Setup. It is a fact, not an instruction: some treatments are loss leaders on purpose. '
      + 'The ones to look at are the ones nobody decided to sell at a loss.',
    style: 'note',
  }])

  return { name: TREATMENTS, widths: COLUMNS.map(column => column.width), rows, freezeRows: 4, freezeColumns: 1 }
}

function decisionsSheet(): Sheet {
  const at = setupRefs()
  const q = `${TREATMENTS}!$Q$${FIRST}:$Q$${LAST}`
  const r = `${TREATMENTS}!$R$${FIRST}:$R$${LAST}`
  const a = `${TREATMENTS}!$A$${FIRST}:$A$${LAST}`
  const p = `${TREATMENTS}!$P$${FIRST}:$P$${LAST}`

  const line = (label: string, formula: string, style: 'derivedMoney' | 'derivedPercent' | 'derivedNumber' | 'derived', note: string): Cell[] =>
    [{ text: label, style: 'label' }, { formula, style }, { text: note, style: 'wrap' }]

  return {
    name: 'What to do about it',
    widths: [38, 18, 84],
    freezeRows: 4,
    rows: [
      [{ text: 'What to do about it', style: 'title' }],
      [{
        text: 'Read this after the Treatments sheet is filled in. It is the same numbers asked a different '
          + 'question: not what does this treatment make, but what should change.',
        style: 'note',
      }],
      [],
      [{ text: 'Measure', style: 'header' }, { text: 'Your figure', style: 'header' }, { text: 'What it tells you', style: 'header' }],

      line('Treatments costed', `=COUNTA(${a})`, 'derivedNumber',
        'Everything below is drawn from these rows only. A menu half costed is a menu half priced.'),
      line('Average margin', `=IFERROR(AVERAGE(${q}),"")`, 'derivedPercent',
        'Across the whole menu. A healthy treatment menu sits well above the target on Setup, because the target is a floor rather than an aim.'),
      line('Average profit per room hour', `=IFERROR(AVERAGE(${r}),"")`, 'derivedMoney',
        'The number that actually matters. A room is the thing you are short of, not a treatment, so the menu should be read by what an hour of room time returns.'),
      line('Best profit per room hour', `=IFERROR(MAX(${r}),"")`, 'derivedMoney',
        'Whatever this treatment is, it should be easier to book, on the first page of the menu, and the one a therapist is trained to recommend.'),
      line('That treatment', `=IFERROR(INDEX(${a},MATCH(MAX(${r}),${r},0)),"")`, 'derived',
        'Named, so nobody has to scan the sheet for it.'),
      line('Worst profit per room hour', `=IFERROR(MIN(${r}),"")`, 'derivedMoney',
        'Worth an hour of somebody senior deciding whether it is a loss leader, a price rise, or a treatment that comes off the menu.'),
      line('That treatment', `=IFERROR(INDEX(${a},MATCH(MIN(${r}),${r},0)),"")`, 'derived',
        'Named, for the same reason.'),
      line('Below the target margin', `=COUNTIF(${q},"<"&${at['Target gross margin']})`, 'derivedNumber',
        'How many treatments miss the floor. One or two is a menu with loss leaders in it. A third of the menu is a pricing problem.'),
      line('Sold at a loss', `=COUNTIF(${q},"<0")`, 'derivedNumber',
        'Treatments that cost more to deliver than they bring in. Every one of these should be a decision somebody made on purpose, and usually at least one is not.'),
      line('Profit on a full room day', `=IFERROR(AVERAGE(${r})*8,"")`, 'derivedMoney',
        'Average profit per room hour across eight sellable hours. Multiply by rooms and by days open to see what the menu is capable of before a single discount.'),
      line('Total gross profit per round of the menu', `=IFERROR(SUM(${p}),"")`, 'derivedMoney',
        'One of each treatment sold once. Not a forecast: a way of seeing how much of the menu is carrying the rest.'),
      [],
      [{
        text: 'Three questions worth asking of this sheet. Which treatments are on the first page of the menu, '
          + 'and are they the ones with the best return per hour. Which treatments take a room for ninety '
          + 'minutes and return less than a sixty minute one. And which of the treatments below target are '
          + 'below target because of the price, rather than because of the time.',
        style: 'note',
      }],
    ],
  }
}

function priceChangeSheet(): Sheet {
  const at = setupRefs()
  const rows: Cell[][] = [
    [{ text: 'What a price rise does', style: 'title' }],
    [{
      text: 'A price rise goes almost entirely to the bottom line, because the cost of delivering the '
        + 'treatment does not move. This is the arithmetic of that, on one treatment at a time.',
      style: 'note',
    }],
    [],
    [
      { text: 'Treatment', style: 'header' },
      { text: 'Current price', style: 'header' },
      { text: 'Current profit', style: 'header' },
      { text: 'Rise', style: 'header' },
      { text: 'New price', style: 'header' },
      { text: 'New profit', style: 'header' },
      { text: 'Profit change', style: 'header' },
      { text: 'Bookings you could lose and stand still', style: 'header' },
    ],
  ]

  for (let index = 0; index < 10; index += 1) {
    const r = 5 + index
    rows.push([
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { formula: `=IF(B${r}="","",B${r}*(1+D${r}))`, style: 'derivedMoney' },
      { formula: `=IF(B${r}="","",C${r}+((E${r}-B${r})/(1+${at['VAT rate']})))`, style: 'derivedMoney' },
      { formula: `=IF(B${r}="","",F${r}-C${r})`, style: 'derivedMoney' },
      { formula: `=IFERROR(1-(C${r}/F${r}),"")`, style: 'derivedPercent' },
    ])
  }

  rows.push([])
  rows.push([{
    text: 'The last column is the one to read. It says what share of bookings you could lose at the new '
      + 'price and still make the same money. It is usually far larger than anybody expects, which is why '
      + 'a spa holding a price for three years out of nervousness is usually the most expensive decision '
      + 'on the sheet.',
    style: 'note',
  }])
  rows.push([{
    text: 'Copy the treatment, its current price and its current profit from the Treatments sheet. Enter '
      + 'the rise as a percentage: 0.05 for five per cent.',
    style: 'note',
  }])

  return { name: 'What a price rise does', widths: [32, 14, 14, 10, 14, 14, 14, 22], rows, freezeRows: 4 }
}

function readMe(): Sheet {
  return {
    name: 'Read me',
    widths: [100],
    rows: [
      [{ text: 'Treatment costings and menu pricing', style: 'title' }],
      [{ text: 'Talent House Collective', style: 'subtitle' }],
      [],
      [{ text: 'In what order', style: 'section' }],
      [{ text: '1. Setup. Eight numbers. Everything else is worked out from them.', style: 'wrap' }],
      [{ text: '2. Products. Pack size and pack cost, so a treatment is costed on the dose it uses.', style: 'wrap' }],
      [{ text: '3. Treatments. One row per treatment. Fill in the white columns only.', style: 'wrap' }],
      [{ text: '4. What to do about it. Read it once the menu is in.', style: 'wrap' }],
      [{ text: '5. What a price rise does. For the conversation that follows.', style: 'wrap' }],
      [],
      [{ text: 'Three things this does differently', style: 'section' }],
      [{
        text: 'It costs room time, not treatment time. A sixty minute treatment with fifteen minutes of '
          + 'turnaround occupies the room for seventy-five, and a costing that ignores the fifteen '
          + 'overstates every margin on the menu.',
        style: 'wrap',
      }],
      [{
        text: 'It costs the therapist at wage plus on-costs. National insurance, pension and holiday '
          + 'accrual are roughly a fifth on top, and leaving them out is the single most common reason a '
          + 'menu looks profitable and the profit and loss disagrees.',
        style: 'wrap',
      }],
      [{
        text: 'It reads the menu by profit per room hour rather than by margin. Margin flatters a long '
          + 'treatment. A room is the thing a spa is short of, and the right question is what an hour of '
          + 'it returns.',
        style: 'wrap',
      }],
      [],
      [{ text: 'What it is not', style: 'section' }],
      [{
        text: 'It is not a forecast and it is not advice on what to charge. It tells you what a treatment '
          + 'costs you and what it would have to sell at to hit the margin you set. What you then charge '
          + 'is a commercial decision about your market, your position and your competitors.',
        style: 'wrap',
      }],
      [{
        text: 'Nothing is pre-filled. A plausible figure in a costing model is worse than a blank one, '
          + 'because a blank is obviously unfinished and a plausible figure gets believed and then gets '
          + 'priced off.',
        style: 'wrap',
      }],
    ],
  }
}

export const TREATMENT_COSTINGS_FILE = 'Treatment Costings and Menu Pricing.xlsx'

export function treatmentCostingsWorkbook(): Buffer {
  return buildWorkbook([
    readMe(),
    setupSheet(),
    productsSheet(),
    treatmentsSheet(),
    decisionsSheet(),
    priceChangeSheet(),
  ])
}

/** Exported for the test that checks every formula points somewhere real. */
export const TREATMENT_COSTINGS_SHAPE = {
  setupFields: SETUP_FIELDS.length,
  treatmentRows: TREATMENT_ROWS,
  columns: COLUMNS.map(column => column.heading),
  firstTreatmentRow: FIRST,
  cell: cellRef,
}
