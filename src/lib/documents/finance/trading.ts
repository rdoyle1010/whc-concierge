import type { PlanSection } from '../plan-types'
import { figures, definitions, purpose, actionsBlock, type Metric } from './shape'

// Trading, capacity and pace. The three that decide the week.

const DAILY: Metric[] = [
  { name: 'Treatment revenue', how: 'Net treatment revenue in the period, excluding retail, membership and any service charge. Exclude VAT if registered.' },
  { name: 'Retail revenue', how: 'Net retail sales. Products used in treatment are a cost of sale and are never counted here.' },
  { name: 'Membership revenue', how: 'Membership income recognised in the period, not cash collected. Joining fees shown separately.' },
  { name: 'Fitness and class revenue', how: 'Personal training, classes and studio income, excluding anything already counted in membership.' },
  { name: 'Other income', how: 'Day passes, hire, food and beverage, gift voucher uplift on redemption, and anything not above.' },
  { name: 'Total revenue', how: 'The sum of the lines above. This is the only total that should ever be quoted as revenue.' },
  { name: 'Total guests', how: 'Individual guests through the door, counted once each however many treatments they had.' },
  { name: 'Treatments delivered', how: 'Completed treatments. Cancelled, no-show and comped treatments are excluded and counted separately.' },
  { name: 'Average treatment value', how: 'Treatment revenue divided by treatments delivered. Not divided by guests.' },
  { name: 'Treatment room utilisation', how: 'Treatment hours sold divided by treatment hours available. Available means the room was open and staffable.' },
  { name: 'Therapist utilisation', how: 'Treatment hours sold divided by therapist hours rostered. Show both this and the available-hours version.' },
  { name: 'Retail capture rate', how: 'Guests who bought retail divided by guests treated, as a percentage.' },
  { name: 'Retail spend per guest', how: 'Retail revenue divided by guests treated, including the ones who bought nothing.' },
  { name: 'No-shows', how: 'Bookings not attended and not cancelled, as a count and as a percentage of bookings.' },
  { name: 'Cancellations', how: 'Split inside notice period and outside it. They are different problems with different answers.' },
]

export const DAILY_TRADING: PlanSection[] = [
  ...purpose(
    'whether yesterday was good, and what to change today while it can still be changed.',
    'Daily, before the morning briefing.',
    'Reception or the duty manager.',
    [
      'Revenue up with utilisation flat means you sold the same time for more money. That is the good version.',
      'Revenue up with utilisation up and average treatment value down means you are busier and poorer. This is the most common way a spa grows revenue and loses margin.',
      'A no-show rate above a few per cent is a deposit and confirmation problem, not a guest problem.',
      'Retail capture below a fifth of treated guests is a therapist conversation, not a merchandising one.',
      'A single day is noise. Read it as a running week, and read the week against the same week last year.',
    ],
  ),
  figures('Yesterday, by line', 'Every figure net, and every comparison filled in. A number in one column is a fact and not yet a finding.', DAILY),
  definitions(DAILY),
  ...actionsBlock(),
]

const CAPACITY: Metric[] = [
  { name: 'RevPATH', how: 'Total revenue divided by treatment hours available. Revenue per available treatment hour: the single most useful number a spa has and the one most rarely produced.' },
  { name: 'Revenue per treatment room', how: 'Total treatment revenue divided by the number of rooms in service. Compare rooms against each other, not only against budget.' },
  { name: 'Revenue per therapist hour', how: 'Total revenue attributable to therapists divided by therapist hours rostered. Include their retail.' },
  { name: 'Treatment hours available', how: 'Rooms in service multiplied by opening hours, less any planned closure. Staffing does not reduce it: unstaffed capacity is still capacity you failed to sell.' },
  { name: 'Treatment hours sold', how: 'Delivered treatment time only. Changeover and set-up time is not sold time.' },
  { name: 'Occupancy by hour', how: 'Hours sold divided by hours available, by hour of the day. A day at sixty per cent is usually two hours at ninety-five and six at forty.' },
  { name: 'Occupancy by day of week', how: 'The same, by day. This is where pricing and rota decisions actually live.' },
  { name: 'Peak occupancy', how: 'Occupancy in the hours you have defined as peak. Define them once and keep the definition.' },
  { name: 'Off-peak occupancy', how: 'Occupancy outside those hours. The gap between the two is your yield opportunity.' },
  { name: 'Unsold capacity', how: 'Hours available less hours sold, in hours. Show it as hours, not only as a percentage: hours are a thing people act on.' },
  { name: 'Lost revenue opportunity', how: 'Unsold hours multiplied by average revenue per sold hour. Not a forecast, an order of magnitude, and it is usually larger than anybody expects.' },
  { name: 'Revenue against budget', how: 'Variance in money and in percentage. Kept on this report so capacity and budget are read together rather than in two meetings.' },
]

