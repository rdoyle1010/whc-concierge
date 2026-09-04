import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { sendCertificateResultEmail } from '@/lib/emails'
import { trackEvent } from '@/lib/analytics'

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  try {
    const { data: rows } = await admin.from('certificate_submissions')
      .select('id,candidate_id,title,awarding_body,country,year_awarded,document_url,status,review_note,verified_at,created_at')
      .order('created_at', { ascending: false }).limit(300)
    const candidateIds = Array.from(new Set((rows || []).map(row => row.candidate_id)))
    let names: Record<string, { full_name: string | null; role_level: string | null }> = {}
    if (candidateIds.length) {
      const { data: candidates } = await admin.from('candidate_profiles').select('id,full_name,role_level').in('id', candidateIds)
      names = Object.fromEntries((candidates || []).map(c => [c.id, { full_name: c.full_name, role_level: c.role_level }]))
    }
    const enriched = (rows || []).map(row => ({ ...row, candidate: names[row.candidate_id] || null }))
    return NextResponse.json({ rows: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const id = String(body.id || '')
    const decision = String(body.decision || '')
    const note = String(body.note || '').trim()
    if (!id || !['verified', 'rejected', 'more_info'].includes(decision)) return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 })
    if (decision !== 'verified' && note.length < 5) return NextResponse.json({ error: 'Please tell the professional what is needed - the note is sent to them.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: row } = await admin.from('certificate_submissions').select('id,candidate_id,title,status').eq('id', id).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 })

    const now = new Date().toISOString()
    const { error } = await admin.from('certificate_submissions').update({
      status: decision,
      review_note: note || null,
      verified_at: decision === 'verified' ? now : null,
      verified_source: decision === 'verified' ? 'document_verified' : null,
      updated_at: now,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: 'Could not save the decision.' }, { status: 500 })

    const { data: candidate } = await admin.from('candidate_profiles').select('user_id').eq('id', row.candidate_id).maybeSingle()
    if (candidate?.user_id) {
      const title = decision === 'verified' ? 'Certificate verified'
        : decision === 'rejected' ? 'Certificate could not be verified'
        : 'Certificate review - more information needed'
      const message = decision === 'verified'
        ? `${row.title} has been reviewed and verified by Talent House. It now shows as verified on your profile.`
        : decision === 'rejected'
          ? `${row.title} could not be verified: ${note}`
          : `Talent House needs more information to verify ${row.title}: ${note}`
      await createNotification(candidate.user_id, 'general', title, message, '/talent/profile').catch?.(() => {})

      // And an email, because a bell is only seen by somebody who happens to
      // log back in. Right-to-work decisions have always sent one; a
      // certificate decision is the same news to the same person.
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
        const email = authUser?.user?.email
        if (email) {
          const { data: profile } = await admin.from('candidate_profiles')
            .select('full_name').eq('id', row.candidate_id).maybeSingle()
          await sendCertificateResultEmail(
            email,
            String(profile?.full_name || 'there').split(' ')[0] || 'there',
            row.title,
            decision as 'verified' | 'rejected' | 'more_information',
            note || null,
          )
        }
      } catch (e: any) {
        // The decision is recorded either way; a failed email must not undo it.
        console.error('Certificate result email failed:', e?.message)
      }
    }

    await trackEvent('certificate_reviewed', { actorUserId: user.id, candidateId: row.candidate_id }, { decision, title: row.title })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
