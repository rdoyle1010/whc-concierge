// Career metadata for Academy courses - the layer that turns a catalogue into
// career progression. Sidecar map keyed by slug (the established pattern), so
// nothing here can break existing enrolments or the DB course override merge.
//
// skills use the platform's own vocabulary (services, business skills, product
// houses) so the matching engine's gap analysis can join to courses directly.

import { ACADEMY } from './academy'

export type CourseLevel = 'Foundation' | 'Professional' | 'Leadership'

export type CourseMeta = {
  level: CourseLevel
  skills: string[]
  cpdHours: number
}

const CORE_META: Record<string, CourseMeta> = {
  'consultation-excellence': { level: 'Professional', skills: ['Consultation', 'Guest Experience'], cpdHours: 0.5 },
  'retail-excellence': { level: 'Professional', skills: ['Retail', 'Product Recommendation', 'Upselling'], cpdHours: 0.5 },
  'five-star-service': { level: 'Foundation', skills: ['Customer Service', 'Guest Experience'], cpdHours: 0.5 },
  'lqa-forbes-standards': { level: 'Professional', skills: ['LQA Standards', 'Forbes Standards', 'Luxury Service Standards'], cpdHours: 0.5 },
  'health-safety-hygiene': { level: 'Foundation', skills: ['Health & Safety', 'Hygiene', 'COSHH'], cpdHours: 0.5 },
  'room-standards': { level: 'Foundation', skills: ['Treatment Room Standards', 'Presentation'], cpdHours: 0.5 },
  'upgrading-treatments': { level: 'Professional', skills: ['Upselling', 'Treatment Enhancement', 'Retail'], cpdHours: 0.5 },
  'personal-presentation': { level: 'Foundation', skills: ['Personal Presentation', 'Professionalism'], cpdHours: 0.5 },
  'perfect-massage': { level: 'Professional', skills: ['Massage', 'Swedish Massage', 'Deep Tissue Massage'], cpdHours: 0.5 },
  'perfect-facial': { level: 'Professional', skills: ['Facial', 'Skin Analysis', 'Classic Facial'], cpdHours: 0.5 },
  'brand-knowledge': { level: 'Professional', skills: ['Product Knowledge', 'Product Houses'], cpdHours: 0.5 },
  'cancer-care-awareness': { level: 'Professional', skills: ['Cancer Care Awareness', 'Adapted Treatments', 'Specialist Care'], cpdHours: 1 },
  'menopause-aware-spa': { level: 'Professional', skills: ['Menopause Awareness', 'Specialist Care'], cpdHours: 1 },
  'pregnancy-postnatal-spa': { level: 'Professional', skills: ['Pregnancy Massage', 'Postnatal Care', 'Specialist Care'], cpdHours: 1 },
  'spa-manager-programme': { level: 'Leadership', skills: ['Leadership', 'People Management', 'Commercial Performance', 'Rota Management', 'KPIs', 'Revenue Management'], cpdHours: 2 },
  'spa-director-programme': { level: 'Leadership', skills: ['Leadership', 'Strategy', 'Budgeting', 'P&L Management', 'Revenue Management', 'Pre-opening', 'Commercial Performance'], cpdHours: 2.5 },
}

const metaCache = new Map<string, CourseMeta>()

export function courseMeta(slug: string): CourseMeta {
  const cached = metaCache.get(slug)
  if (cached) return cached

  let meta = CORE_META[slug]
  if (!meta && slug.endsWith('-masterclass')) {
    // Brand masterclasses: the skill IS the product house, named as the
    // platform names it, so brand gaps in matching map straight to a course.
    const course = ACADEMY.find(c => c.slug === slug)
    const brand = course ? course.title.replace(/\s*Masterclass\s*$/i, '').trim() : slug.replace(/-masterclass$/, '').replace(/-/g, ' ')
    meta = { level: 'Professional', skills: [brand, 'Product Knowledge', 'Retail'], cpdHours: 0.5 }
  }
  if (!meta) meta = { level: 'Professional', skills: [], cpdHours: 0.5 }
  metaCache.set(slug, meta)
  return meta
}

