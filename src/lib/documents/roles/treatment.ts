import type { RoleEntry } from './types'

// The treatment floor.
//
// These are the roles most often described worst. A spa therapist job
// description usually runs to twelve duties, all of them obvious, and says
// nothing about the two things the job actually turns on: consultation, and
// what happens when a guest discloses something mid-treatment. Both are here.
//
// The commercial expectations are stated plainly rather than hidden behind
// "promote retail where appropriate". A therapist who is measured on retail
// should be told so in the document that defines the job, not discover it at
// their first review.

const CONSULTATION = {
  area: 'Consultation and consent',
  items: [
    'Complete a consultation before every treatment, including for a guest who has been before.',
    'Identify contraindications and act on them, including declining or adapting a treatment.',
    'Record consent and any adaptation on the guest record before the treatment starts.',
    'Refer anything outside your competence or qualification rather than working around it.',
    'Never advise on a medical matter. Say what you cannot do and who can.',
  ],
}

const AFTERCARE = {
  area: 'Close and aftercare',
  items: [
    'Give aftercare advice appropriate to the treatment, verbally and in writing where the standard requires.',
    'Record what was delivered, what was used and anything the next therapist needs to know.',
    'Rebook where it is right for the guest, and recommend the product that supports the treatment.',
    'Hand the guest back to reception rather than leaving them to find their own way.',
  ],
}

const ROOM = {
  area: 'The room',
  items: [
    'Open the room to the standard and complete the opening checks before the first guest.',
    'Turn the room around inside the allotted time, to the same standard, every time.',
    'Follow infection control and laundry standards without exception.',
    'Check and record the temperature of anything applied warm before it touches a guest.',
    'Close the room properly: strip, clean, restock and report any defect before leaving the floor.',
  ],
}

