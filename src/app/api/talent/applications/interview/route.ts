import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const applicationId = new URL(req.url).searchParams.get('applicationId')
  if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

  const { data: application } = await admin.from('applications').select('id,candidate_id').eq('id', applicationId).maybeSingle()
  if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await admin.from('application_interviews').select('*').eq('application_id', applicationId).order('round_number', { ascending: true })
  if (error) return NextResponse.json({ error: 'Could not load interview invitations.' }, { status: 500 })
  return NextResponse.json({ interviews: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const interviewId = String(body.interviewId || '')
    const selectedSlot = String(body.selectedSlot || '')
    const candidateNote = String(body.note || '').trim().slice(0, 1500)
    if (!interviewId || !selectedSlot) return NextResponse.json({ error: 'Choose an interview time.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles').select('id,user_id,full_name').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

    const { data: interview } = await admin.from('application_interviews').select('*').eq('id', interviewId).maybeSingle()
    if (!interview) return NextResponse.json({ error: 'Interview invitation not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id').eq('id', interview.application_id).maybeSingle()
    if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const proposed = Array.isArray(interview.proposed_slots) ? interview.proposed_slots.map(String) : []
    const chosen = new Date(selectedSlot)
    if (Number.isNaN(chosen.getTime()) || !proposed.some((slot: string) => new Date(slot).toISOString() === chosen.toISOString())) {
      return NextResponse.json({ error: 'Choose one of the proposed interview times.' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await admin.from('application_interviews').update({
      selected_slot: chosen.toISOString(),
      status: 'confirmed',
      candidate_note: candidateNote || null,
      updated_at: new Date().toISOString(),
    }).eq('id', interview.id).eq('status', 'proposed').select('*').maybeSingle()
    if (updateError || !updated) return NextResponse.json({ error: 'Could not confirm this interview time.' }, { status: 409 })

    await admin.from('applications').update({ status: 'interview', updated_at: new Date().toISOString() }).eq('id', application.id)

    const jobId = application.role_id || application.job_id
    const { data: job } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    if (job?.employer_id) {
      const { data: employer } = await admin.from('employer_profiles').select('user_id').eq('id', job.employer_id).maybeSingle()
      if (employer?.user_id) {
        const when = chosen.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'})
        await createNotification(employer.user_id, 'general', `Interview ${interview.round_number} confirmed`, `${candidate.full_name || 'The candidate'} selected ${when} for ${job.job_title}.`, '/employer/applications')
      }
    }

    return NextResponse.json({ success: true, interview: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not confirm interview.' }, { status: 500 })
  }
}
