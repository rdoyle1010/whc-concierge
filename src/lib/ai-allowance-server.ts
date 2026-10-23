import { createAdminClient } from '@/lib/supabase/admin'
import {
  ALLOWANCE_BUCKETS, allowancePeriod, exhaustedMessage, isMeteredTier, limitFor,
  type Allowances, type AllowanceBucket,
} from './ai-allowance'

// Spending an allowance, and giving it back when the call fails.
//
// Two rules hold this together, and both were learned somewhere else on this
// platform rather than guessed at here.
//
// The claim is one database statement. Read-then-write lets two tabs both
// spend the last one, and it is invisible until somebody double-clicks.
//
// A failed call is refunded. A person who pressed a button that timed out has
// not had their turn, and charging them for it is how a generous allowance
// comes to feel like a mean one.

export async function loadAllowances(admin = createAdminClient()): Promise<Allowances> {
  const { data, error } = await admin.from('ai_allowances').select('bucket, monthly_limit')
  // A table that cannot be read falls back to the defaults in the code rather
  // than to zero. Running at the old allowance is recoverable; locking every
  // member out of their own profile because one select failed is not.
  if (error || !data) return {}
  const allowances: Allowances = {}
  for (const row of data as any[]) {
    if (ALLOWANCE_BUCKETS.includes(row.bucket) && Number.isInteger(row.monthly_limit) && row.monthly_limit >= 0) {
      allowances[row.bucket as AllowanceBucket] = row.monthly_limit
    }
  }
  return allowances
}

export type AllowanceClaim =
  | { ok: true; metered: false }
  | { ok: true; metered: true; used: number; limit: number; period: string }
  | { ok: false; error: string; status: number }

/**
 * Take one from this month's allowance, or say why not.
 *
 * The membership lookup happens here rather than in the route because every
 * route would otherwise have to remember to do it, and the one that forgot
 * would be the one metering paying members.
 */
export async function claimAllowance(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  bucket: AllowanceBucket,
  membershipTier: unknown,
): Promise<AllowanceClaim> {
  if (!isMeteredTier(membershipTier)) return { ok: true, metered: false }

  const limit = limitFor(bucket, await loadAllowances(admin))
  if (limit <= 0) {
    return { ok: false, error: exhaustedMessage(bucket, 0), status: 402 }
  }

  const period = allowancePeriod()
  const { data, error } = await admin.rpc('claim_ai_allowance', {
    p_user_id: userId, p_bucket: bucket, p_limit: limit, p_period: period,
  })

  // A broken meter must not become a broken product. If the allowance cannot
  // be checked the call goes through: the worst case is a few pence, and the
  // alternative is a profile nobody can finish because of a database blip.
  if (error) {
    console.error('[allowance] could not claim:', error.message)
    return { ok: true, metered: false }
  }

  const claim: any = Array.isArray(data) ? data[0] : data
  if (!claim?.claimed) {
    return { ok: false, error: exhaustedMessage(bucket, limit), status: 402 }
  }

  return { ok: true, metered: true, used: Number(claim.used || 0), limit, period }
}

/** Hand back a claim whose call did not produce anything. */
export async function releaseAllowance(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  claim: AllowanceClaim,
  bucket: AllowanceBucket,
): Promise<void> {
  if (!claim.ok || !claim.metered) return
  const { error } = await admin.rpc('release_ai_allowance', {
    p_user_id: userId, p_bucket: bucket, p_period: claim.period,
  })
  if (error) console.error('[allowance] could not refund:', error.message)
}

/**
 * What the call actually cost, recorded against the person who made it.
 *
 * This is the half that is not about enforcement. The question that started
 * all of this was what a member costs, and it was answered with arithmetic
 * because nothing had written it down. A count says somebody used it eleven
 * times; these columns say what those eleven times cost.
 */
export async function recordSpend(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  bucket: AllowanceBucket,
  tokens: { input?: number | null; output?: number | null },
): Promise<void> {
  const input = Math.max(0, Number(tokens.input || 0))
  const output = Math.max(0, Number(tokens.output || 0))
  if (!input && !output) return

  const period = allowancePeriod()
  const { data } = await admin.from('ai_usage')
    .select('input_tokens, output_tokens')
    .eq('user_id', userId).eq('bucket', bucket).eq('period', period)
    .maybeSingle()

  // Best effort, and deliberately not fatal. A ledger that fails a member's
  // profile write to record its own accounting has the priorities backwards.
  const { error } = await admin.from('ai_usage').upsert({
    user_id: userId, bucket, period,
    input_tokens: Number((data as any)?.input_tokens || 0) + input,
    output_tokens: Number((data as any)?.output_tokens || 0) + output,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,bucket,period' })
  if (error) console.error('[allowance] could not record spend:', error.message)
}
