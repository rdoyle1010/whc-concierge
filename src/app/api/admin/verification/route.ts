import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendVerificationResultEmail } from '@/lib/emails'

// WHC Verified - the admin desk. Review submitted insurance certificates and
// qualification documents, award or refuse the badge. Every decision emails
// and notifies the therapist.

async function requireAdmin() {
  const cookieStore = cookies()
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
      .select('id, user_id, full_name, role_level, whc_verified, whc_verified_at, verification_status, verification_docs, verification_notes, insurance_expiry_date, insurance_document_url, has_insurance, qualifications, review_score, review_count')
      .not('verification_status', 'is', null)
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

    const update: Record<string, any> = {
      verification_status: decision,
      verification_notes: String(body.reason || '').slice(0, 500) || null,
      whc_verified: decision === 'verified',
      whc_verified_at: decision === 'verified' ? new Date().toISOString() : null,
    }
    const { data: row, error } = await admin.from('candidate_profiles')
      .update(update).eq('id', id).select('id, user_id, full_name').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Tell the therapist - awaited, never fatal
    try {
      if (row?.user_id) {
        await createNotification(row.user_id, 'general',
          decision === 'verified' ? 'You are WHC Verified' : 'Verification needs attention',
          decision === 'verified'
            ? 'Your documents checked out - the WHC Verified badge now shows on your profile and in the agency directory.'
            : `We couldn't verify your documents${body.reason ? `: ${body.reason}` : ''}. Update them and resubmit from your Verification page.`,
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
