import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Everything the platform has sent anybody, in one list.
//
// The question "what did we send this person, and did it arrive" used to have
// no answer at all: failures printed to a serverless console and were gone
// within days. Now it has one place.

export async function GET(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const params = req.nextUrl.searchParams
  const channel = params.get('channel')
  const status = params.get('status')
  const search = String(params.get('q') || '').trim().toLowerCase()

  let query = admin.from('email_log')
    .select('id, recipient, kind, subject, status, error, channel, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (channel === 'email' || channel === 'sms') query = query.eq('channel', channel)
  if (status === 'sent' || status === 'failed' || status === 'skipped') query = query.eq('status', status)
  if (search) query = query.ilike('recipient', `%${search}%`)

  const { data, error } = await query
  // The table arrives with a migration. Until it is run, say so plainly rather
  // than showing an empty list that reads as "we have never sent anything".
  if (error) return NextResponse.json({ rows: [], unavailable: true })

  // Counted over the same window the list covers, so the numbers and the rows
  // agree with each other.
  const rows = data || []
  return NextResponse.json({
    rows,
    counts: {
      sent: rows.filter(r => r.status === 'sent').length,
      failed: rows.filter(r => r.status === 'failed').length,
      skipped: rows.filter(r => r.status === 'skipped').length,
    },
  })
}
