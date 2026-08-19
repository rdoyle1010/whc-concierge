import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'
import { sendSmsIfOptedIn } from '@/lib/sms'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Spa Platform <noreply@mail.wellnesshousecollective.co.uk>'
const METHODS = ['teams','video','phone','in_person'] as const

function escapeHtml(value: string) {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')
}

function methodLabel(method: string) {
  return method === 'teams' ? 'Microsoft Teams' : method === 'video' ? 'Video call' : method === 'phone' ? 'Phone call' : 'In person'
}

function roundLabel(round: number) {
  if (round === 1) return 'First interview'
  if (round === 2) return 'Second interview'
  return 'Final interview'
}

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
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

    const parsedSlots: Date[] = slots.map((slot: string) => new Date(slot))
    if (parsedSlots.some((date: Date) => Number.isNaN(date.getTime()) || date.getTime() <= Date.now())) return NextResponse.json({ error: 'All interview times must be in the future.' }, { status: 400 })
    const uniqueIso: string[] = Array.from(new Set<string>(parsedSlots.map((date: Date) => date.toISOString())))
    if (uniqueIso.length !== slots.length) return NextResponse.json({ error: 'Interview times must be unique.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status').eq('id', applicationId).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    if (!['shortlisted','interview'].includes(application.status)) return NextResponse.json({ error: 'Shortlist the candidate before inviting them to interview.' }, { status: 409 })

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
      const html = `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#17344d;"><div style="max-width:560px;margin:32px auto;background:#fff;padding:32px;border-radius:18px;"><p style="color:#9c7a42;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">${escapeHtml(stageLabel)} invitation</p><h1 style="font-family:Georgia,serif;font-weight:500;">${escapeHtml(job.job_title)}</h1><p>${escapeHtml(propertyName)} would like to invite you to the <strong>${escapeHtml(stageLabel.toLowerCase())}</strong> via ${escapeHtml(methodLabel(interviewMethod))}.</p><p>Please choose one of the proposed times below to confirm your attendance:</p><ul>${slotHtml}</ul>${employerNote ? `<p>${escapeHtml(employerNote)}</p>` : ''}<p><a href="https://talent.wellnesshousecollective.co.uk/talent/applications" style="display:inline-block;background:#0b2f4d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;">Choose ${escapeHtml(stageLabel.toLowerCase())} time</a></p></div></body></html>`
      const res = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:FROM_EMAIL,to:email,subject:title,html})})
      if (!res.ok) console.error('Interview invitation email failed:', res.status)
    }

    const smsSent = await sendSmsIfOptedIn({
      to: candidate.phone,
      optedIn: candidate.sms_opt_in,
      body: `Spa Platform: ${propertyName} has invited you to the ${stageLabel.toLowerCase()} for ${job.job_title}. Open My Applications to choose a time.`,
    })

    return NextResponse.json({ success: true, interview, smsSent })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not create interview invitation.' }, { status: 500 })
  }
}
