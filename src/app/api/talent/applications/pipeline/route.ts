import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const applicationId = req.nextUrl.searchParams.get('applicationId')
  if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
  const { data: application } = await admin.from('applications').select('id,candidate_id,status').eq('id', applicationId).maybeSingle()
  if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'You do not have access to that. If that looks wrong, sign in with the account that does.' }, { status: 403 })

  const [{ data: interviews }, { data: offer }] = await Promise.all([
    admin.from('application_interviews').select('*').eq('application_id', applicationId).order('round_number', { ascending: true }),
    admin.from('application_offers').select('*').eq('application_id', applicationId).maybeSingle(),
  ])

  return NextResponse.json({ applicationStatus: application.status, interviews: interviews || [], offer: offer || null })
}
