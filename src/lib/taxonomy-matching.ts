/**
 * WHC CONCIERGE — STRUCTURED TAXONOMY MATCHING ENGINE v2
 *
 * Weights:
 *   Required Skills:          30%
 *   Preferred Skills:         10%
 *   Systems Knowledge:        10%
 *   Product House Experience: 10%
 *   Certifications:           10%
 *   Commercial Skills:        10%
 *   Leadership / Operations:  10%
 *   Eligibility / Location:   10%
 *                            -----
 *                            100%
 */

// ── Types matching the relational schema ──

interface CandidateSkill { skill_id: string; proficiency: string; years_using?: number }
interface CandidateSystem { system_id: string; proficiency: string }
interface CandidateProductHouse { product_house_id: string; years_using?: number }
interface CandidateCertification { certification_id: string; is_verified: boolean }
interface CandidateHotelBrand { hotel_brand_id: string; years_worked?: number }

interface JobRequiredSkill { skill_id: string; is_trainable: boolean }
interface JobPreferredSkill { skill_id: string; is_trainable: boolean }
interface JobRequiredSystem { system_id: string; is_trainable: boolean }
interface JobRequiredProductHouse { product_house_id: string; requirement_level: string; is_trainable: boolean }
interface JobRequiredCertification { certification_id: string; requirement_level: string; is_trainable: boolean }

interface NameLookup { [id: string]: string }

export interface CandidateData {
  id: string
  location_city?: string
  location_country?: string
  right_to_work?: string
  employment_types_wanted?: string[]
  availability_date?: string
  willing_to_relocate?: boolean
  years_experience?: number
  skills: CandidateSkill[]
  systems: CandidateSystem[]
  product_houses: CandidateProductHouse[]
  certifications: CandidateCertification[]
  hotel_brands: CandidateHotelBrand[]
}

export interface JobData {
  id: string
  title?: string
  role_level?: string
  employment_type?: string
  location_city?: string
  location_country?: string
  start_date?: string
  right_to_work_required?: string
  relocation_support?: boolean
  required_skills: JobRequiredSkill[]
  preferred_skills: JobPreferredSkill[]
  required_systems: JobRequiredSystem[]
  required_product_houses: JobRequiredProductHouse[]
  required_certifications: JobRequiredCertification[]
}

export interface CategoryResult {
  score: number
  matched: string[]
  missing: string[]
  trainable: string[]
}

export interface MatchOutput {
  candidateId: string
  jobId: string
  totalScore: number
  label: string
  colour: string
  bgColour: string
  breakdown: {
    requiredSkills: CategoryResult
    preferredSkills: CategoryResult
    systems: CategoryResult
    productHouses: CategoryResult
    certifications: CategoryResult
    commercialSkills: CategoryResult
    leadershipSkills: CategoryResult
    eligibility: CategoryResult
  }
  strengths: string[]
  missingRequired: string[]
  trainableGaps: string[]
  hasHardBlocker: boolean
  blockerReason?: string
}

// ── Hard blockers ──

function checkHardBlockers(candidate: CandidateData, job: JobData): { blocked: boolean; reason?: string } {
  // Right to work
  if (job.right_to_work_required === 'uk_only' && candidate.right_to_work === 'visa_required') {
    return { blocked: true, reason: 'Right to work: UK only required, candidate needs visa sponsorship' }
  }

  // Employment type
  const wanted = candidate.employment_types_wanted || []
  if (wanted.length > 0 && job.employment_type && !wanted.includes(job.employment_type)) {
    // Only hard block if completely incompatible
    const isFlexible = wanted.includes('contract') || wanted.includes('agency')
    if (!isFlexible) {
      return { blocked: true, reason: `Employment type mismatch: wants ${wanted.join('/')} not ${job.employment_type}` }
    }
  }

  return { blocked: false }
}

// ── Score a set of required items with trainable logic ──

function scoreRequirements(
  candidateIds: Set<string>,
  requirements: { id: string; is_trainable: boolean }[],
  names: NameLookup
): CategoryResult {
  if (requirements.length === 0) return { score: 100, matched: [], missing: [], trainable: [] }

  const matched: string[] = []
  const missing: string[] = []
  const trainable: string[] = []
  let points = 0

  for (const req of requirements) {
    const name = names[req.id] || req.id
    if (candidateIds.has(req.id)) {
      matched.push(name)
      points += 1
    } else if (req.is_trainable) {
      trainable.push(name)
      points += 0.5 // Half credit for trainable gap
    } else {
      missing.push(name)
      // Zero credit
    }
  }

  return {
    score: Math.round((points / requirements.length) * 100),
    matched, missing, trainable,
  }
}

// ── Score preferred items (softer penalty) ──

