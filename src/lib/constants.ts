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
  Bronze: { price: 15000, days: 30, label: 'Bronze — £150' },
  Silver: { price: 20000, days: 60, label: 'Silver — £200' },
  Gold: { price: 22500, days: 75, label: 'Gold — £225' },
  Platinum: { price: 25000, days: 90, label: 'Platinum — £250' },
} as const

export const FEATURED_PROFILE_PRICE = 2000 // £20/month in pence
export const AGENCY_COMMISSION_RATE = 0.10 // 10%
