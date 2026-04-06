import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/talent', '/employer', '/admin']

// Routes that should redirect logged-in users away (to dashboard)
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
]

export async function middleware(request: NextRequest) {
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

  // Protected routes: redirect to login if no session
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth pages: redirect logged-in users to their dashboard
  const isAuthPage = AUTH_PAGES.some(page => pathname.startsWith(page))
  if (isAuthPage && user) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/talent/dashboard'
    return NextResponse.redirect(dashUrl)
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
