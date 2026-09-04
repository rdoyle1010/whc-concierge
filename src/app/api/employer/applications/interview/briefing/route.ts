import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'
import { sendSmsIfOptedIn } from '@/lib/sms'
import { emailAllowed } from '@/lib/notification-prefs'
import { briefingDetailsHtml, briefingEmailHtml, describeBriefingChanges, escapeHtml, listInWords } from '@/lib/interview-briefing'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Talent House Collective <noreply@mail.wellnesshousecollective.co.uk>'

// A changed interview nobody was told about is worse than no change at all.
//
// This used to save the new details and drop a bell into an app the candidate
// may not open for days - and the bell only said "details updated", so even
// somebody who saw it could not tell whether the link had moved or a line of
// the note had been reworded. A property that changed a Teams link an hour
// before the call had no way to know that had not reached anybody.
//
// Now a real change goes out the way the invitation did: named in the app,
// emailed with the full current details, and texted if they opted in. A save
// that changes nothing sends nothing.

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

    const { data: interview } = await admin.from('application_interviews')
      .select('id,application_id,round_number,interview_method,status,selected_slot,meeting_link,venue_address,contact_name,preparation_required,assessment_type,assessment_details,employer_note')
      .eq('id', interviewId).maybeSingle()
    if (!interview) return NextResponse.json({ error: 'Interview not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id').eq('id', interview.application_id).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    const jobId = application.role_id || application.job_id
    const { data: job } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Worked out before the write, because afterwards there is nothing to
    // compare against.
    const changes = describeBriefingChanges(
      {
        meetingLink: interview.meeting_link, venueAddress: interview.venue_address, contactName: interview.contact_name,
        preparationRequired: interview.preparation_required, assessmentType: interview.assessment_type,
        assessmentDetails: interview.assessment_details, employerNote: interview.employer_note,
      },
      { meetingLink, venueAddress, contactName, preparationRequired, assessmentType, assessmentDetails, employerNote },
    )

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

    // Reopening the dialog and pressing save is not news.
    if (!changes.length) return NextResponse.json({ success: true, interview: updated, notified: false })

    const { data: candidate } = await admin.from('candidate_profiles').select('user_id,phone,sms_opt_in').eq('id', application.candidate_id).maybeSingle()
    if (!candidate?.user_id) return NextResponse.json({ success: true, interview: updated, notified: false })

    const propertyName = employer.property_name || employer.company_name || 'The property'
    const roundName = `Interview ${interview.round_number}`
    const changeList = listInWords(changes)
    const summary = `${propertyName} has changed ${changeList} for ${job.job_title}.`
    const title = `${roundName} details changed - ${job.job_title}`

    await createNotification(candidate.user_id, 'general', title, `${summary} Check the details before you go.`, '/talent/applications')

    // Preference-gated ('application_updates'), like every other application
    // email. The in-app notice above always goes.
    const wantsEmail = await emailAllowed(admin, candidate.user_id, 'application_updates')
    const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
    const email = authUser?.user?.email || null
    if (email && RESEND_API_KEY && wantsEmail) {
      const when = updated.status === 'confirmed' && updated.selected_slot
        ? new Date(updated.selected_slot).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/London' })
        : null
      // The whole current briefing, not only the parts that moved - nobody
      // should have to hold two emails side by side to work out where to go.
      const html = briefingEmailHtml({
        eyebrow: 'Interview details changed',
        heading: job.job_title,
        intro: `${escapeHtml(propertyName)} has changed <strong>${escapeHtml(changeList)}</strong> for your ${escapeHtml(roundName.toLowerCase())}.`,
        bodyHtml: when
          ? `<p>The time is unchanged: <strong>${escapeHtml(when)}</strong>.</p><p>Here is everything as it now stands:</p>`
          : '<p>Here is everything as it now stands:</p>',
        detailsHtml: briefingDetailsHtml({
          interviewMethod: updated.interview_method, meetingLink, venueAddress, contactName,
          preparationRequired, assessmentType, assessmentDetails,
        }) || '<p>The property has not left any joining details yet. Message them if you need them.</p>',
        ctaLabel: 'Open my applications',
        ctaHref: 'https://talenthousecollective.co.uk/talent/applications',
      })
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: title, html }),
      })
      if (!res.ok) console.error('Interview change email failed:', res.status)
    }

    const smsSent = await sendSmsIfOptedIn({
      to: candidate.phone,
      optedIn: candidate.sms_opt_in,
      body: `Talent House Collective: ${propertyName} has changed ${changeList} for your ${roundName.toLowerCase()} (${job.job_title}). Open My Applications before you set off.`,
    })

    return NextResponse.json({ success: true, interview: updated, notified: true, changes, smsSent })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not update interview details.' }, { status: 500 })
  }
}
