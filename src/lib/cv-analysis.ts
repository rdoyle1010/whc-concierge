import { PRODUCT_HOUSES_FULL, QUALS_CATEGORIES, SERVICES_CATEGORIES, SYSTEMS_FULL } from '@/lib/taxonomy'

export type CvSuggestions = {
  roleLevel: string | null
  experienceYears: number | null
  services: string[]
  productHouses: string[]
  qualifications: string[]
  systems: string[]
  businessSkills: string[]
  careerEvidence: string[]
  progressionSignals: string[]
  evidence: string[]
  aiEnhanced?: boolean
}

function searchable(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9+#]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function contains(text: string, value: string): boolean {
  const needle = searchable(value)
  return needle.length >= 3 && ` ${text} `.includes(` ${needle} `)
}

function matchingItems(text: string, items: string[]): string[] {
  return items.filter(item => contains(text, item))
}

function detectRole(text: string): string | null {
  if (/\b(group )?(spa|wellness).{0,12}director\b|\bdirector of (spa|wellness)\b|\bhead of (spa|wellness)\b/.test(text)) return 'Director of Spa'
  if (/\b(spa|wellness|operations).{0,12}manager\b/.test(text)) return 'Spa Manager'
  if (/\blead.{0,12}therapist\b|\bteam lead\b|\bsupervisor\b/.test(text)) return 'Lead Therapist'
  if (/\bsenior.{0,12}therapist\b/.test(text)) return 'Senior Therapist'
  if (/\bspa receptionist\b|\bfront desk\b/.test(text)) return 'Receptionist'
  if (/\bbeauty therapist\b/.test(text)) return 'Beauty Therapist'
  if (/\bspa therapist\b|\bmassage therapist\b/.test(text)) return 'Therapist'
  if (/\bwellness practitioner\b/.test(text)) return 'Wellness Practitioner'
  if (/\bpersonal trainer\b/.test(text)) return 'Personal Trainer'
  if (/\byoga.{0,12}(teacher|instructor)\b|\bpilates.{0,12}instructor\b/.test(text)) return 'Yoga/Pilates Instructor'
  if (/\bnail technician\b/.test(text)) return 'Nail Technician'
  if (/\bhair stylist\b|\bhairdresser\b/.test(text)) return 'Hair Stylist'
  if (/\bbarber\b/.test(text)) return 'Barber'
  return null
}

function detectExperience(text: string): number | null {
  const values = Array.from(text.matchAll(/\b(?:over |more than |approximately |approx |nearly )?(\d{1,2})\+?\s+years?(?:'| of)?\s+(?:experience|expertise|in (?:spa|wellness|hospitality|beauty))/g))
    .map(match => Number(match[1]))
    .filter(value => value >= 1 && value <= 60)
  return values.length ? Math.max(...values) : null
}

const BUSINESS_PATTERNS: Array<[string, RegExp]> = [
  ['Team Leadership', /team lead|managed (?:a )?team|line manag|people management|direct reports|supervis/],
  ['Staff Training', /train(?:ed|ing)|coach(?:ed|ing)|mentor(?:ed|ing)|onboard/],
  ['Rota Management', /rota|roster|scheduling staff|workforce planning/],
  ['Revenue Management', /revenue|commercial performance|sales target|turnover/],
  ['Budget Management', /budget|p&l|profit and loss|forecast|payroll|labour cost/],
  ['KPI Reporting', /kpi|performance report|dashboard|metric/],
  ['Upselling & Retail', /retail|upsell|rebook|conversion|product sales/],
  ['Stock Control', /stock control|inventory|stocktake|ordering/],
  ['Health & Safety', /health and safety|risk assessment|h&s|compliance/],
  ['Reception & Front of House', /reception|front of house|front desk|reservations/],
  ['Membership Management', /membership|member retention|member journey/],
  ['Event Coordination', /event|activation|launch|open day/],
]

function detectBusinessSkills(text: string): string[] {
  return BUSINESS_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)
}

export function analyseCvText(rawText: string): CvSuggestions {
  const text = searchable(rawText)
  const services = matchingItems(text, SERVICES_CATEGORIES.flatMap(category => category.items))
  const productHouses = matchingItems(text, PRODUCT_HOUSES_FULL)
  const qualifications = matchingItems(text, QUALS_CATEGORIES.flatMap(category => category.items))
  const systems = matchingItems(text, SYSTEMS_FULL)
  const roleLevel = detectRole(text)
  const experienceYears = detectExperience(text)
  const businessSkills = detectBusinessSkills(text)

  const evidence: string[] = []
  if (roleLevel) evidence.push(`Role wording supports ${roleLevel}`)
  if (experienceYears) evidence.push(`${experienceYears} years of experience stated`)
  if (qualifications.length) evidence.push(`${qualifications.length} recognised qualification${qualifications.length === 1 ? '' : 's'} found`)
  if (productHouses.length) evidence.push(`${productHouses.length} product house${productHouses.length === 1 ? '' : 's'} found`)
  if (services.length) evidence.push(`${services.length} treatment or wellness service${services.length === 1 ? '' : 's'} found`)
  if (systems.length) evidence.push(`${systems.length} booking or hotel system${systems.length === 1 ? '' : 's'} found`)
  if (businessSkills.length) evidence.push(`${businessSkills.length} business or leadership skill${businessSkills.length === 1 ? '' : 's'} found`)

  return {
    roleLevel,
    experienceYears,
    services,
    productHouses,
    qualifications,
    systems,
    businessSkills,
    careerEvidence: [],
    progressionSignals: [],
    evidence,
    aiEnhanced: false,
  }
}
