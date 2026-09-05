import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createNotification } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/emails'
import { sendTransactionalEmail } from '@/lib/send-email'

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

// Talent profiles carry no email column - a professional's address lives in
// auth.users, which the browser cannot read. So the admin list showed "no email
// on profile" for everybody and it looked as though people had signed up
// without one. They had not: Supabase will not create an account without an
// email, so every account has one. It was only ever invisible here.
async function emailsForUsers(userIds: string[]) {
  const admin = createAdminClient()
  const pairs = await Promise.all(
    userIds.slice(0, 200).map(async id => {
      try {
        const { data } = await admin.auth.admin.getUserById(id)
        return [id, data?.user?.email || null] as const
      } catch {
        return [id, null] as const
      }
    }),
  )
  return Object.fromEntries(pairs)
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { type, id, action, reason } = body as {
    type: 'candidate' | 'employer'
    id: string
    action: 'approve' | 'reject' | 'emails' | 'email_log' | 'reachability_check'
    reason?: string
  }

  // Looking up addresses needs no profile id, so it is answered before the
  // approve/reject validation below.
  if (action === 'emails') {
    const ids = Array.isArray(body.user_ids) ? body.user_ids.filter((v: unknown) => typeof v === 'string') : []
    return NextResponse.json({ emails: await emailsForUsers(ids) })
  }

  // "Did they get an email?" used to end in a guess. Now it ends in a row.
  if (action === 'email_log') {
    const address = String(body.email || '').trim().toLowerCase()
    const userId = typeof body.user_id === 'string' ? body.user_id : null
    if (!address && !userId) return NextResponse.json({ log: [] })
    const logClient = createAdminClient()
    let query = logClient.from('email_log').select('id, kind, subject, status, error, created_at').order('created_at', { ascending: false }).limit(20)
    query = address && userId
      ? query.or(`recipient.ilike.${address},user_id.eq.${userId}`)
      : address ? query.ilike('recipient', address) : query.eq('user_id', userId as string)
    const { data, error } = await query
    // The table arrives with a migration. Until it is run, say so plainly
    // rather than showing an empty list that reads as "nothing was sent".
    if (error) return NextResponse.json({ log: [], unavailable: true })
    return NextResponse.json({ log: data || [] })
  }

  // "Is their email actually working?" used to have no answer short of
  // deleting the account and making them sign up again, which destroys a
  // profile to test a mail server. This sends one real message down the real
  // path to their own address and records the result in the email log, so
  // the question ends in evidence rather than a guess.
  //
  // The message is written to be worth receiving. A bare test email from a
  // platform somebody barely knows reads as a phishing attempt.
  if (action === 'reachability_check') {
    const userId = typeof body.user_id === 'string' ? body.user_id : ''
    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const client = createAdminClient()
    const { data: authUser } = await client.auth.admin.getUserById(userId)
    const address = authUser?.user?.email
    if (!address) return NextResponse.json({ error: 'There is no email address on this account.' }, { status: 400 })

    const { data: candidate } = await client.from('candidate_profiles').select('full_name').eq('user_id', userId).maybeSingle()
    const { data: employer } = await client.from('employer_profiles').select('property_name, company_name').eq('user_id', userId).maybeSingle()
    const name = candidate?.full_name || employer?.property_name || employer?.company_name || 'there'

    const result = await sendTransactionalEmail({
      to: address,
      subject: 'Checking we can reach you',
      kind: 'notification',
      userId,
      html: `<div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 32px;">Talent House Collective</p>
        <p style="font-size: 22px; font-weight: 700; margin-bottom: 16px;">Just checking this reaches you, ${name}</p>
        <p style="color: #555555;">Nothing needs doing. We are confirming that messages from Talent House arrive properly, so that when a property is interested in you, or a shift needs answering, you actually hear about it.</p>
        <p style="color: #555555;">If this landed in your junk folder, marking it as safe will keep the ones that matter out of there.</p>
        <p style="margin-top: 24px;"><a href="https://talenthousecollective.co.uk/login" style="display: inline-block; background: #1c1c1c; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Sign in</a></p>
      </div>`,
    })

    return NextResponse.json({
      success: result.ok,
      status: result.status,
      to: address,
      error: result.error || null,
      detail: result.ok
        ? `Sent to ${address}. It is in the email log either way, and in Resend if it left the building.`
        : `Not sent: ${result.error || 'the provider refused it'}. That is the reason they have been hearing nothing.`,
    })
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
        await createNotification(data.user_id, 'general', 'Your paid roles are now live', `Your employer account is approved and ${released.length} paid role${released.length === 1 ? ' is' : 's are'} now live on Talent House.`, '/employer/jobs')
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
