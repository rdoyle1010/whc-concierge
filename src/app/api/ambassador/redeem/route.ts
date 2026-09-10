import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { enforceRateLimit } from '@/lib/rate-limit'
import { LAUNCH_COURSE_SLUGS, grantCourses, grantListingCredits } from '@/lib/launch-offers'
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

const REASONS: Record<string, string> = {
  unknown: 'We do not recognise that code. Check it with whoever gave it to you.',
  inactive: 'That code is no longer active.',
  expired: 'That code has expired.',
  already: 'You have already used that code.',
  exhausted: 'That code has been fully claimed. Ask your ambassador whether they have any left.',
  audience: 'That code is for a different kind of account.',
}

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
  const code = String(body.code || '').trim().toUpperCase().slice(0, 40)
  if (!code) return NextResponse.json({ error: 'Enter the code you were given.' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }] = await Promise.all([
    admin.from('candidate_profiles').select('id,full_name').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id,property_name,company_name').eq('user_id', user.id).maybeSingle(),
  ])
  if (!candidate && !employer) {
    return NextResponse.json({ error: 'Finish setting up your account before using a code.' }, { status: 403 })
  }

  const { data, error } = await admin.rpc('claim_ambassador_code', { p_code: code, p_user_id: user.id })
  if (error) {
    console.error('[ambassador] claim failed:', error.message)
    return NextResponse.json({ error: 'We could not check that code just now. Please try again.' }, { status: 503 })
  }

  const claim = Array.isArray(data) ? data[0] : data
  if (!claim?.claimed) {
    return NextResponse.json({ error: REASONS[String(claim?.reason)] || REASONS.unknown }, { status: 400 })
  }

  // The audience check runs after the claim rather than before it, because
  // checking first means reading the code, and a code anybody can read by
  // guessing is a code anybody can enumerate. A wrong-audience claim is handed
  // straight back: the place is released and the redemption removed, so the
  // ambassador does not lose an allocation to somebody's mistake.
  const audience = String(claim.audience || 'talent')
  const wrongAudience = (audience === 'talent' && !candidate) || (audience === 'employer' && !employer)
  if (wrongAudience) {
    await admin.from('ambassador_redemptions').delete().eq('code_id', claim.code_id).eq('user_id', user.id)
    const { data: row } = await admin.from('ambassador_codes').select('redemptions_used').eq('id', claim.code_id).maybeSingle()
    const used = Number((row as any)?.redemptions_used || 0)
    if (used > 0) await admin.from('ambassador_codes').update({ redemptions_used: used - 1 }).eq('id', claim.code_id)
    return NextResponse.json({ error: REASONS.audience }, { status: 400 })
  }

  let granted: string[] = []
  let summary = ''

  if (claim.reward === 'academy_courses' || claim.reward === 'academy_bundle') {
    const slugs: string[] = (claim.reward_slugs || []).length ? claim.reward_slugs : [...LAUNCH_COURSE_SLUGS]
    const result = await grantCourses(admin, candidate!.id, slugs, `ambassador code ${code}`)
    granted = result.granted
    summary = granted.length
      ? `${granted.length} Academy ${granted.length === 1 ? 'course is' : 'courses are'} now in your Academy.`
      : 'You already own every course this code unlocks, so nothing has changed.'
  } else if (claim.reward === 'free_listing') {
    const quantity = Math.max(1, Number(claim.reward_quantity || 1))
    const ok = await grantListingCredits(admin, employer!.id, quantity)
    if (!ok) return NextResponse.json({ error: 'We could not apply that code. Please contact us and we will sort it out.' }, { status: 500 })
    summary = `${quantity} free Standard ${quantity === 1 ? 'listing has' : 'listings have'} been added to your account.`
  } else {
    summary = 'Your code has been recorded.'
  }

  await admin.from('ambassador_redemptions')
    .update({ granted: granted.length ? granted.join(', ') : claim.reward })
    .eq('code_id', claim.code_id).eq('user_id', user.id)

  await trackEvent('ambassador_code_redeemed', { actorUserId: user.id, candidateId: candidate?.id, employerId: employer?.id }, { code, reward: claim.reward })

  // Worth interrupting somebody for: a code being used is the only signal that
  // an ambassador arrangement is doing anything at all.
  await notifyAdmins(
    'An ambassador code was used',
    `${candidate?.full_name || employer?.property_name || employer?.company_name || 'Somebody'} redeemed ${code}.`,
    '/admin/ambassadors',
  )

  return NextResponse.json({ success: true, reward: claim.reward, granted, message: summary })
}
