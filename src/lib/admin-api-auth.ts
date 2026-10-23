import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * The one admin check.
 *
 * Two-step verification was enforced on every page by the middleware and on
 * every route that authenticates through `getRequestUser`. Admin API routes
 * did neither: each carried its own copy of a guard that called
 * `auth.getUser()` and looked up the role, with no assurance-level check
 * anywhere in the path. And the middleware could never have covered them -
 * its protected prefixes are `/admin`, `/talent`, `/employer`, which
 * `/api/admin/...` does not match.
 *
 * So a stolen admin password was enough. Sign in, receive the half-verified
 * session, ignore the authenticator prompt entirely, and call the API
 * directly: approve accounts, read the revenue and verification queues, and -
 * through `/api/files` - download any CV or right-to-work document on the
 * platform. The authenticator the administrator had dutifully enrolled bought
 * nothing at all against anyone willing to skip the browser.
 *
 * This is now the only implementation, and it fails closed: no session, no
 * completed second step, or no admin role, and the caller is nobody.
 */
/**
 * Why an admin request was refused.
 *
 * Every refusal used to reach the administrator as the single word
 * "Unauthorised", which is true of all four causes and useful for none. The
 * person who owns the platform, looking at her own admin screen, could not
 * tell whether her authenticator had lapsed, whether the lookup had failed,
 * or whether something was broken. The guard still fails closed; it just says
 * which door it closed.
 */
export type AdminRefusal = 'signed-out' | 'second-step' | 'check-failed' | 'not-admin'

export const ADMIN_REFUSAL_MESSAGE: Record<AdminRefusal, string> = {
  'signed-out': 'Your session has ended. Sign in again to continue.',
  'second-step': 'Your two-step verification has lapsed. Sign in again and complete the authenticator step.',
  'check-failed': 'We could not verify your two-step status just now. Reload the page, and sign in again if it persists.',
  'not-admin': 'This account is not an administrator.',
}

export type AdminRequestOutcome =
  | { user: User; refusal: null }
  | { user: null; refusal: AdminRefusal }

export async function adminRequestOutcome(): Promise<AdminRequestOutcome> {
  const cookieStore = await cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { user: null, refusal: 'signed-out' }

  // Two-step verification, on the same terms as everywhere else: an account
  // with a verified authenticator that has not completed the challenge is
  // treated as signed out.
  //
  // Deliberately fails CLOSED here, unlike the page middleware. A blip in the
  // assurance lookup on a public page degrades to a signed-in session; on an
  // administrator's API it must degrade to no session, because this is the
  // one place where a wrong answer hands over the whole platform.
  try {
    const { data: assurance, error } = await auth.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error || !assurance) return { user: null, refusal: 'check-failed' }
    if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') return { user: null, refusal: 'second-step' }
  } catch {
    return { user: null, refusal: 'check-failed' }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  return profile?.role === 'admin' ? { user, refusal: null } : { user: null, refusal: 'not-admin' }
}

/**
 * The one admin check, unchanged for every caller that only needs to know
 * whether the request may proceed.
 */
export async function adminRequestUser(): Promise<User | null> {
  const outcome = await adminRequestOutcome()
  return outcome.user
}

/**
 * Server-only guard for maintenance endpoints that use the Supabase service
 * role. Keeping this check in one place makes it harder to accidentally ship
 * a public database mutation route.
 */
export async function isAdminRequest(): Promise<boolean> {
  return Boolean(await adminRequestUser())
}

/**
 * The signed-in administrator's id, or null where the caller is not an admin.
 * Used where a route has to record who took a destructive action, rather than
 * logging it as though the platform had done it by itself.
 */
export async function adminRequestUserId(): Promise<string | null> {
  const user = await adminRequestUser()
  return user?.id || null
}
