import { buildWorkbook, type Cell, type Sheet } from '../xlsx'

// Retail, read as a business rather than as a shelf.
//
// Retail is the easiest money in a spa and the worst managed. A therapist
// recommends what they like, the range grows every time a supplier visits,
// nothing is ever taken off, and the stock count in March finds four thousand
// pounds of product nobody has sold since the year before.
//
// The three questions this answers are the ones nobody asks. Which lines
// actually make the margin, rather than which sell the most units. How much
// capital is tied up in stock that is not moving. And what a line is worth
// per unit of shelf, which is the only basis on which anything should come
// off the range.

const SETUP = 'Setup'

const SETUP_FIELDS: { label: string; hint: string }[] = [
  { label: 'VAT rate', hint: 'Twenty per cent in the United Kingdom. Retail prices are entered including VAT because that is how they are ticketed, and margin is worked out on the net.' },
  { label: 'Target retail margin', hint: 'What a line has to return after cost of goods. Anything below this is on the range for a reason or should come off it.' },
  { label: 'Weeks of cover you want to hold', hint: 'How many weeks of sales you want in stock. Eight to twelve is usual. More than that is capital on a shelf.' },
  { label: 'Weeks in the period below', hint: 'How many weeks the sales figures cover. Four or thirteen. Used to work out rate of sale.' },
  { label: 'Therapist commission on retail', hint: 'As a percentage of the net retail price. Enter zero if you do not pay it. It comes out of the margin either way.' },
  { label: 'Guests treated in the period', hint: 'From your own trading. Used to work out spend per treated guest, which is the real retail measure.' },
]

const at = (label: string) => `${SETUP}!$B$${5 + SETUP_FIELDS.findIndex(field => field.label === label)}`

function setupSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'Setup', style: 'title' }],
    [{ text: 'Six numbers, then the range.', style: 'note' }],
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
  return { name: SETUP, widths: [36, 16, 86], rows, freezeRows: 4 }
}

const LINES = 40
const HEAD = 4
const FIRST = HEAD + 1
const LAST = HEAD + LINES

const COLUMNS: { heading: string; width: number }[] = [
  { heading: 'Product', width: 32 },
  { heading: 'House', width: 18 },
  { heading: 'Cost per unit', width: 12 },
  { heading: 'Retail price (inc VAT)', width: 14 },
  { heading: 'Net price', width: 11 },
  { heading: 'Commission', width: 11 },
  { heading: 'Gross profit per unit', width: 14 },
  { heading: 'Margin', width: 10 },
  { heading: 'Units sold in period', width: 13 },
  { heading: 'Revenue', width: 12 },
  { heading: 'Gross profit', width: 12 },
  { heading: 'Units in stock', width: 12 },
  { heading: 'Stock at cost', width: 12 },
  { heading: 'Rate of sale per week', width: 14 },
  { heading: 'Weeks of cover', width: 12 },
  { heading: 'Order or stop', width: 24 },
]

function rangeSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'The range', style: 'title' }],
    [{
      text: 'One row per line you carry. Fill in the white columns: product, house, cost, price, units sold '
        + 'and units in stock. Everything else is worked out.',
      style: 'note',
    }],
    [],
    COLUMNS.map(column => ({ text: column.heading, style: 'header' as const })),
  ]

  for (let index = 0; index < LINES; index += 1) {
    const r = FIRST + index
    rows.push([
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { text: '', style: 'input' },
      { formula: `=IF(A${r}="","",D${r}/(1+${at('VAT rate')}))`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",E${r}*${at('Therapist commission on retail')})`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",E${r}-C${r}-F${r})`, style: 'derivedMoney' },
      { formula: `=IFERROR(G${r}/E${r},"")`, style: 'derivedPercent' },
      { text: '', style: 'input' },
      { formula: `=IF(A${r}="","",I${r}*E${r})`, style: 'derivedMoney' },
      { formula: `=IF(A${r}="","",I${r}*G${r})`, style: 'derivedMoney' },
      { text: '', style: 'input' },
      { formula: `=IF(A${r}="","",L${r}*C${r})`, style: 'derivedMoney' },
      { formula: `=IFERROR(I${r}/${at('Weeks in the period below')},"")`, style: 'derivedNumber' },
      { formula: `=IFERROR(L${r}/N${r},"")`, style: 'derivedNumber' },
      {
        formula: `=IF(A${r}="","",IF(I${r}=0,"Dead. Take it off the range.",`
          + `IF(O${r}>${at('Weeks of cover you want to hold')}*2,"Overstocked. Stop ordering.",`
          + `IF(O${r}<${at('Weeks of cover you want to hold')}/2,"Order now.",`
          + `IF(H${r}<${at('Target retail margin')},"Below target margin. Price or drop it.","")))))`,
        style: 'derived',
      },
    ])
  }

  const total = LAST + 1
  rows.push([
    { text: 'Total', style: 'label' }, null, null, null, null, null, null,
    { formula: `=IFERROR(SUM(K${FIRST}:K${LAST})/SUM(J${FIRST}:J${LAST}),"")`, style: 'derivedPercent' },
    { formula: `=SUM(I${FIRST}:I${LAST})`, style: 'derivedNumber' },
    { formula: `=SUM(J${FIRST}:J${LAST})`, style: 'derivedMoney' },
    { formula: `=SUM(K${FIRST}:K${LAST})`, style: 'derivedMoney' },
    { formula: `=SUM(L${FIRST}:L${LAST})`, style: 'derivedNumber' },
    { formula: `=SUM(M${FIRST}:M${LAST})`, style: 'derivedMoney' },
    null, null, null,
  ])

  rows.push([])
  rows.push([{
    text: 'The last column is not an instruction. It is the arithmetic stated out loud, and a line it tells '
      + 'you to drop may be one you carry on purpose because a therapist needs it for a treatment. What it '
      + 'should never be is a surprise.',
    style: 'note',
  }])

  return {
    name: 'The range',
    widths: COLUMNS.map(column => column.width),
    rows,
    freezeRows: 4,
    freezeColumns: 1,
  }
}

function decisionsSheet(): Sheet {
  const total = LAST + 1
  const range = `'The range'`
  const line = (
    label: string,
    formula: string,
    style: 'derivedMoney' | 'derivedPercent' | 'derivedNumber' | 'derived',
    note: string,
  ): Cell[] => [{ text: label, style: 'label' }, { formula, style }, { text: note, style: 'wrap' }]

  return {
    name: 'What to do about it',
    widths: [40, 18, 82],
    freezeRows: 4,
    rows: [
      [{ text: 'What to do about it', style: 'title' }],
      [{ text: 'Read this once the range is filled in.', style: 'note' }],
      [],
      [{ text: 'Measure', style: 'header' }, { text: 'Your figure', style: 'header' }, { text: 'What it tells you', style: 'header' }],

      line('Lines carried', `=COUNTA(${range}!A${FIRST}:A${LAST})`, 'derivedNumber',
        'The number of things a therapist has to know in order to recommend confidently. Past about twenty-five, nobody knows all of them and the recommendation gets vague.'),
      line('Retail revenue in the period', `=${range}!J${total}`, 'derivedMoney',
        'Net of VAT.'),
      line('Gross profit', `=${range}!K${total}`, 'derivedMoney',
        'After cost of goods and after commission, which is where most retail reporting stops too early.'),
      line('Overall margin', `=${range}!H${total}`, 'derivedPercent',
        'The blended margin across everything you sold. A healthy spa retail margin after commission is usually in the forties.'),
      line('Retail spend per treated guest',
        `=IFERROR(${range}!J${total}/${at('Guests treated in the period')},"")`, 'derivedMoney',
        'The real measure. It removes the effect of a busy month and says whether the team is actually recommending.'),
      line('Capital tied up in stock', `=${range}!M${total}`, 'derivedMoney',
        'At cost. This is money on a shelf rather than in the business, and in most spas it is larger than anybody thinks.'),
      line('Lines that sold nothing', `=COUNTIFS(${range}!A${FIRST}:A${LAST},"<>",${range}!I${FIRST}:I${LAST},0)`, 'derivedNumber',
        'Dead stock. Each one is capital, shelf space, and a line the team has to remember for no return.'),
      line('Value of the dead stock',
        `=SUMIFS(${range}!M${FIRST}:M${LAST},${range}!I${FIRST}:I${LAST},0)`, 'derivedMoney',
        'What that costs you. Usually enough to fund the training that would fix the attachment rate.'),
      line('Lines below your target margin',
        `=COUNTIFS(${range}!A${FIRST}:A${LAST},"<>",${range}!H${FIRST}:H${LAST},"<"&${at('Target retail margin')})`,
        'derivedNumber',
        'Each should be there for a reason: a treatment needs it, or it brings people to the shelf. The ones with no reason are a pricing decision nobody made.'),
      line('Best gross profit, one line', `=IFERROR(MAX(${range}!K${FIRST}:K${LAST}),"")`, 'derivedMoney',
        'Whatever this is, it should be at eye level, in every treatment room, and the first thing a new therapist is taught.'),
      line('That line', `=IFERROR(INDEX(${range}!A${FIRST}:A${LAST},MATCH(MAX(${range}!K${FIRST}:K${LAST}),${range}!K${FIRST}:K${LAST},0)),"")`, 'derived',
        'Named, so nobody has to scan for it.'),
      line('Share of profit from the top five lines',
        `=IFERROR(SUM(LARGE(${range}!K${FIRST}:K${LAST},1),LARGE(${range}!K${FIRST}:K${LAST},2),`
        + `LARGE(${range}!K${FIRST}:K${LAST},3),LARGE(${range}!K${FIRST}:K${LAST},4),`
        + `LARGE(${range}!K${FIRST}:K${LAST},5))/${range}!K${total},"")`, 'derivedPercent',
        'In most spas this is well over half. If five lines make most of the money, the other thirty-five are working capital and shelf space rather than a range.'),
      line('Weeks of stock you are holding overall',
        `=IFERROR(${range}!M${total}/(SUM(${range}!I${FIRST}:I${LAST})*IFERROR(SUM(${range}!M${FIRST}:M${LAST})/SUM(${range}!L${FIRST}:L${LAST}),0)/${at('Weeks in the period below')}),"")`,
        'derivedNumber',
        'Against the cover you said you wanted on Setup. Well above it is capital you could release this quarter.'),
      [],
      [{
        text: 'Three questions worth asking of this sheet. Whether the lines making the profit are the ones '
          + 'on the counter and in the treatment rooms. Whether the dead stock is worth marking down and '
          + 'clearing this month rather than counting again next March. And whether a range of this size is '
          + 'one a therapist can actually hold in their head, because a recommendation nobody is confident in '
          + 'is the real reason a spend per guest figure is low.',
        style: 'note',
      }],
    ],
  }
}

function readMe(): Sheet {
  return {
    name: 'Read me',
    widths: [100],
    rows: [
      [{ text: 'Retail range, margin and stock', style: 'title' }],
      [{ text: 'Talent House Collective', style: 'subtitle' }],
      [],
      [{ text: 'In what order', style: 'section' }],
      [{ text: '1. Setup. Six numbers.', style: 'wrap' }],
      [{ text: '2. The range. One row per line: product, house, cost, price, units sold, units in stock.', style: 'wrap' }],
      [{ text: '3. What to do about it. Read it once the range is in.', style: 'wrap' }],
      [],
      [{ text: 'Three things this does differently', style: 'section' }],
      [{
        text: 'It takes commission out of the margin. A line paying ten per cent commission on the net price '
          + 'is not making the margin on the supplier price list, and the difference decides which lines are '
          + 'worth their space.',
        style: 'wrap',
      }],
      [{
        text: 'It reads the range by gross profit rather than by units sold. The line that sells most is '
          + 'rarely the line that earns most, and shelf position usually follows the wrong one of the two.',
        style: 'wrap',
      }],
      [{
        text: 'It puts a value on dead stock rather than a count. Four lines that sold nothing is a note. '
          + 'Four thousand pounds sitting in them is a decision.',
        style: 'wrap',
      }],
      [],
      [{ text: 'What it is not', style: 'section' }],
      [{
        text: 'It is not a stock control system and it does not place orders. It tells you what the range is '
          + 'doing, which is the conversation to have before the supplier visits rather than during.',
        style: 'wrap',
      }],
      [{
        text: 'Nothing is pre-filled, including the target margin. A target copied from somewhere else is '
          + 'not a target.',
        style: 'wrap',
      }],
    ],
  }
}

export const RETAIL_FILE = 'Retail Range, Margin and Stock.xlsx'

export function retailWorkbook(): Buffer {
  return buildWorkbook([readMe(), setupSheet(), rangeSheet(), decisionsSheet()])
}
