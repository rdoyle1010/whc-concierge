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

export function calculateMatchScore(candidate: any, job: any): {
  score: number
  label: string
  colour: string
  bgColour: string
  breakdown: { roleLevel: number; brands: number; qualifications: number; travel: number; experience: number }
  matchingSkills: string[]
  hardStop: boolean
  hardStopReason?: string
} {
  const empty = {
    score: 0, label: 'Excluded', colour: '#6B7280', bgColour: '#F3F4F6',
    breakdown: { roleLevel: 0, brands: 0, qualifications: 0, travel: 0, experience: 0 },
    matchingSkills: [] as string[], hardStop: true,
  }

  // Hard stop: insurance
  if (job.insurance_required && !candidate.has_insurance) return { ...empty, hardStopReason: 'Insurance required' }

  // Role level (30%)
  const candLevel = ROLE_LEVELS[candidate.role_level] || 3
  const jobLevel = ROLE_LEVELS[job.required_role_level] || 3
  const diff = Math.abs(candLevel - jobLevel)
  if (diff >= 3) return { ...empty, hardStopReason: 'Role level mismatch' }
  const roleLevelScore = diff === 0 ? 100 : diff === 1 ? 60 : 20

  // Brands (25%)
  const requiredBrands: string[] = job.required_brands || job.required_product_houses || []
  const candidateBrands: string[] = candidate.product_houses || []
  const matchingBrands = requiredBrands.filter(b => candidateBrands.some(cb => cb.toLowerCase() === b.toLowerCase()))
  const brandsScore = requiredBrands.length === 0 ? 100 : Math.round((matchingBrands.length / requiredBrands.length) * 100)

  // Qualifications (20%)
  const requiredQuals: string[] = job.required_qualifications || []
  const candidateQuals: string[] = candidate.qualifications || []
  const matchingQuals = requiredQuals.filter(q => candidateQuals.some(cq => cq.toLowerCase() === q.toLowerCase()))
  const qualsScore = requiredQuals.length === 0 ? 100 : Math.round((matchingQuals.length / requiredQuals.length) * 100)

  // Travel (15%)
  const travel = candidate.travel_availability || 'uk_only'
  const travelScore = travel === 'worldwide' ? 100 : travel === 'europe' ? 90 : travel === 'uk_only' ? 80 : 70

  // Experience (10%)
  const minYears = job.min_years_experience || 0
  const candYears = candidate.experience_years || candidate.years_experience || 0
  const expScore = minYears === 0 ? 100 : candYears >= minYears ? 100 : Math.round((candYears / minYears) * 80)

  // Weighted total
  let score = (roleLevelScore * 0.30) + (brandsScore * 0.25) + (qualsScore * 0.20) + (travelScore * 0.15) + (expScore * 0.10)

  // Boosts
  if (candidate.is_featured) score = Math.min(100, score + 3)
  if ((candidate.review_score || 0) >= 4.5) score = Math.min(100, score + 5)
  else if ((candidate.review_score || 0) >= 4.0) score = Math.min(100, score + 3)
  if ((candidate.profile_completion_score || 0) >= 90) score = Math.min(100, score + 2)

  const rounded = Math.round(score)
  const label = rounded >= 90 ? 'Perfect Match' : rounded >= 75 ? 'Strong Match' : rounded >= 60 ? 'Good Match' : rounded >= 45 ? 'Partial Match' : 'Low Match'
  const colour = rounded >= 90 ? '#16A34A' : rounded >= 75 ? '#1D4ED8' : rounded >= 60 ? '#D97706' : '#6B7280'
  const bgColour = rounded >= 90 ? '#DCFCE7' : rounded >= 75 ? '#DBEAFE' : rounded >= 60 ? '#FEF3C7' : '#F3F4F6'

  const matchingSkills = [...matchingBrands, ...matchingQuals].slice(0, 3)

  return {
    score: rounded, label, colour, bgColour,
    breakdown: { roleLevel: roleLevelScore, brands: brandsScore, qualifications: qualsScore, travel: travelScore, experience: expScore },
    matchingSkills, hardStop: false,
  }
}

export function rankCandidates(candidates: any[], job: any, minScore = 45) {
  return candidates
    .map(c => ({ ...calculateMatchScore(c, job), candidateId: c.id }))
    .filter(r => !r.hardStop && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
}
