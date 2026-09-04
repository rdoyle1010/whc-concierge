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
  talent_search_until?: string | null
}

export type FeatureKey =
  | 'talent_interview_ready'
  | 'employer_talent_search'
  | 'employer_analytics'

export function hasActiveFeaturedAccess(profile?: EmployerAccessProfile | null) {
  if (!profile?.featured_employer) return false
  if (!profile.featured_until) return true
  const expiry = new Date(profile.featured_until).getTime()
  return Number.isFinite(expiry) && expiry > Date.now()
}

// Featured Employer is a visibility product - a badge and higher placement -
// bought once. It used to unlock Talent Search and Analytics as well, which
// meant a single payment bought the same tooling as a Pro subscription and
// gave every employer a reason never to subscribe.
//
// Windows already running when that changed were paid for under the old
// terms and keep the tools until they lapse. Featured runs for 30 or 365
// days, so any window ending on or before one year from the change was
// necessarily bought before it; anything later was bought after. A window
// with no expiry is granted by an administrator, predates all of this, and
// is theirs to revoke.
export const FEATURED_PREMIUM_GRANDFATHER_UNTIL = '2027-09-02T12:26:19.000Z'

function featuredStillCarriesPremium(profile?: EmployerAccessProfile | null) {
  if (!hasActiveFeaturedAccess(profile)) return false
  if (!profile?.featured_until) return true
  const expiry = new Date(profile.featured_until).getTime()
  return Number.isFinite(expiry) && expiry <= Date.parse(FEATURED_PREMIUM_GRANDFATHER_UNTIL)
}

// A paid advert unlocks the recruitment tools for as long as it runs.
//
// A property that pays to fill a role and is then locked out of the screen
// showing who could fill it has been sold an advert when it wanted a hire.
// This is time-boxed to the advert deliberately: the reason Featured stopped
// granting these tools was that one payment bought them permanently, so
// nobody ever subscribed. Thirty days that expire keeps the subscription
// worth buying, and is the only thing that ever shows a property what search
// is worth.
function advertStillCarriesTalentSearch(profile?: EmployerAccessProfile | null) {
  if (!profile?.talent_search_until) return false
  const until = new Date(profile.talent_search_until).getTime()
  return Number.isFinite(until) && until > Date.now()
}

function activeEmployerPremium(profile?: EmployerAccessProfile | null) {
  const tier = String(profile?.membership_tier || '').toLowerCase()
  if (tier === 'pro' || tier === 'group') return true
  if (advertStillCarriesTalentSearch(profile)) return true
  return featuredStillCarriesPremium(profile)
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
