// Demonstration data for showing the platform to somebody.
//
// The rule, which is already written into the seed route this replaces and is
// worth repeating because it is the whole reason this file looks like it does:
//
//   "A fabricated vacancy attributed to a named business, on a live
//    recruitment site, is a job a therapist could apply for at a company that
//    never advertised it."
//
// So no real hotel, group or brand-as-employer appears here, and nothing is
// lifted from Indeed, LinkedIn or anyone else's advert. Those adverts belong
// to the businesses that wrote them, and putting one here would say a property
// is hiring on this platform when it has never heard of it. On a call with
// somebody who might buy this, that is the worst possible thing to be caught
// doing.
//
// Everything else is real, because that is what makes a demonstration land:
// real role titles, real salary bands for the UK luxury market, real product
// houses, real qualifications, real treatment skills, and real coordinates so
// the radius search and the travel-practicality score actually compute. The
// only inventions are the property names and the people.
//
// The properties are invented. Check them against anything trading before a
// public demonstration: an invented name can still collide with a real one.

/** Everything seeded carries one of these, so it can all be removed again. */
export const DEMO_EMAIL_DOMAIN = 'demo.talenthousecollective.co.uk'
export const DEMO_MARKER = '[demonstration data]'

export type DemoProperty = {
  company_name: string
  /** The fields the property page is built around. Without them it renders a
   *  name, two lines and a lot of rule lines - which is what a demonstration
   *  property looked like until somebody read one. */
  tagline: string
  highlights: string[]
  culture_statement: string
  culture_points: string[]
  progression_notes: string
  staff_benefits: string[]
  facilities: string[]
  location_guide: string
  room_count: number
  opening_year: number
  property_type: string
  num_treatment_rooms: number
  team_size: number
  location: string
  postcode: string
  latitude: number
  longitude: number
  company_type: string
  product_houses_used: string[]
  systems_used: string[]
  property_description: string
}

