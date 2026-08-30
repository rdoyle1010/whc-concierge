import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { sendSmsIfOptedIn } from '@/lib/sms'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Spa Platform <noreply@mail.wellnesshousecollective.co.uk>'
const METHODS = ['teams', 'google_meet', 'zoom', 'phone', 'in_person'] as const

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function methodLabel(method: string) {
  if (method === 'teams') return 'Microsoft Teams'
  if (method === 'google_meet') return 'Google Meet'
  if (method === 'zoom') return 'Zoom'
  if (method === 'phone') return 'Phone call'
  return 'In person'
}

function validJoinLink(method: string, link: string) {
  try {
    const url = new URL(link)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (method === 'teams') return host === 'teams.microsoft.com' || host.endsWith('.teams.microsoft.com') || host === 'teams.live.com'
    if (method === 'google_meet') return host === 'meet.google.com'
    if (method === 'zoom') return host === 'zoom.us' || host.endsWith('.zoom.us')
    return true
  } catch {
    return false
  }
}

function roundLabel(round: number) {
  return round === 1 ? 'First interview' : 'Second interview'
}

async function employerApplication(admin: any, userId: string, applicationId: string) {
  const { data: employer } = await admin.from('employer_profiles')
    .select('id,user_id,company_name,property_name')
    .eq('user_id', userId)
    .maybeSingle()
  if (!employer) return { error: NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 }) }

  const { data: application } = await admin.from('applications')
    .select('id,candidate_id,role_id,job_id,status')
    .eq('id', applicationId)
    .maybeSingle()
  if (!application) return { error: NextResponse.json({ error: 'Application not found.' }, { status: 404 }) }

  const jobId = application.role_id || application.job_id
  const [{ data: job }, { data: candidate }] = await Promise.all([
    admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle(),
    admin.from('candidate_profiles').select('id,user_id,full_name,phone,sms_opt_in').eq('id', application.candidate_id).maybeSingle(),
  ])
  if (!job || job.employer_id !== employer.id || !candidate?.user_id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { employer, application, job, candidate }
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const applicationId = new URL(req.url).searchParams.get('applicationId') || ''
  if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

  const admin = createAdminClient()
  const context = await employerApplication(admin, user.id, applicationId)
  if (context.error) return context.error

  const { data, error } = await admin.from('application_interviews')
    .select('*')
    .eq('application_id', applicationId)
    .order('round_number', { ascending: true })
  if (error) return NextResponse.json({ error: 'Could not load the interview stages.' }, { status: 500 })
  return NextResponse.json({ interviews: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const action = String(body.action || 'schedule')
    const applicationId = String(body.applicationId || '')
    if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

    const admin = createAdminClient()
    const context = await employerApplication(admin, user.id, applicationId)
    if (context.error) return context.error
    const { employer, application, job, candidate } = context

    if (action === 'complete') {
      const interviewId = String(body.interviewId || '')
      if (!interviewId) return NextResponse.json({ error: 'Interview is required.' }, { status: 400 })
      const { data: interview } = await admin.from('application_interviews').select('*').eq('id', interviewId).eq('application_id', application.id).maybeSingle()
      if (!interview) return NextResponse.json({ error: 'Interview not found.' }, { status: 404 })
      if (interview.status !== 'confirmed' || !interview.selected_slot) return NextResponse.json({ error: 'The candidate must confirm an interview time before it can be completed.' }, { status: 409 })
      const scheduled = new Date(interview.selected_slot)
      if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() > Date.now()) return NextResponse.json({ error: 'This interview cannot be completed before its confirmed time.' }, { status: 409 })
      const { data: completed, error } = await admin.from('application_interviews').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', interview.id).eq('status', 'confirmed').select('*').maybeSingle()
      if (error || !completed) return NextResponse.json({ error: 'Could not complete this interview stage.' }, { status: 409 })
      return NextResponse.json({ success: true, interview: completed })
    }

    const roundNumber = Number(body.roundNumber || 1)
    const interviewMethod = String(body.interviewMethod || '')
    const employerNote = String(body.note || '').trim().slice(0, 2000)
    const meetingLink = String(body.meetingLink || '').trim().slice(0, 1000) || null
    const venueAddress = String(body.venueAddress || '').trim().slice(0, 1000) || null
    const contactName = String(body.contactName || '').trim().slice(0, 300) || null
    const phoneInstructions = String(body.phoneInstructions || '').trim().slice(0, 800) || null
    const preparationRequired = String(body.preparationRequired || '').trim().slice(0, 2000) || null
    const assessmentType = String(body.assessmentType || '').trim().slice(0, 120) || null
    const assessmentDetails = String(body.assessmentDetails || '').trim().slice(0, 2000) || null
    const slots: string[] = Array.isArray(body.slots) ? body.slots.map((value: unknown) => String(value)).filter(Boolean) : []

    if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > 2) return NextResponse.json({ error: 'Invalid interview round.' }, { status: 400 })
    if (!METHODS.includes(interviewMethod as any)) return NextResponse.json({ error: 'Choose an interview method.' }, { status: 400 })
    if (slots.length < 1 || slots.length > 4) return NextResponse.json({ error: 'Offer between one and four interview times.' }, { status: 400 })
    if (roundNumber === 1 && application.status !== 'shortlisted') return NextResponse.json({ error: 'Shortlist the candidate before arranging the first interview.' }, { status: 409 })
    if (roundNumber === 2 && application.status !== 'interview') return NextResponse.json({ error: 'Complete the first interview before arranging the second interview.' }, { status: 409 })
    if (!contactName) return NextResponse.json({ error: 'Add the interviewer or contact name.' }, { status: 400 })
    if (['teams', 'google_meet', 'zoom'].includes(interviewMethod)) {
      if (!meetingLink) return NextResponse.json({ error: `Add the ${methodLabel(interviewMethod)} join link before sending.` }, { status: 400 })
      if (!validJoinLink(interviewMethod, meetingLink)) return NextResponse.json({ error: `Paste a valid ${methodLabel(interviewMethod)} link.` }, { status: 400 })
    }
    if (interviewMethod === 'in_person' && !venueAddress) return NextResponse.json({ error: 'Add the full interview address and arrival point.' }, { status: 400 })
    if (interviewMethod === 'phone' && !phoneInstructions) return NextResponse.json({ error: 'Add clear phone instructions, including who will call whom and the contact number.' }, { status: 400 })

    const parsedSlots = slots.map(slot => new Date(slot))
    if (parsedSlots.some(date => Number.isNaN(date.getTime()) || date.getTime() <= Date.now())) return NextResponse.json({ error: 'All interview times must be in the future.' }, { status: 400 })
    const uniqueIso = Array.from(new Set(parsedSlots.map(date => date.toISOString())))
    if (uniqueIso.length !== slots.length) return NextResponse.json({ error: 'Interview times must be unique.' }, { status: 400 })

    const { data: existingRounds } = await admin.from('application_interviews').select('id,round_number,status').eq('application_id', application.id).order('round_number', { ascending: true })
    const rounds = existingRounds || []
    const currentRound = rounds.find((item: any) => Number(item.round_number) === roundNumber)
    if (currentRound?.status === 'completed') return NextResponse.json({ error: 'A completed interview round cannot be replaced.' }, { status: 409 })
    if (roundNumber > 1) {
      const previous = rounds.find((item: any) => Number(item.round_number) === roundNumber - 1)
      if (!previous || previous.status !== 'completed') return NextResponse.json({ error: `Complete interview ${roundNumber - 1} before scheduling interview ${roundNumber}.` }, { status: 409 })
    }
    const unfinishedOtherRound = rounds.find((item: any) => Number(item.round_number) !== roundNumber && ['proposed', 'confirmed'].includes(item.status))
    if (unfinishedOtherRound) return NextResponse.json({ error: 'Finish or cancel the current interview stage before creating another.' }, { status: 409 })

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

    if (interviewMethod === 'phone' && phoneInstructions) {
      await admin.from('application_interviews').update({ meeting_link: phoneInstructions }).eq('id', interview.id)
      interview.meeting_link = phoneInstructions
    }

    await admin.from('applications').update({ status: 'interview', updated_at: new Date().toISOString() }).eq('id', application.id)

    const propertyName = employer.property_name || employer.company_name || 'the property'
    const stageLabel = roundLabel(roundNumber)
    const title = `${stageLabel} invitation - ${job.job_title}`
    const notification = `${propertyName} has invited you to the ${stageLabel.toLowerCase()} for ${job.job_title}. Review the details and respond in My Applications.`
    await createNotification(candidate.user_id, 'general', title, notification, '/talent/applications')

    const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
    const email = authUser?.user?.email || null
    if (email && RESEND_API_KEY) {
      const slotHtml = uniqueIso.map(slot => `<li style="margin:7px 0;">${escapeHtml(new Date(slot).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/London' }))}</li>`).join('')
      const logistics = interviewMethod === 'in_person'
        ? `<p><strong>Location:</strong> ${escapeHtml(venueAddress || '')}</p>`
        : interviewMethod === 'phone'
          ? `<p><strong>Phone instructions:</strong> ${escapeHtml(phoneInstructions || '')}</p>`
          : `<p><strong>Join link:</strong> ${escapeHtml(meetingLink || '')}</p>`
      const html = `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#17344d;"><div style="max-width:560px;margin:32px auto;background:#fff;padding:32px;border-radius:18px;"><p style="color:#9c7a42;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">${escapeHtml(stageLabel)} invitation</p><h1 style="font-family:Georgia,serif;font-weight:500;">${escapeHtml(job.job_title)}</h1><p>${escapeHtml(propertyName)} would like to invite you to the <strong>${escapeHtml(stageLabel.toLowerCase())}</strong>.</p><p><strong>Format:</strong> ${escapeHtml(methodLabel(interviewMethod))}</p><p><strong>Interviewer/contact:</strong> ${escapeHtml(contactName)}</p>${logistics}<p>Please choose one of the proposed times:</p><ul>${slotHtml}</ul>${employerNote ? `<p>${escapeHtml(employerNote)}</p>` : ''}<p>If none of the times work, you can send your availability through the application instead.</p><p><a href="https://talent.wellnesshousecollective.co.uk/talent/applications" style="display:inline-block;background:#0b2f4d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;">Respond to interview invitation</a></p></div></body></html>`
      const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: title, html }) })
      if (!res.ok) console.error('Interview invitation email failed:', res.status)
    }

    const smsSent = await sendSmsIfOptedIn({ to: candidate.phone, optedIn: candidate.sms_opt_in, body: `Spa Platform: ${propertyName} has invited you to the ${stageLabel.toLowerCase()} for ${job.job_title}. Open My Applications to respond.` })
    return NextResponse.json({ success: true, interview, smsSent })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not update the interview stage.' }, { status: 500 })
  }
}
