import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createNotification } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/emails'

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { type, id, action, reason } = body as {
    type: 'candidate' | 'employer'
    id: string
    action: 'approve' | 'reject'
    reason?: string
  }

  if (!id || (type !== 'candidate' && type !== 'employer') || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const table = type === 'candidate' ? 'candidate_profiles' : 'employer_profiles'
  const update = action === 'approve'
    ? { approval_status: 'approved', approval_notes: null }
    : { approval_status: 'rejected', approval_notes: reason || null }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from(table)
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Approving an employer releases any paid roles held back by the approval
  // gate: a held role is a draft that already carries a live paid term.
  if (action === 'approve' && table === 'employer_profiles') {
    try {
      const { data: released } = await admin.from('job_listings')
        .update({ is_live: true, status: 'active' })
        .eq('employer_id', id)
        .eq('status', 'draft')
        .eq('is_live', false)
        .gt('expires_at', new Date().toISOString())
        .select('id')
      if (released?.length && data.user_id) {
        await createNotification(data.user_id, 'general', 'Your paid roles are now live', `Your employer account is approved and ${released.length} paid role${released.length === 1 ? ' is' : 's are'} now live on WHC.`, '/employer/jobs')
      }
    } catch (e: any) { console.error('Releasing held roles failed:', e?.message) }
  }

  // Tell the person - approval decisions matter to them. Awaited (serverless
  // kills fire-and-forget) but never fatal to the decision itself.
  try {
    let email: string | null = data.contact_email || null
    if (!email && data.user_id) {
      const { data: authUser } = await admin.auth.admin.getUserById(data.user_id)
      email = authUser?.user?.email || null
    }
    const name = data.full_name || data.contact_name || data.company_name || 'there'
    if (email) {
      if (action === 'approve') await sendApprovalEmail(email, name)
      else await sendRejectionEmail(email, name, reason || 'Please review your profile details and resubmit.')
    }
  } catch (e: any) {
    console.error('Approval email failed:', e?.message)
  }

  return NextResponse.json({ success: true, profile: data })
}
