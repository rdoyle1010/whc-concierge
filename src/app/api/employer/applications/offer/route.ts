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
    const applicationId = String(body.applicationId || '')
    const salaryAmount = body.salaryAmount === '' || body.salaryAmount == null ? null : Number(body.salaryAmount)
    const salaryPeriod = String(body.salaryPeriod || 'annual')
    const startDate = body.startDate ? String(body.startDate) : null
    const note = String(body.note || '').trim().slice(0, 2500)
    if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })
    if (salaryAmount != null && (!Number.isFinite(salaryAmount) || salaryAmount <= 0)) return NextResponse.json({ error: 'Enter a valid salary amount.' }, { status: 400 })
    if (!['annual','monthly','daily','hourly'].includes(salaryPeriod)) return NextResponse.json({ error: 'Choose a valid salary period.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })
    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status').eq('id', applicationId).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    if (!['interview','shortlisted','offered'].includes(application.status)) return NextResponse.json({ error: 'Move the candidate through shortlist/interview before making an offer.' }, { status: 409 })

    const jobId = application.role_id || application.job_id
    const [{ data: job }, { data: candidate }] = await Promise.all([
      admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle(),
      admin.from('candidate_profiles').select('id,user_id,full_name').eq('id', application.candidate_id).maybeSingle(),
    ])
    if (!job || job.employer_id !== employer.id || !candidate?.user_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: offer, error } = await admin.from('application_offers').upsert({
      application_id: application.id,
      salary_amount: salaryAmount,
      salary_period: salaryPeriod,
      start_date: startDate,
      employer_note: note || null,
      status: 'offered',
      offered_at: new Date().toISOString(),
      responded_at: null,
      candidate_note: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'application_id' }).select('*').single()
    if (error) return NextResponse.json({ error: 'Could not create the offer.' }, { status: 500 })

    await admin.from('applications').update({ status: 'offered', updated_at: new Date().toISOString() }).eq('id', application.id)
    const propertyName = employer.property_name || employer.company_name || 'The property'
    await createNotification(candidate.user_id, 'general', `Job offer - ${job.job_title}`, `${propertyName} has made you an offer. Review and respond in My Applications.`, '/talent/applications')
    return NextResponse.json({ success: true, offer })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not create the offer.' }, { status: 500 })
  }
}
