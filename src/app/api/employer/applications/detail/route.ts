import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'

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
      admin.from('candidate_profiles').select('*').eq('id', application.candidate_id).maybeSingle(),
    ])

    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

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
        ...candidate,
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
