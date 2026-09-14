import type { PlanSection } from '../plan-types'
import { DAILY_TRADING, CAPACITY_REPORT, PACE_REPORT } from './trading'
import { TREATMENT_REPORT, THERAPIST_REPORT, RETAIL_REPORT, MEMBERSHIP_REPORT } from './performance'
import { GUEST_REPORT, CHANNEL_REPORT, DISCOUNT_REPORT, VOUCHER_REPORT } from './commercial'
import { PAYROLL_REPORT, PL_REPORT, STOCK_REPORT } from './cost-and-control'
import { COMPLAINTS_REPORT, QUALITY_REPORT, SAFETY_REPORT, MARKETING_REPORT } from './evidence'
import { DIRECTOR_DASHBOARD, ACTION_TRACKER } from './dashboard'

// The reporting pack, in the order it is read.
//
// The dashboard first, because that is the only page most people will open,
// and then the reports it drills into. Sold as a pack rather than singly for
// a reason that is not commercial: the measure definitions only work if every
// report uses the same ones. A spa that buys the therapist report and not the
// capacity report will compute utilisation two ways within a quarter, and the
// argument that follows is the exact thing this pack exists to end.

export type ReportEntry = {
  reference: string
  title: string
  department: string
  intro: string
  cadence: string
  sections: PlanSection[]
}

