import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const interviewId = String(body.interviewId || '')
    if (!interviewId) return NextResponse.json({ error: 'Interview is required.' }, { status: 400 })

    const meetingLink = String(body.meetingLink || '').trim().slice(0, 1000)
    const venueAddress = String(body.venueAddress || '').trim().slice(0, 1500)
    const contactName = String(body.contactName || '').trim().slice(0, 300)
    const preparationRequired = String(body.preparationRequired || '').trim().slice(0, 2500)
    const assessmentType = String(body.assessmentType || '').trim().slice(0, 100)
    const assessmentDetails = String(body.assessmentDetails || '').trim().slice(0, 2500)
    const employerNote = String(body.employerNote || '').trim().slice(0, 2500)

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

    const { data: interview } = await admin.from('application_interviews').select('id,application_id,round_number,interview_method').eq('id', interviewId).maybeSingle()
    if (!interview) return NextResponse.json({ error: 'Interview not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id').eq('id', interview.application_id).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    const jobId = application.role_id || application.job_id
    const { data: job } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: updated, error } = await admin.from('application_interviews').update({
      meeting_link: meetingLink || null,
      venue_address: venueAddress || null,
      contact_name: contactName || null,
      preparation_required: preparationRequired || null,
      assessment_type: assessmentType || null,
      assessment_details: assessmentDetails || null,
      employer_note: employerNote || null,
      updated_at: new Date().toISOString(),
    }).eq('id', interview.id).select('*').single()
    if (error) return NextResponse.json({ error: 'Could not update interview details.' }, { status: 500 })

    const { data: candidate } = await admin.from('candidate_profiles').select('user_id').eq('id', application.candidate_id).maybeSingle()
    if (candidate?.user_id) {
      await createNotification(candidate.user_id, 'general', `Interview ${interview.round_number} details updated`, `${employer.property_name || employer.company_name || 'The property'} updated the interview instructions for ${job.job_title}.`, '/talent/applications')
    }

    return NextResponse.json({ success: true, interview: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not update interview details.' }, { status: 500 })
  }
}
