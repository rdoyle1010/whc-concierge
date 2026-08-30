export const ROLE_LEVELS = [
  'Director of Spa', 'Spa Manager', 'Senior Therapist', 'Therapist',
  'Junior Therapist', 'Apprentice', 'Receptionist', 'Wellness Practitioner',
  'Yoga/Pilates Instructor', 'Personal Trainer', 'Nutritionist',
  'Beauty Therapist', 'Nail Technician', 'Hair Stylist', 'Barber',
] as const

export const ROLE_HIERARCHY: Record<string, number> = {
  'Director of Spa': 6, 'Spa Manager': 5, 'Senior Therapist': 4,
  'Therapist': 3, 'Junior Therapist': 2, 'Apprentice': 1,
}

export const SEPARATE_TRACKS = [
  'Receptionist', 'Wellness Practitioner', 'Yoga/Pilates Instructor',
  'Personal Trainer', 'Nutritionist', 'Beauty Therapist',
  'Nail Technician', 'Hair Stylist', 'Barber',
]

export const PRODUCT_HOUSES = [
  'ESPA', 'Elemis', 'Decléor', 'Comfort Zone', 'La Stone', 'Kama Ayurveda',
  '111SKIN', 'Wildsmith', 'Dr Barbara Sturm', 'VOYA', 'Bamford',
  'Subtle Energies', 'Sodashi', 'Ila', 'Thalgo', 'Guinot', 'Dermalogica',
  'IMAGE Skincare', 'Environ', 'Medik8', 'Murad', 'Other',
] as const

export const QUALIFICATIONS = [
  'CIDESCO', 'CIBTAC', 'BTEC Level 2', 'BTEC Level 3', 'NVQ Level 2',
  'NVQ Level 3', 'NVQ Level 4', 'First Aid', 'Manual Handling', 'COSHH',
  'Food Hygiene', 'Level 3 Sports Massage', 'Level 4 Sports Massage',
  'Ayurvedic Training', 'Hot Stone Certified', 'Aromatherapy Diploma',
  'Reflexology Diploma', 'Other',
] as const

export const SYSTEMS = [
  'Book4Time', 'SpaSoft', 'Mindbody', 'Spa Booker', 'Treatwell',
  'Premier Software', 'Rezlynx', 'Opera', 'Other',
] as const

export const COMPANY_TYPES = [
  'Hotel', 'Spa', 'Resort', 'Clinic', 'Cruise', 'Other',
] as const

export const CONTRACT_TYPES = [
  'permanent', 'fixed_term', 'agency_cover', 'residency', 'zero_hours',
] as const

export const TRAVEL_OPTIONS = [
  { value: 'worldwide', label: 'Worldwide' },
  { value: 'europe', label: 'Europe' },
  { value: 'uk_only', label: 'UK Only' },
  { value: 'radius', label: 'Within Radius' },
] as const

export const AVAILABILITY_STATUSES = [
  { value: 'immediately', label: 'Immediately' },
  { value: '1_week', label: '1 Week' },
  { value: '2_weeks', label: '2 Weeks' },
  { value: '1_month', label: '1 Month' },
  { value: 'not_available', label: 'Not Available' },
] as const

export const RESIDENCY_DURATIONS = [
  '1 week', '2 weeks', '1 month', '3 months', '6 months',
] as const

// Legacy tier keys are retained in the database so existing listings keep working.
// Launch checkout offers only Bronze (Standard) and Platinum (Featured).
export const JOB_TIERS = {
  Bronze: {
    price: 14900, days: 30, label: 'Standard Job - £149',
    display: '£149', visibility: 'Standard', matchNotifs: 'Basic',
    badge: null, shortlisting: 'Full', analytics: 'Basic', support: 'Email',
    features: ['30-day listing', 'Talent matching', 'Applications and shortlist', 'Filled-role notifications'],
  },
  Silver: {
    price: 17500, days: 45, label: 'Legacy Silver - £175',
    display: '£175', visibility: 'Enhanced', matchNotifs: 'Priority',
    badge: 'Silver badge', shortlisting: 'Basic', analytics: 'Basic', support: 'Email',
    features: ['Legacy package - existing listings only'],
  },
  Gold: {
    price: 20000, days: 60, label: 'Legacy Gold - £200',
    display: '£200', visibility: 'Premium', matchNotifs: 'Instant',
    badge: 'Gold badge', shortlisting: 'Full', analytics: 'Full', support: 'Priority',
    features: ['Legacy package - existing listings only'],
  },
  Platinum: {
    price: 24900, days: 30, label: 'Featured Job - £249',
    display: '£249', visibility: 'Maximum', matchNotifs: 'Instant + Featured',
    badge: 'Featured job', shortlisting: 'Full + Notes', analytics: 'Full', support: 'Priority',
    features: ['30-day listing', 'Priority search placement', 'Relevant talent email', 'Featured job badge', 'Enhanced employer branding'],
  },
} as const

