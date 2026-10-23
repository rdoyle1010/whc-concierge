import type { PlanSection } from '../plan-types'
import { figures, definitions, purpose, actionsBlock, type Metric } from './shape'

// Treatments, therapists, retail and membership. What is actually earning.

const TREATMENT: Metric[] = [
  { name: 'Treatments delivered, by treatment', how: 'Count of each treatment completed in the period.' },
  { name: 'Revenue, by treatment', how: 'Net revenue for each treatment. Package redemptions at the allocated value, not at full list.' },
  { name: 'Average achieved price', how: 'Revenue divided by count. This is almost never the menu price, and the gap is the discounting conversation.' },
  { name: 'Duration', how: 'Scheduled minutes including changeover. A sixty minute treatment in a seventy-five minute slot is a seventy-five minute treatment commercially.' },
  { name: 'Revenue per hour, by treatment', how: 'Achieved price divided by slot hours. The number that reorders a menu.' },
  { name: 'Product cost', how: 'Cost of product consumed per treatment. Estimate it properly once rather than guess it monthly.' },
  { name: 'Therapist cost', how: 'Wage cost for the slot, including on-costs. Commission included where it is paid per treatment.' },
  { name: 'Contribution per treatment', how: 'Achieved price less product and therapist cost. The only line that tells you whether a treatment is worth having on the menu.' },
  { name: 'Contribution per hour', how: 'Contribution divided by slot hours. Rank the menu by this and half of it will surprise you.' },
  { name: 'Share of treatments delivered', how: 'Each treatment as a percentage of the total, so popularity and profitability sit side by side.' },
]

export const TREATMENT_REPORT: PlanSection[] = [
  ...purpose(
    'which treatments to keep, reprice, reposition or take off the menu.',
    'Monthly.',
    'The spa manager with finance.',
    [
      'The point of this report is the gap between popular and profitable. A signature treatment can be the most booked thing you do and the least worth doing.',
      'Rank by contribution per hour, never by revenue. A ninety minute treatment at a hundred and twenty pounds can earn less per hour than a thirty minute add-on.',
      'A high achieved price with low volume is a positioning question. Low achieved price with high volume is usually a discounting one.',
      'Product cost is the line most often guessed. Measure it once for each treatment and it will hold for a year.',
      'Before removing a treatment, check what it leads to. Some low-contribution treatments are how members and course bookings start.',
    ],
  ),
  figures('By treatment', 'One row per treatment on the menu. Add rows as needed.', TREATMENT),
  definitions(TREATMENT),
  ...actionsBlock(),
]

const THERAPIST: Metric[] = [
  { name: 'Hours rostered', how: 'Contracted and rostered hours in the period, including overtime worked.' },
  { name: 'Hours available for treatment', how: 'Rostered hours less breaks, training, meetings and allocated non-treatment duties.' },
  { name: 'Treatment hours sold', how: 'Delivered treatment time. Changeover is not sold time.' },
  { name: 'Utilisation against rostered', how: 'Sold hours divided by rostered hours. The commercial figure: it includes time you paid for and did not sell.' },
  { name: 'Utilisation against available', how: 'Sold hours divided by available hours. The fairness figure: it is the one to use in a performance conversation.' },
  { name: 'Treatment revenue', how: 'Net treatment revenue delivered by this therapist.' },
  { name: 'Revenue per rostered hour', how: 'Total revenue including retail divided by rostered hours. The single best measure of a therapist commercially.' },
  { name: 'Retail sales', how: 'Retail revenue attributed to this therapist, at the point the product was recommended.' },
  { name: 'Retail capture rate', how: 'Their guests who bought retail divided by their guests treated.' },
  { name: 'Rebooking rate', how: 'Guests who left with another booking divided by guests treated. The number that compounds.' },
  { name: 'Upgrade and add-on rate', how: 'Treatments where an upgrade or add-on was taken, as a percentage of their treatments.' },
  { name: 'Guest feedback score', how: 'Average score or rating for their treatments in the period, with the count it is based on.' },
  { name: 'Complaints or service recoveries', how: 'Count in the period. Read alongside volume: the busiest therapist will usually have the most.' },
]

export const THERAPIST_REPORT: PlanSection[] = [
  ...purpose(
    'who to develop, who to rota when, and what good actually looks like in this spa.',
    'Monthly, with a weekly utilisation view.',
    'The spa manager.',
    [
      'Use utilisation against available hours in any conversation with a person. Utilisation against rostered hours is a management figure about rota decisions, and holding a therapist to it is holding them to somebody else’s mistake.',
      'Revenue per rostered hour is the fairest single ranking. It rewards the therapist who sells retail and rebooks over the one who simply has the busiest column.',
      'A high utilisation and low rebooking rate is a therapist who is working hard on a treadmill somebody else is filling.',
      'Low utilisation across the whole team is a demand problem. Low utilisation for one person is a rota, skill or preference problem, and the three have different answers.',
      'Never publish this as a league table on a wall. Use it in one-to-ones, or it becomes a reason to stop recording things honestly.',
    ],
  ),
  figures('By therapist', 'One row per therapist. Read the utilisation pair together, never one alone.', THERAPIST),
  definitions(THERAPIST),
  ...actionsBlock(),
]

