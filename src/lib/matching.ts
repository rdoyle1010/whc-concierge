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

function roleLevel(value: string): number {
  const role = value.trim().toLowerCase()
  if (!role) return 3
  const exact = Object.entries(ROLE_LEVELS).find(([label]) => label.toLowerCase() === role)
  if (exact) return exact[1]
  if (/director|head of spa|head of wellness/.test(role)) return 7
  if (/manager/.test(role)) return 6
  if (/lead therapist|team lead|supervisor/.test(role)) return 5
  if (/senior/.test(role)) return 4
  if (/therapist|practitioner|instructor|trainer|nutritionist|stylist|barber/.test(role)) return 3
  if (/junior|reception|nail technician/.test(role)) return 2
  if (/apprentice|attendant/.test(role)) return 1
  return 3
}

const PROFICIENCY_WEIGHT: Record<string, number> = {
  beginner: 0.25, basic: 0.25, intermediate: 0.5, competent: 0.5,
  advanced: 0.75, master: 1.0, expert: 1.0,
}

const PROFICIENCY_LABEL: Record<string, string> = {
  beginner: 'beginner', basic: 'beginner', intermediate: 'intermediate',
  competent: 'intermediate', advanced: 'advanced', master: 'master', expert: 'master',
}

type RoleFamily = 'leadership' | 'reception' | 'treatment' | 'fitness' | 'hair' | 'other'

function roleFamily(value: string): RoleFamily {
  const role = value.toLowerCase()
  if (/director|manager|head of spa|operations lead/.test(role)) return 'leadership'
  if (/reception|front desk|concierge|attendant/.test(role)) return 'reception'
  if (/therapist|practitioner|nail|beauty|massage|aesthetic/.test(role)) return 'treatment'
  if (/fitness|personal trainer|yoga|pilates|nutrition/.test(role)) return 'fitness'
  if (/hair|stylist|barber/.test(role)) return 'hair'
  return 'other'
}

function overlapScore(candidateArr: string[], requiredArr: string[]): { score: number; matches: string[] } {
  if (requiredArr.length === 0) return { score: -1, matches: [] }
  const matches = requiredArr.filter(r => candidateArr.some(c => c.toLowerCase() === r.toLowerCase()))
  return { score: Math.round((matches.length / requiredArr.length) * 100), matches }
}

function validCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function distanceMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radius = 3958.761
  const toRad = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(h))
}

function candidateRadiusMiles(candidate: any): number | null {
  const explicit = Number(candidate.travel_radius_miles)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  const commute = String(candidate.max_commute || '').toLowerCase()
  if (commute.includes('willing to relocate')) return 250
  if (commute.includes('1.5 hour')) return 45
  if (commute.includes('1 hour')) return 30
  if (commute.includes('45')) return 22
  if (commute.includes('30')) return 15
  return null
}

