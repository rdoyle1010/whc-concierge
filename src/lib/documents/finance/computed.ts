// Which lines the spreadsheet works out, and which a person types.
//
// Kept here rather than beside the metric definitions on purpose. The PDF is
// the argument: what the measure is, why it matters, what a bad number means.
// The workbook is the arithmetic. Mixing them would put spreadsheet syntax
// into a document that gets printed and handed to a general manager.
//
// A formula names other lines on the same sheet in braces, and the builder
// turns each one into a cell reference for whichever column it is computing.
// So one formula covers this period, last period, last year and budget, and
// the variance column is the same subtraction everywhere.
//
// {@Something} points at the Setup sheet, where a property states the handful
// of constants the whole pack depends on. {Sheet name!Something} points at a
// line on another report. Get the Setup numbers right once and RevPATH,
// occupancy and unsold capacity all follow from two typed lines.

/** The constants a property states once, and the rest of the pack reads. */
export const SETUP_FIELDS: { label: string; hint: string; format: 'number' | 'money' | 'percent' }[] = [
  { label: 'Treatment rooms in service', hint: 'Rooms actually available to sell, not rooms that exist.', format: 'number' },
  { label: 'Opening hours per day', hint: 'The hours the treatment floor is open and sellable.', format: 'number' },
  { label: 'Days open per week', hint: 'Usually seven. Six if you close a day.', format: 'number' },
  { label: 'Weeks in the reporting period', hint: 'Four or five for a month. One for a weekly report.', format: 'number' },
  { label: 'Peak hours per week', hint: 'Define peak once and keep the definition, or the yield numbers mean nothing.', format: 'number' },
  { label: 'Therapist hours rostered in the period', hint: 'All treatment-delivering staff, including overtime worked.', format: 'number' },
  { label: 'Average therapist hourly cost', hint: 'Including on-costs and pension. Used for contribution.', format: 'money' },
  { label: 'Menu value of hours sold', hint: 'What the treatments delivered would have made at full menu price.', format: 'money' },
]

export const SETUP_SHEET = 'Setup'

/**
 * Lines the workbook computes, by report.
 *
 * Every name in braces has to exist on that report, and a test fails the
 * build if one does not: a formula pointing at a measure somebody renamed is
 * a spreadsheet that opens with errors across it, which is worse than a
 * spreadsheet that only had blanks.
 */
export const COMPUTED: Record<string, Record<string, string>> = {
  'FIN-TRADING-RPT-602': {
    'Total revenue':
      '{Treatment revenue}+{Retail revenue}+{Membership revenue}+{Fitness and class revenue}+{Other income}',
    'Average treatment value': 'IFERROR({Treatment revenue}/{Treatments delivered},"")',
    'Treatment room utilisation':
      'IFERROR({Treatments delivered}/({@Treatment rooms in service}*{@Opening hours per day}'
      + '*{@Days open per week}*{@Weeks in the reporting period}),"")',
    'Retail spend per guest': 'IFERROR({Retail revenue}/{Total guests},"")',
  },

  // The sheet that earns the pack. Four constants on Setup and two typed
  // lines here, and RevPATH, occupancy, unsold hours and what they are worth
  // all fall out of it.
  'FIN-CAPACITY-RPT-603': {
    'Treatment hours available':
      '{@Treatment rooms in service}*{@Opening hours per day}*{@Days open per week}*{@Weeks in the reporting period}',
    'RevPATH': 'IFERROR({Daily trading!Total revenue}/{Treatment hours available},"")',
    'Revenue per treatment room': 'IFERROR({Daily trading!Total revenue}/{@Treatment rooms in service},"")',
    'Revenue per therapist hour':
      'IFERROR({Daily trading!Total revenue}/{@Therapist hours rostered in the period},"")',
    'Occupancy by hour': 'IFERROR({Treatment hours sold}/{Treatment hours available},"")',
    'Unsold capacity': '{Treatment hours available}-{Treatment hours sold}',
    'Lost revenue opportunity':
      'IFERROR({Unsold capacity}*({Daily trading!Total revenue}/{Treatment hours sold}),"")',
  },

  'FIN-THERAPIST-RPT-606': {
    'Utilisation against rostered': 'IFERROR({Treatment hours sold}/{Hours rostered},"")',
    'Utilisation against available': 'IFERROR({Treatment hours sold}/{Hours available for treatment},"")',
    'Revenue per rostered hour': 'IFERROR(({Treatment revenue}+{Retail sales})/{Hours rostered},"")',
  },

  'FIN-RETAIL-RPT-607': {
    'Retail spend per treated guest': 'IFERROR({Retail revenue}/{Daily trading!Total guests},"")',
    'Retail as a percentage of treatment revenue':
      'IFERROR({Retail revenue}/{Daily trading!Treatment revenue},"")',
    'Gross margin': 'IFERROR(({Retail revenue}-{Stock and inventory!Retail cost of goods sold})/{Retail revenue},"")',
  },

  'FIN-MEMBERSHIP-RPT-608': {
    'Net movement': '{New joins}-{Cancellations}',
    'Churn rate': 'IFERROR({Cancellations}/{Total members},"")',
    'Average member value': 'IFERROR({Monthly recurring revenue}/{Total members},"")',
    'Member utilisation': 'IFERROR({Active members}/{Total members},"")',
  },

  'FIN-GUEST-RPT-609': {
    'Total guests': '{New guests}+{Returning guests}',
    'Repeat rate': 'IFERROR({Returning guests}/{Total guests},"")',
    'Average spend per guest': 'IFERROR({Daily trading!Total revenue}/{Total guests},"")',
  },

  'FIN-DISCOUNT-RPT-611': {
    'Discount value given': '{@Menu value of hours sold}-{Full price revenue}-{Discounted revenue}',
    'Discount as a percentage of potential revenue':
      'IFERROR({Discount value given}/{@Menu value of hours sold},"")',
    'Yield achieved': 'IFERROR(({Full price revenue}+{Discounted revenue})/{@Menu value of hours sold},"")',
  },

  'FIN-VOUCHER-RPT-612': {
    'Redemption rate': 'IFERROR({Vouchers redeemed}/{Vouchers sold},"")',
  },

  'FIN-PAYROLL-RPT-613': {
    'Total payroll cost':
      '{Therapist wage cost}+{Reception and support wage cost}+{Management wage cost}'
      + '+{Agency and freelance cost}+{Overtime cost}',
    'Payroll as a percentage of revenue':
      'IFERROR({Total payroll cost}/{Daily trading!Total revenue},"")',
  },

  'FIN-PANDL-RPT-614': {
    'Total revenue': '{Treatment revenue}+{Retail revenue}+{Membership revenue}+{Other income}',
    'Gross profit':
      '{Total revenue}-{Cost of sales, retail}-{Cost of sales, treatment products}',
    'Gross operating profit':
      '{Gross profit}-{Payroll}-{Commission}-{Laundry and linen}-{Consumables}'
      + '-{Utilities}-{Maintenance and repairs}-{Marketing}-{Other operating expenses}',
    'GOP margin': 'IFERROR({Gross operating profit}/{Total revenue},"")',
  },

  'FIN-STOCK-RPT-615': {
    'Discrepancy':
      '({Opening stock at cost}+{Purchases}-{Retail cost of goods sold}-{Professional usage})'
      + '-{Closing stock at cost}',
  },
}

