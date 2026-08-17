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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block maintenance API routes entirely
  if (BLOCKED_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Create Supabase client with request/response cookie handling
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session (important for token refresh)
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes: redirect to login if no session. Preserve the complete
  // destination (including query string) so featured-profile deep links survive sign-in.
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('redirect', destination)
    if (pathname.startsWith('/employer') || pathname.startsWith('/hotel')) loginUrl.searchParams.set('role', 'employer')
    if (pathname.startsWith('/talent')) loginUrl.searchParams.set('role', 'talent')
    return NextResponse.redirect(loginUrl)
  }

  // Auth pages: a signed-in user should continue to a valid requested destination,
  // rather than being bounced to their dashboard and losing context.
  const isAuthPage = AUTH_PAGES.some(page => pathname.startsWith(page))
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

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
