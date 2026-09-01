import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canRoleAccessPath, dashboardForRole, normaliseAccountRole } from '@/lib/role-access'

const PROTECTED_PREFIXES = ['/talent', '/employer', '/hotel', '/admin']
const AUTH_PAGES = ['/login', '/register']

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

  const isProtected = PROTECTED_PREFIXES.some(prefix => matchesRoutePrefix(pathname, prefix))
  const isAuthPage = AUTH_PAGES.some(page => matchesRoutePrefix(pathname, page))

  if (!isProtected && !isAuthPage) {
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
    return NextResponse.redirect(loginUrl)
  }

  // Two-step verification gate: an account with a verified authenticator
  // must complete the challenge before any protected page renders. Without
  // this, a stolen password could ignore the challenge redirect and browse
  // anyway. The assurance level is read from the session token - no extra
  // network round trip.
  if (user && isProtected) {
    try {
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
        const challengeUrl = request.nextUrl.clone()
        challengeUrl.pathname = '/mfa-challenge'
        challengeUrl.search = ''
        challengeUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
        return NextResponse.redirect(challengeUrl)
      }
    } catch { /* assurance unavailable - do not lock users out */ }
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
