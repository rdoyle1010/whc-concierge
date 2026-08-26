import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'

function todayLondon() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

async function workedTogether(admin: ReturnType<typeof createAdminClient>, candidateId: string, employerId: string) {
  const { data: shifts } = await admin.from('agency_bookings')
    .select('id,shift_date,status,paid_at')
    .eq('candidate_id', candidateId).eq('employer_id', employerId)
    .in('status', ['confirmed', 'completed']).not('paid_at', 'is', null).limit(20)
  if ((shifts || []).some((row: any) => row.shift_date && row.shift_date <= todayLondon())) return true

  const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employerId)
  const jobIds = (jobs || []).map((row: any) => row.id)
  if (!jobIds.length) return false
  const { data: application } = await admin.from('applications').select('id')
    .eq('candidate_id', candidateId).eq('status', 'accepted').in('role_id', jobIds).limit(1).maybeSingle()
  return Boolean(application)
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = account?.role === 'employer' ? 'employer' : 'talent'

  const { data: receivedReviews } = await admin.from('reviews')
    .select('id,rating,text,property_name,criteria_scores,created_at,reviewer_id')
    .eq('reviewee_id', user.id).order('created_at', { ascending: false }).limit(50)

  if (role === 'employer') {
    const { data: employer } = await admin.from('employer_profiles')
      .select('id,property_name,company_name,review_score,review_count').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ role, profile: null, reviews: [], references: [] })
    const { data: refs } = await admin.from('reference_requests').select('*')
      .eq('employer_id', employer.id).order('created_at', { ascending: false })
    const candidateIds = Array.from(new Set((refs || []).map((row: any) => row.candidate_id)))
    const { data: candidates } = candidateIds.length ? await admin.from('candidate_profiles')
      .select('id,user_id,full_name,current_job_title,profile_image_url').in('id', candidateIds) : { data: [] as any[] }
    const candidateMap = new Map((candidates || []).map((row: any) => [row.id, row]))
    return NextResponse.json({
      role,
      profile: { name: employer.property_name || employer.company_name || 'Property', reviewScore: employer.review_score || 0, reviewCount: employer.review_count || 0 },
      reviews: receivedReviews || [],
      references: (refs || []).map((row: any) => ({ ...row, candidate_name: candidateMap.get(row.candidate_id)?.full_name || 'Talent', candidate_user_id: candidateMap.get(row.candidate_id)?.user_id || null, candidate_title: candidateMap.get(row.candidate_id)?.current_job_title || null })),
    })
  }

  const { data: candidate } = await admin.from('candidate_profiles')
    .select('id,full_name,review_score,review_count').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ role, profile: null, reviews: [], references: [], eligibleEmployers: [] })
  const { data: refs } = await admin.from('reference_requests').select('*')
    .eq('candidate_id', candidate.id).order('created_at', { ascending: false })
  const requestedEmployerIds = new Set((refs || []).map((row: any) => row.employer_id))

  const { data: shifts } = await admin.from('agency_bookings').select('employer_id,shift_date,status,paid_at')
    .eq('candidate_id', candidate.id).in('status', ['confirmed','completed']).not('paid_at', 'is', null).limit(100)
  const eligibleIds = new Set((shifts || []).filter((row: any) => row.shift_date && row.shift_date <= todayLondon()).map((row: any) => row.employer_id))
  const { data: acceptedApps } = await admin.from('applications').select('role_id').eq('candidate_id', candidate.id).eq('status', 'accepted').limit(100)
  const roleIds = (acceptedApps || []).map((row: any) => row.role_id).filter(Boolean)
  if (roleIds.length) {
    const { data: jobs } = await admin.from('job_listings').select('id,employer_id').in('id', roleIds)
    for (const row of jobs || []) if (row.employer_id) eligibleIds.add(row.employer_id)
  }
  const allEmployerIds = Array.from(new Set([...eligibleIds, ...(refs || []).map((row: any) => row.employer_id)]))
  const { data: employers } = allEmployerIds.length ? await admin.from('employer_profiles')
    .select('id,user_id,property_name,company_name,location,review_score,review_count').in('id', allEmployerIds) : { data: [] as any[] }
  const employerMap = new Map((employers || []).map((row: any) => [row.id, row]))

  return NextResponse.json({
    role,
    profile: { name: candidate.full_name || 'Talent', reviewScore: candidate.review_score || 0, reviewCount: candidate.review_count || 0 },
    reviews: receivedReviews || [],
    references: (refs || []).map((row: any) => ({ ...row, employer_name: employerMap.get(row.employer_id)?.property_name || employerMap.get(row.employer_id)?.company_name || 'Property' })),
    eligibleEmployers: Array.from(eligibleIds).filter(id => !requestedEmployerIds.has(id)).map(id => {
      const employer = employerMap.get(id)
      return employer ? { id: employer.id, user_id: employer.user_id, name: employer.property_name || employer.company_name || 'Property', location: employer.location || null } : null
    }).filter(Boolean),
  })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const admin = createAdminClient()

  if (action === 'request_reference') {
    const employerId = String(body.employerId || '')
    const message = String(body.message || '').trim().slice(0, 1000)
    const { data: candidate } = await admin.from('candidate_profiles').select('id,full_name').eq('user_id', user.id).maybeSingle()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,property_name,company_name').eq('id', employerId).maybeSingle()
    if (!candidate || !employer) return NextResponse.json({ error: 'Reference relationship not found.' }, { status: 404 })
    if (!(await workedTogether(admin, candidate.id, employer.id))) return NextResponse.json({ error: 'References can only be requested from properties you have worked with through the platform.' }, { status: 403 })
    const { data: existing } = await admin.from('reference_requests').select('id,status').eq('candidate_id', candidate.id).eq('employer_id', employer.id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'A reference request already exists for this property.' }, { status: 409 })
    const { error } = await admin.from('reference_requests').insert({ candidate_id: candidate.id, employer_id: employer.id, requested_by: user.id, request_message: message || null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    try { await createNotification(employer.user_id, 'general', 'Reference request', `${candidate.full_name || 'A Talent member'} has asked you for a verified WHC reference.`, '/employer/reputation') } catch {}
    return NextResponse.json({ success: true })
  }

  if (action === 'respond_reference') {
    const referenceId = String(body.referenceId || '')
    const status = body.status === 'declined' ? 'declined' : 'completed'
    const responseText = String(body.responseText || '').trim().slice(0, 2000)
    const wouldRehire = body.wouldRehire === true
    const { data: employer } = await admin.from('employer_profiles').select('id,property_name,company_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 403 })
    const { data: ref } = await admin.from('reference_requests').select('id,candidate_id,status').eq('id', referenceId).eq('employer_id', employer.id).maybeSingle()
    if (!ref || ref.status !== 'pending') return NextResponse.json({ error: 'This reference request is no longer pending.' }, { status: 400 })
    if (status === 'completed' && responseText.length < 20) return NextResponse.json({ error: 'Please add a useful written reference.' }, { status: 400 })
    const { error } = await admin.from('reference_requests').update({ status, response_text: status === 'completed' ? responseText : null, would_rehire: status === 'completed' ? wouldRehire : null, responded_at: new Date().toISOString() }).eq('id', ref.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { data: candidate } = await admin.from('candidate_profiles').select('user_id').eq('id', ref.candidate_id).maybeSingle()
    if (candidate?.user_id) {
      try { await createNotification(candidate.user_id, 'general', status === 'completed' ? 'Reference completed' : 'Reference request declined', `${employer.property_name || employer.company_name || 'A property'} has responded to your reference request.`, '/talent/reputation') } catch {}
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
