import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getEmployerProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin.from('employer_profiles')
    .select('id, user_id, property_name, company_name, approval_status')
    .eq('user_id', user.id)
    .maybeSingle()
  return data
}

export async function GET() {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (profile.approval_status !== 'approved') return NextResponse.json({ error: 'Employer approval required' }, { status: 403 })

  const admin = createAdminClient()
  const [{ data }, { data: blocks }] = await Promise.all([
    admin.from('shortlisted_candidates')
      .select('*, candidate_profiles(id, user_id, full_name, headline, role_level, location, services_offered, experience_years, profile_image_url, review_score, profile_visible, approval_status), job_listings(id, job_title)')
      .eq('employer_id', profile.id)
      .order('created_at', { ascending: false }),
    admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', profile.id),
  ])

  const blockedIds = new Set((blocks || []).map((row: any) => row.candidate_id))
  const visible = (data || []).filter((entry: any) => {
    const candidate = Array.isArray(entry.candidate_profiles) ? entry.candidate_profiles[0] : entry.candidate_profiles
    return candidate && candidate.approval_status === 'approved' && candidate.profile_visible !== false && !blockedIds.has(entry.candidate_id)
  })
  return NextResponse.json({ shortlisted: visible })
}

export async function POST(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (profile.approval_status !== 'approved') return NextResponse.json({ error: 'Employer approval required' }, { status: 403 })

  const { candidateId, jobId, notes } = await req.json()
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: candidate }, { data: block }] = await Promise.all([
    admin.from('candidate_profiles').select('id, approval_status, profile_visible').eq('id', candidateId).maybeSingle(),
    admin.from('profile_blocks').select('id').eq('candidate_id', candidateId).eq('blocked_employer_id', profile.id).maybeSingle(),
  ])
  if (!candidate || candidate.approval_status !== 'approved' || candidate.profile_visible === false || block) {
    return NextResponse.json({ error: 'This profile is not available to your business' }, { status: 403 })
  }

  // A shortlist is a private bookmark, not a Tinder-style "yes". Mutual
  // matching now happens only through /api/swipe with a specific live role.
  const { error } = await admin.from('shortlisted_candidates').insert({
    employer_id: profile.id,
    candidate_id: candidateId,
    job_id: jobId || null,
    notes: notes || null,
  })
  if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, already: error?.code === '23505' })
}

export async function PATCH(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (profile.approval_status !== 'approved') return NextResponse.json({ error: 'Employer approval required' }, { status: 403 })

  const { id, notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const admin = createAdminClient()
  const { error } = await admin.from('shortlisted_candidates').update({ notes }).eq('id', id).eq('employer_id', profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (profile.approval_status !== 'approved') return NextResponse.json({ error: 'Employer approval required' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const admin = createAdminClient()
  await admin.from('shortlisted_candidates').delete().eq('id', id).eq('employer_id', profile.id)
  return NextResponse.json({ success: true })
}
