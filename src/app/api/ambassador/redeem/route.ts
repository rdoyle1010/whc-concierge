import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { enforceRateLimit } from '@/lib/rate-limit'
import { claimCode, normaliseCode } from '@/lib/ambassador-codes'
import { notifyAdmins } from '@/lib/notifications'
import { trackEvent } from '@/lib/analytics'

// Redeeming an ambassador's code.
//
// The code is the point of the whole scheme. The courses it gives away cost
// nothing to reproduce; what it buys is the answer to a question no analytics
// package can give us - whose word actually moves people in this industry.
// Every redemption is attributed, so at the end of the opening month we know
// which four therapists and which hotel were worth the arrangement.
//
// Claiming is one database statement (claim_ambassador_code), because two
// people redeeming the last place must not both read "one left".

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in to use a code.' }, { status: 401 })

  // A guessable code is a code worth guessing, so the guessing is limited
  // across the whole platform rather than per serverless container.
  const limited = await enforceRateLimit(req, 'ambassador-redeem', { windowMs: 15 * 60 * 1000, maxRequests: 8, key: user.id })
  if (limited) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  const body = await req.json().catch(() => ({}))
  const code = normaliseCode(body.code)
  if (!code) return NextResponse.json({ error: 'Enter the code you were given.' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }] = await Promise.all([
    admin.from('candidate_profiles').select('id,full_name').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id,property_name,company_name').eq('user_id', user.id).maybeSingle(),
  ])
  if (!candidate && !employer) {
    return NextResponse.json({ error: 'Finish setting up your account before using a code.' }, { status: 403 })
  }

  // The claim itself lives in src/lib/ambassador-codes.ts, because
  // registration needs the same thing and that is the moment a code is
  // actually used: somebody types it while creating the account, not three
  // screens later.
  const claimed = await claimCode(admin, user.id, code, {
    candidateId: candidate?.id, employerId: employer?.id,
  })
  if (!claimed.ok) return NextResponse.json({ error: claimed.error }, { status: claimed.status })

  await trackEvent('ambassador_code_redeemed', { actorUserId: user.id, candidateId: candidate?.id, employerId: employer?.id }, { code, reward: claimed.reward })

  // Worth interrupting somebody for: a code being used is the only signal that
  // an ambassador arrangement is doing anything at all.
  await notifyAdmins(
    'An ambassador code was used',
    `${candidate?.full_name || employer?.property_name || employer?.company_name || 'Somebody'} redeemed ${code}.`,
    '/admin/ambassadors',
  )

  return NextResponse.json({ success: true, reward: claimed.reward, granted: claimed.granted, message: claimed.message })

}
