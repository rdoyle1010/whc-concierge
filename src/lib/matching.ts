import { ROLE_HIERARCHY, SEPARATE_TRACKS } from './constants'

export interface MatchBreakdown {
  roleLevel: number
  productHouses: number
  qualifications: number
  location: number
}

export interface MatchResult {
  candidateId: string
  score: number
  label: string
  breakdown: MatchBreakdown
  hardStop: boolean
  hardStopReason?: string
}

interface CandidateProfile {
  id: string
  role_level?: string
  product_houses?: string[]
  qualifications?: string[]
  systems_experience?: string[]
  travel_availability?: string
  travel_radius_miles?: number
  postcode?: string
  has_insurance?: boolean
  is_featured?: boolean
  review_score?: number
  profile_completion_score?: number
  [key: string]: any
}

interface JobListing {
  required_role_level?: string
  required_product_houses?: string[]
  required_brands?: string[] // real DB column name
  required_qualifications?: string[]
  required_systems?: string[]
  location_postcode?: string
  radius_miles?: number
  insurance_required?: boolean
  [key: string]: any
}

const WEIGHTS = {
  roleLevel: 0.35,
  productHouses: 0.25,
  qualifications: 0.25,
  location: 0.15,
}

function getRoleLevelScore(candidateRole?: string, requiredRole?: string): { score: number; hardStop: boolean } {
  if (!requiredRole || !candidateRole) return { score: 100, hardStop: false }

  // Separate tracks only match their own
  if (SEPARATE_TRACKS.includes(requiredRole)) {
    return candidateRole === requiredRole
      ? { score: 100, hardStop: false }
      : { score: 0, hardStop: true }
  }
  if (SEPARATE_TRACKS.includes(candidateRole)) {
    return candidateRole === requiredRole
      ? { score: 100, hardStop: false }
      : { score: 0, hardStop: true }
  }

  const candidateLevel = ROLE_HIERARCHY[candidateRole]
  const requiredLevel = ROLE_HIERARCHY[requiredRole]

  if (candidateLevel === undefined || requiredLevel === undefined) {
    return candidateRole === requiredRole
      ? { score: 100, hardStop: false }
      : { score: 50, hardStop: false }
  }

  const diff = Math.abs(candidateLevel - requiredLevel)
  if (diff === 0) return { score: 100, hardStop: false }
  if (diff === 1) return { score: 60, hardStop: false }
  if (diff === 2) return { score: 20, hardStop: false }
  return { score: 0, hardStop: true } // 3+ levels = hard stop
}

function getArrayMatchScore(candidateItems: string[] | undefined, requiredItems: string[] | undefined): number {
  if (!requiredItems || requiredItems.length === 0) return 100
  if (!candidateItems || candidateItems.length === 0) return 0

  const candidateSet = new Set(candidateItems.map(i => i.toLowerCase()))
  const matches = requiredItems.filter(r => candidateSet.has(r.toLowerCase())).length
  return Math.round((matches / requiredItems.length) * 100)
}

function getLocationScore(candidate: CandidateProfile, job: JobListing): { score: number; hardStop: boolean } {
  if (!job.location_postcode) return { score: 100, hardStop: false }

  const travel = candidate.travel_availability || 'uk_only'

  if (travel === 'worldwide') return { score: 100, hardStop: false }
  if (travel === 'europe') return { score: 90, hardStop: false }
  if (travel === 'uk_only') return { score: 100, hardStop: false }

  // Radius-based — simplified without geocoding
  if (travel === 'radius') {
    if (!candidate.postcode || !candidate.travel_radius_miles) {
      return { score: 50, hardStop: false }
    }
    // Without a geocoding API, we give a reasonable score
    // In production, calculate actual distance
    return { score: 70, hardStop: false }
  }

  return { score: 80, hardStop: false }
}

function getMatchLabel(score: number): string {
  if (score >= 90) return 'Perfect Match'
  if (score >= 75) return 'Strong Match'
  if (score >= 60) return 'Good Match'
  if (score >= 45) return 'Partial Match'
  return 'Low Match'
}

export function calculateMatchScore(candidate: CandidateProfile, job: JobListing): MatchResult {
  // Hard stop: insurance required but not held
  if (job.insurance_required && !candidate.has_insurance) {
    return {
      candidateId: candidate.id,
      score: 0,
      label: 'Excluded',
      breakdown: { roleLevel: 0, productHouses: 0, qualifications: 0, location: 0 },
      hardStop: true,
      hardStopReason: 'Insurance required but not held',
    }
  }

  // Role level
  const roleResult = getRoleLevelScore(candidate.role_level, job.required_role_level)
  if (roleResult.hardStop) {
    return {
      candidateId: candidate.id,
      score: 0,
      label: 'Excluded',
      breakdown: { roleLevel: 0, productHouses: 0, qualifications: 0, location: 0 },
      hardStop: true,
      hardStopReason: 'Role level gap too large',
    }
  }

  // Location
  const locationResult = getLocationScore(candidate, job)
  if (locationResult.hardStop) {
    return {
      candidateId: candidate.id,
      score: 0,
      label: 'Excluded',
      breakdown: { roleLevel: 0, productHouses: 0, qualifications: 0, location: 0 },
      hardStop: true,
      hardStopReason: 'Outside travel range',
    }
  }

  // Product houses and qualifications — check both column name variants
  const jobBrands = job.required_product_houses || job.required_brands
  const productScore = getArrayMatchScore(candidate.product_houses, jobBrands)
  const qualScore = getArrayMatchScore(candidate.qualifications, job.required_qualifications)

  const breakdown: MatchBreakdown = {
    roleLevel: roleResult.score,
    productHouses: productScore,
    qualifications: qualScore,
    location: locationResult.score,
  }

  // Weighted base score
  let score = Math.round(
    breakdown.roleLevel * WEIGHTS.roleLevel +
    breakdown.productHouses * WEIGHTS.productHouses +
    breakdown.qualifications * WEIGHTS.qualifications +
    breakdown.location * WEIGHTS.location
  )

  // Boosts
  if (candidate.is_featured) score = Math.min(100, score + 3)
  if (candidate.review_score && candidate.review_score >= 4.5) score = Math.min(100, score + 5)
  else if (candidate.review_score && candidate.review_score >= 4.0) score = Math.min(100, score + 3)
  if (candidate.profile_completion_score && candidate.profile_completion_score >= 90) score = Math.min(100, score + 2)

  return {
    candidateId: candidate.id,
    score,
    label: getMatchLabel(score),
    breakdown,
    hardStop: false,
  }
}

export function rankCandidates(candidates: CandidateProfile[], job: JobListing, minScore = 45): MatchResult[] {
  return candidates
    .map(c => calculateMatchScore(c, job))
    .filter(r => !r.hardStop && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
}
