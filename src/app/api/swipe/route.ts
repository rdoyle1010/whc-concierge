import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendNewMatchEmail } from '@/lib/emails'
import { calculateMatchScore } from '@/lib/matching'
import { canEmployerDiscoverCandidate, mutualRadiusResult } from '@/lib/discovery'

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  return supabase.auth.getUser()
}

type SwipeRow = {
  swiper_id: string
  swiper_type: 'candidate' | 'employer'
  target_id: string
  target_type: 'job' | 'candidate'
  action: 'left' | 'right'
  context_job_id: string | null
}

async function replaceSwipe(admin: any, row: SwipeRow) {
  const { data, error } = await admin.from('swipes').upsert(row, {
    onConflict: 'swiper_id,swiper_type,target_id,target_type,context_job_id',
    ignoreDuplicates: false,
  }).select('action').single()
  return { error, changed: !error && data?.action === row.action }
}

async function createMutualMatch(admin: any, opts: {
  candidate: any
  employer: any
  job: any
  score: number
  candidateUserId: string
  employerUserId: string
  candidateEmail?: string | null
  employerEmail?: string | null
}) {
  const { candidate, employer, job, score, candidateUserId, employerUserId } = opts
  const { data: existing } = await admin.from('matches').select('id')
    .eq('candidate_id', candidate.id)
    .eq('employer_id', employer.id)
    .eq('job_listing_id', job.id)
    .maybeSingle()

  if (existing) return { created: false, matchId: existing.id }

  const now = new Date().toISOString()
  const { data: match, error } = await admin.from('matches').insert({
    candidate_id: candidate.id,
    employer_id: employer.id,
    job_listing_id: job.id,
    match_score: score,
    candidate_swiped_at: now,
    employer_swiped_at: now,
    matched_at: now,
    status: 'active',
    messaging_unlocked: true,
  }).select('id').single()
  if (error) throw error

  const employerName = employer.property_name || employer.company_name || 'the employer'
  const candidateName = candidate.full_name || 'A candidate'
  await Promise.allSettled([
    admin.from('messages').insert({
      sender_id: employerUserId,
      recipient_id: candidateUserId,
      content: `It's a match! You both said yes to ${job.job_title} at ${employerName}. Say hello and take it from here.`,
      read: false,
    }),
    createNotification(candidateUserId, 'new_match', "It's a match!", `${employerName} wants to talk about ${job.job_title}.`, '/talent/messages'),
    createNotification(employerUserId, 'new_match', "It's a match!", `${candidateName} is interested in ${job.job_title}.`, '/employer/messages'),
  ])

  await Promise.allSettled([
    opts.candidateEmail ? sendNewMatchEmail(opts.candidateEmail, candidate.full_name || 'there', employerName) : Promise.resolve(),
    opts.employerEmail ? sendNewMatchEmail(opts.employerEmail, employerName, candidateName) : Promise.resolve(),
  ])

  return { created: true, matchId: match.id }
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const admin = createAdminClient()
    const { data } = await admin.from('swipes').select('target_id,target_type,action,context_job_id')
      .eq('swiper_id', user.id)
    const rows = data || []
    const passed = rows.filter((r: any) => r.action === 'left')
    const interested = rows.filter((r: any) => r.action === 'right')
    return NextResponse.json({
      passed_ids: Array.from(new Set(passed.filter((r: any) => r.target_type === 'candidate').map((r: any) => r.target_id))),
      passed_job_ids: Array.from(new Set(passed.filter((r: any) => r.target_type === 'job').map((r: any) => r.target_id))),
      // Employer right swipes: which candidate was approached, and for which live role.
      employer_interests: interested
        .filter((r: any) => r.target_type === 'candidate')
        .map((r: any) => ({ candidate_id: r.target_id, job_id: r.context_job_id })),
      // Talent right swipes: which jobs this candidate has already expressed interest in.
      interested_job_ids: Array.from(new Set(interested.filter((r: any) => r.target_type === 'job').map((r: any) => r.target_id))),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const { targetId, targetType, action, contextJobId } = body as {
      targetId: string
      targetType: 'job' | 'candidate'
      action: 'left' | 'right'
      contextJobId?: string
    }
    if (!targetId || !['job', 'candidate'].includes(targetType) || !['left', 'right'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminClient()

    if (targetType === 'job') {
      const [{ data: candidate }, { data: job }] = await Promise.all([
        admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        admin.from('job_listings').select('*').eq('id', targetId).maybeSingle(),
      ])
      if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
      if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) {
        return NextResponse.json({ error: 'This role is no longer available.' }, { status: 404 })
      }

      const context = job.id
      if (action === 'left') {
        const saved = await replaceSwipe(admin, {
          swiper_id: user.id, swiper_type: 'candidate', target_id: job.id, target_type: 'job', action: 'left', context_job_id: context,
        })
        if (saved.error) return NextResponse.json({ error: 'Your pass could not be saved.' }, { status: 500 })
        return NextResponse.json({ matched: false })
      }

      const result = calculateMatchScore(candidate, job)
      const saved = await replaceSwipe(admin, {
        swiper_id: user.id, swiper_type: 'candidate', target_id: job.id, target_type: 'job', action: 'right', context_job_id: context,
      })
      if (saved.error) return NextResponse.json({ error: 'Your interest could not be saved.' }, { status: 500 })

      const { data: employer } = await admin.from('employer_profiles').select('*').eq('id', job.employer_id).maybeSingle()
      if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

      // Interest is deliberately separate from a formal application. A right swipe
      // records mutual-interest intent only; applications are created exclusively
      // through the dedicated application draft/submit journey.
      if (employer.user_id) {
        await createNotification(
          employer.user_id,
          'general',
          'A professional is interested in your role',
          `${candidate.full_name || 'A professional'} is interested in ${job.job_title}.`,
          `/employer/candidates?candidate=${candidate.id}`,
        )
      }

      if (!employer.user_id) return NextResponse.json({ matched: false })
      const { data: employerYes } = await admin.from('swipes').select('id')
        .eq('swiper_id', employer.user_id)
        .eq('swiper_type', 'employer')
        .eq('target_id', candidate.id)
        .eq('target_type', 'candidate')
        .eq('action', 'right')
        .eq('context_job_id', job.id)
        .maybeSingle()

      if (!employerYes) return NextResponse.json({ matched: false })
      let employerEmail = employer.contact_email || null
      if (!employerEmail) {
        const { data: employerUser } = await admin.auth.admin.getUserById(employer.user_id)
        employerEmail = employerUser?.user?.email || null
      }
      await createMutualMatch(admin, {
        candidate, employer, job, score: result.score,
        candidateUserId: user.id, employerUserId: employer.user_id,
        candidateEmail: user.email, employerEmail,
      })
      return NextResponse.json({ matched: true, jobTitle: job.job_title, employerName: employer.property_name || employer.company_name || 'the employer' })
    }

    const { data: employer } = await admin.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved first' }, { status: 403 })

    if (action === 'left') {
      const saved = await replaceSwipe(admin, {
        swiper_id: user.id, swiper_type: 'employer', target_id: targetId, target_type: 'candidate', action: 'left', context_job_id: null,
      })
      if (saved.error) return NextResponse.json({ error: 'Your pass could not be saved.' }, { status: 500 })
      return NextResponse.json({ matched: false })
    }

    if (!contextJobId) return NextResponse.json({ error: 'Choose the role you are interested in this professional for.' }, { status: 400 })

    const [{ data: candidate }, { data: job }, { data: blocked }] = await Promise.all([
      admin.from('candidate_profiles').select('*').eq('id', targetId).maybeSingle(),
      admin.from('job_listings').select('*').eq('id', contextJobId).eq('employer_id', employer.id).maybeSingle(),
      admin.from('profile_blocks').select('candidate_id').eq('candidate_id', targetId).eq('blocked_employer_id', employer.id).maybeSingle(),
    ])
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
    if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) return NextResponse.json({ error: 'Choose one of your current live roles.' }, { status: 400 })

    const discoverable = canEmployerDiscoverCandidate(candidate, new Set(blocked ? [targetId] : []))
    const travel = mutualRadiusResult(employer, candidate, null)
    const locationMissing = Boolean(candidate.travel_radius_miles) && travel.reason === 'location_required'
    if (!discoverable || !travel.withinRadius || locationMissing) {
      return NextResponse.json({ error: locationMissing ? 'Add your property location before approaching professionals with a travel radius.' : 'This profile is not available to your account.' }, { status: 403 })
    }

    const result = calculateMatchScore(candidate, job)
    if (result.hardStop) return NextResponse.json({ error: result.hardStopReason || 'This professional is not compatible with that role.' }, { status: 400 })

    const saved = await replaceSwipe(admin, {
      swiper_id: user.id, swiper_type: 'employer', target_id: candidate.id, target_type: 'candidate', action: 'right', context_job_id: job.id,
    })
    if (saved.error) return NextResponse.json({ error: 'Your interest could not be saved.' }, { status: 500 })

    if (candidate.user_id) {
      await createNotification(candidate.user_id, 'general', 'A property is interested in you', `${employer.property_name || employer.company_name || 'An employer'} is interested in you for ${job.job_title}.`, '/talent/jobs')
    }

    if (!candidate.user_id) return NextResponse.json({ matched: false })
    const { data: candidateYes } = await admin.from('swipes').select('id')
      .eq('swiper_id', candidate.user_id)
      .eq('swiper_type', 'candidate')
      .eq('target_id', job.id)
      .eq('target_type', 'job')
      .eq('action', 'right')
      .eq('context_job_id', job.id)
      .maybeSingle()

    if (!candidateYes) return NextResponse.json({ matched: false, candidateName: candidate.full_name, jobTitle: job.job_title })

    const { data: candidateUser } = await admin.auth.admin.getUserById(candidate.user_id)
    await createMutualMatch(admin, {
      candidate, employer, job, score: result.score,
      candidateUserId: candidate.user_id, employerUserId: user.id,
      candidateEmail: candidateUser?.user?.email || null, employerEmail: user.email,
    })

    return NextResponse.json({ matched: true, candidateName: candidate.full_name, jobTitle: job.job_title })
  } catch (e: any) {
    console.error('Swipe route failed:', e?.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
