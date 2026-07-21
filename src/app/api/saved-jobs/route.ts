import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Saved jobs (bookmarks) for talent. Callers: /talent/saved, /talent/jobs,
// /jobs and JobApplyButtons - all expect GET to return { saved: [...] } with
// job_listings (and employer_profiles) embedded, and POST/DELETE to take
// { jobId } in the body.
// NOTE: the live saved_jobs table keys on candidate_id (candidate_profiles.id),
// not user_id - resolve the caller's candidate profile before touching it.

async function getAuthedUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getCandidateId(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await admin.from('candidate_profiles').select('id').eq('user_id', userId).maybeSingle()
  return data?.id as string | undefined
}

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const candidateId = await getCandidateId(admin, user.id)
  if (!candidateId) return NextResponse.json({ saved: [] })

  const { data, error } = await admin
    .from('saved_jobs')
    .select('id, job_id, created_at, job_listings(*, employer_profiles(property_name, company_name))')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { jobId } = await req.json().catch(() => ({}))
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const admin = createAdminClient()
  const candidateId = await getCandidateId(admin, user.id)
  if (!candidateId) return NextResponse.json({ error: 'Complete your profile first, then save jobs.' }, { status: 400 })

  const { error } = await admin.from('saved_jobs').insert({ candidate_id: candidateId, job_id: jobId })

  // 23505 = already saved - treat as success so the toggle stays idempotent
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, already: error?.code === '23505' })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { jobId } = await req.json().catch(() => ({}))
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const admin = createAdminClient()
  const candidateId = await getCandidateId(admin, user.id)
  if (!candidateId) return NextResponse.json({ ok: true })

  const { error } = await admin.from('saved_jobs').delete().eq('candidate_id', candidateId).eq('job_id', jobId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
