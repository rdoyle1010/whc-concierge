import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { sendPrivateApproachEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'
import { trackEvent } from '@/lib/analytics'
import { PREMIUM_COLUMNS, isPremium } from '@/lib/employer-premium'

export const dynamic = 'force-dynamic'

// Confidential approaches for Private Career Mode.
//
// An approved employer requests an introduction to a private profile; the
// candidate accepts or declines. The notification row IS the record of the
// approach: title 'Confidential approach', link carrying the employer id,
// done_at set once the candidate has responded. Accepting inserts a matches
// row, which both reveals the full profile in the employer directory and
// unlocks messaging through the existing relationship logic.

const APPROACH_TITLE = 'Confidential approach'
const APPROACH_WINDOW_DAYS = 30

function approachLink(employerId: string): string {
  return `/talent/dashboard?approach=${employerId}`
}

function employerIdFromLink(link: string | null): string | null {
  const match = /[?&]approach=([0-9a-f-]{36})/i.exec(link || '')
  return match ? match[1] : null
}

// GET: pending approaches for the signed-in candidate.
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ approaches: [] })

  const [{ data: rows }, { data: matchRows }] = await Promise.all([
    admin.from('notifications')
      .select('id, link, message, created_at, done_at')
      .eq('user_id', user.id)
      .eq('title', APPROACH_TITLE)
      .is('done_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
    admin.from('matches').select('employer_id').eq('candidate_id', candidate.id),
  ])

  const matchedEmployerIds = new Set((matchRows || []).map((row: any) => row.employer_id))
  const pending = (rows || [])
    .map((row: any) => ({ ...row, employer_id: employerIdFromLink(row.link) }))
    .filter((row: any) => row.employer_id && !matchedEmployerIds.has(row.employer_id))

  // One entry per employer - keep the most recent approach only.
  const seen = new Set<string>()
  const unique = pending.filter((row: any) => {
    if (seen.has(row.employer_id)) return false
    seen.add(row.employer_id)
    return true
  })

  const employerIds = unique.map((row: any) => row.employer_id)
  const { data: employers } = employerIds.length
    ? await admin.from('employer_profiles').select('id, property_name, company_name, location, city').in('id', employerIds)
    : { data: [] as any[] }
  const employerById = new Map((employers || []).map((row: any) => [row.id, row]))

  return NextResponse.json({
    approaches: unique.map((row: any) => {
      const employer = employerById.get(row.employer_id)
      return {
        notification_id: row.id,
        employer_id: row.employer_id,
        property_name: employer?.property_name || employer?.company_name || 'A property',
        location: employer?.location || employer?.city || null,
        created_at: row.created_at,
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const body = await req.json().catch(() => ({}))
  const action = typeof body.action === 'string' ? body.action : 'request'

  if (action === 'accept' || action === 'decline') return handleCandidateResponse(admin, user.id, action, body)
  return handleEmployerRequest(admin, user.id, body)
}

// Employer flow: request a confidential introduction.
async function handleEmployerRequest(admin: ReturnType<typeof createAdminClient>, userId: string, body: any) {
  const candidateId = typeof body.candidateId === 'string' ? body.candidateId : ''
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  const { data: employer } = await admin.from('employer_profiles')
    .select(`id, user_id, property_name, company_name, approval_status, ${PREMIUM_COLUMNS}`)
    .eq('user_id', userId)
    .maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })
  if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved before requesting introductions' }, { status: 403 })
  if (!isPremium(employer, 'employer_talent_search')) {
    return NextResponse.json(
      { error: 'Approaching a professional directly is a premium feature.', upgradeHref: '/employer/billing' },
      { status: 402 },
    )
  }

  const { data: candidate } = await admin.from('candidate_profiles')
    .select('id, user_id, full_name, approval_status, profile_visible, stealth_mode')
    .eq('id', candidateId)
    .maybeSingle()
  // Stealth Mode was missing from this check, which made it the sharpest
  // failure of the three: the whole promise of Stealth Mode is that no
  // employer reaches you, and a private approach is exactly an employer
  // reaching you. Somebody hiding from a current employer could have been
  // messaged by them.
  if (!candidate || candidate.approval_status !== 'approved' || candidate.profile_visible === false || candidate.stealth_mode === true) {
    return NextResponse.json({ error: 'This professional is not currently available' }, { status: 404 })
  }

  // A candidate who has blocked this employer is invisible to it everywhere,
  // including here - the response is indistinguishable from not found.
  const { data: block } = await admin.from('profile_blocks')
    .select('id').eq('candidate_id', candidate.id).eq('blocked_employer_id', employer.id).limit(1).maybeSingle()
  if (block) return NextResponse.json({ error: 'This professional is not currently available' }, { status: 404 })

  // One approach per candidate per employer per 30 days, whatever its outcome.
  const windowStart = new Date(Date.now() - APPROACH_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await admin.from('notifications')
    .select('id')
    .eq('user_id', candidate.user_id)
    .eq('title', APPROACH_TITLE)
    .eq('link', approachLink(employer.id))
    .gte('created_at', windowStart)
    .limit(1)
    .maybeSingle()
  if (recent) {
    return NextResponse.json({ error: 'You have already approached this professional in the last 30 days. You can approach them again once that period has passed.' }, { status: 409 })
  }

  const propertyName = employer.property_name || employer.company_name || 'A property'
  const { error } = await createNotification(
    candidate.user_id,
    'general',
    APPROACH_TITLE,
    `${propertyName} would like a confidential introduction. Accepting reveals your full profile to them and opens messaging. Declining tells them nothing about who you are.`,
    approachLink(employer.id),
  )
  if (error) return NextResponse.json({ error: 'Could not send the approach - please try again' }, { status: 500 })

  // The in-app notification is the record. The email is how anybody finds out
  // it happened: somebody being approached confidentially has, by definition,
  // not been looking for a job and has no reason to be logged in.
  try {
    if (await emailAllowed(admin, candidate.user_id, 'job_alerts')) {
      const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
      const address = authUser?.user?.email
      if (address) await sendPrivateApproachEmail(address, candidate.full_name || '', propertyName)
    }
  } catch (emailError: any) {
    console.error('[Private approach email failed]', emailError?.message)
  }

  await trackEvent('confidential_approach_requested', { actorUserId: userId, candidateId: candidate.id, employerId: employer.id })
  return NextResponse.json({ success: true })
}

// Candidate flow: accept or decline a pending approach.
async function handleCandidateResponse(admin: ReturnType<typeof createAdminClient>, userId: string, action: 'accept' | 'decline', body: any) {
  const employerId = typeof body.employerId === 'string' ? body.employerId : ''
  if (!employerId) return NextResponse.json({ error: 'employerId required' }, { status: 400 })

  const [{ data: candidate }, { data: employer }] = await Promise.all([
    admin.from('candidate_profiles').select('id, user_id, full_name').eq('user_id', userId).maybeSingle(),
    admin.from('employer_profiles').select('id, user_id, property_name, company_name').eq('id', employerId).maybeSingle(),
  ])
  if (!candidate) return NextResponse.json({ error: 'Only professionals can respond to an approach' }, { status: 403 })
  if (!employer) return NextResponse.json({ error: 'This property no longer exists' }, { status: 404 })

  // The approach must exist and still be unanswered.
  const { data: approach } = await admin.from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('title', APPROACH_TITLE)
    .eq('link', approachLink(employer.id))
    .is('done_at', null)
    .limit(1)
    .maybeSingle()
  if (!approach) return NextResponse.json({ error: 'No pending approach from this property' }, { status: 404 })

  if (action === 'accept') {
    const { data: existingMatch } = await admin.from('matches')
      .select('id').eq('candidate_id', candidate.id).eq('employer_id', employer.id).limit(1).maybeSingle()
    if (!existingMatch) {
      const now = new Date().toISOString()
      const row: Record<string, unknown> = {
        candidate_id: candidate.id,
        employer_id: employer.id,
        job_listing_id: null,
        match_score: null,
        candidate_swiped_at: now,
        employer_swiped_at: now,
        matched_at: now,
        status: 'active',
        messaging_unlocked: true,
      }
      let { error } = await admin.from('matches').insert(row)
      // Defensive: if match_score is non-nullable in the live database, retry
      // with a neutral zero rather than failing the acceptance.
      if (error && /match_score/i.test(error.message || '')) {
        ;({ error } = await admin.from('matches').insert({ ...row, match_score: 0 }))
      }
      if (error) return NextResponse.json({ error: 'Could not open the introduction - please try again' }, { status: 500 })
    }
  }

  // Mark every pending approach from this property as answered.
  await admin.from('notifications')
    .update({ done_at: new Date().toISOString(), is_read: true })
    .eq('user_id', userId)
    .eq('title', APPROACH_TITLE)
    .eq('link', approachLink(employer.id))
    .is('done_at', null)

  if (employer.user_id) {
    if (action === 'accept') {
      await createNotification(
        employer.user_id,
        'general',
        'Introduction accepted',
        `${candidate.full_name || 'The professional'} accepted your confidential approach - you can now view the full profile and message them.`,
        `/employer/candidates?candidate=${candidate.id}`,
      )
    } else {
      await createNotification(
        employer.user_id,
        'general',
        'Confidential approach declined',
        'The professional has declined this approach.',
        '/employer/candidates',
      )
    }
  }

  await trackEvent(action === 'accept' ? 'confidential_approach_accepted' : 'confidential_approach_declined', {
    actorUserId: userId, candidateId: candidate.id, employerId: employer.id,
  })
  return NextResponse.json({ success: true })
}
