export type FeatureAccessState = 'included' | 'limited' | 'locked'

export type FeatureAccess = {
  state: FeatureAccessState
  label?: string
  upgradeHref?: string
}

export type TalentAccessProfile = {
  membership_tier?: string | null
  interview_ready_credits?: number | null
  academy_discount_pct?: number | null
  free_feature_credits?: number | null
}

export type EmployerAccessProfile = {
  membership_tier?: string | null
  annual_job_allowance?: number | null
  annual_jobs_used?: number | null
  featured_employer?: boolean | null
  featured_until?: string | null
}

export type FeatureKey =
  | 'talent_interview_ready'
  | 'employer_talent_search'
  | 'employer_analytics'

function hasActiveFeaturedAccess(profile?: EmployerAccessProfile | null) {
  if (!profile?.featured_employer) return false
  if (!profile.featured_until) return true
  const expiry = new Date(profile.featured_until).getTime()
  return Number.isFinite(expiry) && expiry > Date.now()
}

function activeEmployerPremium(profile?: EmployerAccessProfile | null) {
  const tier = String(profile?.membership_tier || '').toLowerCase()
  return tier === 'pro' || tier === 'group' || hasActiveFeaturedAccess(profile)
}

export function talentFeatureAccess(profile?: TalentAccessProfile | null): Record<FeatureKey, FeatureAccess> {
  const credits = Math.max(0, Number(profile?.interview_ready_credits || 0))

  return {
    talent_interview_ready: credits > 0
      ? { state: 'limited', label: `${credits} ${credits === 1 ? 'credit' : 'credits'} left`, upgradeHref: '/talent/billing' }
      : { state: 'locked', label: 'Upgrade to unlock', upgradeHref: '/talent/billing' },
    employer_talent_search: { state: 'included' },
    employer_analytics: { state: 'included' },
  }
}

export function employerFeatureAccess(profile?: EmployerAccessProfile | null): Record<FeatureKey, FeatureAccess> {
  const premium = activeEmployerPremium(profile)

  return {
    talent_interview_ready: { state: 'included' },
    employer_talent_search: premium
      ? { state: 'included' }
      : { state: 'locked', label: 'Premium feature', upgradeHref: '/employer/billing' },
    employer_analytics: premium
      ? { state: 'included' }
      : { state: 'locked', label: 'Premium feature', upgradeHref: '/employer/billing' },
  }
}

export function isFeatureLocked(access?: FeatureAccess | null) {
  return access?.state === 'locked'
}