function geographicLocationScore(candidate: any, job: any): { score: number; distance: number | null; basis: 'distance' | 'text' | 'unknown' } {
  const hasCandidateCoords = validCoordinate(candidate.latitude, -90, 90) && validCoordinate(candidate.longitude, -180, 180)
  const hasJobCoords = validCoordinate(job.latitude, -90, 90) && validCoordinate(job.longitude, -180, 180)

  if (hasCandidateCoords && hasJobCoords) {
    const distance = distanceMiles(
      { latitude: candidate.latitude, longitude: candidate.longitude },
      { latitude: job.latitude, longitude: job.longitude },
    )
    const relocation = String(candidate.max_commute || '').toLowerCase().includes('willing to relocate')
      || String(candidate.transport_method || '').toLowerCase().includes('relocating')
    if (relocation) return { score: 100, distance, basis: 'distance' }

    const candidateRadius = candidateRadiusMiles(candidate)
    const employerRadiusRaw = Number(job.radius_miles)
    const employerRadius = Number.isFinite(employerRadiusRaw) && employerRadiusRaw > 0 ? employerRadiusRaw : null
    const effectiveRadius = candidateRadius && employerRadius ? Math.min(candidateRadius, employerRadius) : candidateRadius || employerRadius

    if (!effectiveRadius) {
      const score = distance <= 5 ? 100 : distance <= 15 ? 90 : distance <= 30 ? 75 : distance <= 50 ? 55 : 30
      return { score, distance, basis: 'distance' }
    }
    if (distance <= effectiveRadius * 0.35) return { score: 100, distance, basis: 'distance' }
    if (distance <= effectiveRadius * 0.7) return { score: 90, distance, basis: 'distance' }
    if (distance <= effectiveRadius) return { score: 75, distance, basis: 'distance' }
    if (distance <= effectiveRadius * 1.25) return { score: 40, distance, basis: 'distance' }
    return { score: 10, distance, basis: 'distance' }
  }

  const jobLocation = String(job.location || '').toLowerCase()
  const candidateLocPrefs: string[] = (candidate.location_preferences || []).map((l: string) => l.toLowerCase())
  if (jobLocation && candidateLocPrefs.length > 0) {
    const hasMatch = candidateLocPrefs.some(l => jobLocation.includes(l) || l === 'worldwide')
    return { score: hasMatch ? 100 : 30, distance: null, basis: 'text' }
  }
  return { score: jobLocation ? 50 : -1, distance: null, basis: 'unknown' }
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
  distanceMiles: number | null
  locationBasis: 'distance' | 'text' | 'unknown'
} {
  const emptyBreakdown = {
    roleLevel: -1, treatmentSkills: -1, brands: -1, qualifications: -1,
    experience: -1, businessSkills: -1, systems: -1, location: -1,
    shiftCompatibility: -1, transport: -1, accommodation: -1,
    proficiencyDepth: -1, profileCompleteness: 0, reviewScore: 0,
  }
  const empty = {
    score: 10, label: 'Requirement Missing', colour: '#6B7280', bgColour: '#F3F4F6',
    breakdown: emptyBreakdown, matchingSkills: [] as string[], hardStop: true,
    matchExplanation: '', distanceMiles: null, locationBasis: 'unknown' as const,
  }

  const candidateRole = String(candidate.role_level || candidate.current_role || candidate.job_title || '')
  const requiredRole = String(job.job_title || job.title || job.required_role_level || '')
  const candidateFamily = roleFamily(candidateRole)
  const jobFamily = roleFamily(requiredRole)
  const comparableFamilies = candidateFamily !== 'other' && jobFamily !== 'other'
  const sameJobFamily = !comparableFamilies || candidateFamily === jobFamily

  const insuranceApplies = job.insurance_required &&
    (jobFamily === 'treatment' || (job.is_agency_role && jobFamily !== 'leadership'))
  if (insuranceApplies && !candidate.has_insurance) {
    return { ...empty, hardStopReason: 'Professional insurance required for treatment delivery' }
  }

  const candLevel = roleLevel(candidateRole)
  const jobLevel = roleLevel(requiredRole)
  const diff = Math.abs(candLevel - jobLevel)
  const roleLevelScore = candidateRole && requiredRole
    ? (!sameJobFamily ? 0 : diff === 0 ? 100 : diff === 1 ? 70 : diff === 2 ? 35 : 10)
    : -1

  const requiredSkills: string[] = job.required_skills || []
  const candidateSkills: string[] = candidate.treatment_skills || candidate.skills || candidate.services_offered || []
  const treatmentResult = overlapScore(candidateSkills, requiredSkills)

  const requiredBrands: string[] = job.required_brands || job.required_product_houses || []
  const candidateBrands: string[] = candidate.product_houses || []
  const brandResult = overlapScore(candidateBrands, requiredBrands)

  const requiredQuals: string[] = job.required_qualifications || []
  const candidateQuals: string[] = candidate.qualifications || []
  const qualResult = overlapScore(candidateQuals, requiredQuals)

  const minYears = job.min_years_experience || 0
  const candYears = candidate.experience_years || candidate.years_experience || 0
  const expScore = minYears === 0 ? -1 : candYears >= minYears ? 100 : Math.round((candYears / minYears) * 80)

  const requiredBizSkills: string[] = job.preferred_business_skills || []
  const candidateBizSkills: string[] = candidate.business_skills || []
  const bizResult = candidateBizSkills.length > 0
    ? overlapScore(candidateBizSkills, requiredBizSkills)
    : { score: -1, matches: [] as string[] }

  const requiredSystems: string[] = job.required_systems || []
  const candidateSystems: string[] = candidate.systems_knowledge || candidate.systems_experience || []
  const sysResult = overlapScore(candidateSystems, requiredSystems)

  const geo = geographicLocationScore(candidate, job)
  const locationScore = geo.score

  const jobShift = String(job.shift_pattern || '').toLowerCase()
  const candidateShifts: string[] = (candidate.shift_preferences || []).map((s: string) => s.toLowerCase())
  let shiftScore = jobShift ? 50 : -1
  if (jobShift && candidateShifts.length > 0) {
    const isFlexible = candidateShifts.includes('flexible')
    const hasMatch = candidateShifts.some(s => jobShift.includes(s))
    shiftScore = isFlexible || hasMatch ? 100 : 30
  }

  const candidateTransport = candidate.transport_method || ''
  const candidateCommute = candidate.max_commute || ''
  let transportScore = candidateTransport || candidateCommute ? 70 : -1
  if (candidateTransport === 'Own car') transportScore = 100
  else if (candidateTransport === 'Relocating for role') transportScore = 100
  else if (candidateTransport === 'Public transport') transportScore = 80
  if (candidateCommute === 'Willing to relocate') transportScore = Math.max(transportScore, 100)
  else if (candidateCommute === '1.5 hours') transportScore = Math.max(transportScore, 90)
  else if (candidateCommute === '1 hour') transportScore = Math.max(transportScore, 80)

  let accommodationScore = -1
  if (candidate.needs_accommodation && !job.offers_accommodation) accommodationScore = 20
  else if (candidate.needs_accommodation && job.offers_accommodation) accommodationScore = 100

  const candidateProficiencies: Record<string, string> = candidate.skill_proficiencies || {}
  let proficiencyScore = -1
  if (requiredSkills.length > 0 && Object.keys(candidateProficiencies).length > 0) {
    let total = 0; let count = 0
    for (const skill of requiredSkills) {
      const match = Object.entries(candidateProficiencies).find(([k]) => k.toLowerCase() === skill.toLowerCase())
      if (match) { total += (PROFICIENCY_WEIGHT[match[1]] || 0.5) * 100; count++ }
    }
    proficiencyScore = count > 0 ? Math.round(total / count) : -1
  }

  const completionPct = candidate.profile_completion_score || candidate.profile_completion_pct || 0
  const profileScore = Math.min(100, completionPct)
  const reviewVal = candidate.review_score || 0
  const reviewScoreNorm = reviewVal >= 4.5 ? 100 : reviewVal >= 4.0 ? 85 : reviewVal >= 3.5 ? 65 : reviewVal > 0 ? 40 : 50

  const components = [
    { value: roleLevelScore, weight: 40 },
    { value: treatmentResult.score, weight: 18 },
    { value: brandResult.score, weight: 10 },
    { value: qualResult.score, weight: 12 },
    { value: expScore, weight: 10 },
    { value: bizResult.score, weight: 8 },
    { value: sysResult.score, weight: 7 },
    { value: locationScore, weight: 12 },
    { value: shiftScore, weight: 5 },
    { value: transportScore, weight: 3 },
    { value: accommodationScore, weight: 2 },
    { value: proficiencyScore, weight: 2 },
  ].filter(component => component.value >= 0)
  const activeWeight = components.reduce((total, component) => total + component.weight, 0)
  const score = activeWeight > 0
    ? components.reduce((total, component) => total + (component.value * component.weight), 0) / activeWeight
    : 10

  const familyAdjustedScore = comparableFamilies && !sameJobFamily ? Math.min(score, 20) : score
  const rounded = Math.max(10, Math.round(familyAdjustedScore))
  const label = rounded >= 90 ? 'Perfect Match' : rounded >= 75 ? 'Strong Match' : rounded >= 60 ? 'Good Match' : rounded >= 45 ? 'Partial Match' : 'Low Match'
  const colour = rounded >= 90 ? '#16A34A' : rounded >= 75 ? '#1D4ED8' : rounded >= 60 ? '#D97706' : '#6B7280'
  const bgColour = rounded >= 90 ? '#DCFCE7' : rounded >= 75 ? '#DBEAFE' : rounded >= 60 ? '#FEF3C7' : '#F3F4F6'

  const matchingSkills = [...treatmentResult.matches, ...brandResult.matches, ...qualResult.matches].slice(0, 5)
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
  if (geo.distance != null && locationScore >= 75 && reasons.length < 3) reasons.push(`${geo.distance.toFixed(1)} miles from the role`)
  else if (locationScore === 100 && geo.basis === 'text' && reasons.length < 3) reasons.push('location match')
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
    distanceMiles: geo.distance, locationBasis: geo.basis,
  }
}

export function rankCandidates(candidates: any[], job: any, minScore = 10, blockedEmployerIds?: string[]) {
  const employerId = job.employer_id || job.employer_profile_id
  return candidates
    .filter(c => {
      if (blockedEmployerIds && employerId && blockedEmployerIds.includes(c.id)) return false
      return true
    })
    .map(c => ({ ...calculateMatchScore(c, job), candidateId: c.id }))
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
}

export function filterBlockedCandidates(candidates: any[], blockedCandidateIds: string[]) {
  if (!blockedCandidateIds.length) return candidates
  return candidates.filter(c => !blockedCandidateIds.includes(c.id))
}
