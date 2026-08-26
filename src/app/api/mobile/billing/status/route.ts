import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { getCommercialSetting } from '@/lib/commercial-settings'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = account?.role === 'employer' ? 'employer' : 'talent'

  if (role === 'employer') {
    const [{ data: profile }, featuredSetting] = await Promise.all([
      admin.from('employer_profiles')
        .select('id,membership_tier,membership_started_at,membership_renews_at,membership_cancel_at_period_end,membership_stripe_customer_id,stripe_customer_id,annual_job_allowance,annual_jobs_used,featured_employer,featured_until')
        .eq('user_id', user.id).maybeSingle(),
      getCommercialSetting('featured_employer').catch(() => null),
    ])
    const featuredEmployerOffer = featuredSetting && featuredSetting.is_active ? {
      product_key: featuredSetting.product_key,
      label: featuredSetting.label,
      description: featuredSetting.description,
      price_pence: featuredSetting.price_pence,
      billing_interval: featuredSetting.billing_interval,
    } : null
    return NextResponse.json({ role, profile: profile || null, featuredEmployerOffer })
  }

  const { data: profile } = await admin.from('candidate_profiles')
    .select('membership_tier,membership_started_at,membership_renews_at,membership_cancel_at_period_end,membership_stripe_customer_id,stripe_customer_id,interview_ready_credits,academy_discount_pct,free_feature_credits,is_featured,featured_until,residency_member,residency_subscription_status,agency_available,agency_tier,agency_listed_until')
    .eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ role, profile: profile || null })
}