function scorePreferred(
  candidateIds: Set<string>,
  preferred: { id: string }[],
  names: NameLookup
): CategoryResult {
  if (preferred.length === 0) return { score: 100, matched: [], missing: [], trainable: [] }

  const matched: string[] = []
  const missing: string[] = []

  for (const p of preferred) {
    const name = names[p.id] || p.id
    if (candidateIds.has(p.id)) matched.push(name)
    else missing.push(name)
  }

  return {
    score: Math.round((matched.length / preferred.length) * 100),
    matched, missing, trainable: [],
  }
}

// ── Eligibility scoring ──

function scoreEligibility(candidate: CandidateData, job: JobData): CategoryResult {
  let points = 0
  const matched: string[] = []
  const missing: string[] = []

  // Location (max 60 points)
  if (candidate.location_country === job.location_country) {
    points += 40
    matched.push('Same country')
    if (candidate.location_city === job.location_city) {
      points += 20
      matched.push('Same city')
    }
  } else if (candidate.willing_to_relocate || job.relocation_support) {
    points += 30
    matched.push('Willing to relocate')
  } else {
    missing.push('Different location, not relocating')
  }

  // Availability (max 20 points)
  if (job.start_date && candidate.availability_date) {
    const jobStart = new Date(job.start_date).getTime()
    const candAvail = new Date(candidate.availability_date).getTime()
    const diffDays = (jobStart - candAvail) / (1000 * 60 * 60 * 24)
    if (diffDays >= 0) { points += 20; matched.push('Available before start date') }
    else if (diffDays >= -30) { points += 15; matched.push('Available within 30 days') }
    else if (diffDays >= -90) { points += 10; matched.push('Available within 90 days') }
    else { missing.push('Not available within 90 days') }
  } else {
    points += 15 // No dates specified — assume reasonable
    matched.push('Availability assumed')
  }

  // Employment type (max 20 points)
  const wanted = candidate.employment_types_wanted || []
  if (wanted.length === 0 || wanted.includes(job.employment_type || '')) {
    points += 20
    matched.push('Employment type match')
  } else {
    missing.push(`Wants ${wanted.join('/')} not ${job.employment_type}`)
  }

  return { score: Math.min(100, points), matched, missing, trainable: [] }
}

// ── Label from score ──

function getLabel(score: number): { label: string; colour: string; bgColour: string } {
  if (score >= 90) return { label: 'Excellent Match', colour: '#16A34A', bgColour: '#DCFCE7' }
  if (score >= 80) return { label: 'Strong Match', colour: '#1D4ED8', bgColour: '#DBEAFE' }
  if (score >= 70) return { label: 'Good Match', colour: '#2563EB', bgColour: '#DBEAFE' }
  if (score >= 60) return { label: 'Moderate Match', colour: '#D97706', bgColour: '#FEF3C7' }
  if (score >= 45) return { label: 'Partial Match', colour: '#6B7280', bgColour: '#F3F4F6' }
  return { label: 'Low Match', colour: '#6B7280', bgColour: '#F3F4F6' }
}

// ═══════ MAIN FUNCTION ═══════

