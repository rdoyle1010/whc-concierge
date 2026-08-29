import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { canEmployerDiscoverCandidate, mutualRadiusResult } from '@/lib/discovery'
import { calculateMatchScore } from '@/lib/matching'
import { createNotification } from '@/lib/notifications'
import { sendNewMatchEmail } from '@/lib/emails'

const CANDIDATE_FIELDS = [
  'id','user_id','full_name','headline','role_level','location','services_offered','experience_years','years_experience',
  'profile_image_url','review_score','bio','qualifications','product_houses','systems_experience','business_skills',
  'career_evidence','has_insurance','awards','availability_status','travel_radius_miles','has_car','latitude','longitude',
  'approval_status','profile_visible','is_featured','featured_until','created_at',
].join(',')

async function employerFor(admin: any, userId: string) {
  const { data } = await admin.from('employer_profiles')
    .select('id,user_id,company_name,property_name,approval_status,latitude,longitude,postcode,contact_email')
    .eq('user_id', userId).maybeSingle()
  return data
}

async function upsertSwipe(admin: any, row: any) {
  return admin.from('swipes').upsert(row, {
    onConflict: 'swiper_id,swiper_type,target_id,target_type,context_job_id',
    ignoreDuplicates: false,
  })
}

async function ensureMutualMatch(admin: any, opts: {
  candidate: any; employer: any; job: any; score: number;
  candidateUserId: string; employerUserId: string;
  candidateEmail?: string | null; employerEmail?: string | null;
}) {
  const { candidate, employer, job, score, candidateUserId, employerUserId } = opts
  const { data: existing } = await admin.from('matches').select('id')
    .eq('candidate_id', candidate.id)
    .eq('employer_id', employer.id)
    .eq('job_listing_id', job.id)
    .maybeSingle()
  if (existing) return existing.id

  const now = new Date().toISOString()
  const { data: created, error } = await admin.from('matches').insert({
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
    opts.candidateEmail ? sendNewMatchEmail(opts.candidateEmail, candidate.full_name || 'there', employerName) : Promise.resolve(),
    opts.employerEmail ? sendNewMatchEmail(opts.employerEmail, employerName, candidateName) : Promise.resolve(),
  ])
  return created.id
}

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const admin = createAdminClient()
    const employer = await employerFor(admin, user.id)
    if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })
    if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved before viewing talent profiles' }, { status: 403 })

    const now = new Date().toISOString()
    const [{ data: rows, error }, { data: blocks }, { data: jobs }, { data: swipes }, { data: shortlist }] = await Promise.all([
      admin.from('candidate_profiles').select(CANDIDATE_FIELDS)
        .eq('approval_status', 'approved').or('profile_visible.eq.true,profile_visible.is.null')
        .order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(100),
      admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employer.id),
      admin.from('job_listings').select('*').eq('employer_id', employer.id).eq('is_live', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`).limit(25),
      admin.from('swipes').select('target_id,action,context_job_id')
        .eq('swiper_id', user.id).eq('swiper_type', 'employer').eq('target_type', 'candidate'),
      admin.from('shortlisted_candidates').select('candidate_id,job_id').eq('employer_id', employer.id),
    ])
    if (error) return NextResponse.json({ error: 'Talent directory unavailable' }, { status: 500 })

    const liveJobs = jobs || []
    const blocked = new Set((blocks || []).map((row: any) => row.candidate_id))
    const passed = new Set((swipes || []).filter((row: any) => row.action === 'left').map((row: any) => row.target_id))
    const interestedKey = new Set((swipes || []).filter((row: any) => row.action === 'right' && row.context_job_id)
      .map((row: any) => `${row.target_id}:${row.context_job_id}`))
    const shortlisted = new Set((shortlist || []).map((row: any) => row.candidate_id))

    const visible = (rows || []).filter((candidate: any) => !passed.has(candidate.id) && canEmployerDiscoverCandidate(candidate, blocked))
    const userIds = visible.map((candidate: any) => candidate.user_id).filter(Boolean)
    const { data: candidateSwipes } = userIds.length
      ? await admin.from('swipes').select('swiper_id,target_id,action,context_job_id')
          .in('swiper_id', userIds).eq('swiper_type', 'candidate').eq('target_type', 'job')
      : { data: [] as any[] }
    const candidateYes = new Set((candidateSwipes || []).filter((row: any) => row.action === 'right')
      .map((row: any) => `${row.swiper_id}:${row.target_id}`))

    const candidates = visible.map((candidate: any) => {
      const travel = mutualRadiusResult({ latitude: employer.latitude, longitude: employer.longitude }, candidate, null)
      if (!travel.withinRadius) return null

      let best: any = null
      for (const job of liveJobs) {
        const result = calculateMatchScore(candidate, job)
        if (result.hardStop) continue
        if (!best || result.score > best.matchScore) {
          best = {
            matchScore: result.score,
            matchLabel: result.label,
            matchExplanation: result.matchExplanation || '',
            bestJob: job.job_title,
            bestJobId: job.id,
          }
        }
      }
      const bestJobId = best?.bestJobId || null
      const interested = Boolean(bestJobId && interestedKey.has(`${candidate.id}:${bestJobId}`))
      const mutual = Boolean(interested && candidate.user_id && candidateYes.has(`${candidate.user_id}:${bestJobId}`))
      return {
        ...candidate,
        latitude: undefined,
        longitude: undefined,
        distance_miles: travel.distanceMiles,
        ...best,
        interested,
        mutual,
        shortlisted: shortlisted.has(candidate.id),
      }
    }).filter(Boolean).sort((a: any, b: any) => {
      if (!!a.is_featured !== !!b.is_featured) return a.is_featured ? -1 : 1
      return Number(b.matchScore ?? -1) - Number(a.matchScore ?? -1)
    })

    return NextResponse.json({
      candidates,
      live_role_count: liveJobs.length,
      employer: { id: employer.id, company_name: employer.company_name, property_name: employer.property_name },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Talent directory unavailable' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const candidateId = String(body.candidateId || '')
    const jobId = String(body.jobId || '')
    const action = String(body.action || '')
    if (!candidateId || !['left','right'].includes(action)) return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })

    const admin = createAdminClient()
    const employer = await employerFor(admin, user.id)
    if (!employer || employer.approval_status !== 'approved') return NextResponse.json({ error: 'Approved employer account required' }, { status: 403 })

    if (action === 'left') {
      const { error } = await upsertSwipe(admin, {
        swiper_id: user.id,
        swiper_type: 'employer',
        target_id: candidateId,
        target_type: 'candidate',
        action: 'left',
        context_job_id: null,
      })
      if (error) return NextResponse.json({ error: 'Your pass could not be saved.' }, { status: 500 })
      return NextResponse.json({ success: true, matched: false })
    }

    if (!jobId) return NextResponse.json({ error: 'Choose a live role before showing interest.' }, { status: 400 })
    const [{ data: candidate }, { data: job }, { data: block }] = await Promise.all([
      admin.from('candidate_profiles').select('*').eq('id', candidateId).maybeSingle(),
      admin.from('job_listings').select('*').eq('id', jobId).eq('employer_id', employer.id).maybeSingle(),
      admin.from('profile_blocks').select('candidate_id').eq('candidate_id', candidateId).eq('blocked_employer_id', employer.id).maybeSingle(),
    ])
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
    if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) return NextResponse.json({ error: 'Choose one of your current live roles.' }, { status: 400 })
    if (!canEmployerDiscoverCandidate(candidate, new Set(block ? [candidateId] : []))) return NextResponse.json({ error: 'This profile is not available to your account.' }, { status: 403 })
    const travel = mutualRadiusResult({ latitude: employer.latitude, longitude: employer.longitude }, candidate, null)
    if (!travel.withinRadius) return NextResponse.json({ error: 'This professional is outside the available travel rules for this property.' }, { status: 403 })
    const score = calculateMatchScore(candidate, job)
    if (score.hardStop) return NextResponse.json({ error: score.hardStopReason || 'This professional is not compatible with that role.' }, { status: 400 })

    const { error } = await upsertSwipe(admin, {
      swiper_id: user.id,
      swiper_type: 'employer',
      target_id: candidate.id,
      target_type: 'candidate',
      action: 'right',
      context_job_id: job.id,
    })
    if (error) return NextResponse.json({ error: 'Your interest could not be saved.' }, { status: 500 })

    if (candidate.user_id) {
      await createNotification(candidate.user_id, 'general', 'A property is interested in you', `${employer.property_name || employer.company_name || 'An employer'} is interested in you for ${job.job_title}.`, '/talent/jobs').catch(() => null)
    }

    if (!candidate.user_id) return NextResponse.json({ success: true, matched: false })
    const { data: candidateResponse } = await admin.from('swipes').select('id')
      .eq('swiper_id', candidate.user_id).eq('swiper_type', 'candidate')
      .eq('target_id', job.id).eq('target_type', 'job').eq('action', 'right')
      .eq('context_job_id', job.id).maybeSingle()
    if (!candidateResponse) return NextResponse.json({ success: true, matched: false, candidateName: candidate.full_name, jobTitle: job.job_title })

    const [{ data: candidateAuth }, employerEmailResult] = await Promise.all([
      admin.auth.admin.getUserById(candidate.user_id),
      employer.contact_email ? Promise.resolve({ email: employer.contact_email }) : admin.auth.admin.getUserById(user.id).then((r: any) => ({ email: r.data?.user?.email || null })),
    ])
    const matchId = await ensureMutualMatch(admin, {
      candidate,
      employer,
      job,
      score: Number(score.score || 0),
      candidateUserId: candidate.user_id,
      employerUserId: user.id,
      candidateEmail: candidateAuth?.user?.email || null,
      employerEmail: (employerEmailResult as any)?.email || null,
    })
    return NextResponse.json({ success: true, matched: true, matchId, candidateName: candidate.full_name, jobTitle: job.job_title })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not save your decision' }, { status: 500 })
  }
}