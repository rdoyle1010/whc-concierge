/**
 * WHC CONCIERGE — STRUCTURED TAXONOMY MATCHING ENGINE
 *
 * This is a weighted scoring engine that compares a candidate's structured
 * profile against a job's structured requirements. Both sides select from
 * the same taxonomy — no keyword matching, no free text guessing.
 *
 * SCORING CATEGORIES & WEIGHTS:
 *   Treatment skills (required):  30%
 *   Treatment skills (preferred): 10%
 *   Systems knowledge:            10%
 *   Brand experience:             10%
 *   Certifications:               10%
 *   Commercial skills:            10%
 *   Leadership / operations:      10%
 *   Eligibility fit:              10%
 *                                -----
 *                                100%
 *
 * RULES:
 *   - Required items missing → heavy penalty
 *   - Preferred items missing → soft penalty
 *   - Trainable items missing → shown as gap, minimal penalty
 *   - Hard blockers (visa, location) → disqualify entirely
 *   - A 100% match should be rare
 */

// ── Types ──

export interface TaxonomyItem {
  id: string
  category: string
  name: string
}

export interface CandidateTaxonomyEntry {
  taxonomy_id: string
  proficiency?: string
  years_using?: number
  taxonomy_item?: TaxonomyItem
}

export interface JobRequirement {
  taxonomy_id: string
  importance: 'required' | 'preferred' | 'trainable'
  minimum_proficiency?: string
  taxonomy_item?: TaxonomyItem
}

export interface CandidateForMatching {
  id: string
  role_level?: string
  years_experience?: number
  location?: string
  right_to_work?: string
  willing_to_relocate?: boolean
  employment_type_wanted?: string[]
  availability_date?: string
  taxonomy: CandidateTaxonomyEntry[]
}

export interface JobForMatching {
  id: string
  job_title: string
  role_level?: string
  employment_type?: string
  location?: string
  visa_sponsorship?: boolean
  relocation_support?: boolean
  start_date?: string
  employer_name?: string
  requirements: JobRequirement[]
}

export interface CategoryScore {
  score: number
  maxPoints: number
  matched: string[]
  missing: string[]
  trainable: string[]
}

export interface MatchResult {
  candidateId: string
  jobId: string
  overallScore: number
  label: string
  colour: string
  bgColour: string
  breakdown: {
    requiredSkills: CategoryScore
    preferredSkills: CategoryScore
    systems: CategoryScore
    brands: CategoryScore
    certifications: CategoryScore
    commercialSkills: CategoryScore
    leadershipSkills: CategoryScore
    eligibility: CategoryScore
  }
  strengths: string[]
  missing: string[]
  trainableGaps: string[]
  hardBlocked: boolean
  hardBlockReason?: string
}

// ── Weights ──

const WEIGHTS = {
  requiredSkills: 0.30,
  preferredSkills: 0.10,
  systems: 0.10,
  brands: 0.10,
  certifications: 0.10,
  commercialSkills: 0.10,
  leadershipSkills: 0.10,
  eligibility: 0.10,
}

// ── Proficiency scoring ──

const PROFICIENCY_SCORE: Record<string, number> = {
  basic: 0.5,
  competent: 0.75,
  advanced: 0.9,
  expert: 1.0,
}

function proficiencyMeetsMinimum(has: string | undefined, needs: string | undefined): boolean {
  if (!needs) return true
  const hasVal = PROFICIENCY_SCORE[has || 'competent'] || 0.75
  const needsVal = PROFICIENCY_SCORE[needs] || 0.5
  return hasVal >= needsVal
}

// ── Category scoring ──

function scoreCategoryRequirements(
  candidateTaxIds: Set<string>,
  candidateTaxMap: Map<string, CandidateTaxonomyEntry>,
  requirements: JobRequirement[],
  importanceFilter: 'required' | 'preferred',
  taxonomyLookup: Map<string, string>
): CategoryScore {
  const filtered = requirements.filter(r => r.importance === importanceFilter)
  if (filtered.length === 0) return { score: 100, maxPoints: 0, matched: [], missing: [], trainable: [] }

  const matched: string[] = []
  const missing: string[] = []
  const trainable: string[] = []
  let points = 0

  for (const req of filtered) {
    const name = taxonomyLookup.get(req.taxonomy_id) || req.taxonomy_item?.name || req.taxonomy_id

    if (candidateTaxIds.has(req.taxonomy_id)) {
      const entry = candidateTaxMap.get(req.taxonomy_id)
      if (proficiencyMeetsMinimum(entry?.proficiency, req.minimum_proficiency)) {
        matched.push(name)
        points += 1
      } else {
        // Has it but not at required level — partial credit
        matched.push(name)
        points += 0.6
      }
    } else {
      missing.push(name)
      points += 0 // No credit
    }
  }

  return {
    score: Math.round((points / filtered.length) * 100),
    maxPoints: filtered.length,
    matched,
    missing,
    trainable,
  }
}

