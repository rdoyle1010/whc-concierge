import { NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { monthsToThreshold, rollingWindowStart, thresholdViews, type TurnoverReading } from '@/lib/vat-threshold'

// Rolling twelve-month turnover under both readings of the agency model, so
// the VAT question gets asked while there is still time to answer it rather
// than after the threshold has already been crossed.

const EXCLUDED_AGENCY_STATUSES = new Set(['cancelled', 'refunded', 'disputed'])
const pounds = (value: unknown) => Number(value || 0)
const toPence = (amount: number) => Math.round(amount * 100)

export async function GET() {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const windowStart = rollingWindowStart()
  const threeMonthStart = (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString() })()

  const [academyRes, agencyRes, residencyRes, purchasesRes] = await Promise.all([
    admin.from('course_enrollments').select('amount_paid, paid_at').gte('paid_at', windowStart).not('paid_at', 'is', null),
    admin.from('agency_bookings').select('amount_paid, payout_amount, refund_amount, status, paid_at').gte('paid_at', windowStart).not('paid_at', 'is', null),
    admin.from('residency_bookings').select('amount_paid, payout_amount, platform_fee, paid_at').gte('paid_at', windowStart).not('paid_at', 'is', null),
    admin.from('commercial_purchases').select('amount_pence, created_at').gte('created_at', windowStart),
  ])

  const firstError = [academyRes.error, agencyRes.error, residencyRes.error, purchasesRes.error].find(Boolean)
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })

  // Cancelled, refunded and disputed bookings are money that did not stay, so
  // they are not turnover under either reading.
  const agencyRows = (agencyRes.data || []).filter(row => !EXCLUDED_AGENCY_STATUSES.has(String(row.status || '')))
  const residencyRows = residencyRes.data || []

  // course_enrollments.amount_paid is already pence; the booking tables store
  // pounds. Mixing the two is how a threshold gets misread by a factor of 100.
  const ownProductsPence =
    (academyRes.data || []).reduce((sum, row) => sum + Number(row.amount_paid || 0), 0) +
    (purchasesRes.data || []).reduce((sum, row) => sum + Number(row.amount_pence || 0), 0)

  const commissionPence =
    toPence(agencyRows.reduce((sum, row) => sum + (pounds(row.amount_paid) - pounds(row.payout_amount) - pounds(row.refund_amount)), 0)) +
    toPence(residencyRows.reduce((sum, row) => sum + pounds(row.platform_fee), 0))

  const passThroughGrossPence =
    toPence(agencyRows.reduce((sum, row) => sum + (pounds(row.amount_paid) - pounds(row.refund_amount)), 0)) +
    toPence(residencyRows.reduce((sum, row) => sum + pounds(row.amount_paid), 0))

  const reading: TurnoverReading = { ownProductsPence, commissionPence, passThroughGrossPence }
  const views = thresholdViews(reading)

  // Run rate from the last three months, used only for the projection.
  const recent = {
    ownProductsPence:
      (academyRes.data || []).filter(row => String(row.paid_at) >= threeMonthStart).reduce((sum, row) => sum + Number(row.amount_paid || 0), 0) +
      (purchasesRes.data || []).filter(row => String(row.created_at) >= threeMonthStart).reduce((sum, row) => sum + Number(row.amount_pence || 0), 0),
    commissionPence: toPence(agencyRows.filter(row => String(row.paid_at) >= threeMonthStart)
      .reduce((sum, row) => sum + (pounds(row.amount_paid) - pounds(row.payout_amount) - pounds(row.refund_amount)), 0)),
    passThroughGrossPence: toPence(agencyRows.filter(row => String(row.paid_at) >= threeMonthStart)
      .reduce((sum, row) => sum + (pounds(row.amount_paid) - pounds(row.refund_amount)), 0)),
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    window_start: windowStart,
    reading,
    agency_bookings: agencyRows.length,
    agent: {
      ...views.agent,
      months_to_threshold: monthsToThreshold(views.agent.turnoverPence, recent.ownProductsPence + recent.commissionPence),
    },
    principal: {
      ...views.principal,
      months_to_threshold: monthsToThreshold(views.principal.turnoverPence, recent.ownProductsPence + recent.passThroughGrossPence),
    },
  })
}
