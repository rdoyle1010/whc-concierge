// Applying a paid shift adjustment - once, and only once.
//
// When a case resolves with extra money owed (the therapist worked over, or
// the parties agreed a different figure), the property pays that extra
// through Stripe. Two things then have to happen: the booking's collected
// amount and payout rise, and the case closes.
//
// Previously that work lived only in the browser-redirect route. If the tab
// closed, the phone locked, or the confirm call failed, Stripe had the
// property's money and nothing else moved: the case stayed open, the payout
// stayed on hold, and the professional was never paid. There was no webhook
// branch for this product at all - the only paid product on the platform
// without one.
//
// So the work moved here, behind a conditional claim on the case row. The
// redirect and the webhook both call it; whichever arrives first does the
// work and the other is told it was already applied. Two callers, one credit.

export type AdjustmentResult =
  | { applied: true; extra: number; fee: number; total: number; payout: number }
  | { applied: false; reason: 'already_applied' | 'case_not_found' | 'booking_not_found' | 'invalid_amount' | 'write_failed'; message?: string }

export async function applyAgencyCaseAdjustment(admin: any, input: {
  caseId: string
  bookingId?: string | null
  extra: number
  fee: number
  sessionId: string
  actorUserId?: string | null
  actorRole?: 'employer' | 'system'
}): Promise<AdjustmentResult> {
  const extra = Number(input.extra || 0)
  const fee = Number(input.fee || 0)
  if (!input.caseId || extra <= 0) return { applied: false, reason: 'invalid_amount' }

  const { data: row } = await admin.from('agency_cases').select('*').eq('id', input.caseId).maybeSingle()
  if (!row) return { applied: false, reason: 'case_not_found' }
  if (input.bookingId && row.booking_id !== input.bookingId) return { applied: false, reason: 'case_not_found' }
  if (row.extra_payment_status === 'paid') return { applied: false, reason: 'already_applied' }

  const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', row.booking_id).maybeSingle()
  if (!booking) return { applied: false, reason: 'booking_not_found' }

  const now = new Date().toISOString()

  // Claim the case first. Anything after this point runs exactly once,
  // because a second caller finds extra_payment_status already 'paid' and
  // the claim matches no rows.
  const { data: claimed, error: claimError } = await admin.from('agency_cases')
    .update({
      status: 'resolved',
      extra_payment_status: 'paid',
      extra_paid_at: now,
      resolved_at: now,
      extra_stripe_session_id: input.sessionId,
    })
    .eq('id', row.id)
    .neq('extra_payment_status', 'paid')
    .select('id')
  if (claimError) return { applied: false, reason: 'write_failed', message: claimError.message }
  if (!claimed || claimed.length === 0) return { applied: false, reason: 'already_applied' }

  const finalPayout = Number(row.adjusted_payout_amount || Number(booking.payout_amount || 0) + extra)
  const { error: bookingError } = await admin.from('agency_bookings').update({
    amount_paid: Number(booking.amount_paid || 0) + extra + fee,
    payout_amount: finalPayout,
    payout_status: 'pending',
    dispute_status: 'resolved',
  }).eq('id', booking.id)

  if (bookingError) {
    // Release the claim so the other caller, or a Stripe retry, can try
    // again. The money is in; the record must catch up.
    try {
      await admin.from('agency_cases')
        .update({ extra_payment_status: 'pending', status: row.status, resolved_at: row.resolved_at || null })
        .eq('id', row.id)
    } catch { }
    return { applied: false, reason: 'write_failed', message: bookingError.message }
  }

  try {
    await admin.from('agency_case_events').insert({
      case_id: row.id,
      actor_user_id: input.actorUserId || null,
      actor_role: input.actorRole || 'employer',
      event_type: 'extra_payment_received',
      details: { extra, fee, total: extra + fee, session_id: input.sessionId },
    })
  } catch { }

  return { applied: true, extra, fee, total: extra + fee, payout: finalPayout }
}