export const TREATMENT: RoleEntry[] = [
  {
    reference: 'THER-LEADTHERAPIST-JD-711',
    title: 'Lead Spa Therapist',
    department: 'SPA THERAPISTS',
    band: 'Treatment floor',
    purpose:
      'To hold the treatment standard on the floor, and to be the person a therapist asks before they ask a '
      + 'manager.',
    reportsTo: 'Spa Manager',
    responsibleFor: 'The therapists on shift, for standards rather than for employment matters',
    duties: [
      {
        area: 'Standards',
        items: [
          'Deliver treatments to the protocol, and be the reference for how each one is done here.',
          'Observe and coach therapists on the floor, and record the observation.',
          'Sign off treatment competences for new starters and after a protocol change.',
          'Audit rooms, trolleys and records, and act on what the audit finds.',
          'Own the relationship with [the product house] for training and protocol updates.',
        ],
      },
      CONSULTATION,
      {
        area: 'On shift',
        items: [
          'Allocate the floor when the manager is not on shift.',
          'Absorb the awkward booking: the late guest, the adaptation, the treatment nobody else is signed off for.',
          'Raise a standards concern about a colleague to the manager rather than handling it alone.',
        ],
      },
      AFTERCARE,
    ],
    whatGoodLooksLike: [
      'Other therapists copy them without being told to.',
      'Corrects a standard in the moment, quietly, and the person thanks them for it afterwards.',
      'Knows which of their team is strong at what, and allocates accordingly.',
      'Never lets a protocol drift because the room is running late.',
    ],
    measuredBy: [
      'Treatment audit scores across the floor',
      'Guest satisfaction and rebooking rate on the team',
      'Competence sign-offs completed and current',
      'Own utilisation and retail attachment',
    ],
    essential: [
      'Recognised therapy qualification at Level 3 or above',
      'Substantial experience delivering a full treatment menu in a spa',
      'Certification for every treatment on the property menu, or the ability to gain it',
    ],
    desirable: [
      'Advanced or specialist certification',
      'Training or assessing qualification',
      'Experience with [the product houses the property carries]',
    ],
    conditions: [
      'Full time on a rota including weekends, evenings and public holidays.',
      'Physically demanding: standing, and manual treatment work for most of a shift.',
    ],
  },

  {
    reference: 'THER-SPATHERAPIST-JD-712',
    title: 'Spa Therapist',
    department: 'SPA THERAPISTS',
    band: 'Treatment floor',
    purpose:
      'To deliver treatments safely and to the protocol, and to make each guest feel the treatment was for '
      + 'them rather than the next one on the list.',
    reportsTo: 'Lead Spa Therapist, and through them the Spa Manager',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Delivery',
        items: [
          'Deliver every treatment on your signed-off list to the protocol and to time.',
          'Adapt a treatment within the protocol for a guest who needs it, and record the adaptation.',
          'Keep to the timings: a treatment that runs long takes the next guest’s time, not yours.',
          'Maintain professional presentation, hygiene and conduct throughout.',
        ],
      },
      CONSULTATION,
      ROOM,
      AFTERCARE,
    ],
    whatGoodLooksLike: [
      'The guest cannot tell whether it is the first treatment of the day or the sixth.',
      'Asks the consultation question they would rather not ask, because it matters.',
      'Says so when something is outside their competence, without apologising for it.',
      'Leaves the room ready for somebody else rather than ready enough.',
      'Recommends a product because it suits the guest, which is why the recommendation works.',
    ],
    measuredBy: [
      'Utilisation against rostered hours',
      'Revenue per rostered hour, treatment and retail together',
      'Retail attachment rate',
      'Rebooking rate',
      'Guest feedback and treatment audit score',
      'Records complete: consultation, consent and aftercare on every guest',
    ],
    essential: [
      'Recognised therapy qualification at Level 3 or above in [the disciplines the menu requires]',
      'Certification for the treatments on the property menu, or the ability to gain it during induction',
      'Professional indemnity arrangements as the property requires',
    ],
    desirable: [
      'Experience in a luxury or five-star spa',
      'Additional specialisms: [as the menu requires]',
      'Experience with [the booking system the property uses]',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays.',
      'Physically demanding: standing and manual work for most of a shift.',
      'Uniform provided. Presentation standards apply, including on jewellery and nails.',
    ],
  },

  {
    reference: 'THER-BEAUTYTHERAPIST-JD-713',
    title: 'Beauty Therapist',
    department: 'SPA THERAPISTS',
    band: 'Treatment floor',
    purpose:
      'To deliver facial, body and beauty treatments to a standard that makes the result, not only the hour, '
      + 'the reason somebody comes back.',
    reportsTo: 'Lead Spa Therapist',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Delivery',
        items: [
          'Deliver facials, body treatments, waxing, tinting and [the beauty menu the property offers].',
          'Analyse skin properly and build the treatment around what you find, within the protocol.',
          'Carry out and record patch tests where the treatment or the product requires one.',
          'Maintain equipment used on skin to the manufacturer and hygiene standard.',
        ],
      },
      CONSULTATION,
      ROOM,
      {
        area: 'Retail and result',
        items: [
          'Build a home care routine the guest can follow, and sell it as the second half of the treatment.',
          'Book the follow-up where a course is what will actually work.',
          'Record the skin analysis and the products used, so the next treatment continues rather than restarts.',
        ],
      },
    ],
    whatGoodLooksLike: [
      'Can explain why they chose that product on that skin, in words the guest understands.',
      'Turns a one-off facial into a course because the course is what works, not because of a target.',
      'Never skips a patch test because the diary is tight.',
    ],
    measuredBy: [
      'Utilisation and revenue per rostered hour',
      'Retail attachment rate and home care conversion',
      'Course and follow-up booking rate',
      'Guest feedback and treatment audit score',
    ],
    essential: [
      'Level 3 beauty therapy qualification or equivalent',
      'Certification for the facial and body brands the property carries, or ability to gain it',
      'Current understanding of contraindications and patch testing requirements',
    ],
    desirable: [
      'Advanced facial or electrical treatment certification',
      'Experience with [the skincare houses the property carries]',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays.',
      'Close detailed work. Uniform and presentation standards apply.',
    ],
  },

  {
    reference: 'THER-MASSAGETHERAPIST-JD-714',
    title: 'Massage Therapist',
    department: 'SPA THERAPISTS',
    band: 'Treatment floor',
    purpose:
      'To deliver massage treatments that are both safe and genuinely effective, and to protect a body that '
      + 'has to keep doing this for twenty years.',
    reportsTo: 'Lead Spa Therapist',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Delivery',
        items: [
          'Deliver the massage menu: [Swedish, deep tissue, hot stone, pregnancy, and any specialism the menu carries].',
          'Adjust pressure and technique to the guest in front of you, checking in without breaking the treatment.',
          'Apply correct body mechanics throughout, for your own longevity as much as for the result.',
          'Manage draping so that a guest is never exposed or uncertain.',
        ],
      },
      CONSULTATION,
      ROOM,
      AFTERCARE,
    ],
    whatGoodLooksLike: [
      'Asks about pressure once, early, and then reads the body rather than asking again every five minutes.',
      'Declines or adapts where a contraindication says so, and explains it without alarming the guest.',
      'Still has good mechanics in the sixth treatment of the day.',
      'Hands over anything the next therapist needs to know without breaching confidence.',
    ],
    measuredBy: [
      'Utilisation and revenue per rostered hour',
      'Rebooking and request rate',
      'Guest feedback and treatment audit score',
      'Records complete on every guest',
    ],
    essential: [
      'Level 3 massage qualification or equivalent',
      'Certification for the massage modalities on the property menu, or ability to gain it',
      'Sound working knowledge of contraindications, including pregnancy',
    ],
    desirable: [
      'Advanced, sports or clinical massage qualification',
      'Experience delivering to a luxury protocol rather than a clinical one',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays.',
      'Physically demanding. Treatment load managed against [the property maximum per shift].',
    ],
  },

  {
    reference: 'THER-NAILTECH-JD-715',
    title: 'Nail Technician',
    department: 'SPA THERAPISTS',
    band: 'Treatment floor',
    purpose:
      'To deliver hand and foot treatments to a finish that holds, in an environment that is visibly and '
      + 'verifiably hygienic.',
    reportsTo: 'Lead Spa Therapist',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Delivery',
        items: [
          'Deliver manicures, pedicures and [the nail menu the property offers], to time and to finish.',
          'Apply, maintain and remove systems correctly, including gel and any enhancement the menu carries.',
          'Identify nail and skin conditions that contraindicate treatment, and refer rather than proceed.',
        ],
      },
      {
        area: 'Hygiene and equipment',
        items: [
          'Sterilise or dispose of every implement according to the standard, with no exception for a busy day.',
          'Maintain foot spas and basins to the cleaning and disinfection schedule, and record it.',
          'Manage ventilation and dust extraction where products require it.',
          'Store and label all products correctly, including anything decanted.',
        ],
      },
      CONSULTATION,
      AFTERCARE,
    ],
    whatGoodLooksLike: [
      'The finish is the same on the last nail as on the first.',
      'A guest can watch the hygiene happen without being shown it.',
      'Says no to treating a nail that should be seen by a professional elsewhere.',
    ],
    measuredBy: [
      'Utilisation and revenue per rostered hour',
      'Retail attachment and rebooking rate',
      'Hygiene audit results',
      'Guest feedback and any reported reaction',
    ],
    essential: [
      'Level 3 nail services qualification or equivalent',
      'Certification for the systems the property uses',
      'Sound knowledge of nail conditions and contraindications',
    ],
    desirable: [
      'Advanced or specialist nail art certification',
      'Experience in a spa rather than only a salon setting',
    ],
    conditions: [
      'Rota including weekends, evenings and public holidays.',
      'Close detailed work, seated, with exposure to products requiring ventilation.',
    ],
  },

  {
    reference: 'THER-AESTHETICIAN-JD-716',
    title: 'Advanced Aesthetician',
    department: 'SPA THERAPISTS',
    band: 'Treatment floor',
    purpose:
      'To deliver advanced and device-based facial treatments safely, within qualification and within the '
      + 'insurance the property holds.',
    reportsTo: 'Lead Spa Therapist, clinically overseen by [the role the property names]',
    responsibleFor: 'Nobody. This is a delivery role.',
    duties: [
      {
        area: 'Advanced delivery',
        items: [
          'Deliver [the advanced menu: peels, microneedling, radiofrequency, light-based or device treatments].',
          'Work strictly inside your certification and inside the property insurance, and stop where either ends.',
          'Complete and record patch tests, consent and pre-treatment photographs where the protocol requires.',
          'Manage a course rather than a single treatment, and set the expectation honestly at the start.',
        ],
      },
      {
        area: 'Devices and safety',
        items: [
          'Confirm device calibration, service status and consumables before use, and record it.',
          'Apply the correct settings for the skin type in front of you rather than the usual settings.',
          'Recognise and manage an adverse reaction, and escalate it under the property procedure.',
          'Keep the treatment and device records an insurer or regulator would ask to see.',
        ],
      },
      CONSULTATION,
      AFTERCARE,
    ],
    whatGoodLooksLike: [
      'Turns a guest away from a treatment that will not give them what they want.',
      'Photographs, records and consents every time, including when the guest is a regular.',
      'Knows the settings and the reasons, not only the preset.',
      'Reports a reaction immediately rather than watching it for a day.',
    ],
    measuredBy: [
      'Course completion and outcome against what was promised',
      'Revenue per rostered hour on the advanced menu',
      'Adverse reactions, and how each was handled',
      'Record and consent completeness on audit',
    ],
    essential: [
      'Level 4 qualification in the advanced treatments offered, or equivalent',
      'Current certification for every device operated',
      'Professional indemnity insurance covering the advanced menu',
      'Demonstrable understanding of skin typing, contraindications and adverse reaction management',
    ],
    desirable: [
      'Experience in a medical or clinical aesthetics setting',
      'Additional device or brand certifications',
    ],
    conditions: [
      'Rota including weekends and evenings.',
      'Practice subject to the property clinical governance arrangements and to periodic audit.',
    ],
  },
]
