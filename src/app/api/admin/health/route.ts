import { NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
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
    users,
    applications,
    messages,
    liveJobs,
    candidates,
    employers,
    applicationRows,
    interviewRows,
    offerRows,
    conversationRows,
  ] = await Promise.all([
    admin.from('candidate_profiles').select('id, stripe_customer_id', { count: 'exact' }).eq('is_featured', true).gt('featured_until', now),
    admin.from('candidate_profiles').select('id, stripe_customer_id', { count: 'exact' }).eq('agency_available', true).eq('approval_status', 'approved'),
    admin.from('employer_profiles').select('id, stripe_customer_id', { count: 'exact' }).eq('preferred_employer', true).eq('approval_status', 'approved').gt('preferred_until', now),
    admin.from('course_enrollments').select('amount_paid, paid_at').not('paid_at', 'is', null),
    admin.from('agency_bookings').select('id, amount_paid, payout_amount, payout_status, refund_amount, paid_at, dispute_status').not('paid_at', 'is', null),
    admin.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true).lt('expires_at', now),
    admin.from('agency_bookings').select('id', { count: 'exact', head: true }).eq('dispute_status', 'open'),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('applications').select('id', { count: 'exact', head: true }),
    admin.from('messages').select('id', { count: 'exact', head: true }),
    admin.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true).or(`expires_at.is.null,expires_at.gt.${now}`),
    admin.from('candidate_profiles').select('id', { count: 'exact', head: true }),
    admin.from('employer_profiles').select('id', { count: 'exact', head: true }),
    admin.from('applications').select('id,status,hired_at'),
    admin.from('application_interviews').select('application_id'),
    admin.from('application_offers').select('application_id,status'),
    admin.from('messages').select('thread_id').not('thread_id', 'is', null),
  ])

  const firstError = [featured.error, agency.error, preferred.error, academy.error, bookings.error, expiredJobs.error, openDisputes.error].find(Boolean)
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })

  const featuredRows = featured.data || []
  const agencyRows = agency.data || []
  const preferredRows = preferred.data || []
  const academyRows = academy.data || []
  const bookingRows = bookings.data || []

  // Payment source is based only on whether a Stripe customer record exists -
  // there is no per-entitlement payment-source column to consult.
  const stripeEntitlements = [
    ...featuredRows.map((r: any) => (r.stripe_customer_id ? 'stripe' : 'manual')),
    ...agencyRows.map((r: any) => (r.stripe_customer_id ? 'stripe' : 'manual')),
    ...preferredRows.map((r: any) => (r.stripe_customer_id ? 'stripe' : 'manual')),
  ]

  const paymentSources = stripeEntitlements.reduce((acc: Record<string, number>, source: string) => {
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})

  const academyRevenue = academyRows.reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0)
  // Comped enrolments (amount_paid = 0, granted by admin) are legitimate and
  // deliberately do NOT count towards "need attention".
  const academyComped = academyRows.filter((r: any) => Number(r.amount_paid || 0) === 0).length
  const collected = bookingRows.reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0)
  const refunded = bookingRows.reduce((sum: number, r: any) => sum + Number(r.refund_amount || 0), 0)
  const payoutPending = bookingRows
    .filter((r: any) => r.payout_status === 'pending' && r.dispute_status !== 'open')
    .reduce((sum: number, r: any) => sum + Number(r.payout_amount || 0), 0)

  const recruitmentApplications = applicationRows.data || []
  const interviewedApplicationIds = new Set((interviewRows.data || []).map((row: any) => row.application_id).filter(Boolean))
  const offersByApplication = new Map<string, string>()
  for (const row of offerRows.data || []) {
    if (row.application_id) offersByApplication.set(row.application_id, row.status)
  }
  const shortlistedApplicationIds = new Set<string>()
  for (const row of recruitmentApplications) {
    if (row.status === 'shortlisted' || interviewedApplicationIds.has(row.id) || offersByApplication.has(row.id) || row.hired_at) shortlistedApplicationIds.add(row.id)
  }
  const conversations = new Set((conversationRows.data || []).map((row: any) => row.thread_id).filter(Boolean)).size
  const offers = offersByApplication.size
  const accepted = Array.from(offersByApplication.values()).filter(status => status === 'accepted').length
  const hired = recruitmentApplications.filter((row: any) => Boolean(row.hired_at)).length
  const rejected = recruitmentApplications.filter((row: any) => row.status === 'rejected').length

  const attention = Number(expiredJobs.count || 0) + Number(openDisputes.count || 0)

  return NextResponse.json({
    status: attention === 0 ? 'healthy' : 'attention',
    attention,
    featured: featuredRows.length,
    agency: agencyRows.length,
    preferred: preferredRows.length,
    academy: {
      enrolments: academyRows.length,
      revenue_pence: academyRevenue,
      comped_enrolments: academyComped,
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
    },
    recruitment: {
      conversations,
      applications: recruitmentApplications.length,
      shortlisted: shortlistedApplicationIds.size,
      interviewed: interviewedApplicationIds.size,
      offers,
      accepted,
      hired,
      rejected,
    },
    scale: {
      users: Number(users.count || 0),
      candidates: Number(candidates.count || 0),
      employers: Number(employers.count || 0),
      live_jobs: Number(liveJobs.count || 0),
      applications: Number(applications.count || 0),
      messages: Number(messages.count || 0),
      notification_poll_seconds: 120,
    },
    expired_live_jobs: Number(expiredJobs.count || 0),
  })
}
