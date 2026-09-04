import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { createNotification } from '@/lib/notifications'

const RESTARTABLE = new Set(['withdrawn', 'rejected'])

async function clearPreviousJourney(admin: ReturnType<typeof createAdminClient>, applicationId: string) {
  const [interviews, offers] = await Promise.all([
    admin.from('application_interviews').delete().eq('application_id', applicationId),
    admin.from('application_offers').delete().eq('application_id', applicationId),
  ])
  if (interviews.error) throw interviews.error
  if (offers.error) throw offers.error
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate, error: candidateError } = await admin.from('candidate_profiles')
    .select('id,user_id,full_name,headline,role_level,location,profile_image_url')
    .eq('user_id', user.id).maybeSingle()
  if (candidateError) return NextResponse.json({ error: candidateError.message }, { status: 500 })
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

  const { data: inbound, error: inboundError } = await admin.from('swipes')
    .select('id,swiper_id,context_job_id,swiped_at')
    .eq('swiper_type', 'employer')
    .eq('target_type', 'candidate')
    .eq('target_id', candidate.id)
    .eq('action', 'right')
    .not('context_job_id', 'is', null)
    .order('swiped_at', { ascending: false })
  if (inboundError) return NextResponse.json({ error: inboundError.message }, { status: 500 })

  const rows = inbound || []
  const jobIds = Array.from(new Set(rows.map((row: any) => row.context_job_id).filter(Boolean))) as string[]
  if (!jobIds.length) return NextResponse.json({ interests: [], pending_count: 0 })

  const [{ data: jobs }, { data: responses }, { data: applications }] = await Promise.all([
    admin.from('job_listings').select('id,employer_id,job_title,location,job_type,salary_display_text,is_live,status,expires_at,job_image_url,required_role_level').in('id', jobIds),
    admin.from('swipes').select('target_id,action').eq('swiper_id', user.id).eq('swiper_type', 'candidate').eq('target_type', 'job').in('target_id', jobIds),
    admin.from('applications').select('id,status,job_id,role_id,submitted_at,match_score').eq('candidate_id', candidate.id).order('created_at', { ascending: false }),
  ])

  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
  const employerIds = Array.from(new Set((jobs || []).map((job: any) => job.employer_id).filter(Boolean))) as string[]
  const { data: employers } = employerIds.length
    ? await admin.from('employer_profiles').select('id,user_id,company_name,property_name,logo_url,location,review_score,review_count,star_rating').in('id', employerIds)
    : { data: [] as any[] }
  const employerMap = new Map((employers || []).map((employer: any) => [employer.id, employer]))
  const responseMap = new Map((responses || []).map((row: any) => [row.target_id, row.action]))

  const applicationByJob = new Map<string, any>()
  for (const application of applications || []) {
    const key = application.role_id || application.job_id
    if (key && !applicationByJob.has(key)) applicationByJob.set(key, application)
  }

  const now = Date.now()
  const interests = rows.map((row: any) => {
    const job: any = jobMap.get(row.context_job_id)
    if (!job) return null
    if (!job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= now)) return null
    const employer: any = employerMap.get(job.employer_id) || null
    const response = responseMap.get(job.id) === 'right' ? 'accepted' : responseMap.get(job.id) === 'left' ? 'declined' : 'waiting'
    const application = applicationByJob.get(job.id) || null
    return {
      interest_id: row.id,
      sent_at: row.swiped_at,
      response,
      application_id: application?.id || null,
      application_status: application?.status || null,
      job,
      employer,
    }
  }).filter(Boolean)

  return NextResponse.json({
    interests,
    pending_count: interests.filter((item: any) => item.response === 'waiting').length,
  })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const interestId = String(body.interestId || '')
  const action = String(body.action || '') as 'accept' | 'decline'
  if (!interestId || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Choose accept or decline.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

  const { data: interest } = await admin.from('swipes')
    .select('id,swiper_id,target_id,context_job_id,action')
    .eq('id', interestId)
    .eq('swiper_type', 'employer')
    .eq('target_type', 'candidate')
    .eq('target_id', candidate.id)
    .eq('action', 'right')
    .maybeSingle()
  if (!interest?.context_job_id) return NextResponse.json({ error: 'This employer interest is no longer active.' }, { status: 404 })

  const [{ data: job }, { data: employer }] = await Promise.all([
    admin.from('job_listings').select('*').eq('id', interest.context_job_id).maybeSingle(),
    admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', interest.swiper_id).maybeSingle(),
  ])
  if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) {
    return NextResponse.json({ error: 'This role is no longer available.' }, { status: 409 })
  }
  if (!employer || employer.id !== job.employer_id) return NextResponse.json({ error: 'Employer could not be verified.' }, { status: 409 })

  const candidateSwipe = {
    swiper_id: user.id,
    swiper_type: 'candidate',
    target_id: job.id,
    target_type: 'job',
    action: action === 'accept' ? 'right' : 'left',
    context_job_id: job.id,
  }
  const { error: swipeError } = await admin.from('swipes').upsert(candidateSwipe, {
    onConflict: 'swiper_id,swiper_type,target_id,target_type,context_job_id',
    ignoreDuplicates: false,
  })
  if (swipeError) return NextResponse.json({ error: 'Your response could not be saved.' }, { status: 500 })

  const propertyName = employer.property_name || employer.company_name || 'the property'
  const candidateName = candidate.full_name || 'Talent'

  if (action === 'decline') {
    await createNotification(
      employer.user_id,
      'general',
      `${candidateName} declined your interest`,
      `${candidateName} has decided not to progress with ${job.job_title}.`,
      '/employer/match',
    ).catch(() => null)
    return NextResponse.json({ success: true, response: 'declined' })
  }

  const match = calculateMatchScore(candidate, job)
  const matchScore = Number(match.score || 0)
  const now = new Date().toISOString()

  const { data: existing } = await admin.from('applications')
    .select('id,status')
    .eq('candidate_id', candidate.id)
    .or(`job_id.eq.${job.id},role_id.eq.${job.id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let applicationId: string | null = existing?.id || null
  let applicationStatus = String(existing?.status || '')

  if (existing && RESTARTABLE.has(applicationStatus.toLowerCase())) {
    try {
      await clearPreviousJourney(admin, existing.id)
    } catch {
      return NextResponse.json({ error: 'Could not clear the previous recruitment journey.' }, { status: 500 })
    }
    const { error } = await admin.from('applications').update({
      status: 'pending',
      match_score: matchScore,
      submitted_at: now,
      archived_at: null,
      hired_at: null,
      updated_at: now,
    }).eq('id', existing.id)
    if (error) return NextResponse.json({ error: 'Could not restart this recruitment journey.' }, { status: 500 })
    applicationStatus = 'pending'
  } else if (existing?.status === 'draft') {
    const { error } = await admin.from('applications').update({
      status: 'pending',
      match_score: matchScore,
      submitted_at: now,
      updated_at: now,
    }).eq('id', existing.id)
    if (error) return NextResponse.json({ error: 'Could not start this recruitment journey.' }, { status: 500 })
    applicationStatus = 'pending'
  } else if (!existing) {
    const { data: created, error } = await admin.from('applications').insert({
      candidate_id: candidate.id,
      role_id: job.id,
      job_id: job.id,
      status: 'pending',
      match_score: matchScore,
      cover_letter: '',
      submitted_at: now,
    }).select('id,status').single()
    if (error) return NextResponse.json({ error: 'Could not start this recruitment journey.' }, { status: 500 })
    applicationId = created.id
    applicationStatus = created.status
  }

  await Promise.all([
    createNotification(
      employer.user_id,
      'general',
      `${candidateName} is interested too`,
      `${candidateName} accepted your interest in ${job.job_title}. The recruitment journey is now open.`,
      '/employer/applications',
    ).catch(() => null),
    createNotification(
      user.id,
      'general',
      `Mutual interest with ${propertyName}`,
      `You and ${propertyName} are both interested in ${job.job_title}. Your application journey is now open.`,
      '/talent/applications',
    ).catch(() => null),
  ])

  return NextResponse.json({
    success: true,
    response: 'accepted',
    applicationId,
    applicationStatus,
    matchScore,
  })
}
