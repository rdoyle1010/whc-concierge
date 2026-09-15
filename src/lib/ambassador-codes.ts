import type { SupabaseClient } from '@supabase/supabase-js'
import { LAUNCH_COURSE_SLUGS, grantCourses, grantListingCredits } from './launch-offers'

// Claiming a code, from wherever somebody types it.
//
// This lived inside the redeem route, which meant a code could only be used by
// somebody already signed in and already inside the platform. The admin screen
// issued codes, the route knew how to honour them, and nothing in the product
// ever asked for one, so the whole scheme was a form nobody could reach.
//
// It is here because registration needs it too, and that is the moment a code
// is actually used: somebody sees SPA-WELL26 in an Instagram caption and types
// it while creating their account, not three screens later.
//
// The claim itself is one database statement, because two people redeeming the
// last place must not both read "one left".

export const CODE_REFUSALS: Record<string, string> = {
  unknown: 'We do not recognise that code. Check it with whoever gave it to you.',
  inactive: 'That code is no longer active.',
  expired: 'That code has expired.',
  already: 'You have already used that code.',
  exhausted: 'That code has been fully claimed. Ask whoever gave it to you whether they have any left.',
  audience: 'That code is for a different kind of account.',
}

/** Typed off a poster or read down the phone, so it is matched loosely. */
export function normaliseCode(input: unknown): string {
  return String(input ?? '').trim().toUpperCase().slice(0, 40)
}

export type CodeClaim =
  | { ok: true; reward: string; granted: string[]; message: string; codeId: string }
  | { ok: false; error: string; status: number }

/**
 * Claim a code for somebody who has an account and a profile row.
 *
 * The audience check runs after the claim rather than before it, because
 * checking first means reading the code, and a code anybody can read by
 * guessing is a code anybody can enumerate. A wrong-audience claim is handed
 * straight back: the place is released and the redemption removed, so whoever
 * issued it does not lose an allocation to somebody's mistake.
 */
export async function claimCode(
  admin: SupabaseClient<any, any, any>,
  userId: string,
  rawCode: string,
  who: { candidateId?: string | null; employerId?: string | null },
): Promise<CodeClaim> {
  const code = normaliseCode(rawCode)
  if (!code) return { ok: false, error: 'Enter the code you were given.', status: 400 }

  const { data, error } = await admin.rpc('claim_ambassador_code', { p_code: code, p_user_id: userId })
  if (error) {
    console.error('[ambassador] claim failed:', error.message)
    return { ok: false, error: 'We could not check that code just now. Please try again.', status: 503 }
  }

  const claim: any = Array.isArray(data) ? data[0] : data
  if (!claim?.claimed) {
    return { ok: false, error: CODE_REFUSALS[String(claim?.reason)] || CODE_REFUSALS.unknown, status: 400 }
  }

  const audience = String(claim.audience || 'talent')
  const wrongAudience = (audience === 'talent' && !who.candidateId)
    || (audience === 'employer' && !who.employerId)
  if (wrongAudience) {
    await admin.from('ambassador_redemptions').delete().eq('code_id', claim.code_id).eq('user_id', userId)
    const { data: row } = await admin.from('ambassador_codes')
      .select('redemptions_used').eq('id', claim.code_id).maybeSingle()
    const used = Number((row as any)?.redemptions_used || 0)
    if (used > 0) {
      await admin.from('ambassador_codes').update({ redemptions_used: used - 1 }).eq('id', claim.code_id)
    }
    return { ok: false, error: CODE_REFUSALS.audience, status: 400 }
  }

  let granted: string[] = []
  let message = 'Your code has been recorded.'

  if (claim.reward === 'academy_courses' || claim.reward === 'academy_bundle') {
    const slugs: string[] = (claim.reward_slugs || []).length ? claim.reward_slugs : [...LAUNCH_COURSE_SLUGS]
    granted = (await grantCourses(admin, who.candidateId!, slugs, `code ${code}`)).granted
    message = granted.length
      ? `${granted.length} Academy ${granted.length === 1 ? 'course is' : 'courses are'} now in your Academy.`
      : 'You already own every course this code unlocks, so nothing has changed.'
  } else if (claim.reward === 'free_listing') {
    const quantity = Math.max(1, Number(claim.reward_quantity || 1))
    const ok = await grantListingCredits(admin, who.employerId!, quantity)
    if (!ok) {
      return { ok: false, error: 'We could not apply that code. Please contact us and we will sort it out.', status: 500 }
    }
    message = `${quantity} free Standard ${quantity === 1 ? 'listing has' : 'listings have'} been added to your account.`
  }

  await admin.from('ambassador_redemptions')
    .update({ granted: granted.length ? granted.join(', ') : claim.reward })
    .eq('code_id', claim.code_id).eq('user_id', userId)

  return { ok: true, reward: String(claim.reward), granted, message, codeId: String(claim.code_id) }
}
