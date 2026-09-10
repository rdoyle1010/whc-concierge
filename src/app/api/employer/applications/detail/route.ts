import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { CURRENT_EMPLOYER_COLUMNS, PRIVATE_MODE_COLUMNS, isMissingColumnError, presentCandidateForEmployer } from '@/lib/private-mode'

// What an employer may see about somebody who applied to their role.
//
// This route selected the whole candidate row and stripped one column. The
// other twenty-odd went to the browser: phone number, home postcode, exact
// latitude and longitude, work email, right-to-work and insurance document
// URLs, verification notes, Stripe customer ids, and the salary floor the
// professional had explicitly marked private.
//
// The sibling inbox route has always done this correctly with an explicit
// list. Copied here rather than invented, so the two screens show the same
// professional the same way.
const CANDIDATE_FIELDS = [
  'id','user_id','full_name','headline','role_level','location','location_country','services_offered','treatment_skills','experience_years',
  'profile_image_url','review_score','review_count','bio','qualifications','product_houses','systems_experience',
  'business_skills','career_evidence','has_insurance','cv_url','certificates_urls','is_featured','featured_until',
  'awards','languages','hotel_brands_worked','skill_proficiencies','portfolio_url','availability_status','availability_date',
  // Verification, so the employer can see it on the screen where they decide.
  'whc_verified','right_to_work_status','insurance_expiry_date',
  'salary_expectation_min','salary_expectation_max','salary_expectation_private',
  'commercial_experience','revenue_responsibility','team_size_managed','desired_roles',
  // Matching reads these, and the score is calculated on this row.
  'travel_radius_miles','has_car','latitude','longitude','postcode',
  // Anonymity, applied through the shared presenter below.
  'show_first_name_only','stealth_mode','approval_status','profile_visible','created_at',
].join(',')

// The two optional column sets retry-drop exactly as they do elsewhere, so
// this route keeps working before those migrations have run.
async function selectCandidate(admin: ReturnType<typeof createAdminClient>, candidateId: string) {
  const attempt = (fields: string) =>
    admin.from('candidate_profiles').select(fields).eq('id', candidateId).maybeSingle()
  let result: any = await attempt(`${CANDIDATE_FIELDS},${PRIVATE_MODE_COLUMNS.join(',')},${CURRENT_EMPLOYER_COLUMNS.join(',')}`)
  if (isMissingColumnError(result.error)) result = await attempt(`${CANDIDATE_FIELDS},${PRIVATE_MODE_COLUMNS.join(',')}`)
  if (isMissingColumnError(result.error)) result = await attempt(CANDIDATE_FIELDS)
  return result
}

function cvStorageRef(value?: string | null) {
  if (!value) return null
  try {
    const parsed = new URL(value, 'https://wellnesshouse.local')
    const bucket = parsed.searchParams.get('bucket')
    const path = parsed.searchParams.get('path')
    if (bucket === 'talent-documents' && path) return { bucket, path }
  } catch {}
  return null
}

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const applicationId = req.nextUrl.searchParams.get('applicationId')
    if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id,user_id,company_name,property_name')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

    const { data: application, error: applicationError } = await admin.from('applications')
      .select('id,status,match_score,candidate_id,role_id,job_id,cover_letter,cover_note,submitted_at,created_at,updated_at,archived_at,hired_at')
      .eq('id', applicationId)
      .maybeSingle()
    if (applicationError) return NextResponse.json({ error: applicationError.message }, { status: 500 })
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    if (application.status === 'draft') return NextResponse.json({ error: 'This application has not been submitted yet.' }, { status: 409 })

    const jobId = application.role_id || application.job_id
    const [{ data: job }, { data: candidate }] = await Promise.all([
      admin.from('job_listings').select('*').eq('id', jobId).maybeSingle(),
      selectCandidate(admin, application.candidate_id),
    ])

    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

    // Anonymity and the salary the professional marked private, both applied
    // before the row is shaped for the response. The match below is calculated
    // on the full row, because the score is ours to compute and hers to keep.
    const presented = presentCandidateForEmployer(candidate)
    const safeCandidate = presented.salary_expectation_private !== false
      ? { ...presented, salary_expectation_min: null, salary_expectation_max: null }
      : presented

    const liveMatch = calculateMatchScore(candidate, job)
    const liveScore = liveMatch.hardStop ? Number(application.match_score || 0) : Number(liveMatch.score || 0)
    const matchExplanation = liveMatch.hardStop
      ? String(liveMatch.hardStopReason || 'The current role settings need review before a live match explanation can be shown.')
      : String(liveMatch.matchExplanation || '')

    if (!liveMatch.hardStop && liveScore !== Number(application.match_score || 0)) {
      await admin.from('applications').update({ match_score: liveScore, updated_at: new Date().toISOString() }).eq('id', application.id)
    }

    let cvSignedUrl: string | null = null
    const cvRef = cvStorageRef(candidate.cv_url)
    if (cvRef) {
      const { data } = await admin.storage.from(cvRef.bucket).createSignedUrl(cvRef.path, 15 * 60)
      cvSignedUrl = data?.signedUrl || null
    }

    return NextResponse.json({
      application: {
        id: application.id,
        status: application.status,
        match_score: liveScore,
        match_label: liveMatch.label || null,
        match_explanation: matchExplanation,
        cover_letter: application.cover_letter || application.cover_note || '',
        submitted_at: application.submitted_at,
        created_at: application.created_at,
        updated_at: application.updated_at,
        archived_at: application.archived_at,
        hired_at: application.hired_at,
      },
      candidate: {
        ...safeCandidate,
        // Location is used to compute distance, never to hand over an address.
        latitude: undefined,
        longitude: undefined,
        postcode: undefined,
        cv_url: undefined,
        cv_signed_url: cvSignedUrl,
      },
      job,
      employer: {
        id: employer.id,
        company_name: employer.company_name,
        property_name: employer.property_name,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not load this application.' }, { status: 500 })
  }
}
