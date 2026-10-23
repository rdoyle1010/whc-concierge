import type { PlanSection } from '../plan-types'
import { figures, definitions, purpose, actionsBlock, type Metric } from './shape'

// Guests, channels, discounting and vouchers. Where the margin quietly goes.

const GUEST: Metric[] = [
  { name: 'Total guests', how: 'Individual guests in the period, counted once each.' },
  { name: 'New guests', how: 'First visit ever. Not first visit this year.' },
  { name: 'Returning guests', how: 'Guests with a prior visit. New plus returning must equal total.' },
  { name: 'Repeat rate', how: 'Returning guests divided by total guests. The health of the business in one number.' },
  { name: 'Visit frequency', how: 'Visits divided by individual guests, for the period and rolling twelve months.' },
  { name: 'Average spend per guest', how: 'Total revenue divided by guests, including everything they bought.' },
  { name: 'Rebooking rate at departure', how: 'Guests leaving with a future booking, divided by guests treated. Measured at the desk, not later.' },
  { name: 'Booking source', how: 'Split by channel: direct, telephone, walk-in, website, hotel, third party.' },
  { name: 'Treatment preference', how: 'Most booked treatments by guest type. It tells you what to promote to whom.' },
  { name: 'Lapsed guests', how: 'Guests with no visit in the period you define as lapsed, usually nine or twelve months, with their historic value.' },
  { name: 'Complaints', how: 'Count and rate per thousand guests, so it can be compared across months of different sizes.' },
  { name: 'Satisfaction or net promoter score', how: 'The score, the response count, and the response rate. A score on eleven responses is an anecdote.' },
  { name: 'VIP activity', how: 'Visits and spend by guests you have flagged as VIP, and whether anybody spoke to them.' },
]

export const GUEST_REPORT: PlanSection[] = [
  ...purpose(
    'whether guests come back, which ones are worth keeping, and who has quietly stopped coming.',
    'Monthly.',
    'The spa manager with reception.',
    [
      'Repeat rate is the number that predicts next year. Everything else on this report explains it.',
      'A spa can hit budget every month on new guests alone and be dying. Acquisition covers a leaking bucket for about eighteen months.',
      'Rebooking at departure is the single cheapest thing to improve in a spa and it is almost always the therapist conversation, not the offer.',
      'The lapsed guest list is the most valuable list you own and the least often used. It is people who already liked you.',
      'Read satisfaction with the response count beside it, always. A nine out of ten on eleven responses is not a nine out of ten.',
    ],
  ),
  figures('Guests', 'Who came, whether they had been before, and whether they are coming back.', GUEST),
  definitions(GUEST),
  ...actionsBlock(),
]

const CHANNEL: Metric[] = [
  { name: 'Revenue by guest type', how: 'Hotel guest, local day guest, member, package, corporate and third party. Every booking belongs to exactly one.' },
  { name: 'Guests by type', how: 'Count by the same split, so revenue and volume can be compared.' },
  { name: 'Average spend by type', how: 'Revenue divided by guests, within each type.' },
  { name: 'Capacity consumed by type', how: 'Treatment hours used by each type, as a percentage of hours sold. The line most often missing and most often decisive.' },
  { name: 'Peak capacity consumed by type', how: 'The same, restricted to peak hours. This is where the real cost of a low-rate channel shows up.' },
  { name: 'Commission or cost of sale by type', how: 'Third party commission, hotel transfer rates, corporate discounts and agency fees.' },
  { name: 'Net revenue by type', how: 'Revenue less commission and cost of sale. The figure to compare channels on.' },
  { name: 'Net revenue per hour by type', how: 'Net revenue divided by hours consumed. The only fair comparison between a member and a walk-in.' },
  { name: 'Retail attachment by type', how: 'Retail capture and spend within each type. Hotel guests and locals behave very differently.' },
  { name: 'Repeat rate by type', how: 'How often each type comes back. A cheap channel that returns can beat an expensive one that does not.' },
]

export const CHANNEL_REPORT: PlanSection[] = [
  ...purpose(
    'which guest types are actually profitable, rather than which produce the most visits.',
    'Monthly.',
    'The spa manager with finance.',
    [
      'Net revenue per hour of capacity consumed is the whole report. Everything else is working towards it.',
      'A channel producing a third of your visits and a tenth of your net revenue per hour is costing you the capacity you would have sold anyway.',
      'Hotel guest business is often reported at the rate charged to the hotel rather than the rate the guest paid. Use the rate you actually receive.',
      'Third party commission is a cost of sale, not a marketing expense. Reporting it as marketing hides it from this comparison.',
      'Before cutting a low-rate channel, check its repeat rate and its off-peak share. Filling Tuesday at a lower rate is a good trade; filling Saturday at one is not.',
    ],
  ),
  figures('By guest type', 'One row per line, per guest type. Capacity consumed is the column that changes minds.', CHANNEL),
  definitions(CHANNEL),
  ...actionsBlock(),
]

