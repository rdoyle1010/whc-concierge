import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRateLimit } from '@/lib/rate-limit'
import { createNotification } from '@/lib/notifications'
import {
  RECOVERY_CODE_COUNT,
  generateRecoveryCodes,
  hashRecoveryCode,
  normaliseRecoveryCode,
} from '@/lib/mfa-recovery'

export const dynamic = 'force-dynamic'

// Issue codes (POST with action 'issue'), or redeem one (action 'redeem').
//
// This route is exempt from the two-step gate in the middleware, by necessity:
// somebody redeeming a recovery code is by definition unable to complete the
// second step. What it is NOT exempt from is having a valid session - the
// password has already been proven - so redeeming a code is still two
// factors, and the limits below make guessing one impractical.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || 'redeem')
    const admin = createAdminClient()

    // ---------------------------------------------------------------------
    // Issue. Called at enrolment, and again if the person wants a fresh set.
    // Requires a completed second step, so only somebody already holding the
    // authenticator can mint new codes.
    // ---------------------------------------------------------------------
    if (action === 'issue') {
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assurance?.currentLevel !== 'aal2') {
        return NextResponse.json({ error: 'Complete the authenticator step before generating recovery codes.' }, { status: 403 })
      }

      const codes = generateRecoveryCodes()
      // A new set replaces the old one entirely: an old code must never keep
      // working after the person has been shown a replacement sheet.
      await admin.from('mfa_recovery_codes').delete().eq('user_id', user.id)
      const { error } = await admin.from('mfa_recovery_codes').insert(
        codes.map(code => ({ user_id: user.id, code_hash: hashRecoveryCode(code, user.id) })),
      )
      if (error) return NextResponse.json({ error: 'Recovery codes could not be saved. Try again.' }, { status: 500 })

      // Shown exactly once. Nothing on the platform can retrieve them again.
      return NextResponse.json({ codes, count: RECOVERY_CODE_COUNT })
    }

    // ---------------------------------------------------------------------
    // Redeem.
    // ---------------------------------------------------------------------
    const supplied = normaliseRecoveryCode(String(body?.code || ''))
    if (supplied.length < 10) return NextResponse.json({ error: 'Enter one of your recovery codes.' }, { status: 400 })

    // Hard limits. A recovery code is ten characters from a 32-character
    // alphabet, so guessing is already impractical; this makes it pointless.
    const limited = await enforceRateLimit(req, 'mfa-recovery', {
      windowMs: 60 * 60_000,
      maxRequests: 6,
      key: user.id,
    })
    if (limited) {
      return NextResponse.json(
        { error: 'Too many recovery attempts. Wait an hour, or contact Talent House support.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
      )
    }

    const { data: rows, error: readError } = await admin.from('mfa_recovery_codes')
      .select('id, code_hash, used_at')
      .eq('user_id', user.id)
      .is('used_at', null)
    if (readError) return NextResponse.json({ error: 'Recovery is unavailable right now.' }, { status: 500 })
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'This account has no unused recovery codes. Contact Talent House support to regain access.' },
        { status: 400 },
      )
    }

    const candidate = hashRecoveryCode(supplied, user.id)
    const match = rows.find(row => row.code_hash === candidate)
    if (!match) return NextResponse.json({ error: 'That recovery code was not recognised.' }, { status: 400 })

    // Spend the code first, and only proceed if this request is the one that
    // spent it. Two tabs cannot redeem the same code twice.
    const { data: spent } = await admin.from('mfa_recovery_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', match.id)
      .is('used_at', null)
      .select('id')
    if (!spent || spent.length === 0) {
      return NextResponse.json({ error: 'That recovery code has already been used.' }, { status: 400 })
    }

    // Remove the authenticator, which is what lets them back in. They are
    // prompted to enrol a new one immediately.
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totp = (factors?.totp || [])
    for (const factor of totp) {
      try { await supabase.auth.mfa.unenroll({ factorId: factor.id }) } catch { }
    }

    const remaining = rows.length - 1
    try {
      await createNotification(
        user.id,
        'general',
        'Two-step verification was reset with a recovery code',
        remaining > 0
          ? `Your authenticator was removed using a recovery code. ${remaining} code${remaining === 1 ? '' : 's'} remain. Set up an authenticator again now to keep your account protected. If this was not you, change your password immediately.`
          : 'Your authenticator was removed using your last recovery code. Set up an authenticator again now, and generate a fresh set of recovery codes. If this was not you, change your password immediately.',
        '/talent/settings',
      )
    } catch { }

    return NextResponse.json({ success: true, remaining })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Recovery failed.' }, { status: 500 })
  }
}

// How many unused codes are left, so the settings page can tell somebody they
// are running low before they find out the hard way.
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const admin = createAdminClient()
    const { count, error } = await admin.from('mfa_recovery_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('used_at', null)
    if (error) return NextResponse.json({ remaining: null })
    return NextResponse.json({ remaining: count ?? 0 })
  } catch {
    return NextResponse.json({ remaining: null })
  }
}
