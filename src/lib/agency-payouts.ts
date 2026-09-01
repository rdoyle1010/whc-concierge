// Agency payouts: where the shift money actually goes.
//
// A professional who has finished Stripe Connect onboarding is paid by the
// property at the moment of payment - the checkout is a destination charge,
// so the shift money is transferred straight to them and WHC keeps only its
// booking fee. A professional who has not connected an account keeps the
// existing route: WHC collects in full and settles by bank transfer after
// the shift, recorded against a bank reference.
//
// Nothing here changes any amount. The property pays gross + fee either way,
// and the professional receives 100% of the agreed shift value either way.

export const AGENCY_PAYOUT_CONNECT = 'stripe_connect'
export const AGENCY_PAYOUT_MANUAL = 'manual'
export type AgencyPayoutMethod = typeof AGENCY_PAYOUT_CONNECT | typeof AGENCY_PAYOUT_MANUAL

// A manual payout must carry a real bank reference. Four characters is the
// shortest thing a bank reference is ever plausibly shortened to.
export const MIN_PAYOUT_REFERENCE_LENGTH = 4

export type CandidatePayoutAccount = { accountId: string | null; ready: boolean }

// Reads the professional's Connect state. Fallback-safe: if the Connect
// columns are not live yet, or the read fails for any reason, nobody is
// ready and every booking stays on today's manual path.
export async function candidatePayoutAccount(admin: any, candidateId: string | null | undefined): Promise<CandidatePayoutAccount> {
  if (!candidateId) return { accountId: null, ready: false }
  try {
    const { data, error } = await admin.from('candidate_profiles')
      .select('stripe_connect_account_id,connect_payouts_enabled')
      .eq('id', candidateId)
      .maybeSingle()
    if (error || !data) return { accountId: null, ready: false }
    const accountId = data.stripe_connect_account_id ? String(data.stripe_connect_account_id) : null
    return { accountId, ready: Boolean(accountId) && Boolean(data.connect_payouts_enabled) }
  } catch {
    return { accountId: null, ready: false }
  }
}

// The destination-charge split, in pence. The property is charged exactly
// what it is charged today (gross + fee); the application fee is the WHC fee
// alone, so the professional always receives the full agreed shift value.
export function agencyDestinationSplit(grossPounds: number, feePounds: number) {
  const gross = Math.max(0, Number(grossPounds) || 0)
  const fee = Math.max(0, Number(feePounds) || 0)
  const totalPence = Math.round((gross + fee) * 100)
  const applicationFeePence = Math.round(fee * 100)
  return { totalPence, applicationFeePence, professionalPence: totalPence - applicationFeePence }
}

// Money invariant for a dispute resolution: WHC can never hand out more than
// the property actually paid in. Refund to the property plus payout to the
// professional must fit inside the collected amount.
export function agencyResolutionExceedsCollected(amountPaid: number, refundAmount: number, payoutAmount: number): boolean {
  const collected = Math.max(0, Number(amountPaid) || 0)
  const refund = Math.max(0, Number(refundAmount) || 0)
  const payout = Math.max(0, Number(payoutAmount) || 0)
  return refund + payout > collected
}

// True when a booking's money already moved to the professional at payment.
export function bookingPaidByConnect(booking: any): boolean {
  return booking?.payout_method === AGENCY_PAYOUT_CONNECT
}