export function calculateStructuredMatch(
  candidate: CandidateData,
  job: JobData,
  skillNames: NameLookup,
  systemNames: NameLookup,
  productHouseNames: NameLookup,
  certificationNames: NameLookup,
  skillCategories: { [id: string]: string }
): MatchOutput {

  // Step 1: Hard blockers
  const blocker = checkHardBlockers(candidate, job)
  if (blocker.blocked) {
    const empty: CategoryResult = { score: 0, matched: [], missing: [], trainable: [] }
    return {
      candidateId: candidate.id, jobId: job.id, totalScore: 0,
      label: 'Blocked', colour: '#6B7280', bgColour: '#F3F4F6',
      breakdown: { requiredSkills: empty, preferredSkills: empty, systems: empty, productHouses: empty, certifications: empty, commercialSkills: empty, leadershipSkills: empty, eligibility: empty },
      strengths: [], missingRequired: [], trainableGaps: [],
      hasHardBlocker: true, blockerReason: blocker.reason,
    }
  }

  // Build candidate lookup sets
  const candidateSkillIds = new Set(candidate.skills.map(s => s.skill_id))
  const candidateSystemIds = new Set(candidate.systems.map(s => s.system_id))
  const candidateProductHouseIds = new Set(candidate.product_houses.map(p => p.product_house_id))
  const candidateCertIds = new Set(candidate.certifications.map(c => c.certification_id))

  // Split job required skills by category (treatment vs commercial vs leadership vs operational)
  const treatmentReqs = job.required_skills.filter(r => {
    const cat = skillCategories[r.skill_id]
    return cat === 'treatment' || !cat // Default to treatment if unknown
  })
  const commercialReqs = job.required_skills.filter(r => skillCategories[r.skill_id] === 'commercial')
  const leadershipReqs = job.required_skills.filter(r => {
    const cat = skillCategories[r.skill_id]
    return cat === 'leadership' || cat === 'operational'
  })

  // Step 2: Score each category
  const requiredSkills = scoreRequirements(candidateSkillIds, treatmentReqs.map(r => ({ id: r.skill_id, is_trainable: r.is_trainable })), skillNames)
  const preferredSkills = scorePreferred(candidateSkillIds, job.preferred_skills.map(s => ({ id: s.skill_id })), skillNames)
  const systems = scoreRequirements(candidateSystemIds, job.required_systems.map(s => ({ id: s.system_id, is_trainable: s.is_trainable })), systemNames)

  // Product houses: split required vs preferred
  const reqPH = job.required_product_houses.filter(p => p.requirement_level === 'required')
  const prefPH = job.required_product_houses.filter(p => p.requirement_level === 'preferred')
  const phRequired = scoreRequirements(candidateProductHouseIds, reqPH.map(p => ({ id: p.product_house_id, is_trainable: p.is_trainable })), productHouseNames)
  const phPreferred = scorePreferred(candidateProductHouseIds, prefPH.map(p => ({ id: p.product_house_id })), productHouseNames)
  const productHouses: CategoryResult = {
    score: Math.min(100, phRequired.score + Math.round(phPreferred.score * 0.2)),
    matched: [...phRequired.matched, ...phPreferred.matched],
    missing: phRequired.missing,
    trainable: phRequired.trainable,
  }

  // Certifications: split required vs preferred
  const reqCerts = job.required_certifications.filter(c => c.requirement_level === 'required')
  const certifications = scoreRequirements(candidateCertIds, reqCerts.map(c => ({ id: c.certification_id, is_trainable: c.is_trainable })), certificationNames)

  const commercialSkills = scoreRequirements(candidateSkillIds, commercialReqs.map(r => ({ id: r.skill_id, is_trainable: r.is_trainable })), skillNames)
  const leadershipSkills = scoreRequirements(candidateSkillIds, leadershipReqs.map(r => ({ id: r.skill_id, is_trainable: r.is_trainable })), skillNames)
  const eligibility = scoreEligibility(candidate, job)

  // Step 3: Weighted total
  const totalScore = Math.round(
    requiredSkills.score * 0.30 +
    preferredSkills.score * 0.10 +
    systems.score * 0.10 +
    productHouses.score * 0.10 +
    certifications.score * 0.10 +
    commercialSkills.score * 0.10 +
    leadershipSkills.score * 0.10 +
    eligibility.score * 0.10
  )

  // Step 4: Compile
  const strengths = [
    ...requiredSkills.matched, ...systems.matched, ...productHouses.matched,
    ...certifications.matched, ...eligibility.matched,
  ]
  const missingRequired = [
    ...requiredSkills.missing, ...systems.missing, ...productHouses.missing,
    ...certifications.missing, ...commercialSkills.missing, ...leadershipSkills.missing,
  ]
  const trainableGaps = [
    ...requiredSkills.trainable, ...systems.trainable, ...productHouses.trainable,
    ...certifications.trainable, ...commercialSkills.trainable, ...leadershipSkills.trainable,
  ]

  const { label, colour, bgColour } = getLabel(totalScore)

  return {
    candidateId: candidate.id, jobId: job.id, totalScore, label, colour, bgColour,
    breakdown: { requiredSkills, preferredSkills, systems, productHouses, certifications, commercialSkills, leadershipSkills, eligibility },
    strengths, missingRequired, trainableGaps,
    hasHardBlocker: false,
  }
}

// ═══════ RANK FUNCTIONS ═══════

export function rankCandidatesForJob(
  candidates: CandidateData[], job: JobData,
  skillNames: NameLookup, systemNames: NameLookup, phNames: NameLookup, certNames: NameLookup, skillCats: { [id: string]: string },
  minScore = 30
): MatchOutput[] {
  return candidates
    .map(c => calculateStructuredMatch(c, job, skillNames, systemNames, phNames, certNames, skillCats))
    .filter(r => !r.hasHardBlocker && r.totalScore >= minScore)
    .sort((a, b) => b.totalScore - a.totalScore)
}

export function rankJobsForCandidate(
  candidate: CandidateData, jobs: JobData[],
  skillNames: NameLookup, systemNames: NameLookup, phNames: NameLookup, certNames: NameLookup, skillCats: { [id: string]: string },
  minScore = 30
): MatchOutput[] {
  return jobs
    .map(j => calculateStructuredMatch(candidate, j, skillNames, systemNames, phNames, certNames, skillCats))
    .filter(r => !r.hasHardBlocker && r.totalScore >= minScore)
    .sort((a, b) => b.totalScore - a.totalScore)
}
