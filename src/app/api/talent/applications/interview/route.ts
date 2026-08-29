import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getRequestUser } from '@/lib/request-user'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Spa Platform <noreply@mail.wellnesshousecollective.co.uk>'

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function methodLabel(method: string) {
  return method === 'teams' ? 'Microsoft Teams' : method === 'video' ? 'Video call' : method === 'phone' ? 'Phone call' : 'In person'
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
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
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const action = String(body.action || 'confirm')
    const interviewId = String(body.interviewId || '')
    const selectedSlot = String(body.selectedSlot || '')
    const candidateNote = String(body.note || '').trim().slice(0, 1500)
    if (!interviewId) return NextResponse.json({ error: 'Interview invitation is required.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles').select('id,user_id,full_name').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

    const { data: interview } = await admin.from('application_interviews').select('*').eq('id', interviewId).maybeSingle()
    if (!interview) return NextResponse.json({ error: 'Interview invitation not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id').eq('id', interview.application_id).maybeSingle()
    if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const jobId = application.role_id || application.job_id
    const { data: job } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    const { data: employer } = job?.employer_id
      ? await admin.from('employer_profiles').select('user_id,property_name,company_name').eq('id', job.employer_id).maybeSingle()
      : { data: null as any }

    if (action === 'request_alternative') {
      if (interview.status !== 'proposed') return NextResponse.json({ error: 'This interview invitation is no longer waiting for a time choice.' }, { status: 409 })
      if (candidateNote.length < 10) return NextResponse.json({ error: 'Tell the employer when you are available so they can offer new times.' }, { status: 400 })

      const { data: updated, error: updateError } = await admin.from('application_interviews').update({
        candidate_note: candidateNote,
        selected_slot: null,
        updated_at: new Date().toISOString(),
      }).eq('id', interview.id).eq('status', 'proposed').select('*').maybeSingle()
      if (updateError || !updated) return NextResponse.json({ error: 'Could not send your availability.' }, { status: 409 })

      if (employer?.user_id) {
        await createNotification(
          employer.user_id,
          'general',
          `Alternative interview times requested`,
          `${candidate.full_name || 'The candidate'} cannot make the proposed times for ${job?.job_title || 'the role'} and has sent new availability.`,
          '/employer/applications'
        )
      }
      return NextResponse.json({ success: true, interview: updated })
    }

    if (!selectedSlot) return NextResponse.json({ error: 'Choose an interview time.' }, { status: 400 })
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

    const when = chosen.toLocaleString('en-GB',{dateStyle:'full',timeStyle:'short',timeZone:'Europe/London'})
    if (employer?.user_id) {
      await createNotification(employer.user_id, 'general', `Interview ${interview.round_number} confirmed`, `${candidate.full_name || 'The candidate'} selected ${when} for ${job?.job_title || 'the role'}.`, '/employer/applications')
    }

    const propertyName = employer?.property_name || employer?.company_name || 'the property'
    const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
    const email = authUser?.user?.email || null
    if (email && RESEND_API_KEY) {
      const logistics = interview.interview_method === 'in_person'
        ? `<p><strong>Venue:</strong> ${escapeHtml(interview.venue_address || '')}</p>`
        : interview.interview_method === 'phone'
          ? `<p><strong>Phone instructions:</strong> ${escapeHtml(interview.contact_name || interview.meeting_link || 'The employer will confirm the calling details in the platform.')}</p>`
          : `<p><strong>Join link:</strong> <a href="${escapeHtml(interview.meeting_link || '')}">${escapeHtml(interview.meeting_link || '')}</a></p>`
      const html = `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#17344d;"><div style="max-width:560px;margin:32px auto;background:#fff;padding:32px;border-radius:18px;"><p style="color:#5c7667;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">Interview confirmed</p><h1 style="font-family:Georgia,serif;font-weight:500;">${escapeHtml(job?.job_title || 'Your interview')}</h1><p>Your interview with ${escapeHtml(propertyName)} is confirmed.</p><p><strong>Date & time:</strong> ${escapeHtml(when)}</p><p><strong>Format:</strong> ${escapeHtml(methodLabel(interview.interview_method))}</p>${interview.contact_name ? `<p><strong>Contact:</strong> ${escapeHtml(interview.contact_name)}</p>` : ''}${logistics}${interview.preparation_required ? `<p><strong>Preparation:</strong> ${escapeHtml(interview.preparation_required)}</p>` : ''}<p><a href="https://talent.wellnesshousecollective.co.uk/talent/applications" style="display:inline-block;background:#0b2f4d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;">View interview details</a></p></div></body></html>`
      const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: `Interview confirmed - ${job?.job_title || 'your application'}`, html }) })
      if (!res.ok) console.error('Interview confirmation email failed:', res.status)
    }

    return NextResponse.json({ success: true, interview: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not update the interview.' }, { status: 500 })
  }
}
