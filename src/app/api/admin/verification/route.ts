import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { sendVerificationResultEmail } from '@/lib/emails'
import { MANUAL_VERIFICATION_TYPES } from '@/lib/verification-badges'

// The candidate_verifications table arrives via a hand-run migration, so a
// missing table must degrade gracefully rather than break the page.
function isMissingTable(error: any): boolean {
  const message = String(error?.message || '')
  return error?.code === '42P01' || error?.code === 'PGRST205' || /candidate_verifications/.test(message) && /not exist|not find|schema cache/i.test(message)
}

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
    const { data } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name, role_level, whc_verified, whc_verified_at, verification_status, verification_docs, verification_notes, insurance_expiry_date, insurance_document_url, has_insurance, qualifications, review_score, review_count, right_to_work_uk, right_to_work_ireland, right_to_work_status, right_to_work_document_url, right_to_work_expiry_date, right_to_work_verified_at, right_to_work_notes, right_to_work_method, right_to_work_share_code, right_to_work_dob, right_to_work_check_outcome')
      .or('verification_status.not.is.null,right_to_work_status.neq.not_submitted')
      .order('whc_verified', { ascending: true })

    // Manual verification marks for the returned candidates. The table may
    // not exist yet (hand-run migration) - degrade to an empty map.
    let verifications: Record<string, string[]> = {}
    let verificationsAvailable = true
    try {
      const ids = (data || []).map(row => row.id)
      if (ids.length > 0) {
        const { data: marks, error } = await admin.from('candidate_verifications')
          .select('candidate_id, type').in('candidate_id', ids)
        if (error) {
          verificationsAvailable = false
        } else {
          for (const mark of marks || []) {
            (verifications[mark.candidate_id] ||= []).push(mark.type)
          }
        }
      }
    } catch { verificationsAvailable = false }

    return NextResponse.json({ rows: data || [], verifications, verifications_available: verificationsAvailable })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const body = await req.json()

    // Manual verification marks: grant or revoke one structured mark for a
    // candidate. Stored in candidate_verifications (hand-run migration).
    if (body.action === 'grant_verification' || body.action === 'revoke_verification') {
      const candidateId = String(body.candidateId || '')
      const type = String(body.type || '')
      if (!candidateId || !MANUAL_VERIFICATION_TYPES.some(entry => entry.type === type)) {
        return NextResponse.json({ error: 'candidateId and a valid verification type are required' }, { status: 400 })
      }
      try {
        if (body.action === 'grant_verification') {
          const { error } = await admin.from('candidate_verifications')
            .upsert({ candidate_id: candidateId, type, granted_by: user.id }, { onConflict: 'candidate_id,type' })
          if (error) throw error
        } else {
          const { error } = await admin.from('candidate_verifications')
            .delete().eq('candidate_id', candidateId).eq('type', type)
          if (error) throw error
        }
      } catch (e: any) {
        if (isMissingTable(e)) {
          return NextResponse.json({ error: 'The candidate_verifications migration has not been run yet - run supabase/migrations/20260831180000_candidate_verifications.sql first.' }, { status: 400 })
        }
        return NextResponse.json({ error: e.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const { id, decision } = body
    if (!id || !['verified', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'id and a valid decision are required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const update: Record<string, any> = {
      verification_status: decision,
      verification_notes: String(body.reason || '').slice(0, 500) || null,
      right_to_work_status: decision === 'verified' ? 'approved' : 'rejected',
      right_to_work_verified_at: decision === 'verified' ? now : null,
      right_to_work_notes: String(body.reason || '').slice(0, 500) || null,
      // Who looked and what the Home Office page said. A decision with no
      // record of the check behind it is not an audit trail.
      right_to_work_checked_by: user.id,
      right_to_work_check_outcome: String(body.outcome || (decision === 'verified' ? 'Checked at gov.uk - permission confirmed' : 'Checked at gov.uk - not confirmed')).slice(0, 300),
      whc_verified: decision === 'verified',
      whc_verified_at: decision === 'verified' ? now : null,
    }
    const { data: row, error } = await admin.from('candidate_profiles')
      .update(update).eq('id', id).select('id, user_id, full_name').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      if (row?.user_id) {
        await createNotification(row.user_id, 'general',
          decision === 'verified' ? 'Right to work verified' : 'Verification needs attention',
          decision === 'verified'
            ? 'Talent House has verified your right-to-work evidence. Your verified status is now visible to properties. Insurance is shown separately if you have chosen to provide it.'
            : `We couldn't verify your right-to-work evidence${body.reason ? `: ${body.reason}` : ''}. Update it and resubmit from your Verification page.`,
          '/talent/verification')
        const { data: authUser } = await admin.auth.admin.getUserById(row.user_id)
        const email = authUser?.user?.email
        if (email) await sendVerificationResultEmail(email, row.full_name || 'there', decision === 'verified', body.reason || null)
      }
    } catch (e: any) { console.error('Verification notify failed:', e?.message) }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
