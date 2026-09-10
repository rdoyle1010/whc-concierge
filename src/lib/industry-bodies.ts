// The organisations that govern, insure, teach and report on this industry.
//
// Every entry here is a real body with a public website, described from its own
// published material. Nothing is invented, nothing is ranked, and no
// relationship with Talent House is implied by inclusion: this is a reference
// page, not a partner list, and the moment it stops being one it stops being
// worth reading.
//
// Where sources disagreed on a detail - a publication's frequency, say - the
// detail is left out rather than guessed. A page whose whole value is
// trustworthiness cannot afford a single wrong fact.

export type IndustryBody = {
  name: string
  shortName?: string
  url: string
  what: string
  // Why a spa professional would actually click through. Not marketing: the
  // specific reason this matters to a career or an operation.
  whyItMatters: string
  tags: string[]
}

export type IndustryGroup = {
  id: string
  title: string
  intro: string
  bodies: IndustryBody[]
}

export const INDUSTRY_GROUPS: IndustryGroup[] = [
  {
    id: 'professional-bodies',
    title: 'Professional bodies and membership',
    intro: 'The organisations that represent the industry, insure the people working in it and speak for it where decisions get made.',
    bodies: [
      {
        name: 'British Association of Beauty Therapy and Cosmetology',
        shortName: 'BABTAC',
        url: 'https://www.babtac.com/',
        what: 'A not-for-profit membership association founded in Gloucester in 1977, providing member benefits and arranging insurance across aesthetic, beauty, hair and wellbeing therapies. It also accredits training courses against industry standards.',
        whyItMatters: 'Insurance is the practical one. BABTAC requires insured members to hold an Ofqual-regulated qualification or equivalent training in their discipline, so membership is both cover and a statement that your qualifications stand up. Many employers and agencies ask to see it.',
        tags: ['Insurance', 'Membership', 'Accreditation'],
      },
      {
        name: 'UK Spa Association',
        shortName: 'UKSA',
        url: 'https://www.spa-uk.org/',
        what: 'The not-for-profit trade association for UK spas and salons, made up of members and partners from across the spa, salon and wellness sector. It represents the industry at government level, works on training and standards, and runs networking events and regional operator groups.',
        whyItMatters: 'This is the body that argues for the industry rather than for any one business in it. If you manage or own a spa, it is where you meet the people running the ones near you, and where sector-level campaigns such as National Spa Week come from.',
        tags: ['Trade body', 'Operators', 'Advocacy'],
      },
      {
        name: 'Spa Well',
        url: 'https://www.spa-well.com/',
        what: 'An online community for spa and wellness professionals, founded by Sara Young, combining a members network with weekly webinars, accredited training and regular virtual and in-person meet-ups around the UK. Membership is free for spa operators, including managers, directors and heads of department.',
        whyItMatters: 'Free, current, and aimed squarely at people already doing the job. It has also been involved in shaping the Spa Manager Apprenticeship, which makes it worth following if you are building a career path rather than just filling a rota.',
        tags: ['Community', 'Free membership', 'Training'],
      },
    ],
  },
  {
    id: 'qualifications',
    title: 'Qualifications and awarding organisations',
    intro: 'Who awards the certificates on your CV, and who regulates the people who award them. This is the part employers and insurers actually check.',
    bodies: [
      {
        name: 'CIBTAC',
        url: 'https://cibtac.com/',
        what: "An international beauty and spa awarding organisation, and BABTAC's sister organisation, offering qualifications delivered through accredited training centres worldwide.",
        whyItMatters: 'A CIBTAC qualification travels. If you have ever thought about working on a cruise line or overseas, an internationally recognised award saves a conversation you would otherwise have at every interview.',
        tags: ['Awarding body', 'International'],
      },
      {
        name: 'VTCT and ITEC',
        url: 'https://www.vtct.org.uk/',
        what: 'Awarding organisations for qualifications in beauty therapy, spa, complementary therapies and related fields, delivered through approved centres. ITEC qualifications sit within the same group.',
        whyItMatters: 'Between them these cover a large share of the certificates held by UK therapists. Knowing which organisation awarded yours, and at what level, is the difference between a CV that gets shortlisted and one that gets queried.',
        tags: ['Awarding body', 'UK'],
      },
      {
        name: 'Ofqual',
        url: 'https://www.gov.uk/government/organisations/ofqual',
        what: 'The regulator of qualifications, examinations and assessments in England. It recognises awarding organisations and regulates the qualifications they offer.',
        whyItMatters: 'The word "Ofqual-regulated" is doing real work when an insurer or an employer uses it. If you are choosing a course, checking whether the qualification is regulated is the single most useful question you can ask before you pay.',
        tags: ['Regulator'],
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety, health and licensing',
    intro: 'The obligations that sit under every treatment room, whoever owns it.',
    bodies: [
      {
        name: 'Health and Safety Executive',
        shortName: 'HSE',
        url: 'https://www.hse.gov.uk/',
        what: "Great Britain's national regulator for workplace health and safety, publishing the guidance that governs risk assessment, COSHH, manual handling and reporting of incidents at work.",
        whyItMatters: 'COSHH is not a box on an induction form. Spas handle chemicals, heat, water systems and equipment daily, and the HSE guidance is the source everything else quotes. If you manage a team, this is where your obligations are actually written down.',
        tags: ['Regulation', 'COSHH', 'Risk assessment'],
      },
      {
        name: 'Your local authority',
        url: 'https://www.gov.uk/find-local-council',
        what: 'Licensing for special treatments, and the environmental health team that inspects premises, varies by council rather than being set nationally.',
        whyItMatters: 'This catches people out when they move. What needed a licence in one borough may not in the next, and the rules for treatments such as microneedling, laser and piercing differ by area. Check the council, not a national summary.',
        tags: ['Licensing', 'Local'],
      },
    ],
  },
  {
    id: 'media',
    title: 'Industry media and intelligence',
    intro: 'Where the openings, the appointments and the numbers get reported first.',
    bodies: [
      {
        name: 'European Spa Magazine',
        url: 'https://europeanspamagazine.com/',
        what: 'A business publication for spa and wellness professionals founded in 2008 and published by Spa Publishing Ltd, combining a print magazine with a daily news website and a weekly newsletter covering spa, wellbeing, beauty, fitness and nutrition.',
        whyItMatters: 'Openings, appointments, brand launches and supplier news appear here before they reach anywhere general. If you want to know which spa is opening near you next year, this is where it will be written down first.',
        tags: ['Trade press', 'News'],
      },
    ],
  },
]

export const TOTAL_BODIES = INDUSTRY_GROUPS.reduce((sum, group) => sum + group.bodies.length, 0)