function scoreTrainableGaps(
  candidateTaxIds: Set<string>,
  requirements: JobRequirement[],
  taxonomyLookup: Map<string, string>
): string[] {
  return requirements
    .filter(r => r.importance === 'trainable' && !candidateTaxIds.has(r.taxonomy_id))
    .map(r => taxonomyLookup.get(r.taxonomy_id) || r.taxonomy_item?.name || 'Unknown')
}

// ── Eligibility scoring ──

function scoreEligibility(candidate: CandidateForMatching, job: JobForMatching): CategoryScore {
  let points = 0
  let maxPoints = 3
  const matched: string[] = []
  const missing: string[] = []

  // Right to work
  if (candidate.right_to_work === 'uk_citizen' || candidate.right_to_work === 'settled_status') {
    points += 1
    matched.push('Right to work')
  } else if (candidate.right_to_work === 'visa_sponsored' && job.visa_sponsorship) {
    points += 1
    matched.push('Visa sponsorship available')
  } else if (candidate.right_to_work === 'eu_national') {
    points += 0.7
    matched.push('EU national')
  } else {
    missing.push('Right to work')
  }

  // Employment type
  const wantedTypes = candidate.employment_type_wanted || []
  if (wantedTypes.includes(job.employment_type || '') || wantedTypes.length === 0) {
    points += 1
    matched.push('Employment type match')
  } else {
    missing.push(`Wants ${wantedTypes.join('/')} not ${job.employment_type}`)
    points += 0.3
  }

  // Location / relocation
  if (candidate.location === job.location) {
    points += 1
    matched.push('Same location')
  } else if (candidate.willing_to_relocate || job.relocation_support) {
    points += 0.7
    matched.push('Willing to relocate')
  } else {
    points += 0.3
    missing.push('Different location')
  }

  return { score: Math.round((points / maxPoints) * 100), maxPoints, matched, missing, trainable: [] }
}

// ── Label and colour from score ──

function getLabel(score: number): { label: string; colour: string; bgColour: string } {
  if (score >= 90) return { label: 'Excellent Match', colour: '#16A34A', bgColour: '#DCFCE7' }
  if (score >= 80) return { label: 'Strong Match', colour: '#1D4ED8', bgColour: '#DBEAFE' }
  if (score >= 70) return { label: 'Good Match', colour: '#2563EB', bgColour: '#DBEAFE' }
  if (score >= 60) return { label: 'Moderate Match', colour: '#D97706', bgColour: '#FEF3C7' }
  if (score >= 45) return { label: 'Partial Match', colour: '#6B7280', bgColour: '#F3F4F6' }
  return { label: 'Low Match', colour: '#6B7280', bgColour: '#F3F4F6' }
}

// ═══════ MAIN FUNCTION ═══════

