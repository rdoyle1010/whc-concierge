const ROLE_LEVELS: Record<string, number> = {
  'Apprentice': 1, 'Junior': 2, 'Junior Therapist': 2, 'Therapist': 3,
  'Senior Therapist': 4, 'Lead Therapist': 5, 'Spa Manager': 6,
  'Operations Manager': 6, 'Spa & Wellness Operations Manager': 6,
  'Spa Director': 7, 'Director': 7, 'Director of Spa': 7,
  'Receptionist': 2, 'Spa Receptionist': 2, 'Spa Attendant': 1,
  'Beauty Therapist': 3, 'Wellness Practitioner': 3,
  'Yoga/Pilates Instructor': 3, 'Personal Trainer': 3,
  'Nutritionist': 3, 'Nail Technician': 2, 'Hair Stylist': 3, 'Barber': 3,
}

const PROFICIENCY_WEIGHT: Record<string, number> = {
  'beginner': 0.25, 'basic': 0.25, 'intermediate': 0.5, 'competent': 0.5,
  'advanced': 0.75, 'master': 1.0, 'expert': 1.0,
}

const PROFICIENCY_LABEL: Record<string, string> = {
  'beginner': 'beginner', 'basic': 'beginner', 'intermediate': 'intermediate',
  'competent': 'intermediate', 'advanced': 'advanced', 'master': 'master', 'expert': 'master',
}

function overlapScore(candidateArr: string[], requiredArr: string[]): { score: number; matches: string[] } {
  if (requiredArr.length === 0) return { score: 100, matches: [] }
  const matches = requiredArr.filter(r => candidateArr.some(c => c.toLowerCase() === r.toLowerCase()))
  return { score: Math.round((matches.length / requiredArr.length) * 100), matches }
}

