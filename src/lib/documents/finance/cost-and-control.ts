import type { PlanSection } from '../plan-types'
import { figures, definitions, purpose, actionsBlock, type Metric } from './shape'

// Payroll, the profit and loss, stock, complaints, standards, safety and
// marketing. The cost side, and the evidence side.

const PAYROLL: Metric[] = [
  { name: 'Total payroll cost', how: 'Wages, on-costs, pension and employer contributions for the period. Not the gross pay figure alone.' },
  { name: 'Payroll as a percentage of revenue', how: 'Total payroll divided by total revenue. The headline control figure for a spa.' },
  { name: 'Therapist wage cost', how: 'Wage cost of treatment-delivering staff, including commission.' },
  { name: 'Reception and support wage cost', how: 'Non-treatment payroll, shown separately because it does not scale with bookings.' },
  { name: 'Management wage cost', how: 'Salaried management. Usually fixed, and it is the line that makes a small spa look inefficient.' },
  { name: 'Agency and freelance cost', how: 'Cost of cover, with the hours it bought. Compare the hourly cost against your own.' },
  { name: 'Overtime cost', how: 'Overtime paid, with the hours. Persistent overtime is a rota problem wearing a cost disguise.' },
  { name: 'Revenue per labour hour', how: 'Total revenue divided by all hours paid, including reception and management.' },
  { name: 'Treatment hours sold per therapist hour paid', how: 'The productivity ratio. It is the same figure as utilisation, stated in a form a finance director reads.' },
  { name: 'Rostered hours against forecast occupancy', how: 'Hours rostered compared with the occupancy forecast when the rota was published. The rota decision, reviewed.' },
  { name: 'Payroll variance to budget', how: 'In money and percentage, with the reason where you have one.' },
]

export const PAYROLL_REPORT: PlanSection[] = [
  ...purpose(
    'whether you are staffing to demand or to habit.',
    'Monthly, with a weekly rota review.',
    'The spa manager with finance.',
    [
      'Payroll percentage on its own is a blunt figure. Read it with revenue per labour hour, or a quiet month looks like a staffing failure and a busy one hides real waste.',
      'Rostered hours against forecast occupancy is the line that changes behaviour. It compares the decision with the information available when it was made, which is the only fair way to review a rota.',
      'Persistent overtime with spare rostered capacity elsewhere in the week is a rota shape problem, not a demand problem.',
      'Agency cost should be read as an hourly rate against your own. It is often cheaper than it feels and more expensive than it looks.',
      'This report only works connected to the pace report. Staffing decisions taken without forward occupancy are guesses with a spreadsheet attached.',
    ],
  ),
  figures('Payroll and productivity', 'What you paid for, what it produced, and what you had planned.', PAYROLL),
  definitions(PAYROLL),
  ...actionsBlock(),
]

const PL: Metric[] = [
  { name: 'Treatment revenue', how: 'Net, as on the daily trading report. The two must agree or one of them is wrong.' },
  { name: 'Retail revenue', how: 'Net retail sales.' },
  { name: 'Membership revenue', how: 'Recognised in the period.' },
  { name: 'Other income', how: 'Everything else, itemised where it is material.' },
  { name: 'Total revenue', how: 'The sum of the above.' },
  { name: 'Cost of sales, retail', how: 'Cost of retail goods sold. Not stock purchased.' },
  { name: 'Cost of sales, treatment products', how: 'Product consumed in treatment. The line most often left out entirely.' },
  { name: 'Gross profit', how: 'Total revenue less cost of sales, in money and percentage.' },
  { name: 'Payroll', how: 'As on the payroll report, including on-costs.' },
  { name: 'Commission', how: 'Paid on treatments, retail and membership. Shown separately from wages.' },
  { name: 'Laundry and linen', how: 'Including hire and replacement. Small, predictable, and a good early warning of volume drift.' },
  { name: 'Consumables', how: 'Amenities, cleaning materials, chemicals and back bar not charged to treatment.' },
  { name: 'Utilities', how: 'Where they are separately metered or apportioned. State the apportionment basis and keep it.' },
  { name: 'Maintenance and repairs', how: 'Planned and reactive shown separately. A rising reactive share is a capital conversation coming.' },
  { name: 'Marketing', how: 'Campaign and agency spend. Third party commission does not belong here.' },
  { name: 'Other operating expenses', how: 'Itemised where material, with a note on anything unusual.' },
  { name: 'Gross operating profit', how: 'Total revenue less all of the above. The figure the business is judged on.' },
  { name: 'GOP margin', how: 'Gross operating profit as a percentage of total revenue.' },
  { name: 'Variance to budget', how: 'For every line, in money and percentage, with commentary on anything material.' },
]