export const DEMO_PROPERTIES: DemoProperty[] = [
  {
    company_name: 'Fennwood Hall Hotel & Spa',
    location: 'Cirencester, Gloucestershire',
    postcode: 'GL7 1QW',
    latitude: 51.7193, longitude: -1.9690,
    company_type: 'Country house hotel',
    product_houses_used: ['ESPA', 'Elemis'],
    systems_used: ['Spa Booker'],
        tagline: `A seventeen-room country house where the spa is the reason people come, not an amenity they find.`,
    highlights: [`Six treatment rooms for seventeen bedrooms - the highest ratio of any property on the platform.`, `ESPA throughout, with the full body and face menu rather than a cut-down hotel version.`, `Two senior therapists on every shift, so complex bookings are never handed to a junior.`, `Thirty minutes from Cirencester, with staff parking and no London commute.`],
    culture_statement: `A small house where the spa team is named on the website and the kitchen knows their coffee order.`,
    culture_points: [`Treatment times are ninety minutes where the treatment needs ninety minutes.`, `Rota published a fortnight ahead, and it does not change without asking you.`, `Retail targets are a team figure, not an individual one.`, `Every therapist does one ESPA training day a quarter, paid.`],
    progression_notes: `Most of our seniors arrived as therapists.

- Therapist to Senior Therapist, typically eighteen months
- Senior Therapist to Head Therapist, when the role exists and you want it
- Head Therapist to Spa Manager, with the commercial side taught rather than assumed

We would rather promote somebody who knows the house than recruit a manager who has to learn it.`,
    staff_benefits: [`Live-in accommodation available`, `Meals on duty`, `ESPA product allowance`, `Treatments at cost`, `Paid training days`, `Staff parking`, `Birthday off`, `Tronc share`],
    facilities: [`Six treatment rooms`, `Indoor pool`, `Sauna`, `Steam room`, `Relaxation lounge`, `Outdoor hot tub`, `Nail studio`, `Staff room with showers`],
    location_guide: `Deep Cotswolds, eight miles from Cirencester.

Kemble station is twenty minutes by car and reaches Paddington in about ninety. Most of the team live in Cirencester or Tetbury; a few live in.

It is genuinely rural. That suits people who want the countryside and does not suit people who want a city on a night off.`,
    room_count: 17,
    opening_year: 2019,
    property_type: `country_house`,
    num_treatment_rooms: 6,
    team_size: 14,
    property_description: `A seventeen-room country house with a six-room spa, an indoor pool and a treatment menu built around ESPA. ${DEMO_MARKER}`,
  },
  {
    company_name: 'Harbourstone House',
    location: 'Falmouth, Cornwall',
    postcode: 'TR11 4NA',
    latitude: 50.1537, longitude: -5.0689,
    company_type: 'Coastal resort',
    product_houses_used: ['Comfort Zone', 'Temple Spa'],
    systems_used: ['Premier Software'],
        tagline: `A coastal spa with a real season - busy from April, quiet in January, and honest about both.`,
    highlights: [`Eight treatment rooms and a thermal suite, five minutes from the harbour.`, `Comfort Zone and Temple Spa, with brand training from both.`, `Summer is relentless and winter is not - we staff for that rather than pretending.`, `Sea swimming before shift is a normal thing here.`],
    culture_statement: `Seasonal does not mean disposable. The same team comes back each spring because we are straight with them about the winter.`,
    culture_points: [`Guaranteed hours through the quiet months for anybody on a permanent contract.`, `Summer overtime is paid, not absorbed.`, `Two days off together, not split.`, `The December rota is agreed in October.`],
    progression_notes: `A coastal resort gives you volume, which is the fastest way to get good.

- Therapist to Senior Therapist, often inside a year on this volume
- Senior Therapist to Treatment Lead across the thermal suite
- Treatment Lead to Spa Manager

Several of the team came for one season and stayed.`,
    staff_benefits: [`Seasonal accommodation`, `Guaranteed winter hours`, `Paid summer overtime`, `Comfort Zone and Temple Spa training`, `Meals on duty`, `Treatments at cost`, `Wetsuit storage and showers`],
    facilities: [`Eight treatment rooms`, `Thermal suite`, `Hydrotherapy pool`, `Salt room`, `Experience showers`, `Relaxation terrace`, `Sea view treatment room`, `Staff changing`],
    location_guide: `Falmouth, five minutes from the harbour.

Truro is twenty-five minutes and has the mainline station. Summer parking is tight in town, so staff parking is on site and kept for staff.

Renting here is easier out of season than in it, which is worth knowing before you move.`,
    room_count: 42,
    opening_year: 2017,
    property_type: `resort`,
    num_treatment_rooms: 8,
    team_size: 19,
    property_description: `A coastal resort spa with eight treatment rooms, a thermal suite and a seasonal peak from April to October. ${DEMO_MARKER}`,
  },
  {
    company_name: 'The Calder Wellness Club',
    location: 'Marylebone, London',
    postcode: 'W1U 6QX',
    latitude: 51.5194, longitude: -0.1527,
    company_type: 'Members club',
    product_houses_used: ['Aromatherapy Associates', 'Natura Bissé'],
    systems_used: ['Mindbody'],
        tagline: `A members club in Marylebone where the same forty faces come back every week and know yours.`,
    highlights: [`Members rather than guests - you build a client list instead of starting again each day.`, `Advanced skin is the centre of what we do: microneedling, peels, LED.`, `Five treatment rooms, no hotel, no banqueting, no rooms division.`, `Four minutes from Baker Street.`],
    culture_statement: `Clinical standards with the manners of a members club. Quiet, precise, and not remotely corporate.`,
    culture_points: [`Clients rebook with you by name, and that is the point.`, `Column time protected for advanced treatments - no doubling up.`, `Commission on treatment, not only on retail.`, `Closed Sundays.`],
    progression_notes: `This is where therapists come to specialise rather than to manage.

- Therapist to Advanced Skin Therapist, with the qualifications funded
- Advanced Skin Therapist to Lead Aesthetician
- Lead Aesthetician to Clinical Lead, setting the protocols

There is a management route as well, but most people here want the skill.`,
    staff_benefits: [`Funded advanced qualifications`, `Treatment commission`, `Closed Sundays`, `Travel contribution`, `Club membership`, `Uniform and laundry`, `Private healthcare after two years`],
    facilities: [`Five treatment rooms`, `Advanced skin suite`, `LED room`, `Infrared sauna`, `Members lounge`, `Changing suites`, `Fitness studio`],
    location_guide: `Marylebone, four minutes from Baker Street.

Everything in central London is reachable. Most of the team travel in from zones two and three and we contribute to travel.

It is a members club, so the rhythm is weekday-heavy and the evenings are busier than the mornings.`,
    room_count: 0,
    opening_year: 2021,
    property_type: `day_spa`,
    num_treatment_rooms: 5,
    team_size: 11,
    property_description: `A members' wellness club over three floors, with a strong facial and advanced-skin business. ${DEMO_MARKER}`,
  },
]

