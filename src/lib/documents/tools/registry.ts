import { treatmentCostingsWorkbook, TREATMENT_COSTINGS_FILE } from './treatment-costings'

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
]

export const toolBySlug = (slug: string): Tool | undefined =>
  TOOLS.find(tool => tool.slug === slug)
