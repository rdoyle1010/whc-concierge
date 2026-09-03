import { NextRequest, NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/request-user'
import { createAdminClient } from '@/lib/supabase/admin'

// The heartbeat behind "who has been online today".
//
// Deliberately says almost nothing. It records that a signed-in person was
// active in a five minute window, and which of the three workspaces they were
// in - not the page, not the record they were looking at. A per-page trail of
// an administrator's own users is surveillance dressed up as analytics, and it
// would be the first thing a subject access request asked for.
//
// Never returns an error worth acting on: a failed heartbeat must not put a
// red banner in front of somebody trying to work.

const BUCKET_MINUTES = 5

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ ok: true })

  let role: string | null = null
  try {
    const body = await req.json()
    const claimed = String(body?.role || '')
    if (['talent', 'employer', 'admin', 'consultant'].includes(claimed)) role = claimed
  } catch { /* a heartbeat with no body is still a heartbeat */ }

  // The bucket is minutes since midnight UK time, rounded down. Computed on
  // the server so a device with a wrong clock cannot invent a working day.
  const now = new Date()
  const uk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
  const bucket = Math.floor((uk.getHours() * 60 + uk.getMinutes()) / BUCKET_MINUTES) * BUCKET_MINUTES

  try {
    const admin = createAdminClient()
    const { error } = await admin.rpc('record_activity', {
      p_user_id: user.id,
      p_role: role,
      p_bucket: bucket,
    })
    if (error) return NextResponse.json({ ok: true, recorded: false })
  } catch {
    return NextResponse.json({ ok: true, recorded: false })
  }
  return NextResponse.json({ ok: true, recorded: true })
}
