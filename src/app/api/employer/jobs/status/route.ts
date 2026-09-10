import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRoleFilledEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'
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
  if (!jobId || !['filled', 'closed', 'reopen', 'delete'].includes(action)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id, property_name, company_name, approval_status').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

  const { data: job } = await admin.from('job_listings').select('id, employer_id, job_title, expires_at').eq('id', jobId).maybeSingle()
  if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Putting a role back up used to be a write straight from the browser to
  // the database, guarded by nothing but a JavaScript alert about the paid
  // term. The term is checked here now, where it cannot be stepped around.
  if (action === 'reopen') {
    if (employer.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Your employer account is awaiting Talent House approval. Roles go live the moment it is approved.' }, { status: 409 })
    }
    const paidUntil = job.expires_at ? new Date(job.expires_at).getTime() : 0
    if (!paidUntil || !Number.isFinite(paidUntil) || paidUntil <= Date.now()) {
      return NextResponse.json({
        error: 'This listing\u2019s paid term has ended. Use Repost to relist it - your details carry over and payment is taken at checkout.',
        code: 'TERM_ENDED',
        repostHref: `/employer/post-role?repost=${job.id}`,
      }, { status: 402 })
    }
    const { error: reopenError } = await admin.from('job_listings')
      .update({ is_live: true, status: 'active' }).eq('id', job.id)
    if (reopenError) return NextResponse.json({ error: 'Could not put this role back up.' }, { status: 500 })
    return NextResponse.json({ success: true, status: 'active', is_live: true, expiresAt: job.expires_at })
  }

  // Deleting a listing.
  //
  // This used to be a delete straight from the browser, and the database
  // refused it: matches point at job_listings with no cascade, so a role
  // anybody had matched with could not be removed and the raw constraint
  // error was shown to the property in an alert box.
  //
  // The refusal was right and the reason is a product one. A role people have
  // applied to or matched with is a record - of their application, of a
  // conversation, of a hire - and deleting it would take that history from
  // them to tidy a screen. Roles like that are closed, which is what Close
  // and Filled already do. Only a listing nobody ever reached can be removed,
  // and then its own scaffolding goes with it.
  if (action === 'delete') {
    const [{ count: applicationCount }, { count: matchCount }] = await Promise.all([
      admin.from('applications').select('id', { count: 'exact', head: true }).or(`job_id.eq.${jobId},role_id.eq.${jobId}`),
      admin.from('matches').select('id', { count: 'exact', head: true }).eq('job_listing_id', jobId),
    ])
    const applications = Number(applicationCount || 0)
    const matches = Number(matchCount || 0)

    if (applications > 0 || matches > 0) {
      const parts: string[] = []
      if (applications > 0) parts.push(`${applications} application${applications === 1 ? '' : 's'}`)
      if (matches > 0) parts.push(`${matches} match${matches === 1 ? '' : 'es'}`)
      return NextResponse.json({
        error: `This role has ${parts.join(' and ')} against it, so it cannot be deleted - that history belongs to the professionals as much as to you. Close it instead and it comes off the board while the record stays.`,
        code: 'HAS_HISTORY',
        applications,
        matches,
      }, { status: 409 })
    }

    // Nothing reached it, so the scaffolding goes too. Swipes are the only
    // dependent without a cascade that a never-seen listing can still have.
    await admin.from('swipes').delete().eq('target_id', jobId).eq('target_type', 'job')
    const { error: deleteError } = await admin.from('job_listings').delete().eq('id', jobId).eq('employer_id', employer.id)
    if (deleteError) {
      return NextResponse.json({ error: 'This role could not be deleted. Close it instead, and tell us if it keeps happening.' }, { status: 500 })
    }
    return NextResponse.json({ success: true, deleted: true })
  }

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
      // Preference-gated ('application_updates'): the role-filled/closed email
      // honours the applicant's opt-out; the in-app notification above always
      // fires. Fail-open on lookup errors.
      if (!(await emailAllowed(admin, candidate.user_id, 'application_updates'))) continue
      const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
      const email = authUser.user?.email
      if (!email) continue
      await sendRoleFilledEmail(email, candidate.full_name || '', job.job_title || 'Role', propertyName, action === 'filled' ? 'filled' : 'closed')
      notified += 1
    }
  }

  return NextResponse.json({ success: true, status, notified })
}
