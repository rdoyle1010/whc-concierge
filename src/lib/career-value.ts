// Career value derivation for candidate portfolios.
//
// Every dimension is derived only from data that actually exists on the
// profile - an empty section is omitted, never rated. Every basis string
// names the exact facts the rating was computed from, so the panel can
// honestly say "derived from the verified data on this profile".
//
// The function is pure and deterministic: same inputs, same output.

export type CareerValueRating = 'Developing' | 'Strong' | 'Advanced' | 'Exceptional'

export type CareerValueDimension = {
  dimension: string
  rating: CareerValueRating
  basis: string
}

const RATINGS: CareerValueRating[] = ['Developing', 'Strong', 'Advanced', 'Exceptional']

// Clamp a 1-4 score onto the rating ladder.
function ratingFromScore(score: number): CareerValueRating {
  return RATINGS[Math.max(0, Math.min(3, score - 1))]
}

function asList(value: any): string[] {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item ?? '').trim()).filter(Boolean)
}

function distinct(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (!seen.has(key)) { seen.add(key); out.push(value) }
  }
  return out
}

function hasText(value: any): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function plural(count: number, singular: string, pluralWord?: string): string {
  return `${count} ${count === 1 ? singular : (pluralWord || `${singular}s`)}`
}

const COMMERCIAL_SKILL = /revenue|retail|budget|commercial|p\s*&\s*l|profit\s+and\s+loss/i
const PEOPLE_SKILL = /training|mentor|coach|development|develop(ing)?\s+people|people\s+develop/i

export function careerValue(candidate: any, academyCompletions: number): CareerValueDimension[] {
  const dimensions: CareerValueDimension[] = []
  if (!candidate) return dimensions

  // Luxury brand experience: distinct hotel brands + product houses.
  const hotelBrands = distinct(asList(candidate.hotel_brands_worked))
  const productHouses = distinct(asList(candidate.product_houses))
  const brandCount = hotelBrands.length + productHouses.length
  if (brandCount > 0) {
    const parts: string[] = []
    if (productHouses.length) parts.push(plural(productHouses.length, 'product house'))
    if (hotelBrands.length) parts.push(plural(hotelBrands.length, 'luxury hotel brand'))
    const score = brandCount >= 7 ? 4 : brandCount >= 5 ? 3 : brandCount >= 3 ? 2 : 1
    dimensions.push({
      dimension: 'Luxury brand experience',
      rating: ratingFromScore(score),
      basis: parts.join(' and '),
    })
  }

  // Commercial leadership: count the independent commercial signals present.
  const businessSkills = asList(candidate.business_skills)
  const commercialSkills = businessSkills.filter(skill => COMMERCIAL_SKILL.test(skill))
  const roleLevel = String(candidate.role_level || '')
  const seniorRole = /manager|director|head/i.test(roleLevel)
  const commercialSignals: string[] = []
  if (hasText(candidate.revenue_responsibility)) commercialSignals.push(`revenue responsibility of ${String(candidate.revenue_responsibility).trim()}`)
  if (hasText(candidate.commercial_experience)) commercialSignals.push('commercial experience on record')
  if (commercialSkills.length) commercialSignals.push(plural(commercialSkills.length, 'commercial business skill'))
  if (seniorRole) commercialSignals.push(`${roleLevel.trim()} role level`)
  if (commercialSignals.length > 0) {
    dimensions.push({
      dimension: 'Commercial leadership',
      rating: ratingFromScore(commercialSignals.length),
      basis: `Based on ${commercialSignals.join(', ')}`,
    })
  }

  // People development: team actually managed plus people-development skills.
  const teamSize = Number(candidate.team_size_managed) || 0
  const peopleSkills = businessSkills.filter(skill => PEOPLE_SKILL.test(skill))
  if (teamSize > 0 || peopleSkills.length > 0) {
    let score = 0
    if (teamSize > 0) score += 1
    if (teamSize >= 8) score += 1
    if (peopleSkills.length >= 1) score += 1
    if (peopleSkills.length >= 2 && teamSize >= 15) score += 1
    const parts: string[] = []
    if (teamSize > 0) parts.push(`a team of ${teamSize} managed`)
    if (peopleSkills.length) parts.push(`${plural(peopleSkills.length, 'people-development skill')} listed`)
    dimensions.push({
      dimension: 'People development',
      rating: ratingFromScore(score),
      basis: `Based on ${parts.join(' and ')}`,
    })
  }

  // Craft and guest experience: treatment range, stated proficiency depth,
  // and the review record (only when reviews actually exist).
  const treatments = distinct(asList(candidate.treatment_skills))
  const proficiencies = (candidate.skill_proficiencies && typeof candidate.skill_proficiencies === 'object' && !Array.isArray(candidate.skill_proficiencies))
    ? Object.entries(candidate.skill_proficiencies as Record<string, any>).filter(([skill, level]) => String(skill).trim() && hasText(level))
    : []
  const advancedCount = proficiencies.filter(([, level]) => /advanced|expert|master/i.test(String(level))).length
  const reviewCount = Number(candidate.review_count) || 0
  const reviewScore = Number(candidate.review_score) || 0
  const hasReviewRecord = reviewCount > 0 && reviewScore > 0
  if (treatments.length > 0 || proficiencies.length > 0 || hasReviewRecord) {
    let score = 0
    if (treatments.length > 0) score += 1
    if (treatments.length >= 8) score += 1
    if (advancedCount >= 2) score += 1
    if (hasReviewRecord && reviewScore >= 4.5) score += 1
    else if (hasReviewRecord && score === 0) score = 1
    const parts: string[] = []
    if (treatments.length) parts.push(plural(treatments.length, 'treatment skill'))
    if (advancedCount) parts.push(`${advancedCount} rated advanced or expert`)
    else if (proficiencies.length) parts.push(`${plural(proficiencies.length, 'skill')} with stated proficiency`)
    if (hasReviewRecord) parts.push(`a ${reviewScore.toFixed(1)} average from ${plural(reviewCount, 'verified review')}`)
    dimensions.push({
      dimension: 'Craft and guest experience',
      rating: ratingFromScore(score),
      basis: `Based on ${parts.join(', ')}`,
    })
  }

  // Professional development: verified Academy completions + qualifications.
  const qualifications = distinct(asList(candidate.qualifications))
  const completions = Math.max(0, Math.floor(Number(academyCompletions) || 0))
  const developmentTotal = completions + qualifications.length
  if (developmentTotal > 0) {
    const score = developmentTotal >= 8 ? 4 : developmentTotal >= 5 ? 3 : developmentTotal >= 3 ? 2 : 1
    const parts: string[] = []
    if (completions) parts.push(plural(completions, 'verified Talent House Academy completion'))
    if (qualifications.length) parts.push(plural(qualifications.length, 'qualification'))
    dimensions.push({
      dimension: 'Professional development',
      rating: ratingFromScore(score),
      basis: parts.join(' and '),
    })
  }

  return dimensions
}