export const FINANCE_REGISTER: ReportEntry[] = [
  {
    reference: 'FIN-DASHBOARD-RPT-601',
    title: 'Spa Director Dashboard',
    department: 'FINANCE TEAM',
    intro:
      'One page, fifteen headline measures, each with the report behind it. Eighteen reports is the right '
      + 'amount of reporting and the wrong amount of reading.',
    cadence: 'Monthly',
    sections: DIRECTOR_DASHBOARD,
  },
  {
    reference: 'FIN-TRADING-RPT-602',
    title: 'Daily Trading Report',
    department: 'FINANCE TEAM',
    intro:
      'Revenue by line, guests, utilisation, average treatment value, retail conversion, no-shows and '
      + 'cancellations. Yesterday, in time to change today.',
    cadence: 'Daily',
    sections: DAILY_TRADING,
  },
  {
    reference: 'FIN-CAPACITY-RPT-603',
    title: 'Revenue and Capacity Report',
    department: 'FINANCE TEAM',
    intro:
      'Revenue against the capacity you are paying for, not against a budget built from last year. RevPATH, '
      + 'revenue per room and per therapist hour, occupancy by hour and day, and what the unsold hours are worth.',
    cadence: 'Weekly',
    sections: CAPACITY_REPORT,
  },
  {
    reference: 'FIN-PACE-RPT-604',
    title: 'Forward Booking and Pace Report',
    department: 'FINANCE TEAM',
    intro:
      'The next seven, fourteen, thirty and ninety days against the same point last year. The only report in '
      + 'the pack you can still act on.',
    cadence: 'Weekly',
    sections: PACE_REPORT,
  },
  {
    reference: 'FIN-TREATMENT-RPT-605',
    title: 'Treatment Performance Report',
    department: 'FINANCE TEAM',
    intro:
      'Revenue, volume, achieved price, product and therapist cost, and contribution per hour by treatment. '
      + 'It exposes the treatments that look popular and earn almost nothing.',
    cadence: 'Monthly',
    sections: TREATMENT_REPORT,
  },
  {
    reference: 'FIN-THERAPIST-RPT-606',
    title: 'Therapist Productivity Report',
    department: 'FINANCE TEAM',
    intro:
      'Utilisation measured both ways, revenue per rostered hour, retail, rebooking, upgrades and feedback. '
      + 'With a note on which figure belongs in a performance conversation and which does not.',
    cadence: 'Monthly',
    sections: THERAPIST_REPORT,
  },
  {
    reference: 'FIN-RETAIL-RPT-607',
    title: 'Retail Report',
    department: 'FINANCE TEAM',
    intro:
      'Capture rate, spend per treated guest, margin, sales by therapist and by brand, stock turn and ageing. '
      + 'Whether retail is a business or a display.',
    cadence: 'Monthly',
    sections: RETAIL_REPORT,
  },
  {
    reference: 'FIN-MEMBERSHIP-RPT-608',
    title: 'Membership Dashboard',
    department: 'FINANCE TEAM',
    intro:
      'Movement, churn, recurring revenue, utilisation, secondary spend and member profitability, including '
      + 'the peak capacity membership consumes at member rates.',
    cadence: 'Monthly',
    sections: MEMBERSHIP_REPORT,
  },
  {
    reference: 'FIN-GUEST-RPT-609',
    title: 'Guest and CRM Report',
    department: 'FINANCE TEAM',
    intro:
      'New against returning, frequency, spend, booking source, rebooking, complaints, satisfaction and the '
      + 'lapsed guest list, which is the most valuable list a spa owns and the least used.',
    cadence: 'Monthly',
    sections: GUEST_REPORT,
  },
  {
    reference: 'FIN-CHANNEL-RPT-610',
    title: 'Commercial Channel Report',
    department: 'FINANCE TEAM',
    intro:
      'Hotel guest, local, member, package, corporate and third party, compared on net revenue per hour of '
      + 'capacity consumed rather than on visit count.',
    cadence: 'Monthly',
    sections: CHANNEL_REPORT,
  },
  {
    reference: 'FIN-DISCOUNT-RPT-611',
    title: 'Discount and Yield Report',
    department: 'FINANCE TEAM',
    intro:
      'Full price against discounted revenue, discount depth, promotions, complimentary treatments, upgrades '
      + 'and yield achieved. Including discount by approver, which is uncomfortable and effective.',
    cadence: 'Monthly',
    sections: DISCOUNT_REPORT,
  },
  {
    reference: 'FIN-VOUCHER-RPT-612',
    title: 'Gift Voucher Report',
    department: 'FINANCE TEAM',
    intro:
      'Sales, redemptions, outstanding liability and its ageing, expiry, uplift on redemption and the peak '
      + 'capacity redemptions consume.',
    cadence: 'Monthly',
    sections: VOUCHER_REPORT,
  },
  {
    reference: 'FIN-PAYROLL-RPT-613',
    title: 'Payroll and Labour Productivity Report',
    department: 'FINANCE TEAM',
    intro:
      'Payroll percentage, wage cost by group, agency and overtime, revenue per labour hour, and rostered '
      + 'hours against the occupancy forecast the rota was built on.',
    cadence: 'Monthly',
    sections: PAYROLL_REPORT,
  },
  {
    reference: 'FIN-PANDL-RPT-614',
    title: 'Departmental Profit and Loss',
    department: 'FINANCE TEAM',
    intro:
      'Revenue, cost of sales including treatment product, payroll, commission, laundry, consumables, '
      + 'maintenance and marketing, down to gross operating profit and margin.',
    cadence: 'Monthly',
    sections: PL_REPORT,
  },
  {
    reference: 'FIN-STOCK-RPT-615',
    title: 'Stock and Inventory Report',
    department: 'FINANCE TEAM',
    intro:
      'Opening, purchases, usage, closing and discrepancy, with retail and professional stock kept apart and '
      + 'usage per treatment tracked for drift.',
    cadence: 'Monthly',
    sections: STOCK_REPORT,
  },
  {
    reference: 'FIN-COMPLAINTS-RPT-616',
    title: 'Complaints and Service Recovery Report',
    department: 'FINANCE TEAM',
    intro:
      'Type, area, root cause, cost of recovery, repeat issues and whether the guest came back. Built to find '
      + 'patterns rather than to record incidents.',
    cadence: 'Monthly',
    sections: COMPLAINTS_REPORT,
  },
  {
    reference: 'FIN-QUALITY-RPT-617',
    title: 'Quality and Standards Report',
    department: 'FINANCE TEAM',
    intro:
      'Audit and mystery shopper scores, treatment audits, cleanliness, checklist completion and the '
      + 'verification rate that keeps the whole checklist system honest.',
    cadence: 'Monthly',
    sections: QUALITY_REPORT,
  },
  {
    reference: 'FIN-SAFETY-RPT-618',
    title: 'Health, Safety and Compliance Dashboard',
    department: 'FINANCE TEAM',
    intro:
      'Accidents, near misses, water testing, chemicals, equipment faults, planned maintenance, risk '
      + 'assessment reviews and certification expiry. Evidence, produced whether or not anybody asks.',
    cadence: 'Monthly',
    sections: SAFETY_REPORT,
  },
  {
    reference: 'FIN-MARKETING-RPT-619',
    title: 'Marketing Performance Report',
    department: 'FINANCE TEAM',
    intro:
      'Spend, bookings and revenue generated, cost per new guest acquired against the twelve month value of '
      + 'guests acquired a year ago, and off-peak campaign performance judged on incremental revenue.',
    cadence: 'Monthly',
    sections: MARKETING_REPORT,
  },
  {
    reference: 'FIN-ACTIONS-RPT-620',
    title: 'Management Action Tracker',
    department: 'FINANCE TEAM',
    intro:
      'Not a financial report, and the one that decides whether the others were worth producing. Action, '
      + 'owner, date, expected impact, and the carry-over count that tells you when to drop something.',
    cadence: 'Continuous',
    sections: ACTION_TRACKER,
  },
]
