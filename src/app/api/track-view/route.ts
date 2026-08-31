import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

// View tracking - the raw material behind role and profile intelligence.
// Best-effort by design: every path returns 204 so a blocked or malformed
// beacon can never surface an error to the viewer.
//
// 'job': any visitor viewing a live role. 'candidate': recorded only when
// the signed-in viewer is an approved employer - that is the signal a
// professional actually cares about - and never for viewing yourself.
// Duplicate views of the same thing by the same viewer within six hours
// are not re-recorded, so refreshes do not inflate the numbers.

export const dynamic = 'force-dynamic'

const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000

function noContent() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const kind = body?.kind
    const id = typeof body?.id === 'string' ? body.id.trim() : ''
    if ((kind !== 'job' && kind !== 'candidate') || !id) return noContent()

    const admin = createAdminClient()
    const user = await getRequestUser(req).catch(() => null)
    const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString()

    if (kind === 'job') {
      const { data: job } = await admin.from('job_listings')
        .select('id, employer_id').eq('id', id).maybeSingle()
      if (!job) return noContent()

      let dedupe = admin.from('analytics_events').select('id')
        .eq('event_name', 'job_viewed').eq('job_id', job.id)
        .gte('created_at', since).limit(1)
      dedupe = user ? dedupe.eq('actor_user_id', user.id) : dedupe.is('actor_user_id', null)
      const { data: existing } = await dedupe
      if (existing && existing.length) return noContent()

      await admin.from('analytics_events').insert({
        event_name: 'job_viewed',
        job_id: job.id,
        employer_id: job.employer_id || null,
        actor_user_id: user?.id || null,
        payload: {},
      })
      return noContent()
    }

    // kind === 'candidate': only an approved employer's view is meaningful.
    if (!user) return noContent()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id, approval_status').eq('user_id', user.id).maybeSingle()
    if (!employer || employer.approval_status !== 'approved') return noContent()

    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id, user_id').eq('id', id).maybeSingle()
    if (!candidate) return noContent()
    if (candidate.user_id && candidate.user_id === user.id) return noContent()

    const { data: existing } = await admin.from('analytics_events').select('id')
      .eq('event_name', 'candidate_profile_viewed')
      .eq('candidate_id', candidate.id)
      .eq('employer_id', employer.id)
      .gte('created_at', since).limit(1)
    if (existing && existing.length) return noContent()

    await admin.from('analytics_events').insert({
      event_name: 'candidate_profile_viewed',
      candidate_id: candidate.id,
      employer_id: employer.id,
      actor_user_id: user.id,
      payload: {},
    })
    return noContent()
  } catch {
    return noContent()
  }
}
