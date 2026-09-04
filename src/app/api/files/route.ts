import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

const PRIVATE_BUCKETS = new Set(['talent-documents', 'message-attachments'])

// Identity documents - a passport, a BRP, a visa scan - are not the same
// thing as a CV, and they no longer open on the same terms.
//
// A right-to-work document reveals nationality, place of birth and a facial
// image. The statutory check sits with the employer at the point of
// engagement, not with every property that receives an application, so ten
// applications should not put a passport scan in ten properties' hands.
const IDENTITY_DOCUMENT_PATTERN = /(^|\/)(verification|right-to-work|rtw|identity)\//i

function isIdentityDocument(path: string): boolean {
  return IDENTITY_DOCUMENT_PATTERN.test(path)
}

// A candidate's CV and certificates open only where the candidate took part
// in creating the relationship: a mutual match, an agency booking they
// actually accepted, or an application they submitted themselves.
// Shortlisting is deliberately not on this list - it is employer-initiated,
// the candidate is never told it happened, and it must not unlock documents
// on its own.
//
// `strength` says how far the relationship has gone:
//   'none'      - nothing opens
//   'engaged'   - the candidate took part; CV and certificates open
//   'committed' - money or a confirmed engagement exists; identity
//                 documents open too
type RelationshipStrength = 'none' | 'engaged' | 'committed'

async function candidateRelationshipStrength(
  admin: ReturnType<typeof createAdminClient>,
  viewerId: string,
  candidateUserId: string,
): Promise<RelationshipStrength> {
  const [{ data: employer }, { data: candidate }] = await Promise.all([
    admin.from('employer_profiles').select('id, approval_status').eq('user_id', viewerId).maybeSingle(),
    admin.from('candidate_profiles').select('id').eq('user_id', candidateUserId).maybeSingle(),
  ])
  if (!employer || employer.approval_status !== 'approved' || !candidate) return 'none'

  // A booking the professional has accepted, and which has been paid for, is
  // a real engagement. A 'pending' offer is not: a Preferred Employer can
  // create one unilaterally, for anybody on the register, and the
  // professional may never even open the notification. That row used to be
  // enough to unlock their passport.
  const [{ data: match }, { data: liveBooking }, { data: paidBooking }] = await Promise.all([
    admin.from('matches').select('id').eq('candidate_id', candidate.id).eq('employer_id', employer.id).limit(1).maybeSingle(),
    admin.from('agency_bookings').select('id')
      .eq('candidate_id', candidate.id).eq('employer_id', employer.id)
      .in('status', ['accepted', 'confirmed', 'completed']).limit(1).maybeSingle(),
    admin.from('agency_bookings').select('id')
      .eq('candidate_id', candidate.id).eq('employer_id', employer.id)
      .not('paid_at', 'is', null).limit(1).maybeSingle(),
  ])
  if (paidBooking) return 'committed'

  // An application the employer has moved to interview stage or beyond is the
  // point at which a right-to-work check genuinely belongs to them.
  const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employer.id)
  const jobIds = (jobs || []).map(job => job.id)

  let applied = false
  let progressed = false
  if (jobIds.length > 0) {
    const [byRole, byJob, progressedByRole, progressedByJob] = await Promise.all([
      admin.from('applications').select('id').eq('candidate_id', candidate.id).in('role_id', jobIds).limit(1).maybeSingle(),
      admin.from('applications').select('id').eq('candidate_id', candidate.id).in('job_id', jobIds).limit(1).maybeSingle(),
      admin.from('applications').select('id').eq('candidate_id', candidate.id).in('role_id', jobIds).in('status', ['interview', 'offered', 'accepted']).limit(1).maybeSingle(),
      admin.from('applications').select('id').eq('candidate_id', candidate.id).in('job_id', jobIds).in('status', ['interview', 'offered', 'accepted']).limit(1).maybeSingle(),
    ])
    applied = Boolean((!byRole.error && byRole.data) || (!byJob.error && byJob.data))
    progressed = Boolean((!progressedByRole.error && progressedByRole.data) || (!progressedByJob.error && progressedByJob.data))
  }

  if (progressed) return 'committed'
  if (match || liveBooking || applied) return 'engaged'
  return 'none'
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const bucket = String(req.nextUrl.searchParams.get('bucket') || '')
  const path = String(req.nextUrl.searchParams.get('path') || '')
  const wantsJson = req.nextUrl.searchParams.get('format') === 'json'
  if (!PRIVATE_BUCKETS.has(bucket) || !path || path.startsWith('/') || path.includes('..') || path.includes('\\')) {
    return NextResponse.json({ error: 'Invalid file request' }, { status: 400 })
  }

  const ownerId = path.split('/')[0]
  const admin = createAdminClient()
  const { data: viewer } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  let allowed = ownerId === user.id || viewer?.role === 'admin'

  if (!allowed && bucket === 'talent-documents') {
    const strength = await candidateRelationshipStrength(admin, user.id, ownerId)
    allowed = isIdentityDocument(path)
      ? strength === 'committed'
      : strength !== 'none'
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
  if (wantsJson) return NextResponse.json({ url: data.signedUrl, expiresIn: 60 })
  return NextResponse.redirect(data.signedUrl)
}
