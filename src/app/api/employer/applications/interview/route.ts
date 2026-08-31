import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { trackEvent } from '@/lib/analytics'
import { createNotification } from '@/lib/notifications'
import { sendSmsIfOptedIn } from '@/lib/sms'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'
const METHODS = ['teams','video','phone','in_person'] as const

function escapeHtml(value: string) {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
}

function methodLabel(method: string) {
  return method === 'teams' ? 'Microsoft Teams' : method === 'video' ? 'Video call' : method === 'phone' ? 'Phone call' : 'In person'
}

function roundLabel(round: number) {
  if (round === 1) return 'First interview'
  if (round === 2) return 'Second interview'
  return 'Final interview'
}

// datetime-local values arrive with no timezone. The server runs in UTC, so a
// naive `new Date()` shifts every interview by an hour during British Summer
// Time. Interpret naive values as Europe/London wall-clock time instead.
function parseLondonSlot(value: string): Date | null {
  if (!value) return null
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    const direct = new Date(value)
    return Number.isNaN(direct.getTime()) ? null : direct
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  const [y, mo, d, h, mi] = match.slice(1).map(Number)
  const target = Date.UTC(y, mo - 1, d, h, mi)
  let ts = target
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(ts))
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value || 0)
    const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'))
    ts += target - wall
  }
  return new Date(ts)
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const applicationId = String(body.applicationId || '')
    const roundNumber = Number(body.roundNumber || 1)
    const interviewMethod = String(body.interviewMethod || '')
    const employerNote = String(body.note || '').trim().slice(0, 2000)
    const meetingLink = String(body.meetingLink || '').trim().slice(0, 1000) || null
    const venueAddress = String(body.venueAddress || '').trim().slice(0, 1000) || null
    const contactName = String(body.contactName || '').trim().slice(0, 300) || null
    const preparationRequired = String(body.preparationRequired || '').trim().slice(0, 2000) || null
    const assessmentType = String(body.assessmentType || '').trim().slice(0, 120) || null
    const assessmentDetails = String(body.assessmentDetails || '').trim().slice(0, 2000) || null
    const slots: string[] = Array.isArray(body.slots)
      ? body.slots.map((value: unknown) => String(value)).filter((value: string) => value.length > 0)
      : []

    if (!applicationId || !Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > 3) return NextResponse.json({ error: 'Invalid interview round.' }, { status: 400 })
    if (!METHODS.includes(interviewMethod as any)) return NextResponse.json({ error: 'Choose an interview method.' }, { status: 400 })
    if (slots.length < 1 || slots.length > 4) return NextResponse.json({ error: 'Offer between one and four interview times.' }, { status: 400 })

    const parsedSlots: (Date | null)[] = slots.map((slot: string) => parseLondonSlot(slot))
    if (parsedSlots.some((date: Date | null) => !date || Number.isNaN(date.getTime()) || date.getTime() <= Date.now())) return NextResponse.json({ error: 'All interview times must be in the future.' }, { status: 400 })
    const uniqueIso: string[] = Array.from(new Set<string>((parsedSlots as Date[]).map((date: Date) => date.toISOString())))
    if (uniqueIso.length !== slots.length) return NextResponse.json({ error: 'Interview times must be unique.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status').eq('id', applicationId).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    if (!['shortlisted','interview'].includes(application.status)) return NextResponse.json({ error: 'Shortlist the candidate before inviting them to interview.' }, { status: 409 })

    // A later round can only be arranged once the previous round has actually
    // been held: confirmed by the candidate and past its scheduled time.
    if (roundNumber > 1) {
      const { data: previousRound } = await admin.from('application_interviews')
        .select('id,status,selected_slot')
        .eq('application_id', application.id)
        .eq('round_number', roundNumber - 1)
        .maybeSingle()
      const previousHeld = previousRound && (
        previousRound.status === 'completed' ||
        (previousRound.status === 'confirmed' && previousRound.selected_slot && new Date(previousRound.selected_slot).getTime() <= Date.now())
      )
      if (!previousHeld) return NextResponse.json({ error: 'The previous interview needs to be confirmed by the candidate and to have taken place before arranging the next one.' }, { status: 409 })
    }

    const jobId = application.role_id || application.job_id
    const [{ data: job }, { data: candidate }] = await Promise.all([
      admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle(),
      admin.from('candidate_profiles').select('id,user_id,full_name,phone,sms_opt_in').eq('id', application.candidate_id).maybeSingle(),
    ])
    if (!job || job.employer_id !== employer.id || !candidate?.user_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: interview, error: interviewError } = await admin.from('application_interviews').upsert({
      application_id: application.id,
      round_number: roundNumber,
      interview_method: interviewMethod,
      proposed_slots: uniqueIso,
      selected_slot: null,
      status: 'proposed',
      employer_note: employerNote || null,
      candidate_note: null,
      meeting_link: meetingLink,
      venue_address: venueAddress,
      contact_name: contactName,
      preparation_required: preparationRequired,
      assessment_type: assessmentType,
      assessment_details: assessmentDetails,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'application_id,round_number' }).select('*').single()
    if (interviewError) return NextResponse.json({ error: 'Could not create interview invitation.' }, { status: 500 })

    await admin.from('applications').update({ status: 'interview', updated_at: new Date().toISOString() }).eq('id', application.id)

    const propertyName = employer.property_name || employer.company_name || 'the property'
    const stageLabel = roundLabel(roundNumber)
    const title = `${stageLabel} invitation - ${job.job_title}`
    const note = `${propertyName} has invited you to the ${stageLabel.toLowerCase()} for ${job.job_title}. Choose one of the proposed times in My Applications.`
    await createNotification(candidate.user_id, 'general', title, note, '/talent/applications')

    const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
    const email = authUser?.user?.email || null
    if (email && RESEND_API_KEY) {
      const slotHtml = uniqueIso.map((slot: string) => `<li style="margin:7px 0;">${escapeHtml(new Date(slot).toLocaleString('en-GB',{dateStyle:'full',timeStyle:'short',timeZone:'Europe/London'}))}</li>`).join('')
      const html = `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#10283b;"><div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e5e5e5;"><div style="background:#0b2f4d;padding:24px 32px;"><p style="margin:0 0 6px;color:#ffffff;opacity:.8;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">${escapeHtml(stageLabel)} invitation</p><h1 style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:23px;font-weight:600;">WHC Concierge</h1></div><div style="padding:28px 32px;"><h2 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-weight:600;font-size:19px;">${escapeHtml(job.job_title)}</h2><p>${escapeHtml(propertyName)} would like to invite you to the <strong>${escapeHtml(stageLabel.toLowerCase())}</strong> via ${escapeHtml(methodLabel(interviewMethod))}.</p><p>Please choose one of the proposed times below to confirm your attendance:</p><ul>${slotHtml}</ul>${employerNote ? `<p>${escapeHtml(employerNote)}</p>` : ''}<p><a href="https://talent.wellnesshousecollective.co.uk/talent/applications" style="display:inline-block;background:#0b2f4d;color:#ffffff;text-decoration:none;padding:12px 18px;">Choose ${escapeHtml(stageLabel.toLowerCase())} time</a></p></div></div></body></html>`
      const res = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:FROM_EMAIL,to:email,subject:title,html})})
      if (!res.ok) console.error('Interview invitation email failed:', res.status)
    }

    const smsSent = await sendSmsIfOptedIn({
      to: candidate.phone,
      optedIn: candidate.sms_opt_in,
      body: `WHC Concierge: ${propertyName} has invited you to the ${stageLabel.toLowerCase()} for ${job.job_title}. Open My Applications to choose a time.`,
    })

    await trackEvent('interview_scheduled', { actorUserId: user.id, candidateId: application.candidate_id, employerId: employer.id, jobId: job.id, applicationId: application.id }, { round: interview.round || 1 })
    return NextResponse.json({ success: true, interview, smsSent })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not create interview invitation.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const body = await req.json()
    const interviewId = String(body.interviewId || '')
    if (!interviewId) return NextResponse.json({ error: 'Interview is required.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

    const { data: interview } = await admin.from('application_interviews').select('id,application_id,status,selected_slot,round_number').eq('id', interviewId).maybeSingle()
    if (!interview) return NextResponse.json({ error: 'Interview not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,role_id,job_id').eq('id', interview.application_id).maybeSingle()
    const jobId = application?.role_id || application?.job_id
    const { data: job } = jobId ? await admin.from('job_listings').select('id,employer_id').eq('id', jobId).maybeSingle() : { data: null }
    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (interview.status === 'completed') return NextResponse.json({ success: true, interview })
    if (interview.status !== 'confirmed' || !interview.selected_slot) return NextResponse.json({ error: 'The interview needs a confirmed time before it can be marked complete.' }, { status: 409 })
    if (new Date(interview.selected_slot).getTime() > Date.now()) return NextResponse.json({ error: 'This interview has not taken place yet.' }, { status: 409 })

    const { data: updated, error } = await admin.from('application_interviews').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', interview.id).select('*').single()
    if (error) return NextResponse.json({ error: 'Could not mark the interview complete.' }, { status: 500 })
    return NextResponse.json({ success: true, interview: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not mark the interview complete.' }, { status: 500 })
  }
}
