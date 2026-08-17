import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const cookieStore = await cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const [
    featured,
    agency,
    preferred,
    academy,
    bookings,
    expiredJobs,
    openDisputes,
  ] = await Promise.all([
    admin.from('candidate_profiles').select('id, stripe_customer_id, featured_payment_source', { count: 'exact' }).eq('is_featured', true).gt('featured_until', now),
    admin.from('candidate_profiles').select('id, stripe_customer_id, agency_payment_source', { count: 'exact' }).eq('agency_available', true).eq('approval_status', 'approved'),
    admin.from('employer_profiles').select('id, stripe_customer_id, preferred_payment_source', { count: 'exact' }).eq('preferred_employer', true).eq('approval_status', 'approved').gt('preferred_until', now),
    admin.from('course_enrollments').select('amount_paid, payment_source, paid_at').not('paid_at', 'is', null),
    admin.from('agency_bookings').select('id, amount_paid, payout_amount, payout_status, refund_amount, paid_at, dispute_status').not('paid_at', 'is', null),
    admin.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true).lt('expires_at', now),
    admin.from('agency_bookings').select('id', { count: 'exact', head: true }).eq('dispute_status', 'open'),
  ])

  const featuredRows = featured.data || []
  const agencyRows = agency.data || []
  const preferredRows = preferred.data || []
  const academyRows = academy.data || []
  const bookingRows = bookings.data || []

  const stripeEntitlements = [
    ...featuredRows.map((r: any) => r.featured_payment_source || (r.stripe_customer_id ? 'stripe' : 'manual')),
    ...agencyRows.map((r: any) => r.agency_payment_source || (r.stripe_customer_id ? 'legacy' : 'manual')),
    ...preferredRows.map((r: any) => r.preferred_payment_source || (r.stripe_customer_id ? 'stripe' : 'manual')),
  ]

  const paymentSources = stripeEntitlements.reduce((acc: Record<string, number>, source: string) => {
    const key = source || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const academyRevenue = academyRows.reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0)
  const academyLegacy = academyRows.filter((r: any) => (r.payment_source || (Number(r.amount_paid || 0) > 0 ? 'stripe' : 'legacy')) === 'legacy').length
  const collected = bookingRows.reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0)
  const refunded = bookingRows.reduce((sum: number, r: any) => sum + Number(r.refund_amount || 0), 0)
  const payoutPending = bookingRows
    .filter((r: any) => r.payout_status === 'pending' && r.dispute_status !== 'open')
    .reduce((sum: number, r: any) => sum + Number(r.payout_amount || 0), 0)

  const attention = Number(expiredJobs.count || 0) + Number(openDisputes.count || 0) + academyLegacy

  return NextResponse.json({
    status: attention === 0 ? 'healthy' : 'attention',
    attention,
    featured: featuredRows.length,
    agency: agencyRows.length,
    preferred: preferredRows.length,
    academy: {
      enrolments: academyRows.length,
      revenue_pence: academyRevenue,
      legacy_records: academyLegacy,
    },
    agency_money: {
      collected_pounds: collected,
      refunded_pounds: refunded,
      payout_pending_pounds: payoutPending,
      open_disputes: Number(openDisputes.count || 0),
    },
    payment_sources: {
      stripe: paymentSources.stripe || 0,
      manual: paymentSources.manual || 0,
      legacy: paymentSources.legacy || 0,
      unknown: paymentSources.unknown || 0,
    },
    expired_live_jobs: Number(expiredJobs.count || 0),
  })
}