export const CAPACITY_REPORT: PlanSection[] = [
  ...purpose(
    'where the capacity you are paying for went, and what it would be worth to fill it.',
    'Weekly, and monthly in summary.',
    'The spa manager.',
    [
      'This is the important one. Revenue against budget tells you whether the forecast was right. Revenue against capacity tells you how the business is actually performing.',
      'A spa can beat budget every month and still be running at half its capacity, because the budget was built from last year, which was also half.',
      'RevPATH falling while revenue rises means you have added capacity faster than demand. That is a pricing and marketing problem, not an operational one.',
      'Occupancy by hour is where the money is. Two hours at ninety-five per cent and six at forty is a rota and a pricing problem, not a busy spa.',
      'Lost revenue opportunity is deliberately blunt. It is the number that makes a marketing spend or an off-peak rate easy to argue for.',
    ],
  ),
  figures('Revenue against the capacity you have', 'Available hours, sold hours, and what the gap between them is worth.', CAPACITY),
  {
    part: 'The figures',
    heading: 'Occupancy by hour and by day',
    intro:
      'The grid that changes rotas. Fill in occupancy as a percentage for each hour you are open. A day read as '
      + 'a single average hides the two hours that are turning guests away and the six that are paying wages to '
      + 'stand still.',
    table: {
      columns: ['Hour', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      rows: Array.from({ length: 14 }, () => ['', '', '', '', '', '', '', '']),
      fillable: true,
    },
  },
  definitions(CAPACITY),
  ...actionsBlock(),
]

const PACE: Metric[] = [
  { name: 'Treatment room occupancy, next 7 days', how: 'Hours booked divided by hours available for the period ahead, as at today.' },
  { name: 'Treatment room occupancy, next 14 days', how: 'The same, for fourteen days.' },
  { name: 'Treatment room occupancy, next 30 days', how: 'The same, for thirty days.' },
  { name: 'Treatment room occupancy, next 90 days', how: 'The same, for ninety days. Read for shape rather than for level.' },
  { name: 'Same point last year', how: 'The equivalent figure at the same number of days out last year. Pace is only meaningful against a prior pace.' },
  { name: 'Therapist hours rostered against booked', how: 'Rostered hours against booked hours for each period ahead. This is the staffing decision.' },
  { name: 'Bookings taken this week', how: 'New bookings created in the period, whenever they are for. This is the demand signal; occupancy is the result.' },
  { name: 'Package and voucher bookings', how: 'Bookings redeeming a package or voucher. Revenue was recognised earlier and the capacity is consumed now.' },
  { name: 'Group and corporate bookings', how: 'Confirmed group business ahead, with the capacity it removes from general sale.' },
  { name: 'Member bookings ahead', how: 'Bookings held by members. High member pace on peak hours is a yield decision waiting to be taken.' },
  { name: 'Unsold peak hours ahead', how: 'Peak hours still available in the next fourteen days. The most actionable single number on this report.' },
]

export const PACE_REPORT: PlanSection[] = [
  ...purpose(
    'what to price, staff and promote, while there is still time to change the outcome.',
    'Weekly, on the same day each week.',
    'The spa manager, with reception.',
    [
      'Every other report in this pack is history. This is the only one you can still act on.',
      'Pace is read against the same point last year, not against the final figure. Sixty per cent at fourteen days out means nothing until you know it was forty-five last year.',
      'A soft seven-day pace is a marketing and offer decision this week. A soft ninety-day pace is a positioning decision this quarter. They are not the same problem and should not get the same response.',
      'Strong pace is not automatically good news. Peak filled at member rates and off-peak empty is a yield problem dressed as a busy diary.',
      'If rostered hours exceed booked hours by a wide margin at seven days out, that is payroll you have already committed to.',
    ],
  ),
  figures('The diary ahead', 'As at today, for each window. Fill in the same-point-last-year column or the rest is decoration.', PACE),
  definitions(PACE),
  ...actionsBlock(),
]
