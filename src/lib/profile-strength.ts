type StrengthResult = {
  score: number
  missing: string[]
  nudge: string
}

const FIELDS: { key: string; label: string; weight: number; check: (p: any) => boolean }[] = [
  { key: 'full_name', label: 'Full name', weight: 5, check: p => !!p.full_name },
  { key: 'email', label: 'Email', weight: 5, check: p => !!p.email || !!p.work_email },
  { key: 'phone', label: 'Phone number', weight: 5, check: p => !!p.phone || !!p.phone_number },
  { key: 'photo', label: 'Profile photo', weight: 10, check: p => !!p.photo_url || !!p.avatar_url },
  { key: 'role_level', label: 'Role level', weight: 5, check: p => !!p.role_level },
  { key: 'treatment_skills', label: 'Treatment skills (5+)', weight: 10, check: p => (p.treatment_skills?.length || p.services_offered?.length || 0) >= 5 },
  { key: 'business_skills', label: 'Business skills (3+)', weight: 5, check: p => (p.business_skills?.length || 0) >= 3 },
  { key: 'systems', label: 'Systems knowledge (2+)', weight: 5, check: p => (p.systems_knowledge?.length || p.systems_experience?.length || 0) >= 2 },
  { key: 'product_houses', label: 'Product houses (2+)', weight: 5, check: p => (p.product_houses?.length || 0) >= 2 },
  { key: 'qualifications', label: 'Qualifications', weight: 10, check: p => (p.qualifications?.length || 0) >= 1 },
  { key: 'brands', label: 'Brand experience', weight: 5, check: p => (p.hotel_brands?.length || p.brand_experience?.length || 0) >= 1 },
  { key: 'experience', label: 'Work experience', weight: 5, check: p => !!(p.experience_years || p.years_experience) },
  { key: 'bio', label: 'Bio (50+ words)', weight: 10, check: p => (p.bio || '').trim().split(/\s+/).length >= 50 },
  { key: 'location_preferences', label: 'Location preferences', weight: 5, check: p => (p.location_preferences?.length || 0) > 0 },
  { key: 'shift_preferences', label: 'Shift preferences', weight: 5, check: p => (p.shift_preferences?.length || 0) > 0 },
  { key: 'transport_method', label: 'Transport method', weight: 5, check: p => !!p.transport_method },
]

export function calculateProfileStrength(profile: any): StrengthResult {
  if (!profile) return { score: 0, missing: FIELDS.map(f => f.label), nudge: 'Get started by completing your profile — employers prefer candidates with complete profiles.' }

  let earned = 0
  const missing: string[] = []

  for (const field of FIELDS) {
    if (field.check(profile)) {
      earned += field.weight
    } else {
      missing.push(field.label)
    }
  }

  const score = Math.min(100, earned)
  const nudge = buildNudge(score, missing)

  return { score, missing, nudge }
}

function buildNudge(score: number, missing: string[]): string {
  if (score >= 100) return 'Your profile is fully complete — you\'re at the top of employer searches.'
  if (missing.length === 0) return 'Great work — your profile is looking strong.'

  // Pick the highest-impact missing items (up to 2)
  const highImpact = missing.slice(0, 2)
  const target = Math.min(100, score + highImpact.length * 10)
  const items = highImpact.map(m => m.toLowerCase()).join(' and ')

  if (score >= 80) return `Add ${items} to reach ${target}% — you're almost there.`
  if (score >= 60) return `Add ${items} to reach ${target}% — employers are 3x more likely to shortlist complete profiles.`
  if (score >= 40) return `Add ${items} to boost your score — complete profiles get significantly more matches.`
  return `Start with ${items} — even a few details help employers find you.`
}

export const PROFILE_FIELDS = FIELDS
