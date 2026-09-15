import { treatmentCostingsWorkbook, TREATMENT_COSTINGS_FILE } from './treatment-costings'
import { staffingWorkbook, STAFFING_FILE } from './staffing'
import { retailWorkbook, RETAIL_FILE } from './retail'
import { preOpeningWorkbook, PRE_OPENING_FILE, PRE_OPENING_TASK_COUNT } from './pre-opening'

// The tools, as products.
//
// A spa runs on spreadsheets. The library says what the operation should do;
// a tool works out what to do about it, and it is the thing an operator opens
// weekly rather than once a year at audit. Selling four hundred procedures
// and no calculator is selling the reference book without the instrument.
//
// Built in code rather than uploaded, for the same reason the reporting
// workbook is: a file built from the same source as the documents beside it
// cannot drift from them, and a file in a bucket agrees with the pack until
// the first time somebody edits a definition.
//
// Each one has its own slug in the same namespace as pack slugs, so an order
// carrying it needs no new plumbing: entitlement already resolves a buyer's
// slugs to what they can download.

export type Tool = {
  slug: string
  name: string
  /** What it answers, in one line, for the card. */
  blurb: string
  /** The argument, for the page. */
  detail: string
  pricePence: number
  fileName: string
  sheets: number
  build: () => Buffer
}

export const TOOLS: Tool[] = [
  {
    slug: 'tool-treatment-costings',
    name: 'Treatment Costings and Menu Pricing',
    blurb: 'What each treatment actually costs you, and what it would have to sell at.',
    detail:
      'The calculation that decides whether a menu makes money, done properly. It costs room time rather '
      + 'than treatment time, product by the dose rather than by the bottle, and the therapist at wage plus '
      + 'on-costs. Each of those is usually left out, and together they understate the cost of a treatment '
      + 'by about a third. It then reads the menu by profit per room hour, which is the only question that '
      + 'matters when rooms are the thing you are short of, and tells you what a price rise is worth and how '
      + 'many bookings you could lose before it stops being worth it.',
    pricePence: 24500,
    fileName: TREATMENT_COSTINGS_FILE,
    sheets: 6,
    build: treatmentCostingsWorkbook,
  },

  {
    slug: 'tool-staffing',
    name: 'Staffing, Rota and Cover',
    blurb: 'What a shape of week costs, and whether the hours match the diary.',
    detail:
      'A rota says who is in. It does not say whether the hours match the bookings, what they cost against '
      + 'the revenue they can produce, or what it costs to cover the holiday and sickness that are certain to '
      + 'happen. This costs an hour at wage plus on-costs plus cover, which is usually a third above the '
      + 'contract rate and is why payroll comes in over budget in a spa that rostered exactly what it '
      + 'planned. It measures utilisation against hours rostered rather than hours worked, and it separates a '
      + 'rota problem from a price problem, which are the two things a high payroll percentage can mean.',
    pricePence: 24500,
    fileName: STAFFING_FILE,
    sheets: 5,
    build: staffingWorkbook,
  },

  {
    slug: 'tool-retail',
    name: 'Retail Range, Margin and Stock',
    blurb: 'Which lines earn, which are dead, and what the shelf is costing you.',
    detail:
      'Retail is the easiest money in a spa and the worst managed. This takes commission out of the margin, '
      + 'reads the range by gross profit rather than by units sold, and puts a value on the stock that is not '
      + 'moving. Four lines that sold nothing is a note; four thousand pounds sitting in them is a decision. '
      + 'It also says what share of the profit comes from the top five lines, which in most spas is more than '
      + 'half and changes what the other thirty-five are for.',
    pricePence: 19500,
    fileName: RETAIL_FILE,
    sheets: 4,
    build: retailWorkbook,
  },

  {
    slug: 'tool-pre-opening',
    name: 'Pre-Opening Critical Path',
    blurb: `The ${PRE_OPENING_TASK_COUNT} things that have to happen before the first guest, in order.`,
    detail:
      'The only tool here that arrives filled in, because the value is knowing what the tasks are and in '
      + 'what order, which is exactly what somebody opening their first spa cannot find out until it is too '
      + 'late to act on. Enter the opening date and the whole path recalculates, which is the one thing a '
      + 'printed plan cannot do. Every task is marked with whether it stops opening, because at week two '
      + 'everything is late and somebody has to decide what actually cannot slip.',
    pricePence: 39500,
    fileName: PRE_OPENING_FILE,
    sheets: 4,
    build: preOpeningWorkbook,
  },
]

export const TOOL_BUNDLE_SLUG = 'tool-operators-toolkit'

/**
 * Every tool, at a price that is not the sum of them.
 *
 * Four tools bought singly are one thousand and eighty pounds. A spa that
 * wants all four is a spa taking the whole operation seriously, and the
 * bundle should be priced so that is the obvious decision rather than a
 * calculation. It also sits just under the reporting pack, which is the right
 * order: the tools work out what to do, the reporting pack proves what
 * happened, and most properties should buy the first before the second.
 */
export const TOOL_BUNDLE = {
  slug: TOOL_BUNDLE_SLUG,
  name: 'The Spa Operator\u2019s Toolkit',
  blurb: 'Every tool in one purchase, at less than three of them bought separately.',
  detail:
    'Treatment costings and menu pricing, staffing and rota cost, retail range and margin, and the '
    + 'pre-opening critical path. The four spreadsheets a spa is actually run from, each built so that a '
    + 'handful of typed numbers produce the rest, and none of them pre-filled with a figure somebody would '
    + 'believe.',
  pricePence: 79500,
}

export const toolBySlug = (slug: string): Tool | undefined =>
  TOOLS.find(tool => tool.slug === slug)
