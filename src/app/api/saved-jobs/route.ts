import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getCandidateId(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('candidate_profiles').select('id').eq('user_id', userId).single()
  return data?.id
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const candidateId = await getCandidateId(user.id)
  if (!candidateId) return NextResponse.json({ saved: [] })

  const admin = createAdminClient()
  const { data } = await admin
    .from('saved_jobs')
    .select('*, job_listings(id, job_title, job_description, location, salary_min, salary_max, contract_type, tier, is_live, employer_profiles(company_name, property_name))')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ saved: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { jobId } = await req.json()
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const candidateId = await getCandidateId(user.id)
  if (!candidateId) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const admin = createAdminClient()
  const { error } = await admin.from('saved_jobs').insert({ candidate_id: candidateId, job_id: jobId })

  if (error?.code === '23505') return NextResponse.json({ success: true, already: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { jobId } = await req.json()
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const candidateId = await getCandidateId(user.id)
  if (!candidateId) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const admin = createAdminClient()
  await admin.from('saved_jobs').delete().eq('candidate_id', candidateId).eq('job_id', jobId)
  return NextResponse.json({ success: true })
}
