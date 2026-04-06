import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getEmployerProfile() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).single()
  return data
}

export async function GET() {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('shortlisted_candidates')
    .select('*, candidate_profiles(id, user_id, full_name, headline, role_level, location, services_offered, experience_years, profile_image_url, review_score), job_listings(id, job_title)')
    .eq('employer_id', profile.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ shortlisted: data || [] })
}

export async function POST(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { candidateId, jobId, notes } = await req.json()
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('shortlisted_candidates').insert({
    employer_id: profile.id,
    candidate_id: candidateId,
    job_id: jobId || null,
    notes: notes || null,
  })

  if (error?.code === '23505') return NextResponse.json({ success: true, already: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id, notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('shortlisted_candidates')
    .update({ notes })
    .eq('id', id)
    .eq('employer_id', profile.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('shortlisted_candidates').delete().eq('id', id).eq('employer_id', profile.id)
  return NextResponse.json({ success: true })
}
