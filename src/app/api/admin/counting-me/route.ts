import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { STAFF_COOKIE } from '@/lib/visit-counting'

// Whether the person who owns the platform is in her own visitor numbers.
//
// She was, and it mattered more than it sounds. Visitor counting rotates its
// hash every day, so somebody who opens the website on twenty days counts as
// twenty separate visitors. Testing her own pages daily on a laptop is what
// made the desktop share look like the majority when almost every real
// stranger arrives on a phone.
//
// So an admin page load marks the browser, once, and the count leaves it out
// from then on. The marker is a preference rather than a fact, because there
// are days when she genuinely does want to see her own journey through the
// site, and a setting she cannot undo is not a setting.

export const dynamic = 'force-dynamic'

const A_YEAR = 60 * 60 * 24 * 365

export async function GET() {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })
  const jar = await cookies()
  return NextResponse.json({ countMe: jar.get(STAFF_COOKIE)?.value === 'on' })
}

/**
 * Mark this browser as staff, without overruling a choice already made.
 *
 * Called on every admin page load. If it wrote unconditionally, turning the
 * setting back on would last exactly until the next admin screen.
 */
export async function PUT() {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })
  const jar = await cookies()
  const existing = jar.get(STAFF_COOKIE)?.value
  if (existing !== 'on' && existing !== 'off') {
    jar.set(STAFF_COOKIE, 'off', {
      path: '/', maxAge: A_YEAR, sameSite: 'lax', httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return NextResponse.json({ countMe: jar.get(STAFF_COOKIE)?.value === 'on' })
}

export async function POST(request: Request) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const countMe = body?.countMe === true
  const jar = await cookies()
  jar.set(STAFF_COOKIE, countMe ? 'on' : 'off', {
    path: '/', maxAge: A_YEAR, sameSite: 'lax', httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
  return NextResponse.json({ countMe })
}
