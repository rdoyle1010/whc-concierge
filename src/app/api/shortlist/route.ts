import { NextRequest, NextResponse } from 'next/server'
import { canEmployerDiscoverCandidate } from '@/lib/discovery'
import { presentCandidateForEmployer } from '@/lib/private-mode'
import { PREMIUM_COLUMNS, isPremium } from '@/lib/employer-premium'
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
    .select(`id, user_id, property_name, company_name, approval_status, ${PREMIUM_COLUMNS}`)
    .eq('user_id', user.id)
    .maybeSingle()
  return data
}

// Shortlisting is how an employer starts a conversation: a shortlist entry is
// one of the relationships /api/messages/send accepts as permission to write
// to a professional. Discover Talent is gated on a paid membership or a
// running advert, and its API refuses a free account outright - but this route
// never checked, so a free account could POST a candidate id straight to it,
// land on the shortlist, and message anybody on the register.
//
// The gate here is deliberately wider than Talent Search. A Standard advert
// sells "applications and shortlist", and an advert that has since expired
// should not strand the applications it bought, so anybody who has applied to
// one of this property's roles stays shortlistable whatever the tier.
async function mayShortlist(admin: ReturnType<typeof createAdminClient>, profile: any, candidateId: string) {
  if (isPremium(profile, 'employer_talent_search')) return true

  const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', profile.id)
  const jobIds = (jobs || []).map((job: any) => job.id)
  if (!jobIds.length) return false

  const [byRole, byJob] = await Promise.all([
    admin.from('applications').select('id').eq('candidate_id', candidateId).in('role_id', jobIds).limit(1).maybeSingle(),
    admin.from('applications').select('id').eq('candidate_id', candidateId).in('job_id', jobIds).limit(1).maybeSingle(),
  ])
  return Boolean((!byRole.error && byRole.data) || (!byJob.error && byJob.data))
}

export async function GET() {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (profile.approval_status !== 'approved') return NextResponse.json({ error: 'Employer approval required' }, { status: 403 })

  const admin = createAdminClient()
  const [{ data }, { data: blocks }] = await Promise.all([
    admin.from('shortlisted_candidates')
      .select('*, candidate_profiles(id, user_id, full_name, headline, role_level, location, services_offered, experience_years, profile_image_url, review_score, profile_visible, approval_status, stealth_mode, show_first_name_only), job_listings(id, job_title)')
      .eq('employer_id', profile.id)
      .order('created_at', { ascending: false }),
    admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', profile.id),
  ])

  const blockedIds = new Set((blocks || []).map((row: any) => row.candidate_id))
  // Turning on Stealth Mode has to remove somebody from the shortlists they
  // are already on. A control that only applies to future searches protects
  // nobody who has already been found, which is everybody who needs it.
  const visible = (data || []).filter((entry: any) => {
    const candidate = Array.isArray(entry.candidate_profiles) ? entry.candidate_profiles[0] : entry.candidate_profiles
    return Boolean(candidate) && canEmployerDiscoverCandidate(candidate, blockedIds)
  })
  // A shortlist is employer-initiated and the professional is never told she
  // is on one, so nothing here counts as her having revealed herself. Private
  // Career Mode and the first-name-only choice both apply, exactly as they do
  // on the search that found her.
  const presented = visible.map((entry: any) => {
    const raw = Array.isArray(entry.candidate_profiles) ? entry.candidate_profiles[0] : entry.candidate_profiles
    return { ...entry, candidate_profiles: presentCandidateForEmployer(raw) }
  })
  return NextResponse.json({ shortlisted: presented })
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

  if (!await mayShortlist(admin, profile, candidateId)) {
    return NextResponse.json(
      { error: 'Shortlisting a professional you have not received an application from is part of Talent Search.', upgradeHref: '/employer/membership' },
      { status: 402 },
    )
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
