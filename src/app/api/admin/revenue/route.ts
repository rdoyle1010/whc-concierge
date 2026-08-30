import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

function monthStartIso() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const monthStart = monthStartIso()
  const now = new Date().toISOString()

  const [
    academyRes,
    agencyRes,
    adsRes,
    featuredTalentRes,
    agencyTalentRes,
    preferredRes,
    featuredEmployerRes,
    jobsRes,
    settingsRes,
    purchasesRes,
    recruitmentRes,
  ] = await Promise.all([
    admin.from('course_enrollments').select('amount_paid,paid_at').gte('paid_at', monthStart).not('paid_at', 'is', null),
    admin.from('agency_bookings').select('amount_paid,platform_fee,paid_at,status').gte('paid_at', monthStart).not('paid_at', 'is', null),
    admin.from('ad_placements').select('monthly_rate,status,payment_status,review_status').eq('payment_status', 'paid'),
    admin.from('candidate_profiles').select('id').eq('is_featured', true).or(`featured_until.is.null,featured_until.gt.${now}`),
    admin.from('candidate_profiles').select('id').eq('agency_available', true).or(`agency_listed_until.is.null,agency_listed_until.gt.${now}`),
    admin.from('employer_profiles').select('id').eq('preferred_employer', true).or(`preferred_until.is.null,preferred_until.gt.${now}`),
    admin.from('employer_profiles').select('id').eq('featured_employer', true).or(`featured_until.is.null,featured_until.gt.${now}`),
    admin.from('job_listings').select('id,status,posted_date').gte('posted_date', monthStart),
    admin.from('commercial_settings').select('product_key,price_pence,billing_interval,is_active'),
    admin.from('commercial_purchases').select('product_key,amount_pence,created_at').gte('created_at', monthStart),
    admin.from('recruitment_requests').select('id,status,created_at'),
  ])

  const firstError = [academyRes.error, agencyRes.error, adsRes.error, featuredTalentRes.error, agencyTalentRes.error, preferredRes.error, featuredEmployerRes.error, jobsRes.error, settingsRes.error].find(Boolean)
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })

  const academyRevenue = (academyRes.data || []).reduce((sum: number, row: any) => sum + Number(row.amount_paid || 0), 0)
  // agency_bookings amounts are stored in POUNDS - convert to pence here.
  const agencyGross = Math.round((agencyRes.data || []).reduce((sum: number, row: any) => sum + Number(row.amount_paid || 0), 0) * 100)
  const agencyPlatformRevenue = Math.round((agencyRes.data || []).reduce((sum: number, row: any) => sum + Number(row.platform_fee || 0), 0) * 100)
  const purchases = purchasesRes.error ? [] : (purchasesRes.data || [])
  const purchasesPence = purchases.reduce((sum: number, row: any) => sum + Number(row.amount_pence || 0), 0)
  const purchasesByProduct = new Map<string, { count: number; pence: number }>()
  for (const row of purchases) {
    const entry = purchasesByProduct.get(row.product_key) || { count: 0, pence: 0 }
    entry.count += 1
    entry.pence += Number(row.amount_pence || 0)
    purchasesByProduct.set(row.product_key, entry)
  }
  const recruitment = recruitmentRes.error ? [] : (recruitmentRes.data || [])
  const liveAds = (adsRes.data || []).filter((row: any) => row.status === 'active' && row.review_status === 'approved')
  const advertisingMrrPence = liveAds.reduce((sum: number, row: any) => sum + Math.round(Number(row.monthly_rate || 0) * 100), 0)

  const settings = new Map((settingsRes.data || []).map((row: any) => [row.product_key, row]))
  const featuredEmployerSetting: any = settings.get('featured_employer')
  const featuredEmployerMrrPence = featuredEmployerSetting?.is_active && featuredEmployerSetting.billing_interval === 'month'
    ? (featuredEmployerRes.data?.length || 0) * Number(featuredEmployerSetting.price_pence || 0)
    : 0

  // These products pre-date the commercial_settings table. We report active
  // entitlement counts but do not invent revenue from them until every Stripe
  // payment is written to a transaction ledger.
  const recordedRevenuePence = academyRevenue + agencyPlatformRevenue + purchasesPence

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    month_start: monthStart,
    recorded_revenue_pence: recordedRevenuePence,
    academy: {
      revenue_pence: academyRevenue,
      paid_enrolments: (academyRes.data || []).filter((row: any) => Number(row.amount_paid || 0) > 0).length,
    },
    agency: {
      gross_pence: agencyGross,
      platform_revenue_pence: agencyPlatformRevenue,
      paid_bookings: agencyRes.data?.length || 0,
    },
    advertising: {
      live_adverts: liveAds.length,
      booked_mrr_pence: advertisingMrrPence,
      paid_records: adsRes.data?.length || 0,
    },
    subscriptions: {
      featured_talent_active: featuredTalentRes.data?.length || 0,
      agency_talent_active: agencyTalentRes.data?.length || 0,
      preferred_employers_active: preferredRes.data?.length || 0,
      featured_employers_active: featuredEmployerRes.data?.length || 0,
      featured_employer_mrr_pence: featuredEmployerMrrPence,
    },
    jobs: {
      posted_this_month: jobsRes.data?.length || 0,
      payment_tracking: 'not_yet_ledgered',
    },
    purchases: {
      total_pence: purchasesPence,
      count: purchases.length,
      by_product: Array.from(purchasesByProduct.entries()).map(([product_key, info]) => ({ product_key, ...info })).sort((a, b) => b.pence - a.pence),
    },
    recruitment: {
      total_requests: recruitment.length,
      open_requests: recruitment.filter((row: any) => ['new', 'reviewing', 'search_active', 'shortlist_sent'].includes(row.status)).length,
      new_this_month: recruitment.filter((row: any) => row.created_at >= monthStart).length,
    },
    note: 'Recorded revenue includes the commercial purchase ledger, Academy payments and WHC Agency platform fees. Subscription/job revenue should not be treated as cash received until a central Stripe transaction ledger is added.',
  })
}
