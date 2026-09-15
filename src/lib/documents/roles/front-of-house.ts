import type { RoleEntry } from './types'

// Reception, and the roles that meet a guest first.
//
// Reception is the most commercially consequential role in a spa and the most
// often written as an administrative one. The desk decides whether the diary
// fills, whether a gap gets sold, whether a complaint becomes a review, and
// whether a first-time guest ever comes back. So these are written with the
// commercial expectations named rather than implied.

export const FRONT_OF_HOUSE: RoleEntry[] = [
  {
    reference: 'REC-RECEPTIONIST-JD-721',
    title: 'Spa Receptionist',
    department: 'RECEPTION TEAM',
    band: 'Front of house',
    purpose:
      'To be the first and last impression of the spa, and to sell the diary rather than only record what '
      + 'somebody already decided to book.',
    reportsTo: 'Reception Supervisor',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'The desk',
        items: [
          'Greet every guest by name where it is known, and never let anybody stand unacknowledged.',
          'Take bookings by telephone, in person and through the system, and confirm them in writing.',
          'Check guests in and out, handle payment, and reconcile the till at the close of shift.',
          'Manage arrivals: robes, lockers, the tour, and the guest who has never been to a spa before.',
          'Answer the telephone inside the standard the property sets, and never leave a caller on hold unattended.',
        ],
      },
      {
        area: 'Selling the diary',
        items: [
          'Fill gaps: know where today is empty and offer into it rather than waiting to be asked.',
          'Upsell and cross-sell where it suits the guest, including add-ons, upgrades and the longer treatment.',
          'Rebook at departure, every time, as part of the close rather than as an afterthought.',
          'Take and work the waiting list when something is full.',
          'Sell retail, vouchers and memberships to the standard the property sets.',
        ],
      },
      {
        area: 'Records and accuracy',
        items: [
          'Capture allergies, medical alerts and preferences on the guest record at the point of booking.',
          'Collect and record marketing consent properly, and never assume it.',
          'Apply cancellation and no-show policy consistently, and refer anything outside it.',
          'Keep the diary accurate: buffers, resources, therapist allocation and room assignment.',
        ],
      },
      {
        area: 'When it goes wrong',
        items: [
          'Take a complaint properly: listen, record, act within your authority, and escalate the rest.',
          'Tell a guest the truth about a delay early, rather than hoping it resolves.',
          'Follow the procedure when the system is down rather than improvising a new one.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Knows what is empty this afternoon and has already tried to fill it.',
      'Remembers a returning guest without looking at the screen.',
      'Says the price clearly and without apologising for it.',
      'Handles a difficult guest without becoming difficult.',
      'Leaves a shift handover the next person can actually use.',
    ],
    measuredBy: [
      'Conversion: enquiries to bookings',
      'Rebooking rate at departure',
      'Retail and voucher revenue taken at the desk',
      'Diary fill and gaps carried into the day',
      'Guest feedback on arrival and departure',
      'Till accuracy and record completeness',
    ],
    essential: [
      'Experience in a customer-facing role where the desk carried a commercial target',
      'Confident and accurate with a booking system and with payment handling',
      'Clear written and spoken English',
    ],
    desirable: [
      'Spa, salon or hotel reception experience',
      'Experience with [the booking system the property uses]',
      'A second language',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays. Early and late shifts.',
      'Standing and seated. The desk is not left unattended during opening hours.',
    ],
  },

  {
    reference: 'REC-SENIOR-RECEPTIONIST-JD-722',
    title: 'Senior Spa Receptionist',
    department: 'RECEPTION TEAM',
    band: 'Front of house',
    purpose:
      'To run the desk on shift: the diary, the standard, and the decisions a receptionist should not have '
      + 'to make alone.',
    reportsTo: 'Reception Supervisor',
    responsibleFor: 'The receptionists on shift, for standards on the day',
    duties: [
      {
        area: 'Running the shift',
        items: [
          'Open or close the desk, including the float, the banking and the system checks.',
          'Read the diary end to end before the shift and work the gaps before guests arrive.',
          'Allocate the desk, breaks and cover so the telephone and the front are both held.',
          'Take the decisions a receptionist should refer: a goodwill gesture, a policy exception within limit.',
        ],
      },
      {
        area: 'Standards and coaching',
        items: [
          'Coach on the floor in the moment, and feed back to the supervisor on who needs what.',
          'Check record quality: consents, alerts, notes and cancellations coded correctly.',
          'Induct new receptionists and sign off the basic competences.',
        ],
      },
      {
        area: 'Commercial',
        items: [
          'Own the shift’s conversion and rebooking numbers and report them at handover.',
          'Drive retail and voucher sales at the desk and set the example for them.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'The desk runs the same whether the supervisor is in the building or not.',
      'Catches an error in the diary before it becomes a guest standing in reception.',
      'Corrects a colleague without an audience.',
    ],
    measuredBy: [
      'Shift conversion, rebooking and retail against target',
      'Diary accuracy and gaps carried',
      'Till and banking accuracy',
      'Guest feedback on shifts they ran',
    ],
    essential: [
      'Substantial reception experience with a commercial element',
      'Confidence taking charge of a desk and of a difficult guest',
      'Accuracy with cash, card and reconciliation',
    ],
    desirable: [
      'Spa or luxury hotel background',
      'Experience training or inducting others',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays.',
      'Opening and closing shifts, with responsibility for the float and banking.',
    ],
  },

  {
    reference: 'REC-SPAHOST-JD-723',
    title: 'Spa Host',
    department: 'RECEPTION TEAM',
    band: 'Front of house',
    purpose:
      'To look after guests between the desk and the treatment, so that nobody is ever lost, waiting without '
      + 'knowing why, or sitting in an area that has not been reset.',
    reportsTo: 'Reception Supervisor',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Looking after guests',
        items: [
          'Tour and orient arriving guests: changing, lockers, facilities, timings and etiquette.',
          'Serve refreshments to the standard and keep relaxation areas stocked and calm.',
          'Collect guests for treatments on time and return them afterwards.',
          'Notice the guest who looks uncertain and reach them before they have to ask.',
        ],
      },
      {
        area: 'The areas',
        items: [
          'Reset relaxation, changing and wet areas continuously through the shift.',
          'Keep linen, robes and slippers stocked, clean and in the right places.',
          'Report any defect, spill or hazard immediately, and make it safe in the meantime.',
          'Monitor the thermal areas for guests exceeding safe times, and intervene kindly.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'A guest never has to look for someone.',
      'The relaxation room looks the same at four in the afternoon as at nine in the morning.',
      'Picks up a towel without making it a performance.',
      'Notices somebody unwell in the heat before they say anything.',
    ],
    measuredBy: [
      'Guest feedback on the facilities and the welcome',
      'Area audit scores through the day',
      'Treatment start times: guests collected on time',
      'Defects reported rather than found later by a manager',
    ],
    essential: [
      'A genuine service instinct and the confidence to approach a stranger',
      'Physically able to reset areas and carry linen throughout a shift',
    ],
    desirable: [
      'Spa, hotel or hospitality experience',
      'Pool or leisure experience',
      'First aid certification',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays.',
      'Physically active, in warm and humid environments, for most of the shift.',
    ],
  },

  {
    reference: 'MEM-MEMBERSHIP-ADVISOR-JD-724',
    title: 'Membership Advisor',
    department: 'MEMBERSHIP',
    band: 'Front of house',
    purpose:
      'To sell memberships to people who will keep them, and to keep the ones already sold.',
    reportsTo: 'Spa Manager',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Selling',
        items: [
          'Handle every membership enquiry to a decision rather than to a brochure.',
          'Show the club properly: a tour built around what that person said they wanted.',
          'Qualify honestly. A member who will not use it will cancel, and a cancellation costs more than a no.',
          'Complete the contract, the direct debit and the consent correctly at the point of sale.',
          'Work referrals and corporate enquiries as a pipeline rather than as they arrive.',
        ],
      },
      {
        area: 'Keeping',
        items: [
          'Run the onboarding: first visit, induction, and contact at [the intervals the property sets].',
          'Monitor usage and contact members whose attendance has dropped, before they cancel.',
          'Handle cancellations properly: understand the reason, offer the alternative, record the outcome.',
          'Manage freezes, upgrades, renewals and arrears within the policy.',
        ],
      },
      {
        area: 'Reporting',
        items: [
          'Report joins, leavers, net movement and churn weekly, with the reasons behind them.',
          'Keep the member record accurate: contact details, consent, payment status and usage.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Turns away a prospect who would not use it, and explains why to their manager.',
      'Knows which members have not been in for a month, and has already called them.',
      'Can state churn and the top three reasons for it without preparing.',
      'Handles a cancellation without becoming defensive about it.',
    ],
    measuredBy: [
      'Joins against target, and enquiry to join conversion',
      'Churn rate and net member movement',
      'Member usage in the first ninety days',
      'Arrears recovered and direct debit failure rate',
      'Referrals generated',
    ],
    essential: [
      'Experience selling a subscription, membership or service in person',
      'Comfort asking for a decision and handling an objection',
      'Accuracy with contracts and payment details',
    ],
    desirable: [
      'Health club, spa or leisure membership background',
      'Experience with a CRM and a direct debit provider',
    ],
    conditions: [
      'Rota including weekends and evenings, when prospective members visit.',
      'Target-carrying role with regular performance review against it.',
    ],
  },
]
