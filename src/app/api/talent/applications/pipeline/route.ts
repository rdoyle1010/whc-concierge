import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const applicationId = req.nextUrl.searchParams.get('applicationId')
  if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
  const { data: application } = await admin.from('applications').select('id,candidate_id,status').eq('id', applicationId).maybeSingle()
  if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [{ data: interviews }, { data: offer }] = await Promise.all([
    admin.from('application_interviews').select('*').eq('application_id', applicationId).order('round_number', { ascending: true }),
    admin.from('application_offers').select('*').eq('application_id', applicationId).maybeSingle(),
  ])

  return NextResponse.json({ applicationStatus: application.status, interviews: interviews || [], offer: offer || null })
}
