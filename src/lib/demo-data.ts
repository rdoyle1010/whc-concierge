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
