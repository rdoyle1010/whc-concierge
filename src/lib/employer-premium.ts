import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { employerFeatureAccess, type FeatureKey } from '@/lib/feature-access'

// Premium employer features were locked in the sidebar only, so the padlock
// was a suggestion: a direct URL, an old bookmark or a deep link from an
// email reached the full feature for free. The lock has to live where the
// data is served, which is here - one helper shared by the route guards and
// the API routes so the tier rules never drift apart.

export const PREMIUM_COLUMNS = 'membership_tier, featured_employer, featured_until, talent_search_until'

export type PremiumCheck = {
  /** Null when the caller is not a signed-in employer at all. */
  employerId: string | null
  premium: boolean
}

export function isPremium(profile: unknown, feature: FeatureKey = 'employer_talent_search') {
  return employerFeatureAccess(profile as never)[feature].state !== 'locked'
}

/**
 * Resolves the signed-in employer and whether their tier covers `feature`.
 * Admins pass so support can reproduce what a property sees.
 */
export async function checkEmployerPremium(feature: FeatureKey = 'employer_talent_search'): Promise<PremiumCheck> {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { employerId: null, premium: false }

  try {
    const admin = createAdminClient()
    const [{ data: account }, { data: employer }] = await Promise.all([
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      admin.from('employer_profiles').select(`id, ${PREMIUM_COLUMNS}`).eq('user_id', user.id).maybeSingle(),
    ])

    if (account?.role === 'admin') return { employerId: employer?.id ?? null, premium: true }
    if (!employer) return { employerId: null, premium: false }
    return { employerId: employer.id, premium: isPremium(employer, feature) }
  } catch {
    // Fail closed. Showing the upgrade panel to a paying customer during an
    // outage is recoverable; handing a premium feature to every free account
    // is not, and throwing here would break the page for everyone.
    return { employerId: null, premium: false }
  }
}
