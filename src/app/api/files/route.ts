import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const PRIVATE_BUCKETS = new Set(['talent-documents', 'message-attachments'])

async function hasCandidateRelationship(admin: ReturnType<typeof createAdminClient>, viewerId: string, candidateUserId: string) {
  const [{ data: employer }, { data: candidate }] = await Promise.all([
    admin.from('employer_profiles').select('id, approval_status').eq('user_id', viewerId).maybeSingle(),
    admin.from('candidate_profiles').select('id').eq('user_id', candidateUserId).maybeSingle(),
  ])
  if (!employer || employer.approval_status !== 'approved' || !candidate) return false

  const [{ data: match }, { data: booking }, { data: shortlist }] = await Promise.all([
    admin.from('matches').select('id').eq('candidate_id', candidate.id).eq('employer_id', employer.id).limit(1).maybeSingle(),
    admin.from('agency_bookings').select('id').eq('candidate_id', candidate.id).eq('employer_id', employer.id).limit(1).maybeSingle(),
    admin.from('shortlisted_candidates').select('id').eq('candidate_id', candidate.id).eq('employer_id', employer.id).limit(1).maybeSingle(),
  ])
  if (match || booking || shortlist) return true

  const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employer.id)
  const jobIds = (jobs || []).map(job => job.id)
  if (jobIds.length === 0) return false
  const byRole = await admin.from('applications').select('id')
    .eq('candidate_id', candidate.id).in('role_id', jobIds).limit(1).maybeSingle()
  if (!byRole.error && byRole.data) return true
  const byJob = await admin.from('applications').select('id')
    .eq('candidate_id', candidate.id).in('job_id', jobIds).limit(1).maybeSingle()
  return Boolean(!byJob.error && byJob.data)
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const bucket = String(req.nextUrl.searchParams.get('bucket') || '')
  const path = String(req.nextUrl.searchParams.get('path') || '')
  if (!PRIVATE_BUCKETS.has(bucket) || !path || path.startsWith('/') || path.includes('..') || path.includes('\\')) {
    return NextResponse.json({ error: 'Invalid file request' }, { status: 400 })
  }

  const ownerId = path.split('/')[0]
  const admin = createAdminClient()
  const { data: viewer } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  let allowed = ownerId === user.id || viewer?.role === 'admin'

  if (!allowed && bucket === 'talent-documents') {
    allowed = await hasCandidateRelationship(admin, user.id, ownerId)
  }

  if (!allowed && bucket === 'message-attachments') {
    const { data: messages } = await admin.from('messages')
      .select('attachment_url')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .not('attachment_url', 'is', null)
      .limit(500)
    allowed = (messages || []).some(message => {
      try { return decodeURIComponent(String(message.attachment_url)).includes(path) }
      catch { return String(message.attachment_url).includes(path) }
    })
  }

  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 60)
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  return NextResponse.redirect(data.signedUrl)
}
