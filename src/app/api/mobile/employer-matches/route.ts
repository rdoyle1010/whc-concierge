import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { canEmployerDiscoverCandidate, mutualRadiusResult } from '@/lib/discovery'
import { createNotification } from '@/lib/notifications'
import { createMutualMatch } from '@/lib/mutual-match'
import { candidateNameForEmployer, presentCandidateForEmployer } from '@/lib/private-mode'

const CANDIDATE_FIELDS = [
  'id','user_id','full_name','headline','role_level','location','services_offered','experience_years','years_experience',
  'profile_image_url','review_score','bio','qualifications','treatment_skills','product_houses','systems_experience',
  'business_skills','career_evidence','has_insurance','awards','availability_status','travel_radius_miles','has_car',
  'latitude','longitude','approval_status','profile_visible','stealth_mode','show_first_name_only','is_featured','featured_until','created_at',
].join(',')

async function getEmployer(admin: any, userId: string) {
  const { data } = await admin.from('employer_profiles')
    .select('id,user_id,company_name,property_name,approval_status,latitude,longitude,postcode,featured_employer,featured_until,membership_tier')
    .eq('user_id', userId).maybeSingle()
  return data
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const employer = await getEmployer(admin, user.id)
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })
  if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved first.' }, { status: 403 })

  const requestedJobId = String(req.nextUrl.searchParams.get('jobId') || '')
  const now = new Date().toISOString()
  const [{ data: jobs }, { data: blocks }] = await Promise.all([
    admin.from('job_listings').select('*').eq('employer_id', employer.id).eq('is_live', true).or(`expires_at.is.null,expires_at.gt.${now}`).order('posted_date', { ascending: false }),
    admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employer.id),
  ])
  const liveJobs = jobs || []
  const selectedJob = requestedJobId ? liveJobs.find((job: any) => job.id === requestedJobId) : liveJobs[0]
  if (!selectedJob) return NextResponse.json({ jobs: liveJobs, candidates: [], selected_job_id: null })

  const [{ data: rows, error }, { data: swipes }] = await Promise.all([
    admin.from('candidate_profiles').select(CANDIDATE_FIELDS).eq('approval_status', 'approved').or('profile_visible.eq.true,profile_visible.is.null').order('is_featured', { ascending: false }).limit(100),
    admin.from('swipes').select('target_id,action,context_job_id').eq('swiper_id', user.id).eq('swiper_type', 'employer').eq('target_type', 'candidate'),
  ])
  if (error) return NextResponse.json({ error: 'Talent matches are unavailable.' }, { status: 500 })

  const blocked = new Set((blocks || []).map((row: any) => row.candidate_id))
  // Private Career Mode, read tolerantly - the column arrives with migration
  // 20260831190000 and the feed must not break before it runs.
  const privateIds = new Set<string>()
  try {
    const { data: privateRows, error: privateError } = await admin.from('candidate_profiles')
      .select('id').eq('private_mode', true)
    if (!privateError) for (const row of privateRows || []) privateIds.add(row.id)
  } catch { }
  const reviewedForRole = new Set((swipes || []).filter((row: any) => row.action === 'left' || row.context_job_id === selectedJob.id).map((row: any) => row.target_id))
  const candidates = (rows || []).map((raw: any) => {
    const candidate = privateIds.has(raw.id) ? { ...raw, private_mode: true } : raw
    if (reviewedForRole.has(candidate.id)) return null
    if (!canEmployerDiscoverCandidate(candidate, blocked)) return null
    const travel = mutualRadiusResult(employer, candidate, null)
    if (!travel.withinRadius) return null
    const match = calculateMatchScore(candidate, selectedJob)
    if (match.hardStop) return null
    return {
      ...presentCandidateForEmployer(candidate),
      latitude: undefined,
      longitude: undefined,
      match_score: match.score,
      match_label: match.label,
      match_explanation: match.matchExplanation || [],
      distance_miles: travel.distanceMiles,
      role_title: selectedJob.job_title,
    }
  }).filter(Boolean).sort((a: any, b: any) => Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) || Number(b.match_score || 0) - Number(a.match_score || 0))

  return NextResponse.json({
    jobs: liveJobs.map((job: any) => ({ id: job.id, job_title: job.job_title, location: job.location, job_type: job.job_type })),
    selected_job_id: selectedJob.id,
    candidates,
  })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const candidateId = String(body.candidateId || '')
  const jobId = String(body.jobId || '')
  const action = String(body.action || '')
  if (!candidateId || !jobId || !['left','right'].includes(action)) return NextResponse.json({ error: 'Invalid swipe.' }, { status: 400 })

  const admin = createAdminClient()
  const employer = await getEmployer(admin, user.id)
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const [{ data: candidate }, { data: job }, { data: blocked }] = await Promise.all([
    admin.from('candidate_profiles').select('*').eq('id', candidateId).maybeSingle(),
    admin.from('job_listings').select('*').eq('id', jobId).eq('employer_id', employer.id).maybeSingle(),
    admin.from('profile_blocks').select('candidate_id').eq('candidate_id', candidateId).eq('blocked_employer_id', employer.id).maybeSingle(),
  ])
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
  if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) return NextResponse.json({ error: 'Choose one of your live roles.' }, { status: 400 })

  if (action === 'right') {
    const discoverable = canEmployerDiscoverCandidate(candidate, new Set(blocked ? [candidateId] : []))
    const travel = mutualRadiusResult(employer, candidate, null)
    if (!discoverable || !travel.withinRadius) return NextResponse.json({ error: 'This professional is outside the available search rules for this property.' }, { status: 403 })
    const match = calculateMatchScore(candidate, job)
    if (match.hardStop) return NextResponse.json({ error: match.hardStopReason || 'This professional is not compatible with that role.' }, { status: 400 })
  }

  const contextForAction = action === 'right' ? jobId : null
  let deleteQuery = admin.from('swipes').delete()
    .eq('swiper_id', user.id).eq('swiper_type', 'employer')
    .eq('target_id', candidateId).eq('target_type', 'candidate')
  deleteQuery = contextForAction ? deleteQuery.eq('context_job_id', contextForAction) : deleteQuery.is('context_job_id', null)
  await deleteQuery

  const { error: swipeError } = await admin.from('swipes').insert({
    swiper_id: user.id,
    swiper_type: 'employer',
    target_id: candidateId,
    target_type: 'candidate',
    action,
    // Passes are global (matching the web convention); interest is role-specific.
    context_job_id: contextForAction,
  })
  if (swipeError) return NextResponse.json({ error: 'Your decision could not be saved.' }, { status: 500 })

  if (action === 'left') return NextResponse.json({ success: true, matched: false })

  let applicationId: string | null = null
  const { data: application } = await admin.from('applications').select('id,status')
    .eq('candidate_id', candidateId).or(`job_id.eq.${jobId},role_id.eq.${jobId}`)
    .neq('status', 'draft')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  applicationId = application?.id || null

  let mutual = false
  if (candidate.user_id) {
    const { data: candidateYes } = await admin.from('swipes').select('id')
      .eq('swiper_id', candidate.user_id).eq('swiper_type', 'candidate')
      .eq('target_id', jobId).eq('target_type', 'job').eq('action', 'right').maybeSingle()
    mutual = Boolean(candidateYes)
    if (mutual) {
      // A mobile match must behave exactly like a web match: create the
      // matches row (which unlocks messaging), message both sides, and email
      // them - not just drop an unactionable notification.
      const match = calculateMatchScore(candidate, job)
      let employerEmail: string | null = null
      let candidateEmail: string | null = null
      const [{ data: employerUser }, { data: candidateUser }] = await Promise.all([
        admin.auth.admin.getUserById(user.id),
        admin.auth.admin.getUserById(candidate.user_id),
      ])
      employerEmail = employerUser?.user?.email || null
      candidateEmail = candidateUser?.user?.email || null
      try {
        await createMutualMatch(admin, {
          candidate, employer, job, score: match.score,
          candidateUserId: candidate.user_id, employerUserId: user.id,
          candidateEmail, employerEmail,
        })
      } catch (matchError: any) {
        console.error('Mobile mutual match failed:', matchError?.message)
      }
    } else {
      await createNotification(candidate.user_id, 'general', 'A property is interested in you',
        `${employer.property_name || employer.company_name || 'A property'} is interested in you for ${job.job_title}.`, '/talent/jobs')
    }
  }

  return NextResponse.json({ success: true, matched: mutual, applicationId, candidateName: candidate.full_name || 'Candidate', jobTitle: job.job_title })
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const jobId = String(req.nextUrl.searchParams.get('jobId') || '')
  if (!jobId) return NextResponse.json({ error: 'Choose a role first.' }, { status: 400 })
  const admin = createAdminClient()
  const { error } = await admin.from('swipes').delete()
    .eq('swiper_id', user.id).eq('swiper_type', 'employer').eq('target_type', 'candidate')
    .or(`context_job_id.eq.${jobId},context_job_id.is.null`)
  if (error) return NextResponse.json({ error: 'Could not reset matches.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