export function calculateMatchScore(candidate: any, job: any): {
  score: number
  label: string
  colour: string
  bgColour: string
  breakdown: {
    roleLevel: number; treatmentSkills: number; brands: number; qualifications: number
    experience: number; businessSkills: number; systems: number; location: number
    shiftCompatibility: number; transport: number; accommodation: number
    proficiencyDepth: number; profileCompleteness: number; reviewScore: number
  }
  matchingSkills: string[]
  hardStop: boolean
  hardStopReason?: string
  matchExplanation: string
} {
  const emptyBreakdown = {
    roleLevel: 0, treatmentSkills: 0, brands: 0, qualifications: 0,
    experience: 0, businessSkills: 0, systems: 0, location: 0,
    shiftCompatibility: 0, transport: 0, accommodation: 0,
    proficiencyDepth: 0, profileCompleteness: 0, reviewScore: 0,
  }
  const empty = {
    score: 0, label: 'Excluded', colour: '#6B7280', bgColour: '#F3F4F6',
    breakdown: emptyBreakdown, matchingSkills: [] as string[],
    hardStop: true, matchExplanation: '',
  }

  // ── Hard stop: insurance ──
  if (job.insurance_required && !candidate.has_insurance) return { ...empty, hardStopReason: 'Insurance required' }

  // ── 1. Role Level (12%) ──
  const candLevel = ROLE_LEVELS[candidate.role_level] || 3
  const jobLevel = ROLE_LEVELS[job.required_role_level] || 3
  const diff = Math.abs(candLevel - jobLevel)
  if (diff >= 3) return { ...empty, hardStopReason: 'Role level mismatch' }
  const roleLevelScore = diff === 0 ? 100 : diff === 1 ? 60 : 20

  // ── 2. Treatment Skills (10%) ──
  const requiredSkills: string[] = job.required_skills || []
  const candidateSkills: string[] = candidate.treatment_skills || candidate.skills || []
  const treatmentResult = overlapScore(candidateSkills, requiredSkills)

  // ── 3. Product House / Brand (8%) ──
  const requiredBrands: string[] = job.required_brands || job.required_product_houses || []
  const candidateBrands: string[] = candidate.product_houses || []
  const brandResult = overlapScore(candidateBrands, requiredBrands)

  // ── 4. Qualifications (8%) ──
  const requiredQuals: string[] = job.required_qualifications || []
  const candidateQuals: string[] = candidate.qualifications || []
  const qualResult = overlapScore(candidateQuals, requiredQuals)

  // ── 5. Experience Years (7%) ──
  const minYears = job.min_years_experience || 0
  const candYears = candidate.experience_years || candidate.years_experience || 0
  const expScore = minYears === 0 ? 100 : candYears >= minYears ? 100 : Math.round((candYears / minYears) * 80)

  // ── 6. Business Skills (6%) ──
  const requiredBizSkills: string[] = job.preferred_business_skills || []
  const candidateBizSkills: string[] = candidate.business_skills || []
  const bizResult = overlapScore(candidateBizSkills, requiredBizSkills)

  // ── 7. Systems Knowledge (5%) ──
  const requiredSystems: string[] = job.required_systems || []
  const candidateSystems: string[] = candidate.systems_knowledge || candidate.systems_experience || []
  const sysResult = overlapScore(candidateSystems, requiredSystems)

  // ── 8. Location Match (8%) ──
  const jobLocation: string = (job.location || '').toLowerCase()
  const candidateLocPrefs: string[] = (candidate.location_preferences || []).map((l: string) => l.toLowerCase())
  let locationScore = 100
  if (jobLocation && candidateLocPrefs.length > 0) {
    const hasMatch = candidateLocPrefs.some(l => jobLocation.includes(l) || l === 'worldwide')
    locationScore = hasMatch ? 100 : 30
  }

  // ── 9. Shift Compatibility (5%) ──
  const jobShift: string = (job.shift_pattern || '').toLowerCase()
  const candidateShifts: string[] = (candidate.shift_preferences || []).map((s: string) => s.toLowerCase())
  let shiftScore = 100
  if (jobShift && candidateShifts.length > 0) {
    const isFlexible = candidateShifts.includes('flexible')
    const hasMatch = candidateShifts.some(s => jobShift.includes(s))
    shiftScore = isFlexible ? 100 : hasMatch ? 100 : 30
  }

  // ── 10. Transport / Commute (4%) ──
  const candidateTransport = candidate.transport_method || ''
  const candidateCommute = candidate.max_commute || ''
  let transportScore = 70 // default neutral
  if (candidateTransport === 'Own car') transportScore = 100
  else if (candidateTransport === 'Relocating for role') transportScore = 100
  else if (candidateTransport === 'Public transport') transportScore = 80
  if (candidateCommute === 'Willing to relocate') transportScore = Math.max(transportScore, 100)
  else if (candidateCommute === '1.5 hours') transportScore = Math.max(transportScore, 90)
  else if (candidateCommute === '1 hour') transportScore = Math.max(transportScore, 80)

  // ── 11. Accommodation (3%) ──
  let accommodationScore = 100
  if (candidate.needs_accommodation && !job.offers_accommodation) accommodationScore = 20
  else if (candidate.needs_accommodation && job.offers_accommodation) accommodationScore = 100

  // ── 12. Proficiency Depth (8%) ──
  const candidateProficiencies: Record<string, string> = candidate.skill_proficiencies || {}
  let proficiencyScore = 50 // default when no data
  if (requiredSkills.length > 0 && Object.keys(candidateProficiencies).length > 0) {
    let total = 0; let count = 0
    for (const skill of requiredSkills) {
      const match = Object.entries(candidateProficiencies).find(
        ([k]) => k.toLowerCase() === skill.toLowerCase()
      )
      if (match) {
        total += (PROFICIENCY_WEIGHT[match[1]] || 0.5) * 100
        count++
      }
    }
    proficiencyScore = count > 0 ? Math.round(total / count) : 30
  }

  // ── 13. Profile Completeness (3%) ──
  const completionPct = candidate.profile_completion_score || candidate.profile_completion_pct || 0
  const profileScore = Math.min(100, completionPct)

  // ── 14. Review Score (3%) ──
  const reviewVal = candidate.review_score || 0
  const reviewScoreNorm = reviewVal >= 4.5 ? 100 : reviewVal >= 4.0 ? 85 : reviewVal >= 3.5 ? 65 : reviewVal > 0 ? 40 : 50

  // ── Weighted total ──
  let score =
    (roleLevelScore * 0.12) +
    (treatmentResult.score * 0.10) +
    (brandResult.score * 0.08) +
    (qualResult.score * 0.08) +
    (expScore * 0.07) +
    (bizResult.score * 0.06) +
    (sysResult.score * 0.05) +
    (locationScore * 0.08) +
    (shiftScore * 0.05) +
    (transportScore * 0.04) +
    (accommodationScore * 0.03) +
    (proficiencyScore * 0.08) +
    (profileScore * 0.03) +
    (reviewScoreNorm * 0.03)

  // ── Boosts ──
  if (candidate.is_featured) score = Math.min(100, score + 3)
  if (reviewVal >= 4.5) score = Math.min(100, score + 5)
  else if (reviewVal >= 4.0) score = Math.min(100, score + 3)
  if (completionPct >= 90) score = Math.min(100, score + 2)

  const rounded = Math.round(score)
  const label = rounded >= 90 ? 'Perfect Match' : rounded >= 75 ? 'Strong Match' : rounded >= 60 ? 'Good Match' : rounded >= 45 ? 'Partial Match' : 'Low Match'
  const colour = rounded >= 90 ? '#16A34A' : rounded >= 75 ? '#1D4ED8' : rounded >= 60 ? '#D97706' : '#6B7280'
  const bgColour = rounded >= 90 ? '#DCFCE7' : rounded >= 75 ? '#DBEAFE' : rounded >= 60 ? '#FEF3C7' : '#F3F4F6'

  const matchingSkills = [...treatmentResult.matches, ...brandResult.matches, ...qualResult.matches].slice(0, 5)

  // ── Match explanation ──
  const reasons: string[] = []
  if (qualResult.matches.length > 0) reasons.push(`${qualResult.matches[0]} qualification`)
  if (brandResult.matches.length > 0) reasons.push(`${brandResult.matches[0]} product experience`)
  if (candYears >= 5 && roleLevelScore >= 60) reasons.push(`${candYears}+ years at ${candidate.role_level || 'senior'} level`)
  if (treatmentResult.matches.length > 0 && reasons.length < 3) {
    const skillName = treatmentResult.matches[0]
    const prof = candidateProficiencies[skillName.toLowerCase()] || Object.entries(candidateProficiencies).find(([k]) => k.toLowerCase() === skillName.toLowerCase())?.[1]
    const profLabel = prof ? PROFICIENCY_LABEL[prof] : null
    reasons.push(profLabel ? `${profLabel}-level ${skillName}` : `${skillName} skills`)
  }
  if (sysResult.matches.length > 0 && reasons.length < 3) reasons.push(`${sysResult.matches[0]} system experience`)
  if (bizResult.matches.length > 0 && reasons.length < 3) reasons.push(`${bizResult.matches[0]} business skills`)
  if (locationScore === 100 && candidateLocPrefs.length > 0 && reasons.length < 3) reasons.push('location match')
  if (shiftScore === 100 && candidateShifts.length > 0 && reasons.length < 3) reasons.push('shift compatibility')

  let matchExplanation = ''
  if (reasons.length > 0) {
    const strength = rounded >= 90 ? 'Excellent' : rounded >= 75 ? 'Strong' : rounded >= 60 ? 'Good' : 'Partial'
    matchExplanation = `${strength} match based on ${reasons.join(', ')}.`
  }

  return {
    score: rounded, label, colour, bgColour,
    breakdown: {
      roleLevel: roleLevelScore, treatmentSkills: treatmentResult.score,
      brands: brandResult.score, qualifications: qualResult.score,
      experience: expScore, businessSkills: bizResult.score,
      systems: sysResult.score, location: locationScore,
      shiftCompatibility: shiftScore, transport: transportScore,
      accommodation: accommodationScore, proficiencyDepth: proficiencyScore,
      profileCompleteness: profileScore, reviewScore: reviewScoreNorm,
    },
    matchingSkills, hardStop: false, matchExplanation,
  }
}

export function rankCandidates(candidates: any[], job: any, minScore = 45, blockedEmployerIds?: string[]) {
  const employerId = job.employer_id || job.employer_profile_id
  return candidates
    .filter(c => {
      if (blockedEmployerIds && employerId && blockedEmployerIds.includes(c.id)) return false
      return true
    })
    .map(c => ({ ...calculateMatchScore(c, job), candidateId: c.id }))
    .filter(r => !r.hardStop && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
}

/** Filter candidates who have blocked a specific employer via profile_blocks */
export function filterBlockedCandidates(candidates: any[], blockedCandidateIds: string[]) {
  if (!blockedCandidateIds.length) return candidates
  return candidates.filter(c => !blockedCandidateIds.includes(c.id))
}
