import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Your session could not be verified. Please sign in again.' }, { status: 401 })

    const { applicationId } = await req.json().catch(() => ({}))
    if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id,company_name,property_name')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

    const { data: application, error: applicationError } = await admin.from('applications')
      .select('id,status,candidate_id,role_id,job_id')
      .eq('id', String(applicationId))
      .maybeSingle()
    if (applicationError) return NextResponse.json({ error: applicationError.message }, { status: 500 })
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    if (application.status !== 'rejected') return NextResponse.json({ error: 'Only a not-progressing application can be reopened.' }, { status: 409 })

    const jobId = application.role_id || application.job_id
    const { data: job } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'This application does not belong to the signed-in employer.' }, { status: 403 })

    const { data: liveOffer } = await admin.from('application_offers').select('id').eq('application_id', application.id).in('status', ['offered', 'accepted']).maybeSingle()
    if (liveOffer) return NextResponse.json({ error: 'Resolve the existing offer before reopening this application.' }, { status: 409 })

    const { data: updated, error: updateError } = await admin.from('applications')
      .update({ status: 'reviewed', updated_at: new Date().toISOString() })
      .eq('id', application.id)
      .select('id,status')
      .single()
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const { data: candidate } = await admin.from('candidate_profiles').select('user_id,full_name').eq('id', application.candidate_id).maybeSingle()
    if (candidate?.user_id) {
      const propertyName = employer.property_name || employer.company_name || 'The employer'
      await createNotification(candidate.user_id, 'general', 'Your application has been reopened', `${propertyName} has reopened your application for ${job.job_title}.`, '/talent/applications').catch(() => null)
    }

    return NextResponse.json({ success: true, applicationStatus: updated.status })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not reopen this application.' }, { status: 500 })
  }
}
