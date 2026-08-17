import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canRoleAccessPath, dashboardForRole, normaliseAccountRole } from '@/lib/role-access'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/talent', '/employer', '/hotel', '/admin']

// Routes that should redirect logged-in users away (to dashboard or requested destination)
const AUTH_PAGES = ['/login', '/register']

// Maintenance / dev-only API routes that should be blocked in production
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block maintenance API routes entirely.
  if (BLOCKED_API_ROUTES.some(route => matchesRoutePrefix(pathname, route))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Match route boundaries, not raw string prefixes. Without this,
  // `/admin-sign-in` was incorrectly treated as a protected `/admin` route.
  const isProtected = PROTECTED_PREFIXES.some(prefix => matchesRoutePrefix(pathname, prefix))
  const isAuthPage = AUTH_PAGES.some(page => matchesRoutePrefix(pathname, page))

  // Critical performance guard: do NOT call Supabase Auth for every request.
  if (!isProtected && !isAuthPage) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes: redirect to login if no session. Preserve the complete
  // destination (including query string) so featured-profile deep links survive sign-in.
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

  // Auth pages: a signed-in user should continue to a valid requested destination,
  // rather than being bounced to their dashboard and losing context.
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
