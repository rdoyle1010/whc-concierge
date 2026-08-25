import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendVerificationResultEmail } from '@/lib/emails'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const { data } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name, role_level, whc_verified, whc_verified_at, verification_status, verification_docs, verification_notes, insurance_expiry_date, insurance_document_url, has_insurance, qualifications, review_score, review_count, right_to_work_uk, right_to_work_ireland, right_to_work_status, right_to_work_document_url, right_to_work_expiry_date, right_to_work_verified_at, right_to_work_notes')
      .or('verification_status.not.is.null,right_to_work_status.neq.not_submitted')
      .order('whc_verified', { ascending: true })
    return NextResponse.json({ rows: data || [] })
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
            ? 'WHC has verified your right-to-work evidence. Your verified status is now visible to properties. Insurance is shown separately if you have chosen to provide it.'
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
