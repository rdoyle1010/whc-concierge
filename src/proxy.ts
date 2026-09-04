import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canRoleAccessPath, dashboardForRole, normaliseAccountRole } from '@/lib/role-access'

const PROTECTED_PREFIXES = ['/talent', '/employer', '/hotel', '/admin']
// '/admin/login' sits inside the '/admin' prefix, so it was protected by the
// rule below and bounced a signed-out administrator to '/login?redirect=...'.
// That page has a Talent / Hotel toggle and no admin option, so it refused the
// account it had just been handed and told the person to "use the Admin sign
// in" - the page they had been redirected away from. A closed loop, and the
// reason an administrator concluded her account was broken.
const AUTH_PAGES = ['/login', '/register', '/admin/login']

// Two-step verification on the API, not only on the pages.
//
// The gate below used to apply to PROTECTED_PREFIXES alone, and '/api/admin'
// matches none of them - '/api/admin/users' is neither '/admin' nor does it
// start with '/admin/'. So every API route was outside it. Around seventy of
// them authenticate by building their own Supabase client and calling
// getUser(), with no assurance check anywhere in that path.
//
// The practical consequence: a stolen admin password was enough on its own.
// Sign in, receive the half-verified session, ignore the authenticator
// prompt, and call the API directly - approve accounts, read the revenue and
// verification queues, and pull any CV or right-to-work document through
// /api/files. The authenticator bought nothing against anyone willing to skip
// the browser.
//
// So the rule moves here, where it covers every route including the ones
// nobody has written yet. Routes that must stay reachable by a
// half-verified session are listed below and only those.
const MFA_EXEMPT_API_ROUTES = [
  // Completing the second step, and getting out.
  '/api/auth',
  // Signed by Stripe, not by a session.
  '/api/stripe/webhook',
  // Public: no session at all, or a session that is irrelevant to the answer.
  '/api/public-stats',
  '/api/contact-notify',
  '/api/newsletter',
  '/api/certificates/verify',
  '/api/address-lookup',
  '/api/track-view',
  '/api/privacy/marketing',
  '/api/register',
  '/api/health',
]

export function isMfaExemptApi(pathname: string) {
  return MFA_EXEMPT_API_ROUTES.some(route => matchesRoutePrefix(pathname, route))
}

const EMPLOYER_PREMIUM_ROUTES: Record<string, string> = {
  '/employer/candidates': 'talent-search',
  '/employer/analytics': 'analytics',
}

const BLOCKED_API_ROUTES = [
  '/api/seed',
  '/api/seed-taxonomy',
  '/api/seed-residencies',
  '/api/run-migration',
  '/api/fix-employer-columns',
  '/api/fix-taxonomy-rls',
  '/api/fix-null-live',
  '/api/update-jobs',
  '/api/application-email',
  '/api/welcome-email',
]

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function activeFeaturedEmployer(employer: any) {
  if (!employer?.featured_employer) return false
  if (!employer.featured_until) return true
  const expiry = new Date(employer.featured_until).getTime()
  return Number.isFinite(expiry) && expiry > Date.now()
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (BLOCKED_API_ROUTES.some(route => matchesRoutePrefix(pathname, route))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const isAuthPage = AUTH_PAGES.some(page => matchesRoutePrefix(pathname, page))
  // A sign-in page is never protected, whichever prefix it happens to sit under.
  const isProtected = !isAuthPage && PROTECTED_PREFIXES.some(prefix => matchesRoutePrefix(pathname, prefix))

  // The mobile app has no cookie jar; it sends a Bearer token, and
  // getRequestUser already enforces two-step verification on those. Leaving
  // them to the route means the middleware never has to guess.
  const usesBearerToken = (request.headers.get('authorization') || '').startsWith('Bearer ')
  const isGuardedApi = matchesRoutePrefix(pathname, '/api')
    && !isMfaExemptApi(pathname)
    && !usesBearerToken

  if (!isProtected && !isAuthPage && !isGuardedApi) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('redirect', destination)
    if (matchesRoutePrefix(pathname, '/employer') || matchesRoutePrefix(pathname, '/hotel')) loginUrl.searchParams.set('role', 'employer')
    if (matchesRoutePrefix(pathname, '/talent')) loginUrl.searchParams.set('role', 'talent')
    // Administrators have their own door. Sending them to the member sign-in
    // page hands their account to a form that is built to reject it.
    if (matchesRoutePrefix(pathname, '/admin')) loginUrl.pathname = '/admin/login'
    return NextResponse.redirect(loginUrl)
  }

  // Two-step verification gate: an account with a verified authenticator
  // must complete the challenge before any protected page renders. Without
  // this, a stolen password could ignore the challenge redirect and browse
  // anyway. The assurance level is read from the session token - no extra
  // network round trip.
  if (user && (isProtected || isGuardedApi)) {
    try {
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
        // An API caller gets an answer it can act on, not a redirect to an
        // HTML page it would try to parse as JSON.
        if (isGuardedApi) {
          return NextResponse.json(
            { error: 'Two-step verification required', mfaRequired: true },
            { status: 401 },
          )
        }
        const challengeUrl = request.nextUrl.clone()
        challengeUrl.pathname = '/mfa-challenge'
        challengeUrl.search = ''
        challengeUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
        return NextResponse.redirect(challengeUrl)
      }
    } catch { /* assurance unavailable - do not lock users out */ }
  }

  // Everything below is page behaviour: role redirects, premium gating,
  // bouncing a signed-in user off the login screen. An API request has had
  // its check and goes on to its route.
  if (isGuardedApi && !isProtected && !isAuthPage) {
    return response
  }

  if (user) {
    const premiumEntry = Object.entries(EMPLOYER_PREMIUM_ROUTES).find(([route]) => matchesRoutePrefix(pathname, route))
    if (premiumEntry) {
      const { data: employer } = await supabase
        .from('employer_profiles')
        .select('membership_tier,featured_employer,featured_until')
        .eq('user_id', user.id)
        .maybeSingle()
      const tier = String(employer?.membership_tier || '').toLowerCase()
      const premium = tier === 'pro' || tier === 'group' || activeFeaturedEmployer(employer)
      if (!premium) {
        const billingUrl = request.nextUrl.clone()
        billingUrl.pathname = '/employer/billing'
        billingUrl.search = ''
        billingUrl.searchParams.set('locked', premiumEntry[1])
        return NextResponse.redirect(billingUrl)
      }
    }
  }

  if (isAuthPage && user) {
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = normaliseAccountRole(prof?.role)
    if (role) {
      const requested = request.nextUrl.searchParams.get('redirect')
      const safeRequested = requested
        && requested.startsWith('/')
        && !requested.startsWith('//')
        && canRoleAccessPath(role, requested)
        ? requested
        : null

      const destination = safeRequested || dashboardForRole(role)
      const nextUrl = request.nextUrl.clone()
      const [nextPath, query = ''] = destination.split('?')
      nextUrl.pathname = nextPath
      nextUrl.search = query ? `?${query}` : ''
      return NextResponse.redirect(nextUrl)
    }
  }

  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
