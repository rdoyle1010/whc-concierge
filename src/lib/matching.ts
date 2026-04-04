import { ROLE_HIERARCHY, SEPARATE_TRACKS } from './constants'

export interface MatchBreakdown {
  roleLevel: number
  productHouses: number
  qualifications: number
  location: number
  experience: number
}

export interface MatchResult {
  candidateId: string
  score: number
  label: string
  badgeClass: string
  breakdown: MatchBreakdown
  hardStop: boolean
  hardStopReason?: string
  matchingSkills?: string[]
}

interface CandidateProfile {
  id: string
  role_level?: string
  product_houses?: string[]
  qualifications?: string[]
  systems_experience?: string[]
  specialisms?: string[]
  travel_availability?: string
  travel_radius_miles?: number
  postcode?: string
  has_insurance?: boolean
  is_featured?: boolean
  review_score?: number
  profile_completion_score?: number
  experience_years?: number
  [key: string]: any
}

interface JobListing {
  required_role_level?: string
  required_product_houses?: string[]
  required_brands?: string[]
  required_qualifications?: string[]
  required_systems?: string[]
  location_postcode?: string
  radius_miles?: number
  insurance_required?: boolean
  [key: string]: any
}

const WEIGHTS = { roleLevel: 0.30, productHouses: 0.25, qualifications: 0.20, location: 0.15, experience: 0.10 }

function getRoleLevelScore(candidateRole?: string, requiredRole?: string): { score: number; hardStop: boolean } {
  if (!requiredRole || !candidateRole) return { score: 100, hardStop: false }
  if (SEPARATE_TRACKS.includes(requiredRole)) return candidateRole === requiredRole ? { score: 100, hardStop: false } : { score: 0, hardStop: true }
  if (SEPARATE_TRACKS.includes(candidateRole)) return candidateRole === requiredRole ? { score: 100, hardStop: false } : { score: 0, hardStop: true }
  const cLvl = ROLE_HIERARCHY[candidateRole], rLvl = ROLE_HIERARCHY[requiredRole]
  if (cLvl === undefined || rLvl === undefined) return candidateRole === requiredRole ? { score: 100, hardStop: false } : { score: 50, hardStop: false }
  const diff = Math.abs(cLvl - rLvl)
  if (diff === 0) return { score: 100, hardStop: false }
  if (diff === 1) return { score: 60, hardStop: false }
  if (diff === 2) return { score: 20, hardStop: false }
  return { score: 0, hardStop: true }
}

function getArrayMatchScore(candidateItems: string[] | undefined, requiredItems: string[] | undefined): { score: number; matching: string[] } {
  if (!requiredItems || requiredItems.length === 0) return { score: 100, matching: [] }
  if (!candidateItems || candidateItems.length === 0) return { score: 0, matching: [] }
  const candidateSet = new Set(candidateItems.map(i => i.toLowerCase()))
  const matching = requiredItems.filter(r => candidateSet.has(r.toLowerCase()))
  return { score: Math.round((matching.length / requiredItems.length) * 100), matching }
}

function getLocationScore(candidate: CandidateProfile): number {
  const travel = candidate.travel_availability || 'uk_only'
  if (travel === 'worldwide') return 100
  if (travel === 'uk_only') return 80
  if (travel === 'europe') return 70
  if (travel === 'radius') return candidate.travel_radius_miles ? 60 : 50
  return 70
}

function getMatchLabel(score: number): { label: string; badgeClass: string } {
  if (score >= 90) return { label: 'Perfect Match', badgeClass: 'match-perfect' }
  if (score >= 75) return { label: 'Strong Match', badgeClass: 'match-strong' }
  if (score >= 60) return { label: 'Good Match', badgeClass: 'match-good' }
  if (score >= 45) return { label: 'Partial Match', badgeClass: 'match-partial' }
  return { label: 'Low Match', badgeClass: 'match-partial' }
}

export function calculateMatchScore(candidate: CandidateProfile, job: JobListing): MatchResult {
  const empty: MatchResult = { candidateId: candidate.id, score: 0, label: 'Excluded', badgeClass: '', breakdown: { roleLevel: 0, productHouses: 0, qualifications: 0, location: 0, experience: 0 }, hardStop: true }

  if (job.insurance_required && !candidate.has_insurance) return { ...empty, hardStopReason: 'Insurance required' }

  const roleResult = getRoleLevelScore(candidate.role_level, job.required_role_level)
  if (roleResult.hardStop) return { ...empty, hardStopReason: 'Role level mismatch' }

  const jobBrands = job.required_product_houses || job.required_brands
  const brandResult = getArrayMatchScore(candidate.product_houses, jobBrands)
  const qualResult = getArrayMatchScore(candidate.qualifications, job.required_qualifications)
  const locationScore = getLocationScore(candidate)
  const experienceScore = 100 // Default full score — can be refined with min_experience on job

  const breakdown: MatchBreakdown = {
    roleLevel: roleResult.score,
    productHouses: brandResult.score,
    qualifications: qualResult.score,
    location: locationScore,
    experience: experienceScore,
  }

  let score = Math.round(
    breakdown.roleLevel * WEIGHTS.roleLevel +
    breakdown.productHouses * WEIGHTS.productHouses +
    breakdown.qualifications * WEIGHTS.qualifications +
    breakdown.location * WEIGHTS.location +
    breakdown.experience * WEIGHTS.experience
  )

  // Boosts
  if (candidate.is_featured) score = Math.min(100, score + 3)
  if (candidate.review_score && candidate.review_score >= 4.5) score = Math.min(100, score + 5)
  else if (candidate.review_score && candidate.review_score >= 4.0) score = Math.min(100, score + 3)
  if (candidate.profile_completion_score && candidate.profile_completion_score >= 90) score = Math.min(100, score + 2)

  const { label, badgeClass } = getMatchLabel(score)
  const matchingSkills = [...brandResult.matching, ...qualResult.matching].slice(0, 3)

  return { candidateId: candidate.id, score, label, badgeClass, breakdown, hardStop: false, matchingSkills }
}

export function rankCandidates(candidates: CandidateProfile[], job: JobListing, minScore = 45): MatchResult[] {
  return candidates.map(c => calculateMatchScore(c, job)).filter(r => !r.hardStop && r.score >= minScore).sort((a, b) => b.score - a.score)
}