const DISCOUNT: Metric[] = [
  { name: 'Full price revenue', how: 'Revenue at menu rate with no reduction of any kind.' },
  { name: 'Discounted revenue', how: 'Revenue where any reduction was applied, at the value actually received.' },
  { name: 'Discount value given', how: 'Menu value less received value. The money you decided not to charge.' },
  { name: 'Discount as a percentage of potential revenue', how: 'Discount value divided by revenue at menu rate. The headline number.' },
  { name: 'Average discount depth', how: 'Average percentage reduction on discounted bookings. Depth matters more than frequency.' },
  { name: 'Promotional bookings', how: 'Bookings taken on a named promotion, with the revenue and the capacity each consumed.' },
  { name: 'Complimentary treatments', how: 'Count, menu value and reason. Service recovery, marketing and staff treatments shown separately.' },
  { name: 'Upgrades taken', how: 'Count and incremental revenue. The only line on this report that adds rather than subtracts.' },
  { name: 'Package revenue and redemption', how: 'Package revenue recognised, and treatments delivered against packages at allocated value.' },
  { name: 'Discount by approver', how: 'Discount value given, by the person who authorised it. Uncomfortable, and the fastest way to stop the drift.' },
  { name: 'Peak versus off-peak discounting', how: 'Discount value split by peak and off-peak. Discounting peak capacity is giving money away for nothing.' },
  { name: 'Yield achieved', how: 'Actual revenue divided by revenue at menu rate for hours sold. One number for how much of your price you kept.' },
]

export const DISCOUNT_REPORT: PlanSection[] = [
  ...purpose(
    'how much of your own price you are keeping, and where it is going instead.',
    'Monthly.',
    'The spa manager with finance.',
    [
      'Most spas bury their margin here and never see it, because a discount is a hundred small decisions and never appears as a line in the accounts.',
      'Peak discounting is the one to stop first. An off-peak rate that fills a Tuesday is yield management; the same rate on a Saturday is a loss with a smile on it.',
      'Discount by approver is deliberately uncomfortable. It is also the fastest way to change behaviour, and it works within one month.',
      'Complimentary treatments given for service recovery should be read with the complaints report. If they are rising together, you have an operational problem, not a generosity problem.',
      'Yield achieved is the single number for this report. Track the trend and put it on the director dashboard.',
    ],
  ),
  figures('Discounting and yield', 'What you could have charged, what you did charge, and who decided.', DISCOUNT),
  definitions(DISCOUNT),
  ...actionsBlock(),
]

const VOUCHER: Metric[] = [
  { name: 'Vouchers sold', how: 'Count and face value issued in the period.' },
  { name: 'Voucher revenue received', how: 'Cash received. Not revenue: it is a liability until redeemed.' },
  { name: 'Vouchers redeemed', how: 'Count and value redeemed in the period, whenever they were sold.' },
  { name: 'Redemption rate', how: 'Value redeemed divided by value issued, measured on a cohort rather than in-period.' },
  { name: 'Outstanding liability', how: 'Face value of unredeemed, unexpired vouchers at the period end. This belongs on the balance sheet.' },
  { name: 'Liability ageing', how: 'Outstanding value by age band, so the expiry profile is visible before it arrives.' },
  { name: 'Expiring within ninety days', how: 'Value expiring soon. A prompt to the holder is good service and converts into a visit.' },
  { name: 'Expired and released', how: 'Value expired in the period and treated as breakage, with the policy applied.' },
  { name: 'Average redemption spend', how: 'Total spend on a redeeming visit, divided by redemptions.' },
  { name: 'Uplift on redemption', how: 'Spend above the voucher value. The whole commercial case for selling vouchers.' },
  { name: 'Unredeemed balances', how: 'Value left on partly redeemed vouchers, and the policy for it.' },
  { name: 'Capacity consumed by redemptions', how: 'Hours used by voucher redemptions, and how many of them fell in peak.' },
]

export const VOUCHER_REPORT: PlanSection[] = [
  ...purpose(
    'what you owe in unredeemed vouchers, and whether redemption earns anything when it comes.',
    'Monthly.',
    'Finance with reception.',
    [
      'A voucher sale is not revenue. It is cash today against an obligation to deliver later, usually in December against a January you had not planned.',
      'Outstanding liability is a real number and belongs on the balance sheet. A spa with a large unreported voucher liability has a problem that only appears when it is redeemed.',
      'Uplift on redemption is the commercial case. If redeeming guests spend nothing above the face value, you have sold treatment time at a discount and deferred it.',
      'Prompting holders before expiry converts liability into a visit and into goodwill, and it costs an email.',
      'Watch the capacity redemptions consume at peak. Christmas vouchers redeemed on February Saturdays displace full-rate demand.',
    ],
  ),
  figures('Gift vouchers', 'Sold, redeemed, outstanding, and what redemption is actually worth.', VOUCHER),
  definitions(VOUCHER),
  ...actionsBlock(),
]
