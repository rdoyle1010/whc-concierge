import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail, SUPPORT_MAILBOX } from '@/lib/send-email'
import { isBuildStatus } from '@/lib/profile-build'
import { visibilityColumns } from '@/lib/talent-visibility'

// Building somebody's profile for them, from the queue to the handover.
//
// Three of these actions are ordinary admin. One is not: 'open' mints a
// one-time link that signs an administrator in as the professional, which is
// the only way to fill in a profile using the real form rather than a second
// copy of it that drifts out of date. It is fenced accordingly - the
// administrator's own two-step is enforced by adminRequestUser, the person
// must have asked for this in writing, and every use is written down.

export const dynamic = 'force-dynamic'

const SITE = 'https://talenthousecollective.co.uk'
const BUCKET = 'talent-documents'

export async function GET() {
  const admin_user = await adminRequestUser()
  if (!admin_user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()

  const { data, error } = await admin.from('profile_build_requests')
    .select('*').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ rows: [], unavailable: true, reason: error.message })

  // A signed link per CV, valid for an hour. The bucket is private and must
  // stay that way: these are strangers' CVs.
  const rows = await Promise.all((data || []).map(async (row: any) => {
    if (!row.cv_path) return { ...row, cv_url: null }
    try {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(row.cv_path, 3600)
      return { ...row, cv_url: signed?.signedUrl || null }
    } catch {
      return { ...row, cv_url: null }
    }
  }))

  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'Missing request' }, { status: 400 })

  const admin = createAdminClient()
  const { data: request, error: readError } = await admin.from('profile_build_requests')
    .select('*').eq('id', id).maybeSingle()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

  if (action === 'status') {
    if (!isBuildStatus(body.status)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
    const { error } = await admin.from('profile_build_requests')
      .update({ status: body.status, admin_note: String(body.admin_note || '').slice(0, 2000) || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Create the account. No password: they set one at handover, which is the
  // first and only thing they are ever asked to do.
  if (action === 'create') {
    if (request.created_user_id) return NextResponse.json({ error: 'This one already has an account.' }, { status: 400 })

    const { data: made, error: createError } = await admin.auth.admin.createUser({
      email: request.email,
      email_confirm: true,
      user_metadata: { role: 'talent', full_name: request.full_name },
    })
    if (createError || !made?.user) {
      return NextResponse.json({ error: createError?.message || 'That account could not be created.' }, { status: 400 })
    }
    const userId = made.user.id

    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId, email: request.email, role: 'candidate', full_name: request.full_name,
    }, { onConflict: 'id' })
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    // Private, and not merely by default. She has not seen this yet, so
    // nobody else may either.
    const { error: candidateError } = await admin.from('candidate_profiles').upsert({
      user_id: userId,
      full_name: request.full_name,
      phone: request.phone || null,
      cv_url: request.cv_path || null,
      agreed_terms: false,
      approval_status: 'approved',
      ...visibilityColumns('private'),
    }, { onConflict: 'user_id' })
    if (candidateError) return NextResponse.json({ error: candidateError.message }, { status: 500 })

    const { error: linkError } = await admin.from('profile_build_requests')
      .update({ created_user_id: userId, status: 'building', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (linkError) {
      return NextResponse.json({
        success: true, userId,
        warning: 'The account was created, but we could not link it to this request. Do not press create again: it would fail on a duplicate address.',
      })
    }
    return NextResponse.json({ success: true, userId })
  }

  // Sign in as them, to fill the profile in using the real form.
  if (action === 'open') {
    if (!request.created_user_id) return NextResponse.json({ error: 'Create the account first.' }, { status: 400 })
    if (!request.consent_given_at) return NextResponse.json({ error: 'There is no recorded consent on this request.' }, { status: 403 })

    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: request.email,
      options: { redirectTo: `${SITE}/talent/profile` },
    })
    const url = link?.properties?.action_link
    if (error || !url) {
      return NextResponse.json({ error: error?.message || 'We could not open that workspace.' }, { status: 502 })
    }

    // Written down before the link is handed over, so the record exists even
    // if the browser never opens it. This is the most sensitive action on the
    // platform and the log is the only thing that makes it accountable.
    const { error: logError } = await admin.from('profile_build_access_log').insert({
      admin_user_id: actor.id,
      admin_email: actor.email || null,
      target_user_id: request.created_user_id,
      target_email: request.email,
      request_id: id,
      reason: 'Building a profile at their written request',
    })
    if (logError) {
      // No log, no link. An unrecorded sign-in as somebody else is exactly
      // what this is not allowed to be.
      console.error('Profile build access log failed:', logError.message)
      return NextResponse.json({ error: 'We could not record that access, so it has not been granted.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url })
  }

  // Hand it over: here is your profile, set a password and it is yours.
  if (action === 'handover') {
    if (!request.created_user_id) return NextResponse.json({ error: 'Create the account first.' }, { status: 400 })

    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: request.email,
      options: { redirectTo: `${SITE}/talent/profile` },
    })
    const url = link?.properties?.action_link
    if (error || !url) {
      return NextResponse.json({ error: error?.message || 'We could not create the link.' }, { status: 502 })
    }

    const sent = await sendTransactionalEmail({
      to: request.email,
      subject: 'Your profile is ready',
      html: handoverHtml(request.full_name, url),
      kind: 'onboarding',
      userId: request.created_user_id,
      replyTo: SUPPORT_MAILBOX,
    })
    if (!sent.ok) return NextResponse.json({ error: sent.error || 'The email did not send.' }, { status: 502 })

    const { error: statusError } = await admin.from('profile_build_requests')
      .update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', id)
    if (statusError) {
      return NextResponse.json({ success: true, warning: 'Sent, but the queue status did not update.' })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

const escape = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function handoverHtml(fullName: string, url: string): string {
  const firstName = String(fullName || '').trim().split(/\s+/)[0] || 'there'
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:32px auto;border:1px solid #dddddd;">
      <div style="background:#262626;padding:26px 32px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.75;">Talent House Collective</p>
        <p style="margin:0;color:#ffffff;font-size:23px;font-weight:600;">Your profile is ready</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">Hello ${escape(firstName)},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          We have built it from what you sent. Have a look, change anything that is not right, and it
          is yours. Setting a password is the only thing left to do.
        </p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          <strong>It is private.</strong> No property can see you, and none will until you decide
          otherwise. When you are ready there is a middle setting as well, where a spa can find you by
          what you can do without learning your name until you agree to an introduction.
        </p>
        <p style="margin:0 0 22px;">
          <a href="${url}" style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:600;">See your profile and set a password</a>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b6b;">
          Anything we have got wrong, just reply to this email and we will fix it.
        </p>
        <p style="margin:22px 0 0;font-size:12px;color:#6b6b6b;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    </div>
  </body></html>`
}