export const PL_REPORT: PlanSection[] = [
  ...purpose(
    'what the department actually made, and where it went.',
    'Monthly.',
    'Finance with the spa manager.',
    [
      'Treatment product cost is the line most often missing from a spa profit and loss, and it is usually several per cent of revenue.',
      'Show planned and reactive maintenance separately. A rising reactive share is the clearest early signal of capital expenditure you have not budgeted for.',
      'Third party commission belongs in cost of sale, not marketing. In marketing it looks like a choice; in cost of sale it looks like what it is.',
      'Read the variance column against the capacity report, not on its own. Beating budget in a half-empty spa is a budget finding, not a performance one.',
      'Apportionment bases for shared costs should be agreed once and written down. Changing them mid-year makes the year-on-year comparison worthless.',
    ],
  ),
  figures('Departmental profit and loss', 'Every line, against last period, last year and budget.', PL),
  definitions(PL),
  ...actionsBlock(),
]

const STOCK: Metric[] = [
  { name: 'Opening stock at cost', how: 'Retail and professional stock separately. They behave differently and should never be pooled.' },
  { name: 'Purchases', how: 'Goods received in the period at cost, whether or not invoiced.' },
  { name: 'Retail cost of goods sold', how: 'Cost of the retail actually sold.' },
  { name: 'Professional usage', how: 'Product consumed in treatment at cost. Compare it against treatments delivered.' },
  { name: 'Usage per treatment', how: 'Professional usage divided by treatments delivered. A drifting figure is either waste or a stock leak.' },
  { name: 'Closing stock at cost', how: 'Counted, not calculated. A calculated closing stock cannot find a discrepancy.' },
  { name: 'Discrepancy', how: 'Expected closing stock less counted closing stock, in money and as a percentage of purchases.' },
  { name: 'Wastage and breakage', how: 'Recorded losses with the reason. Unrecorded losses appear as discrepancy.' },
  { name: 'Testers and samples', how: 'Product used for sampling at cost. A legitimate marketing cost and a common hiding place.' },
  { name: 'Obsolete and discontinued stock', how: 'Value of stock that will not sell at full price, with a plan for each line.' },
  { name: 'Stock value against a month of sales', how: 'Closing retail stock at cost compared with a month of retail cost of sales. More than one is usually too much.' },
  { name: 'Lines out of stock', how: 'Best sellers unavailable during the period, with the days lost. The invisible cost of holding too little of the right thing.' },
]

export const STOCK_REPORT: PlanSection[] = [
  ...purpose(
    'whether stock is under control, and how much cash is asleep on the shelf.',
    'Monthly, with a full count at least quarterly.',
    'Retail lead with finance.',
    [
      'Count the closing stock. A calculated figure will always reconcile and will never find anything.',
      'Usage per treatment is the most useful line here. It drifts slowly, and when it drifts it is either waste, over-application or product walking out.',
      'Retail and professional stock must be kept apart. Pooling them hides both a retail cash problem and a treatment cost problem at the same time.',
      'Obsolete stock is a decision, not a condition. Every line on that list needs a plan: promote, bundle, use in treatment, or write off.',
      'Out-of-stock best sellers cost more than slow movers do. Measure both.',
    ],
  ),
  figures('Stock and inventory', 'Opening, purchases, usage, closing, and the gap between expected and counted.', STOCK),
  definitions(STOCK),
  ...actionsBlock(),
]
