import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
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
export async function adminRequestUser() {
  const cookieStore = await cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null

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
    if (error || !assurance) return null
    if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') return null
  } catch {
    return null
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  return profile?.role === 'admin' ? user : null
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
