import { NextRequest, NextResponse } from 'next/server'
import { platformAccess, PREVIEW_COOKIE } from '@/lib/platform-access'

// The way past the closed doors, for a walkthrough with a property that has
// not signed up yet. Visit /api/preview?code=<the code>&next=/login and the
// cookie is set for this browser only; the doors stay shut for everyone else.
//
// A server component cannot set a cookie, which is why this is a route.

export async function GET(req: NextRequest) {
  const { previewCode } = await platformAccess()
  const supplied = (req.nextUrl.searchParams.get('code') || '').trim()
  const nextPath = req.nextUrl.searchParams.get('next') || '/login'
  // Only ever return to our own pages: an open redirect here would be a gift
  // to anyone phishing spa professionals.
  const safeNext = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/login'

  if (!previewCode || supplied !== previewCode) {
    return NextResponse.redirect(new URL('/coming-soon', req.nextUrl.origin))
  }

  const response = NextResponse.redirect(new URL(safeNext, req.nextUrl.origin))
  response.cookies.set(PREVIEW_COOKIE, previewCode, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