export type DemoJob = {
  property: string
  job_title: string
  job_description: string
  contract_type: string
  job_type: string
  required_role_level: string
  salary_min: number
  salary_max: number
  /** Drawn from the vocabulary the demonstration candidates hold, so the
   *  matcher has something real to agree and disagree about, and the market
   *  page's most-demanded-skills panel has something to count. */
  required_skills: string[]
  required_brands: string[]
  required_qualifications: string[]
  tier: string
  is_agency_role: boolean
  insurance_required: boolean
}

// Eight roles, spread across tier, contract type, seniority and brand, so the
// filters on the roles page have something to filter and the tier badges are
// not all the same colour.
export const DEMO_JOBS: DemoJob[] = [
  {
    property: 'Fennwood Hall Hotel & Spa',
    job_title: 'Senior Spa Therapist',
    job_description: 'Delivering the full ESPA treatment menu across six rooms, with a strong massage and body bias. You would be one of two seniors on the floor, taking the more complex bookings and mentoring two juniors. Five-day week including weekends on rota.',
    contract_type: 'permanent', job_type: 'Full-time',
    required_role_level: 'Senior Therapist',
    salary_min: 29000, salary_max: 34000,
    required_skills: ['Deep tissue massage', 'Hot stone', 'Aromatherapy'],
    required_brands: ['ESPA'],
    required_qualifications: ['NVQ Level 3 Beauty Therapy'],
    tier: 'Platinum', is_agency_role: false, insurance_required: false,
  },
  {
    property: 'Fennwood Hall Hotel & Spa',
    job_title: 'Spa Manager',
    job_description: 'Running the spa day to day: rota, stock, treatment mix, retail targets and the therapist team. Full responsibility for the spa P&L and for the relationship with the product house. Reports to the General Manager.',
    contract_type: 'permanent', job_type: 'Full-time',
    required_role_level: 'Spa Manager',
    salary_min: 42000, salary_max: 50000,
    required_skills: ['Team leadership', 'Rota planning', 'Stock control'],
    required_brands: ['ESPA', 'Elemis'],
    required_qualifications: ['NVQ Level 3 Beauty Therapy'],
    tier: 'Platinum', is_agency_role: false, insurance_required: false,
  },
  {
    property: 'Fennwood Hall Hotel & Spa',
    job_title: 'Spa Therapist - weekend cover',
    job_description: 'Saturday and Sunday cover through the summer, eight-hour days, ESPA massage and facials. Paid by the day, booked through Agency.',
    contract_type: 'agency', job_type: 'Part-time',
    required_role_level: 'Therapist',
    salary_min: 130, salary_max: 160,
    required_skills: ['Swedish massage', 'Aromatherapy'],
    required_brands: ['ESPA'],
    required_qualifications: ['NVQ Level 3 Beauty Therapy'],
    tier: 'Gold', is_agency_role: true, insurance_required: true,
  },
  {
    property: 'Harbourstone House',
    job_title: 'Spa Therapist',
    job_description: 'Eight rooms, a thermal suite and a busy seasonal guest list. Comfort Zone trained preferred but training is given. Live-in accommodation available for the right person.',
    contract_type: 'permanent', job_type: 'Full-time',
    required_role_level: 'Therapist',
    salary_min: 25000, salary_max: 28000,
    required_skills: ['Swedish massage', 'Aromatherapy', 'Manicure and pedicure'],
    required_brands: ['Comfort Zone'],
    required_qualifications: ['NVQ Level 3 Beauty Therapy'],
    tier: 'Gold', is_agency_role: false, insurance_required: false,
  },
  {
    property: 'Harbourstone House',
    job_title: 'Head Therapist',
    job_description: 'Leading a team of six through the season, holding the treatment standard, running the training calendar and covering the diary when it is full. Seasonal peak April to October.',
    contract_type: 'permanent', job_type: 'Full-time',
    required_role_level: 'Lead Therapist',
    salary_min: 32000, salary_max: 37000,
    required_skills: ['Team leadership', 'Training delivery', 'Advanced facials'],
    required_brands: ['Comfort Zone', 'Temple Spa'],
    required_qualifications: ['NVQ Level 3 Beauty Therapy', 'CIBTAC'],
    tier: 'Gold', is_agency_role: false, insurance_required: false,
  },
  {
    property: 'Harbourstone House',
    job_title: 'Spa Receptionist',
    job_description: 'First point of contact for the spa: bookings, arrivals, retail and the daily diary. Premier Software experience useful, not essential.',
    contract_type: 'permanent', job_type: 'Full-time',
    required_role_level: 'Junior',
    salary_min: 23000, salary_max: 25000,
    required_skills: ['Stock control'],
    required_brands: [],
    required_qualifications: [],
    tier: 'Bronze', is_agency_role: false, insurance_required: false,
  },
  {
    property: 'The Calder Wellness Club',
    job_title: 'Advanced Skin Therapist',
    job_description: 'An advanced facial list for a members’ club: microneedling, peels and LED alongside the Natura Bissé menu. Results-led, with members who book the same therapist every month.',
    contract_type: 'permanent', job_type: 'Full-time',
    required_role_level: 'Senior Therapist',
    salary_min: 34000, salary_max: 40000,
    required_skills: ['Microneedling', 'Chemical peels', 'LED therapy', 'Advanced facials'],
    required_brands: ['Natura Bissé'],
    required_qualifications: ['NVQ Level 4 Beauty Therapy', 'Level 4 Laser & IPL'],
    tier: 'Platinum', is_agency_role: false, insurance_required: false,
  },
  {
    property: 'The Calder Wellness Club',
    job_title: 'Massage Therapist - evenings',
    job_description: 'Evening cover Tuesday to Thursday, 4pm to 9pm, deep tissue and sports-led. Suits somebody building a London list around daytime work elsewhere.',
    contract_type: 'agency', job_type: 'Part-time',
    required_role_level: 'Therapist',
    salary_min: 140, salary_max: 170,
    required_skills: ['Deep tissue massage', 'Sports massage', 'Trigger point'],
    required_brands: ['Aromatherapy Associates'],
    required_qualifications: ['NVQ Level 3 Beauty Therapy'],
    tier: 'Gold', is_agency_role: true, insurance_required: true,
  },
]

