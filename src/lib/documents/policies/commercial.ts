import type { PolicyEntry } from './types'

// Money and bookings.
//
// These four are where a spa loses money quietly. A cancellation policy
// nobody enforces is not a policy, a refund policy that lives in a manager's
// head produces a different answer every week, and a discount nobody approved
// is a discount nobody is reading. Each of these states the authority
// explicitly, because that is the part that is always missing.

export const COMMERCIAL_POLICIES: PolicyEntry[] = [
  {
    reference: 'FIN-CANCELLATION-POL-821',
    title: 'Cancellation, No-Show and Lateness Policy',
    department: 'RECEPTION TEAM',
    group: 'Money and bookings',
    purpose:
      'To state the notice required to cancel, what happens when it is not given, and who may vary that, so '
      + 'the answer is the same on a Tuesday as on a Saturday.',
    appliesTo: 'Every booking taken by the spa, and everybody who takes one.',
    position: [
      'A treatment slot is the thing being sold. A slot cancelled inside the notice period is usually a slot '
      + 'that cannot be resold, so it is charged for.',
      'The terms are stated at the point of booking, in the confirmation, and are not a surprise on the day. '
      + 'A policy a guest first hears about when they are being charged is unenforceable in practice however '
      + 'clearly it was written.',
      'The policy is applied consistently. An exception made because somebody complained loudly teaches every '
      + 'guest how to get one.',
      'Discretion exists, it belongs to named roles, and it is recorded when used.',
    ],
    rules: [
      {
        area: 'The terms',
        items: [
          'Notice required: [the property states it, by booking type and value].',
          'Cancelled inside notice: [the property states the charge].',
          'No-show: [the property states the charge].',
          'Late arrival: the treatment ends at its booked finish time and is charged in full, because the next guest is already booked.',
          'Where a treatment cannot safely be shortened, it may be declined and charged.',
        ],
      },
      {
        area: 'Making it stick',
        items: [
          'State the terms verbally when the booking is taken, not only in the confirmation.',
          'Send the confirmation in writing with the terms on it, every time.',
          'Hold card details or a deposit where the property requires it, and say so at booking.',
          'Remind at [the interval the property sets] before the appointment.',
          'Where a charge applies, tell the guest before taking it rather than afterwards.',
        ],
      },
      {
        area: 'Discretion',
        items: [
          'Reception may waive up to [the property limit] where the reason is genuine and the guest gave what notice they could.',
          'Anything above that is a duty manager decision.',
          'Bereavement, illness and emergency are waived. This is a commercial policy, not a test of character.',
          'Every waiver is recorded with the reason and who authorised it.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Reception', duty: 'Stating the terms at booking, confirming in writing, applying them consistently.' },
      { role: 'Duty manager', duty: 'Decisions above the reception limit, and recording them.' },
      { role: 'Spa Manager', duty: 'Reviewing waivers monthly and the value of what is not being charged.' },
    ],
    records: [
      'Terms stated at booking and in the written confirmation',
      'Cancellations, no-shows and late arrivals, with the outcome',
      'Waivers with the reason and the authoriser',
      'Monthly value of unrecovered cancellations and no-shows',
    ],
    breach: [
      'Not stating the terms at booking is a service failure and makes the charge unenforceable in practice.',
      'Waiving above your authority is a disciplinary matter.',
      'Applying the policy inconsistently between guests is treated seriously, because it is the thing that makes it collapse.',
    ],
    reviewTriggers: [
      'A rise in no-shows or in waivers',
      'A change to the booking system or to payment handling',
      'Complaints arising from the policy itself rather than from its application',
    ],
  },

  {
    reference: 'FIN-REFUNDS-POL-822',
    title: 'Refunds and Goodwill Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Money and bookings',
    purpose:
      'To state when money is returned, who may return it and how much, so that the same situation produces '
      + 'the same answer whoever is on duty.',
    appliesTo: 'Everybody authorised to take payment or to resolve a complaint.',
    position: [
      'Where we did not deliver what was paid for, we put it right. That is not goodwill, it is the bargain.',
      'Goodwill is different: it is a gesture where we did deliver but the experience fell short. It has limits '
      + 'and it has named authority.',
      'A refund is never the first answer. Fixing the thing, re-treating properly, or rebooking with the right '
      + 'therapist is worth more to the guest and more to us.',
      'Nobody is ever refused a refund they are entitled to because of a target or a month-end.',
    ],
    rules: [
      {
        area: 'Authority',
        items: [
          'Reception: up to [the property limit], for a clear service failure.',
          'Duty manager: up to [the property limit].',
          'Spa Manager: up to [the property limit].',
          'Spa Director: anything above, and anything involving injury, an allegation or a legal claim.',
          'Nobody authorises a refund on their own booking or for a member of their own family.',
        ],
      },
      {
        area: 'How',
        items: [
          'Refund to the original payment method. Cash is not given back for a card payment.',
          'Record the reason against the booking, using the reason codes the property uses rather than free text.',
          'A partial refund is explained in terms of what was and was not delivered.',
          'Where a re-treatment is offered instead, book it before the guest leaves.',
        ],
      },
      {
        area: 'Gift vouchers and packages',
        items: [
          'Vouchers are refunded only as [the property states], and the terms are printed on the voucher.',
          'For a package part-delivered, refund the undelivered elements at menu price rather than at package price.',
          'Deposits follow the cancellation policy rather than this one.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Everybody taking payment', duty: 'Working inside their authority and recording the reason.' },
      { role: 'Duty manager', duty: 'Decisions above first-line authority, and consistency across the team.' },
      { role: 'Spa Manager', duty: 'Monthly review of refunds and goodwill by reason and by authoriser.' },
      { role: 'Finance', duty: 'Reconciling refunds against takings and flagging anything irregular.' },
    ],
    records: [
      'Every refund and goodwill gesture with reason, value and authoriser',
      'The original payment method and the refund route',
      'Monthly totals by reason code and by authoriser',
    ],
    breach: [
      'Refunding above your authority is a disciplinary matter.',
      'Authorising a refund on your own booking is treated as a financial irregularity.',
      'Refunding to a different payment method without authority is treated as a fraud risk and investigated.',
      'Failing to record a reason is a breach, because the reason codes are how the pattern is found.',
    ],
    reviewTriggers: [
      'A rise in refunds or goodwill by value or by volume',
      'Any suspected irregularity',
      'A change to the payment system or to the authority limits',
    ],
  },

  {
    reference: 'FIN-VOUCHERS-POL-823',
    title: 'Gift Voucher Policy',
    department: 'FINANCE TEAM',
    group: 'Money and bookings',
    purpose:
      'To state how vouchers are sold, redeemed, expired and accounted for, because a voucher is money the '
      + 'property has taken and not yet earned.',
    appliesTo: 'Everybody selling or redeeming a voucher, and the finance function.',
    position: [
      'A voucher is a liability until it is redeemed. It is somebody else’s money sitting in the bank, and '
      + 'it is accounted for as such rather than treated as revenue on the day it is sold.',
      'The terms are printed on the voucher and stated at the point of sale. A guest who discovers a condition '
      + 'at redemption will not buy another.',
      'A voucher is honoured. Where it has expired, the decision is a commercial one made by a named role, not '
      + 'an argument at the desk.',
      'Every voucher is traceable: issued, by whom, to what value, and redeemed against which booking.',
    ],
    rules: [
      {
        area: 'Selling',
        items: [
          'Issue through the system, never by hand, so every voucher has a number and a record.',
          'State the expiry, what it can be used for, and whether it is transferable, at the point of sale.',
          'Take payment in full before issuing. A voucher is never issued against a promise to pay.',
          'Record the purchaser and the recipient where the property collects it.',
        ],
      },
      {
        area: 'Redeeming',
        items: [
          'Check the number against the system before honouring it, every time.',
          'Redeem in full or record the remaining balance. Never hand back cash as change.',
          'Apply against the treatment value rather than against retail unless the terms allow it.',
          'A voucher reported lost is cancelled and reissued only with the original purchase evidence.',
        ],
      },
      {
        area: 'Expiry and accounting',
        items: [
          'Expiry: [the property states the period, and it is printed on the voucher].',
          'Expired vouchers: [the property states its position, and who may vary it].',
          'The liability is reported monthly: issued, redeemed, expired and outstanding.',
          'Breakage is recognised only under the property accounting policy, not when somebody notices it.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Reception', duty: 'Selling and redeeming through the system, and stating the terms.' },
      { role: 'Duty manager', duty: 'Decisions on expired or disputed vouchers within authority.' },
      { role: 'Finance', duty: 'The liability report, reconciliation, and the accounting treatment.' },
      { role: 'Spa Director', duty: 'The expiry position and any change to the terms.' },
    ],
    records: [
      'Every voucher issued: number, value, date, purchaser and seller',
      'Every redemption against a booking, with any remaining balance',
      'Expired vouchers and any decision to honour one',
      'Monthly voucher liability: issued, redeemed, expired, outstanding',
    ],
    breach: [
      'Issuing a voucher outside the system is treated as a financial irregularity.',
      'Issuing without payment is gross misconduct.',
      'Giving cash against a voucher is treated as a cash handling breach.',
      'Honouring an expired voucher without authority is a disciplinary matter.',
    ],
    reviewTriggers: [
      'A change to the expiry period or the terms',
      'Any suspected irregularity',
      'A material change in the outstanding liability',
      'A change to the booking or accounting system',
    ],
  },

  {
    reference: 'FIN-DISCOUNTS-POL-824',
    title: 'Discounts, Complimentary and Staff Rates Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Money and bookings',
    purpose:
      'To state who may give away treatment value, how much, and on what basis, because a discount nobody '
      + 'approved is a discount nobody is reading.',
    appliesTo: 'Everybody who can alter a price, apply a code, or book a complimentary treatment.',
    position: [
      'Every pound of discount comes off the bottom line, not off the top. A ten per cent discount on a '
      + 'treatment with a forty per cent margin costs a quarter of the profit.',
      'Discount is a commercial decision made in advance as part of a campaign, not a negotiation at the desk.',
      'Every complimentary treatment has a named approver and a stated reason. A complimentary treatment with '
      + 'no reason recorded is indistinguishable from theft.',
      'Staff rates are a benefit with rules, not an entitlement to be extended to friends.',
    ],
    rules: [
      {
        area: 'Authority',
        items: [
          'Reception may apply only published rates and live campaign codes. No ad hoc discount at any level.',
          'Duty manager: up to [the property limit], for service recovery, recorded against the booking.',
          'Spa Manager: up to [the property limit], including complimentary treatments.',
          'Spa Director: anything above, and any new discount structure or campaign rate.',
          'Nobody approves a discount or a complimentary treatment for themselves or their own family.',
        ],
      },
      {
        area: 'Campaign codes',
        items: [
          'Every code has an owner, an end date, a restriction set and an expected return.',
          'Codes are single use or audience-specific wherever they could reach a discount site.',
          'A code found in public is disabled the same day rather than left to expire.',
          'Codes are reviewed monthly against what they actually returned.',
        ],
      },
      {
        area: 'Staff and industry rates',
        items: [
          'Staff rate applies to the member of the team only, at [the property terms], and is not transferable.',
          'Bookings at staff rate are made at [the notice the property requires] and may be moved if the slot sells.',
          'Friends and family rate, where offered, is [the property terms] and is booked by the member of the team in person.',
          'Industry and trade rates are approved individually by the Spa Director.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Reception', duty: 'Applying only published rates and live codes, and never improvising.' },
      { role: 'Duty manager and Spa Manager', duty: 'Working inside their limit and recording the reason every time.' },
      { role: 'Spa Director', duty: 'The discount structure, campaign approval and the monthly review.' },
      { role: 'Finance', duty: 'Reporting discount given, by type and by approver, monthly.' },
    ],
    records: [
      'Every discount and complimentary treatment: value, reason, approver and booking',
      'Campaign codes: owner, restrictions, dates and result',
      'Staff, friends and family and industry rate bookings',
      'Monthly discount report by type and by approver',
    ],
    breach: [
      'Applying a discount without authority is a disciplinary matter.',
      'Approving a discount or a complimentary treatment for yourself or your family is treated as a financial irregularity.',
      'Creating or sharing a code without approval is a serious breach.',
      'Extending a staff rate to somebody not entitled to it is treated as taking value from the business.',
    ],
    reviewTriggers: [
      'A rise in discount as a percentage of potential revenue',
      'Any code appearing in public without approval',
      'Any suspected irregularity',
      'A change to the campaign calendar or the rate structure',
    ],
  },
]
