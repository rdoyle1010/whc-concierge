import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRoleFilledEmail } from '@/lib/emails'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'

// Only these applications are still "in play" and need closing + notifying
// when the role ends. Drafts were never sent; withdrawn/rejected/accepted are
// already settled.
const ACTIVE_STATUSES = ['pending', 'reviewed', 'shortlisted', 'interview', 'offered']

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { jobId, action } = await req.json()
  if (!jobId || !['filled', 'closed'].includes(action)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id, property_name, company_name').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

  const { data: job } = await admin.from('job_listings').select('id, employer_id, job_title').eq('id', jobId).maybeSingle()
  if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = action === 'filled' ? 'filled' : 'closed'
  const { error: updateError } = await admin.from('job_listings').update({ is_live: false, status }).eq('id', jobId)
  if (updateError) return NextResponse.json({ error: 'Could not update role' }, { status: 500 })

  let notified = 0
  const propertyName = employer.property_name || employer.company_name || 'the property'
  const { data: applications } = await admin.from('applications')
    .select('id, candidate_id, status')
    .or(`job_id.eq.${jobId},role_id.eq.${jobId}`)
    .in('status', ACTIVE_STATUSES)

  const activeApplications = applications || []
  if (activeApplications.length) {
    // Close the applications so neither side is left with a live-looking
    // application against a dead role.
    await admin.from('applications')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .in('id', activeApplications.map((a: any) => a.id))

    const candidateIds = Array.from(new Set(activeApplications.map((a: any) => a.candidate_id).filter(Boolean))) as string[]
    const { data: candidates } = await admin.from('candidate_profiles').select('id, user_id, full_name').in('id', candidateIds)
    const message = action === 'filled'
      ? `${job.job_title || 'The role'} at ${propertyName} has been filled. Thank you for your interest - your other applications are unaffected.`
      : `${job.job_title || 'The role'} at ${propertyName} has been closed by the property. Thank you for your interest - your other applications are unaffected.`
    for (const candidate of candidates || []) {
      if (!candidate.user_id) continue
      await createNotification(candidate.user_id, 'general', action === 'filled' ? 'Role filled' : 'Role closed', message, '/talent/applications')
      const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
      const email = authUser.user?.email
      if (!email) continue
      await sendRoleFilledEmail(email, candidate.full_name || '', job.job_title || 'Role', propertyName, action === 'filled' ? 'filled' : 'closed')
      notified += 1
    }
  }

  return NextResponse.json({ success: true, status, notified })
}