export type DemoCandidate = {
  first_name: string
  last_name: string
  role_level: string
  current_role: string
  experience_years: number
  location: string
  latitude: number
  longitude: number
  max_commute: number
  services_offered: string[]
  skills: string[]
  product_houses: string[]
  qualifications: string[]
  business_skills: string[]
  salary_expectation_min: number
  availability_status: string
  has_insurance: boolean
  review_score: number
  headline: string
}

// Six people, built so the match scores spread rather than all landing at 90.
// A demonstration where everybody is a perfect match proves nothing: the point
// of the score is that it separates, and the reasons panel is what sells it.
export const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    first_name: 'Amelia', last_name: 'Hartley',
    role_level: 'Senior Therapist', current_role: 'Senior Spa Therapist',
    experience_years: 7,
    location: 'Cheltenham, Gloucestershire', latitude: 51.9000, longitude: -2.0800, max_commute: 30,
    services_offered: ['Massage', 'Facials', 'Body treatments'],
    skills: ['Deep tissue massage', 'Hot stone', 'Aromatherapy', 'Advanced facials'],
    product_houses: ['ESPA', 'Elemis'],
    qualifications: ['NVQ Level 3 Beauty Therapy', 'CIDESCO'],
    business_skills: ['Retail targets', 'Mentoring juniors'],
    salary_expectation_min: 30000,
    availability_status: 'available', has_insurance: true, review_score: 4.8,
    headline: 'Seven years of ESPA across two country house spas, strongest on body and hot stone.',
  },
  {
    first_name: 'Priya', last_name: 'Raman',
    role_level: 'Spa Manager', current_role: 'Assistant Spa Manager',
    experience_years: 11,
    location: 'Swindon, Wiltshire', latitude: 51.5558, longitude: -1.7797, max_commute: 45,
    services_offered: ['Massage', 'Facials', 'Spa management'],
    skills: ['Team leadership', 'Rota planning', 'Stock control', 'Advanced facials'],
    product_houses: ['ESPA', 'Elemis', 'Comfort Zone'],
    qualifications: ['NVQ Level 3 Beauty Therapy', 'CIBTAC'],
    business_skills: ['P&L responsibility', 'Retail targets', 'Recruitment', 'Supplier relationships'],
    salary_expectation_min: 44000,
    availability_status: 'available', has_insurance: true, review_score: 4.9,
    headline: 'Eleven years, the last four running a six-room spa and its P&L.',
  },
  {
    first_name: 'Sofia', last_name: 'Lindqvist',
    role_level: 'Senior Therapist', current_role: 'Advanced Skin Therapist',
    experience_years: 9,
    location: 'Islington, London', latitude: 51.5362, longitude: -0.1033, max_commute: 20,
    services_offered: ['Facials', 'Advanced skin', 'Massage'],
    skills: ['Microneedling', 'Chemical peels', 'LED therapy', 'Advanced facials'],
    product_houses: ['Natura Bissé', 'Aromatherapy Associates'],
    qualifications: ['NVQ Level 4 Beauty Therapy', 'Level 4 Laser & IPL'],
    business_skills: ['Retail targets', 'Client retention'],
    salary_expectation_min: 36000,
    availability_status: 'available', has_insurance: true, review_score: 4.9,
    headline: 'Advanced skin specialist with a members’ club list and a Level 4 laser qualification.',
  },
  {
    first_name: 'Grace', last_name: 'Oyelaran',
    role_level: 'Therapist', current_role: 'Spa Therapist',
    experience_years: 3,
    location: 'Truro, Cornwall', latitude: 50.2632, longitude: -5.0510, max_commute: 35,
    services_offered: ['Massage', 'Facials'],
    skills: ['Swedish massage', 'Aromatherapy', 'Manicure and pedicure'],
    product_houses: ['Comfort Zone'],
    qualifications: ['NVQ Level 3 Beauty Therapy'],
    business_skills: ['Retail targets'],
    salary_expectation_min: 25000,
    availability_status: 'available', has_insurance: true, review_score: 4.6,
    headline: 'Three years on the Cornish coast, Comfort Zone trained, looking to step up.',
  },
  {
    first_name: 'Daniel', last_name: 'Whitcombe',
    role_level: 'Therapist', current_role: 'Freelance Massage Therapist',
    experience_years: 6,
    location: 'Camden, London', latitude: 51.5390, longitude: -0.1426, max_commute: 25,
    services_offered: ['Massage'],
    skills: ['Deep tissue massage', 'Sports massage', 'Trigger point'],
    product_houses: ['Aromatherapy Associates'],
    qualifications: ['NVQ Level 3 Beauty Therapy', 'Level 3 Sports Massage'],
    business_skills: [],
    salary_expectation_min: 150,
    availability_status: 'available', has_insurance: true, review_score: 4.7,
    headline: 'Freelance deep tissue and sports, evenings and weekends across central London.',
  },
  {
    first_name: 'Niamh', last_name: 'Doherty',
    role_level: 'Lead Therapist', current_role: 'Head Therapist',
    experience_years: 8,
    location: 'Plymouth, Devon', latitude: 50.3755, longitude: -4.1427, max_commute: 60,
    services_offered: ['Massage', 'Facials', 'Body treatments'],
    skills: ['Team leadership', 'Training delivery', 'Hot stone', 'Advanced facials'],
    product_houses: ['Temple Spa', 'Comfort Zone'],
    qualifications: ['NVQ Level 3 Beauty Therapy', 'CIBTAC'],
    business_skills: ['Mentoring juniors', 'Training calendar', 'Retail targets'],
    salary_expectation_min: 33000,
    availability_status: 'available', has_insurance: true, review_score: 4.8,
    headline: 'Head therapist with eight years on the south coast and a training brief.',
  },
]

export const demoEmail = (c: DemoCandidate) =>
  `${c.first_name}.${c.last_name}`.toLowerCase().replace(/[^a-z.]/g, '') + '@' + DEMO_EMAIL_DOMAIN

/** The sign-in for a demonstration property, on the same removable domain. */
export const demoPropertyEmail = (companyName: string) =>
  companyName.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  + '@' + DEMO_EMAIL_DOMAIN
