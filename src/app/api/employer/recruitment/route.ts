import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { trackEvent } from '@/lib/analytics'
import { TRANSACTIONAL_FROM } from '@/lib/send-email'
import { administratorEmails } from '@/lib/administrators'

// Managed recruitment intake: the employer asks Talent House to run the search.
// 12.5% of first-year salary (15-20% executive), payable on placement.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = TRANSACTIONAL_FROM

const esc = (v: string) => v.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')

async function alertAdmin(propertyName: string, request: { job_title: string; service: string; role_level?: string | null; salary_min?: number | null; salary_max?: number | null; location?: string | null; timeline?: string | null; brief: string }) {
  if (!RESEND_API_KEY) return
  const salary = request.salary_min || request.salary_max
    ? `£${Number(request.salary_min || 0).toLocaleString()}${request.salary_max ? ` - £${Number(request.salary_max).toLocaleString()}` : ''}`
    : 'Not stated'
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1c1c1c;">
    <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#1c1c1c;">New managed search request</p>
    <h2 style="font-family:Georgia,serif;font-weight:500;">${esc(propertyName)} wants Talent House to run a search</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b6b6b;width:110px;">Service</td><td style="text-transform:capitalize;">${esc(request.service)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Role</td><td><strong>${esc(request.job_title)}</strong>${request.role_level ? ` (${esc(String(request.role_level))})` : ''}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Salary</td><td>${esc(salary)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Location</td><td>${esc(String(request.location || 'Not stated'))}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Timeline</td><td>${esc(String(request.timeline || 'Not stated'))}</td></tr>
    </table>
    <div style="background:#f1f1f1;border-radius:8px;padding:14px 16px;margin:18px 0;">
      <p style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px;">Brief</p>
      <p style="font-size:14px;line-height:1.7;white-space:pre-wrap;margin:0;">${esc(request.brief)}</p>
    </div>
    <p style="font-size:13px;color:#516371;">Reply to the employer within one working day - this is the highest-value enquiry the platform takes.</p>
  </div>`
  // Every administrator. This is the highest-value enquiry the platform takes
  // and it used to reach one personal address written into the source, so a
  // second partner never saw one.
  for (const to of await administratorEmails()) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject: `Managed search request - ${request.job_title} (${propertyName})`, html }),
    }).catch(() => {})
  }
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })
  const { data: requests, error } = await admin.from('recruitment_requests')
    .select('id,service,job_title,role_level,salary_min,salary_max,location,timeline,status,created_at')
    .eq('employer_id', employer.id).order('created_at', { ascending: false }).limit(20)
  if (error) return NextResponse.json({ requests: [], unavailable: true })
  return NextResponse.json({ requests: requests || [] })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const jobTitle = String(body.jobTitle || '').trim()
    const brief = String(body.brief || '').trim()
    const service = body.service === 'executive' ? 'executive' : 'managed'
    if (jobTitle.length < 3) return NextResponse.json({ error: 'Please tell us the role you are hiring for.' }, { status: 400 })
    if (brief.length < 30) return NextResponse.json({ error: 'Please give us a few sentences of brief so the search starts well.' }, { status: 400 })

    const salaryMin = body.salaryMin ? Number(body.salaryMin) : null
    const salaryMax = body.salaryMax ? Number(body.salaryMax) : null
    if ((salaryMin && !Number.isFinite(salaryMin)) || (salaryMax && !Number.isFinite(salaryMax))) {
      return NextResponse.json({ error: 'Salary must be a number.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name,approval_status').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

    const { data: request, error } = await admin.from('recruitment_requests').insert({
      employer_id: employer.id,
      service,
      job_title: jobTitle,
      role_level: String(body.roleLevel || '').trim() || null,
      salary_min: salaryMin,
      salary_max: salaryMax,
      location: String(body.location || '').trim() || null,
      timeline: String(body.timeline || '').trim() || null,
      brief,
    }).select('id,service,job_title,role_level,salary_min,salary_max,location,timeline,brief,status,created_at').single()
    if (error) return NextResponse.json({ error: 'Could not send your request. Please try again.' }, { status: 500 })

    const propertyName = employer.property_name || employer.company_name || 'An employer'
    await alertAdmin(propertyName, request)
    await createNotification(user.id, 'general', 'Managed search request received', `Thank you - Talent House has received your ${service === 'executive' ? 'executive search' : 'managed recruitment'} request for ${jobTitle}. We will come back to you within one working day.`, '/employer/recruitment').catch?.(() => {})
    await trackEvent('recruitment_request_created', { actorUserId: user.id, employerId: employer.id }, { service, job_title: jobTitle })

    return NextResponse.json({ success: true, request })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not send your request.' }, { status: 500 })
  }
}