export type TierName = keyof typeof JOB_TIERS

export const TALENT_MEMBERSHIPS = {
  free: { price: 0, label: 'Talent Free', interviewCredits: 1, rolloverCap: 1, academyDiscountPct: 0 },
  standard: { price: 999, label: 'Talent Standard', interviewCredits: 1, rolloverCap: 3, academyDiscountPct: 10 },
  pro: { price: 1999, label: 'Talent Pro', interviewCredits: 10, rolloverCap: 20, academyDiscountPct: 20 },
} as const

export const FEATURED_TALENT = {
  seven_days: { price: 999, days: 7, label: 'Featured Talent - 7 Days' },
  thirty_days: { price: 2499, days: 30, label: 'Featured Talent - 30 Days' },
} as const

export const EMPLOYER_MEMBERSHIPS = {
  free: { price: 0, label: 'Employer Free', includedJobs: 0 },
  pro: { price: 49900, label: 'Employer Pro', includedJobs: 0, discountedStandardJobPrice: 9900 },
  group: { price: 99900, label: 'Employer Group', includedJobs: 20 },
} as const

export const RESIDENCY_PRICING = {
  standard: { price: 19900, label: 'Standard Residency' },
  featured: { price: 29900, label: 'Featured Residency' },
} as const

export const RECRUITMENT_SERVICE_RATE = 0.125
export const EXECUTIVE_SEARCH_GUIDE_RATE = 0.18
export const EXECUTIVE_SEARCH_RATE_RANGE = [0.15, 0.20] as const

// Agency commercial promise: the professional keeps the full agreed rate.
// WHC charges the property 15% on top of the shift value.
export const AGENCY_COMMISSION_RATE = 0.15
export const AGENCY_PLATFORM_FEE_PCT = 0.15
// Same-day and next-day cover carries an urgency premium on the WHC fee -
// the professional still receives the full agreed rate; the premium prices
// the emergency service the property is buying.
export const AGENCY_URGENT_FEE_SURCHARGE = 0.05

// The WHC fee percentage for a shift, judged by how close the shift date is
// to today (both YYYY-MM-DD, Europe/London). Same-day or next-day => premium.
export function agencyFeePctForShift(shiftDate: string | null | undefined, todayLondon: string): number {
  if (!shiftDate || !todayLondon) return AGENCY_PLATFORM_FEE_PCT
  const d = new Date(`${todayLondon}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  const tomorrow = d.toISOString().slice(0, 10)
  return String(shiftDate) <= tomorrow ? AGENCY_PLATFORM_FEE_PCT + AGENCY_URGENT_FEE_SURCHARGE : AGENCY_PLATFORM_FEE_PCT
}

// Kept as a legacy alias for old Featured Profile code. New one-off featured
// options are £9.99 / 7 days and £24.99 / 30 days.
export const FEATURED_PROFILE_PRICE = FEATURED_TALENT.thirty_days.price

// Hotels must register as a Preferred Employer to book agency cover.
export const PREFERRED_EMPLOYER_PRICE = 15000 // £150/year in pence

// Agency register listing remains separate from Talent membership at launch.
export const AGENCY_LISTING_TIERS = {
  basic: { price: 1000, label: 'Basic', display: '£10/month', features: ['Listed on the agency register', 'Receive shift offers', 'SMS alerts for urgent cover'] },
  featured: { price: 2000, label: 'Featured', display: '£20/month', features: ['Everything in Basic', 'Top placement in the register', 'Featured badge on your profile'] },
} as const

export type AgencyTier = keyof typeof AGENCY_LISTING_TIERS

export const FACILITY_OPTIONS = [
  'Hydrotherapy pool','Vitality pool','Indoor pool','Outdoor pool','Thermal suite','Sauna','Steam room','Hammam',
  'Snow cave / ice fountain','Experience showers','Salt room','Cryotherapy','Flotation','Relaxation lounge',
  'Rooftop terrace','Gym','Fitness studio','Yoga / Pilates studio','Padel or tennis courts','Nail salon','Hair salon',
  'Spa café / healthy dining','Private spa suites','Couples suites',
] as const

export const STAFF_BENEFIT_OPTIONS = [
  'Service charge / tronc','Retail commission','Treatment commission','Spa treatment allowance','Product discount',
  'Free meals on duty','Uniform provided & laundered','Hotel discounts worldwide','Friends & family rates',
  'Pension scheme','Private healthcare','Mental health support','Training budget','Brand training',
  'Clear progression pathway','Accommodation available','Relocation support','Gym use','28+ days holiday',
  'Birthday day off','Employee assistance programme',
] as const
