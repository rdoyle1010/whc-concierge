import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// "Kelly cannot get into her account" - answered, then fixed, in one place.
//
// Everything that stops somebody signing in lives somewhere the browser cannot
// see: the role on their profile, whether their address was ever confirmed,
// whether an authenticator is enrolled on a phone they no longer own. From
// outside, all of those produce the same thing - a person who cannot get in
// and cannot say why. So the platform's owner had no move except to guess.
//
// Clearing two-step verification is the one genuinely dangerous button here,
// so it is fenced: the caller must already have passed their own two-step
// challenge (adminRequestUser enforces that), cannot aim it at themselves,
// and every use is written to the audit log with who did it and to whom.

type Diagnosis = {
  found: boolean
  userId?: string
  email?: string
  role?: string | null
  emailConfirmed?: boolean
  lastSignIn?: string | null
  createdAt?: string | null
  twoStep?: 'enrolled' | 'none' | 'unknown'
  recoveryCodesLeft?: number | null
  // Written for somebody who is not a developer: what is wrong, in a sentence.
  verdict?: string
  fix?: string
}

async function diagnose(email: string): Promise<Diagnosis> {
  const admin = createAdminClient()

  // There is no getUserByEmail. listUsers is paged, so filter on the way past
  // rather than pulling every account into memory.
  let account: any = null
  for (let page = 1; page <= 20 && !account; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    account = data.users.find((candidate: any) => String(candidate.email || '').toLowerCase() === email) || null
    if (data.users.length < 200) break
  }
  if (!account) {
    return {
      found: false,
      verdict: 'No account exists with that address.',
      fix: 'Check the spelling. If it is right, they have never completed registration - send them the sign-up link.',
    }
  }

  const { data: profile } = await admin.from('profiles').select('role').eq('id', account.id).maybeSingle()

  let twoStep: Diagnosis['twoStep'] = 'unknown'
  try {
    const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId: account.id })
    const list = (factors as any)?.factors || []
    twoStep = list.some((factor: any) => factor.status === 'verified') ? 'enrolled' : 'none'
  } catch { twoStep = 'unknown' }

  let recoveryCodesLeft: number | null = null
  try {
    const { count } = await admin.from('mfa_recovery_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', account.id).is('used_at', null)
    recoveryCodesLeft = count ?? null
  } catch { recoveryCodesLeft = null }

  const role = profile?.role ?? null
  const emailConfirmed = Boolean(account.email_confirmed_at || account.confirmed_at)

  // Ordered by what actually stops a sign-in first.
  let verdict = 'Nothing on our side is blocking this account. The password is the likely problem.'
  let fix = 'Send a password reset below. If they still cannot get in, the browser may be holding an old session - ask them to try a private window.'

  if (!role) {
    verdict = 'This account has no role set, so sign-in is refused before the password is even checked.'
    fix = 'Set their role in the database. An administrator needs role = admin on their profiles row.'
  } else if (role !== 'admin') {
    verdict = `This is a ${role === 'candidate' ? 'talent' : role} account, not an administrator. Signing in through the admin door will always be refused.`
    fix = role === 'candidate'
      ? 'They should use the Talent side of the normal sign-in page. To make them an administrator, change their role to admin.'
      : 'They should use the Hotel / Employer side of the normal sign-in page. To make them an administrator, change their role to admin.'
  } else if (twoStep === 'none') {
    verdict = 'Administrator with no authenticator enrolled. Sign-in works, but it lands on the security setup page rather than the dashboard.'
    fix = 'That is correct behaviour - administrators must set up two-step verification. Tell them to sign in at /admin and follow the prompt on screen.'
  } else if (!emailConfirmed) {
    verdict = 'The address on this account was never confirmed.'
    fix = 'Send a password reset below. Completing the reset confirms the address at the same time.'
  } else if (twoStep === 'enrolled') {
    verdict = 'Administrator, authenticator enrolled, address confirmed. Sign-in should work.'
    fix = `They will be asked for a six-digit code after their password.${recoveryCodesLeft ? ` They have ${recoveryCodesLeft} recovery codes left if the app is gone.` : ''} If the authenticator app is gone and the codes with it, clear two-step below.`
  }

  return {
    found: true,
    userId: account.id,
    email: account.email,
    role,
    emailConfirmed,
    lastSignIn: account.last_sign_in_at || null,
    createdAt: account.created_at || null,
    twoStep,
    recoveryCodesLeft,
    verdict,
    fix,
  }
}

export async function GET(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const email = String(req.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Enter the email address on the account.' }, { status: 400 })
  return NextResponse.json(await diagnose(email))
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const action = String(body.action || '')
  if (!email) return NextResponse.json({ error: 'Enter the email address on the account.' }, { status: 400 })

  const admin = createAdminClient()
  const found = await diagnose(email)
  if (!found.found || !found.userId) return NextResponse.json({ error: 'No account exists with that address.' }, { status: 404 })

  if (action === 'send_reset') {
    // Goes to their own inbox. The link is never shown to the administrator
    // running this, which is what keeps it a reset rather than a takeover.
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://talenthousecollective.co.uk/reset-password',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 502 })
    await audit(actor.id, 'password_reset_sent', found.userId, email)
    return NextResponse.json({ ok: true, detail: `Reset link sent to ${email}. It lasts one hour and goes only to their inbox.` })
  }

  if (action === 'clear_two_step') {
    // Removing your own second factor from a page that is itself gated on it
    // is how an administrator locks themselves out for good. Recovery codes
    // are the route for that, and they exist.
    if (found.userId === actor.id) {
      return NextResponse.json({
        error: 'You cannot clear your own two-step verification here. Use one of your recovery codes, or ask the other administrator to do it for you.',
      }, { status: 400 })
    }
    let removed = 0
    try {
      const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId: found.userId })
      for (const factor of ((factors as any)?.factors || [])) {
        await admin.auth.admin.mfa.deleteFactor({ userId: found.userId, id: factor.id })
        removed++
      }
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Could not remove the authenticator.' }, { status: 502 })
    }
    // Codes issued against the authenticator that has just gone are dead
    // weight, and leaving them behind means the next enrolment shows a count
    // belonging to an authenticator nobody has.
    try { await admin.from('mfa_recovery_codes').delete().eq('user_id', found.userId).is('used_at', null) } catch { }
    await audit(actor.id, 'two_step_cleared', found.userId, email)
    return NextResponse.json({
      ok: true,
      detail: removed
        ? `Two-step verification removed. ${email} can now sign in on their password alone, and will be asked to set up a new authenticator straight away.`
        : 'There was no authenticator on this account to remove.',
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

async function audit(adminId: string, action: string, entityId: string, notes: string) {
  try {
    await createAdminClient().from('admin_audit_log').insert({
      admin_id: adminId, action, entity_type: 'auth_account', entity_id: entityId, notes,
    })
  } catch { /* the record is worth having, never worth failing the fix for */ }
}