/**
 * The dashboard, and where each of its fifteen numbers comes from.
 *
 * A dashboard that is typed in by hand is a dashboard that disagrees with the
 * reports behind it by the third month, and the person who spots it stops
 * trusting both. Every line here is a reference.
 */
export const DASHBOARD_SOURCES: { measure: string; sheet: string; from: string }[] = [
  { measure: 'Total revenue', sheet: 'Daily trading', from: 'Total revenue' },
  { measure: 'Variance to budget', sheet: 'Profit and loss', from: 'Total revenue' },
  { measure: 'RevPATH', sheet: 'Revenue and capacity', from: 'RevPATH' },
  { measure: 'Treatment room utilisation', sheet: 'Revenue and capacity', from: 'Occupancy by hour' },
  { measure: 'Therapist utilisation', sheet: 'Therapist productivity', from: 'Utilisation against rostered' },
  { measure: 'Average treatment value', sheet: 'Daily trading', from: 'Average treatment value' },
  { measure: 'Retail capture rate', sheet: 'Retail', from: 'Retail capture rate' },
  { measure: 'Retail spend per guest', sheet: 'Retail', from: 'Retail spend per treated guest' },
  { measure: 'Rebooking rate', sheet: 'Guests and CRM', from: 'Rebooking rate at departure' },
  { measure: 'Membership recurring revenue', sheet: 'Membership', from: 'Monthly recurring revenue' },
  { measure: 'Membership churn', sheet: 'Membership', from: 'Churn rate' },
  { measure: 'Payroll percentage', sheet: 'Payroll and labour', from: 'Payroll as a percentage of revenue' },
  { measure: 'Guest repeat rate', sheet: 'Guests and CRM', from: 'Repeat rate' },
  { measure: 'Forward occupancy, 30 days', sheet: 'Forward pace', from: 'Treatment room occupancy, next 30 days' },
  { measure: 'Gross operating profit', sheet: 'Profit and loss', from: 'Gross operating profit' },
]

/** How a line is formatted, where the name does not make it obvious. */
const EXPLICIT: Record<string, 'money' | 'percent' | 'number'> = {
  'Total guests': 'number',
  'New guests': 'number',
  'Returning guests': 'number',
  'Treatments delivered': 'number',
  'Treatment hours available': 'number',
  'Treatment hours sold': 'number',
  'Unsold capacity': 'number',
  'Total members': 'number',
  'Active members': 'number',
  'New joins': 'number',
  'Cancellations': 'number',
  'Freezes': 'number',
  'Net movement': 'number',
  'Duration': 'number',
  'Hours rostered': 'number',
  'Hours available for treatment': 'number',
  'RevPATH': 'money',
  'Discount value given': 'money',
  'Average redemption spend': 'money',
  'Uplift on redemption': 'money',
}

const PERCENT = /\b(rate|percentage|utilisation|occupancy|margin|share|churn|yield|conversion)\b/i
const MONEY = /\b(revenue|cost|value|spend|profit|payroll|liability|price|income|compensation|sales|stock|purchases|commission|laundry|consumables|utilities|maintenance|marketing|banking|float)\b/i

export function formatFor(name: string): 'money' | 'percent' | 'number' {
  if (EXPLICIT[name]) return EXPLICIT[name]
  if (PERCENT.test(name)) return 'percent'
  if (MONEY.test(name)) return 'money'
  return 'number'
}
