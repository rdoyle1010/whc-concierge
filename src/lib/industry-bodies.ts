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
  // Three voices, because three different people read this page and none of
  // them wants the other two's answer.
  //
  // whyItMatters is the professional's: the specific reason this affects a
  // career. whyWeRateIt is ours, and it is an opinion rather than a fact -
  // said plainly, because a reference page that refuses to have a view is
  // just a list of links somebody could have found themselves. whySpasValueIt
  // is the operator's: what it does for a business rather than a person.
  whyItMatters: string
  whyWeRateIt: string
  whySpasValueIt: string
  // A photograph, when there is one. Left empty until Talent House owns the
  // picture: a reference page whose whole value is trustworthiness cannot
  // borrow somebody else's photography, and a designed monogram reads as a
  // decision rather than a gap.
  image?: string
  tags: string[]
}

export type IndustryGroup = {
  id: string
  title: string
  intro: string
  bodies: IndustryBody[]
}

// The four sections, which are structure rather than content: what kind of
// organisation sits in each, and in what order somebody meets them. Everything
// inside them lives in the database and is Rebecca's to edit. A body pointing
// at a section that is not here disappears quietly rather than breaking the
// page.
export const INDUSTRY_SECTIONS = [
  { id: 'professional-bodies', title: 'Professional bodies and membership', intro: 'The organisations that represent the industry, insure the people working in it and speak for it where decisions get made.' },
  { id: 'qualifications', title: 'Qualifications and awarding organisations', intro: 'Who awards the certificates on your CV, and who regulates the people who award them. This is the part employers and insurers actually check.' },
  { id: 'safety', title: 'Safety, health and licensing', intro: 'The obligations that sit under every treatment room, whoever owns it.' },
  { id: 'media', title: 'Industry media and intelligence', intro: 'Where the openings, the appointments and the numbers get reported first.' },
] as const

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
        whyWeRateIt: 'It is the closest thing this industry has to a licence. Nobody is legally required to hold it, which is exactly why holding it says something: it is a voluntary standard, and the people who meet it are the people who take the work seriously. When we verify insurance on a Talent House profile, this is usually the document we are looking at.',
        whySpasValueIt: 'A therapist who arrives already insured to a recognised standard is a therapist who can be put in front of a guest on day one. For a spa director it removes a conversation, a risk and a delay, and it means your treatment list is not being quietly narrowed by what your cover will not stretch to.',
        tags: ['Insurance', 'Membership', 'Accreditation'],
      },
      {
        name: 'UK Spa Association',
        shortName: 'UKSA',
        url: 'https://www.spa-uk.org/',
        what: 'The not-for-profit trade association for UK spas and salons, made up of members and partners from across the spa, salon and wellness sector. It represents the industry at government level, works on training and standards, and runs networking events and regional operator groups.',
        whyItMatters: 'This is the body that argues for the industry rather than for any one business in it. If you manage or own a spa, it is where you meet the people running the ones near you, and where sector-level campaigns such as National Spa Week come from.',
        whyWeRateIt: 'Every industry gets the representation it turns up for. Spa has spent years being treated as an add-on to hospitality rather than a business in its own right, and this is the organisation arguing otherwise in the rooms where that gets decided. Worth supporting for that alone.',
        whySpasValueIt: 'The regional operator groups are the real draw. Recruitment, rates, supplier terms and what the spa down the road is charging are all easier to judge when you know the people running it, and this is where operators actually meet each other rather than meeting suppliers.',
        tags: ['Trade body', 'Operators', 'Advocacy'],
      },
      {
        name: 'Spa Well',
        url: 'https://www.spa-well.com/',
        what: 'An online community for spa and wellness professionals, founded by Sara Young, combining a members network with weekly webinars, accredited training and regular virtual and in-person meet-ups around the UK. Membership is free for spa operators, including managers, directors and heads of department.',
        whyItMatters: 'Free, current, and aimed squarely at people already doing the job. It has also been involved in shaping the Spa Manager Apprenticeship, which makes it worth following if you are building a career path rather than just filling a rota.',
        whyWeRateIt: 'Free training that is genuinely useful is rare, and free training built by somebody who has run the department is rarer still. If you are early in a management career and cannot get a training budget signed off, start here rather than waiting for one.',
        whySpasValueIt: 'It costs a spa nothing to send its heads of department, and a manager who spends an hour a week with people doing the same job elsewhere brings back more than most paid courses deliver. The apprenticeship work also matters if you are trying to build progression rather than replace leavers.',
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
        whyWeRateIt: 'Portability is underrated. A career in this industry rarely runs in a straight line through one country, and a qualification that needs explaining at every border quietly narrows where you can work. This one does not.',
        whySpasValueIt: 'For a property recruiting internationally, or one whose team arrives from several countries, a common awarding standard makes a pile of unfamiliar certificates comparable. That is the difference between assessing a candidate and guessing at one.',
        tags: ['Awarding body', 'International'],
      },
      {
        name: 'VTCT and ITEC',
        url: 'https://www.vtct.org.uk/',
        what: 'Awarding organisations for qualifications in beauty therapy, spa, complementary therapies and related fields, delivered through approved centres. ITEC qualifications sit within the same group.',
        whyItMatters: 'Between them these cover a large share of the certificates held by UK therapists. Knowing which organisation awarded yours, and at what level, is the difference between a CV that gets shortlisted and one that gets queried.',
        whyWeRateIt: 'Most people cannot name the organisation that awarded their own qualification, and it is the single most common gap we see on a profile. Find the certificate, read the logo, put it on your CV. It takes five minutes and it changes how the CV is read.',
        whySpasValueIt: 'A named awarding organisation and a level turn a line on a CV into something a spa director can actually verify. Where those are missing, most hiring managers do not investigate, they move on, which is how good candidates get lost to bad paperwork.',
        tags: ['Awarding body', 'UK'],
      },
      {
        name: 'Ofqual',
        url: 'https://www.gov.uk/government/organisations/ofqual',
        what: 'The regulator of qualifications, examinations and assessments in England. It recognises awarding organisations and regulates the qualifications they offer.',
        whyItMatters: 'The word "Ofqual-regulated" is doing real work when an insurer or an employer uses it. If you are choosing a course, checking whether the qualification is regulated is the single most useful question you can ask before you pay.',
        whyWeRateIt: 'This is the question we would ask before paying for any course, and the one training providers least like being asked. A regulated qualification has somebody standing behind it. An unregulated certificate has a printer.',
        whySpasValueIt: 'If you fund training for your team, the register is where you check that the money is buying something an insurer will recognise. It is a two-minute check that occasionally saves a five-figure training budget from being spent on wall decoration.',
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
        whyWeRateIt: "Read the source, not the summary. Almost every spa health and safety document in circulation is somebody's paraphrase of this guidance, and paraphrases drift. When something goes wrong, what is written here is what gets quoted back at you.",
        whySpasValueIt: 'Water systems are the one that catches spas out. Pools, hot tubs, steam rooms and showers all sit inside legionella duties that a general hospitality risk assessment usually does not cover in enough detail, and this is where those duties are set out.',
        tags: ['Regulation', 'COSHH', 'Risk assessment'],
      },
      {
        name: 'Your local authority',
        url: 'https://www.gov.uk/find-local-council',
        what: 'Licensing for special treatments, and the environmental health team that inspects premises, varies by council rather than being set nationally.',
        whyItMatters: 'This catches people out when they move. What needed a licence in one borough may not in the next, and the rules for treatments such as microneedling, laser and piercing differ by area. Check the council, not a national summary.',
        whyWeRateIt: 'The most expensive assumption in this industry is that a rule is national. It is not, and the version you learned at your last property may be wrong at your next one by a single street.',
        whySpasValueIt: "Before you sign a lease, add a treatment or open a second site, this is the first call. A treatment menu built on the wrong borough's rules is a menu that has to be rewritten after the fit-out, which is the worst possible time to find out.",
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
        whyWeRateIt: 'Career timing beats career planning. The best roles in this industry are filled in the months before a spa opens, not after, and this is where those openings are announced first. Read it weekly and you are early rather than lucky.',
        whySpasValueIt: 'It is a competitor briefing and a recruitment early-warning system in one. Knowing which property is opening, which brand is arriving and who has just been appointed nearby tells you where your next resignation letter is coming from.',
        tags: ['Trade press', 'News'],
      },
    ],
  },
]

export const TOTAL_BODIES = INDUSTRY_GROUPS.reduce((sum, group) => sum + group.bodies.length, 0)
