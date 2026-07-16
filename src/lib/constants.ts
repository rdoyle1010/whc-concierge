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

export const JOB_TIERS = {
  Bronze: {
    price: 15000, days: 30, label: 'Bronze — £150',
    display: '£150', visibility: 'Standard', matchNotifs: 'Basic',
    badge: null, shortlisting: null, analytics: null, support: 'Email',
    features: ['30-day listing', 'Basic matching', 'Applicant tracking'],
  },
  Silver: {
    price: 17500, days: 45, label: 'Silver — £175',
    display: '£175', visibility: 'Enhanced', matchNotifs: 'Priority',
    badge: 'Silver badge', shortlisting: 'Basic', analytics: 'Basic', support: 'Email',
    features: ['45-day listing', 'Enhanced matching', 'Priority support', 'Applicant tracking'],
  },
  Gold: {
    price: 20000, days: 60, label: 'Gold — £200', popular: true,
    display: '£200', visibility: 'Premium', matchNotifs: 'Instant',
    badge: 'Gold badge', shortlisting: 'Full', analytics: 'Full', support: 'Priority',
    features: ['60-day listing', 'Advanced matching', 'Featured placement', 'Direct messaging'],
  },
  Platinum: {
    price: 25000, days: 90, label: 'Platinum — £250',
    display: '£250', visibility: 'Maximum', matchNotifs: 'Instant + Featured',
    badge: 'Platinum badge', shortlisting: 'Full + Notes', analytics: 'Full + Export', support: 'Dedicated',
    features: ['90-day listing', 'Priority matching', 'Homepage featuring', 'Social promotion', 'Full analytics'],
  },
} as const

export type TierName = keyof typeof JOB_TIERS

export const FEATURED_PROFILE_PRICE = 1000 // £10/month in pence
export const AGENCY_COMMISSION_RATE = 0.10 // 10%

// Agency money flow (decided 15 Jul): ALL booking money goes through WHC.
// The property pays rate × hours + 10% at acceptance; WHC pays the therapist
// out after the shift, minus 5%. Both sides also subscribe (below).
export const AGENCY_PLATFORM_FEE_PCT = 0.10   // charged to the property, on top
export const AGENCY_CANDIDATE_FEE_PCT = 0.05  // deducted from the therapist's payout

// Hotels must register as a Preferred Employer to book agency cover.
export const PREFERRED_EMPLOYER_PRICE = 15000 // £150/year in pence

// Monthly subscription for candidates to appear on the agency register.
// Prices in pence. Featured tier appears first in the directory.
export const AGENCY_LISTING_TIERS = {
  basic: { price: 1000, label: 'Basic', display: '£10/month', features: ['Listed on the agency register', 'Receive shift offers', 'SMS alerts for urgent cover'] },
  featured: { price: 2000, label: 'Featured', display: '£20/month', features: ['Everything in Basic', 'Top placement in the register', 'Featured badge on your profile'] },
} as const

export type AgencyTier = keyof typeof AGENCY_LISTING_TIERS