export function calculateTaxonomyMatch(
  candidate: CandidateForMatching,
  job: JobForMatching,
  allTaxonomy: TaxonomyItem[]
): MatchResult {

  // Build lookup maps
  const taxonomyLookup = new Map(allTaxonomy.map(t => [t.id, t.name]))
  const taxonomyCategory = new Map(allTaxonomy.map(t => [t.id, t.category]))

  const candidateTaxIds = new Set(candidate.taxonomy.map(ct => ct.taxonomy_id))
  const candidateTaxMap = new Map(candidate.taxonomy.map(ct => [ct.taxonomy_id, ct]))

  // Split job requirements by category
  const reqsByCategory = {
    treatment_skill: job.requirements.filter(r => taxonomyCategory.get(r.taxonomy_id) === 'treatment_skill'),
    system: job.requirements.filter(r => taxonomyCategory.get(r.taxonomy_id) === 'system'),
    brand: job.requirements.filter(r => taxonomyCategory.get(r.taxonomy_id) === 'brand'),
    certification: job.requirements.filter(r => taxonomyCategory.get(r.taxonomy_id) === 'certification'),
    commercial_skill: job.requirements.filter(r => taxonomyCategory.get(r.taxonomy_id) === 'commercial_skill'),
    leadership_skill: job.requirements.filter(r => taxonomyCategory.get(r.taxonomy_id) === 'leadership_skill'),
  }

  // Score each category
  const requiredSkills = scoreCategoryRequirements(candidateTaxIds, candidateTaxMap, reqsByCategory.treatment_skill, 'required', taxonomyLookup)
  const preferredSkills = scoreCategoryRequirements(candidateTaxIds, candidateTaxMap, reqsByCategory.treatment_skill, 'preferred', taxonomyLookup)
  const systems = scoreCategoryRequirements(candidateTaxIds, candidateTaxMap, reqsByCategory.system, 'required', taxonomyLookup)
  const brands = scoreCategoryRequirements(candidateTaxIds, candidateTaxMap, reqsByCategory.brand, 'required', taxonomyLookup)
  const certifications = scoreCategoryRequirements(candidateTaxIds, candidateTaxMap, reqsByCategory.certification, 'required', taxonomyLookup)
  const commercialSkills = scoreCategoryRequirements(candidateTaxIds, candidateTaxMap, reqsByCategory.commercial_skill, 'required', taxonomyLookup)
  const leadershipSkills = scoreCategoryRequirements(candidateTaxIds, candidateTaxMap, reqsByCategory.leadership_skill, 'required', taxonomyLookup)
  const eligibility = scoreEligibility(candidate, job)

  // Collect trainable gaps across all categories
  const trainableGaps = [
    ...scoreTrainableGaps(candidateTaxIds, reqsByCategory.treatment_skill, taxonomyLookup),
    ...scoreTrainableGaps(candidateTaxIds, reqsByCategory.system, taxonomyLookup),
    ...scoreTrainableGaps(candidateTaxIds, reqsByCategory.brand, taxonomyLookup),
    ...scoreTrainableGaps(candidateTaxIds, reqsByCategory.certification, taxonomyLookup),
    ...scoreTrainableGaps(candidateTaxIds, reqsByCategory.commercial_skill, taxonomyLookup),
    ...scoreTrainableGaps(candidateTaxIds, reqsByCategory.leadership_skill, taxonomyLookup),
  ]

  // Weighted total
  const overallScore = Math.round(
    requiredSkills.score * WEIGHTS.requiredSkills +
    preferredSkills.score * WEIGHTS.preferredSkills +
    systems.score * WEIGHTS.systems +
    brands.score * WEIGHTS.brands +
    certifications.score * WEIGHTS.certifications +
    commercialSkills.score * WEIGHTS.commercialSkills +
    leadershipSkills.score * WEIGHTS.leadershipSkills +
    eligibility.score * WEIGHTS.eligibility
  )

  // Collect all strengths and missing
  const strengths = [
    ...requiredSkills.matched,
    ...systems.matched,
    ...brands.matched,
    ...certifications.matched,
    ...eligibility.matched,
  ]

  const missing = [
    ...requiredSkills.missing,
    ...systems.missing,
    ...brands.missing,
    ...certifications.missing,
    ...commercialSkills.missing,
    ...leadershipSkills.missing,
  ]

  const { label, colour, bgColour } = getLabel(overallScore)

  return {
    candidateId: candidate.id,
    jobId: job.id,
    overallScore,
    label,
    colour,
    bgColour,
    breakdown: {
      requiredSkills,
      preferredSkills,
      systems,
      brands,
      certifications,
      commercialSkills,
      leadershipSkills,
      eligibility,
    },
    strengths,
    missing,
    trainableGaps,
    hardBlocked: false,
  }
}

// ═══════ RANK CANDIDATES FOR A JOB ═══════

export function rankCandidatesForJob(
  candidates: CandidateForMatching[],
  job: JobForMatching,
  taxonomy: TaxonomyItem[],
  minScore = 30
): MatchResult[] {
  return candidates
    .map(c => calculateTaxonomyMatch(c, job, taxonomy))
    .filter(r => !r.hardBlocked && r.overallScore >= minScore)
    .sort((a, b) => b.overallScore - a.overallScore)
}

// ═══════ RANK JOBS FOR A CANDIDATE ═══════

export function rankJobsForCandidate(
  candidate: CandidateForMatching,
  jobs: JobForMatching[],
  taxonomy: TaxonomyItem[],
  minScore = 30
): MatchResult[] {
  return jobs
    .map(j => calculateTaxonomyMatch(candidate, j, taxonomy))
    .filter(r => !r.hardBlocked && r.overallScore >= minScore)
    .sort((a, b) => b.overallScore - a.overallScore)
}
