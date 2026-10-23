import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { getStripe } from '@/lib/stripe'
import { getSafeSiteOrigin } from '@/lib/site-origin'

// Stripe Connect Express onboarding for professionals, so residency (and
// later agency) payouts are real bank transfers rather than a manual flag.
//
// GET  -> payout status (creates nothing)
// POST -> start or resume onboarding; returns the Stripe-hosted URL

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles')
    .select('id,stripe_connect_account_id,connect_payouts_enabled').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })
  if (!candidate.stripe_connect_account_id) return NextResponse.json({ state: 'not_started' })

  // Sync the live truth from Stripe so a completed onboarding shows
  // immediately rather than waiting for the webhook.
  try {
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(candidate.stripe_connect_account_id)
    const enabled = Boolean(account.payouts_enabled)
    if (enabled !== Boolean(candidate.connect_payouts_enabled)) {
      await admin.from('candidate_profiles').update({ connect_payouts_enabled: enabled }).eq('id', candidate.id)
    }
    return NextResponse.json({
      state: enabled ? 'active' : 'incomplete',
      details_submitted: Boolean(account.details_submitted),
    })
  } catch {
    return NextResponse.json({ state: candidate.connect_payouts_enabled ? 'active' : 'incomplete' })
  }
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id,full_name,stripe_connect_account_id').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

    const stripe = getStripe()
    const origin = getSafeSiteOrigin(body.returnUrl)

    let accountId = candidate.stripe_connect_account_id
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: user.email || undefined,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        metadata: { candidate_id: candidate.id, platform: 'whc' },
      })
      accountId = account.id

      // Checked, because this is the line that decides whether the account we
      // just created is ever found again.
      //
      // The write was unchecked. A Connect account is created at Stripe first
      // and linked here second, so a failed link leaves a real account that
      // this platform has no record of - and the next time the professional
      // presses the button, the branch above sees no id and creates another
      // one. Every attempt makes a new account, none of them can be paid out
      // to, and nothing anywhere says so.
      const { error: linkError } = await admin.from('candidate_profiles')
        .update({ stripe_connect_account_id: accountId }).eq('id', candidate.id)
      if (linkError) {
        console.error('[payouts] Connect account created but not linked:', accountId, candidate.id, linkError.message)
        return NextResponse.json({
          error: 'Your payout account was created but we could not save it against your profile. Please tell us before trying again, so we do not create a second one.',
        }, { status: 502 })
      }
    }

    // Agency and Residency both start onboarding here, so the professional
    // comes back to the page they left. Allowlisted - never a caller-supplied path.
    const RETURN_PATHS = ['/talent/residency', '/talent/agency/settings']
    const returnPath = RETURN_PATHS.includes(String(body.returnPath || '')) ? String(body.returnPath) : RETURN_PATHS[0]

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}${returnPath}?payouts=refresh`,
      return_url: `${origin}${returnPath}?payouts=return`,
      type: 'account_onboarding',
    })
    return NextResponse.json({ url: link.url })
  } catch (e: any) {
    const message = String(e?.message || '')
    if (message.toLowerCase().includes('connect')) {
      return NextResponse.json({ error: 'Payout onboarding is not available yet - Talent House is finishing its Stripe Connect setup. Your payout will be arranged directly in the meantime.' }, { status: 503 })
    }
    return NextResponse.json({ error: message || 'Could not start payout setup.' }, { status: 500 })
  }
}