const norm = (value: string) => value.trim().toLowerCase()

// Find active courses that teach a given skill (loose containment both ways,
// matching how the matching engine compares skills).
export function coursesForSkill(skill: string, slugs?: string[]): string[] {
  const key = norm(skill)
  if (!key) return []
  const pool = slugs || ACADEMY.map(c => c.slug)
  return pool.filter(slug => courseMeta(slug).skills.some(s => {
    const candidate = norm(s)
    return candidate === key || candidate.includes(key) || key.includes(candidate)
  }))
}

// The career ladder used for "where you are → what's next".
export const CAREER_LADDER: { level: number; label: string; nextLabel: string; recommendedSlugs: string[] }[] = [
  { level: 1, label: 'Starting out', nextLabel: 'Therapist', recommendedSlugs: ['five-star-service', 'health-safety-hygiene', 'personal-presentation', 'room-standards'] },
  { level: 2, label: 'Junior', nextLabel: 'Therapist', recommendedSlugs: ['five-star-service', 'health-safety-hygiene', 'consultation-excellence'] },
  { level: 3, label: 'Therapist', nextLabel: 'Senior Therapist', recommendedSlugs: ['consultation-excellence', 'perfect-massage', 'perfect-facial', 'retail-excellence'] },
  { level: 4, label: 'Senior Therapist', nextLabel: 'Lead Therapist / Supervisor', recommendedSlugs: ['lqa-forbes-standards', 'upgrading-treatments', 'retail-excellence', 'brand-knowledge'] },
  { level: 5, label: 'Lead / Supervisor', nextLabel: 'Spa Manager', recommendedSlugs: ['spa-manager-programme', 'lqa-forbes-standards'] },
  { level: 6, label: 'Spa Manager', nextLabel: 'Spa Director', recommendedSlugs: ['spa-director-programme'] },
  { level: 7, label: 'Spa Director', nextLabel: 'Regional / Corporate Wellness Leadership', recommendedSlugs: ['spa-director-programme'] },
]

// Same role-name → level mapping the matching engine uses (kept small and local).
const ROLE_LEVEL_NAMES: Record<string, number> = {
  'Apprentice': 1, 'Spa Attendant': 1, 'Junior': 2, 'Junior Therapist': 2, 'Receptionist': 2, 'Spa Receptionist': 2,
  'Nail Technician': 2, 'Therapist': 3, 'Beauty Therapist': 3, 'Massage Therapist': 3, 'Spa Therapist': 3,
  'Fitness Instructor': 3, 'Personal Trainer': 3, 'Yoga Instructor': 3, 'Pilates Instructor': 3,
  'Nutritionist': 3, 'Hair Stylist': 3, 'Barber': 3, 'Senior Therapist': 4,
  'Lead Therapist': 5, 'Supervisor': 5, 'Spa Supervisor': 5, 'Assistant Spa Manager': 5,
  'Spa Manager': 6, 'Operations Manager': 6, 'Spa & Wellness Operations Manager': 6,
  'Spa Director': 7, 'Director': 7, 'Director of Spa': 7, 'Wellness Director': 7,
}

export function careerPosition(roleLevel: string | null | undefined) {
  const raw = String(roleLevel || '').trim()
  let level = ROLE_LEVEL_NAMES[raw]
  if (!level) {
    const key = norm(raw)
    for (const [name, value] of Object.entries(ROLE_LEVEL_NAMES)) {
      if (key && (norm(name) === key || key.includes(norm(name)))) { level = value; break }
    }
  }
  if (!level) level = 3
  const rung = CAREER_LADDER.find(r => r.level === Math.min(level, 7)) || CAREER_LADDER[2]
  return { level, currentLabel: raw || rung.label, nextLabel: rung.nextLabel, recommendedSlugs: rung.recommendedSlugs }
}
