import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { applicationId } = await req.json()
  if (!applicationId) return NextResponse.json({ error: 'Application is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

  const { data: application } = await admin.from('applications').select('id,candidate_id,status').eq('id', applicationId).maybeSingle()
  if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (['accepted','rejected'].includes(application.status)) return NextResponse.json({ error: 'This application can no longer be withdrawn' }, { status: 409 })

  const { error } = await admin.from('applications').delete().eq('id', applicationId).eq('candidate_id', candidate.id)
  if (error) return NextResponse.json({ error: 'Could not withdraw application' }, { status: 500 })
  return NextResponse.json({ success: true })
}