const RETAIL: Metric[] = [
  { name: 'Retail revenue', how: 'Net retail sales in the period. Never includes product consumed in treatment.' },
  { name: 'Retail capture rate', how: 'Guests who bought divided by guests treated.' },
  { name: 'Average retail spend per buying guest', how: 'Retail revenue divided by guests who bought something.' },
  { name: 'Retail spend per treated guest', how: 'Retail revenue divided by all guests treated. The honest version, and the one to track.' },
  { name: 'Retail as a percentage of treatment revenue', how: 'The industry comparison. Ten per cent is common, twenty is good, thirty is a retail operation.' },
  { name: 'Sales by therapist', how: 'Retail revenue attributed to each therapist. Kept here as well as on their own report so the pattern is visible.' },
  { name: 'Sales by brand', how: 'Revenue by product house. Read against the shelf space and the trade terms each one has.' },
  { name: 'Best sellers', how: 'Top lines by units and by revenue. They are rarely the same list.' },
  { name: 'Slow movers', how: 'Lines with no sale in the period, with the stock value sitting in them.' },
  { name: 'Gross margin', how: 'Retail revenue less cost of goods sold, in money and percentage.' },
  { name: 'Stock turn', how: 'Cost of goods sold divided by average stock at cost, annualised. Under four is money asleep on a shelf.' },
  { name: 'Stock ageing', how: 'Stock value by age band. Anything over a year is usually never going to sell at full price.' },
  { name: 'Stock value held', how: 'Closing retail stock at cost. Compare it to a month of retail revenue: more than that is too much.' },
]

export const RETAIL_REPORT: PlanSection[] = [
  ...purpose(
    'what to stock, what to stop, and whether retail is a business or a display.',
    'Monthly.',
    'Retail lead or the spa manager.',
    [
      'Capture rate and spend per treated guest are the two that matter. Average spend per buying guest flatters you by ignoring everybody who bought nothing.',
      'Retail at less than a tenth of treatment revenue usually means it is a display rather than a business.',
      'Slow movers and stock ageing are where the cash is. A spa with a healthy margin and four months of stock on the shelf has a cash problem it has not noticed.',
      'Sales by therapist varies more than any other line in a spa. The gap between the best and the worst is a training opportunity worth real money.',
      'Before adding a brand, look at the stock turn of the ones you have. Shelf space is finite and cash tied up in it is not.',
    ],
  ),
  figures('Retail performance', 'Revenue, conversion, margin and what the stock is doing.', RETAIL),
  definitions(RETAIL),
  ...actionsBlock(),
]

const MEMBERSHIP: Metric[] = [
  { name: 'Total members', how: 'Everybody on a live contract at the period end, including frozen members shown separately.' },
  { name: 'Active members', how: 'Members who used the facility at least once in the period. The difference between this and total members is your churn warning.' },
  { name: 'New joins', how: 'Contracts started in the period, with the source they came from.' },
  { name: 'Cancellations', how: 'Contracts ended in the period, with the stated reason where you have one.' },
  { name: 'Freezes', how: 'Members on hold. A freeze is a cancellation that has not happened yet more often than it is a pause.' },
  { name: 'Net movement', how: 'Joins less cancellations. The only membership number worth putting on a dashboard.' },
  { name: 'Churn rate', how: 'Cancellations divided by opening members, as a percentage, annualised for comparison.' },
  { name: 'Monthly recurring revenue', how: 'Sum of live monthly contract values at the period end. Joining fees are not recurring and are shown separately.' },
  { name: 'Average member value', how: 'Recurring revenue divided by members. Track the trend: a falling average with rising members is discounting.' },
  { name: 'Member utilisation', how: 'Visits in the period divided by members. Very low utilisation is churn coming; very high may be a capacity problem.' },
  { name: 'Secondary spend per member', how: 'Treatment, retail and other spend by members, divided by members. This is where membership becomes profitable.' },
  { name: 'Member treatment spend', how: 'Treatment revenue from members. Shown separately because it consumes peak capacity at a member rate.' },
  { name: 'Member profitability', how: 'Recurring revenue plus secondary spend, less the cost to serve. Estimate cost to serve once and hold it.' },
  { name: 'Average membership tenure', how: 'Average months held by members who left in the period. The honest measure of whether the proposition holds.' },
]

export const MEMBERSHIP_REPORT: PlanSection[] = [
  ...purpose(
    'whether membership is growing, whether it is profitable, and who is about to leave.',
    'Monthly.',
    'Membership lead or the spa manager.',
    [
      'Total members is a vanity figure. Net movement and churn are the business.',
      'The gap between total and active members is the best leaving indicator a spa has. A member who has not visited in six weeks has usually already decided.',
      'Freezes should be read as cancellations until proven otherwise, and chased as such.',
      'Membership rarely pays on the subscription alone. Secondary spend per member is where it becomes worth the capacity it consumes.',
      'If member treatment spend fills peak hours at member rates while full-rate demand is turned away, membership is costing you money while appearing to make it.',
    ],
  ),
  figures('Membership', 'Movement, revenue and behaviour. Read net movement and the active gap first.', MEMBERSHIP),
  definitions(MEMBERSHIP),
  ...actionsBlock(),
]
