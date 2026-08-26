import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = account?.role === 'employer' ? 'employer' : 'talent'

  if (role === 'employer') {
    const { data: profile } = await admin.from('employer_profiles')
      .select('membership_tier,membership_started_at,membership_renews_at,membership_cancel_at_period_end,membership_stripe_customer_id,stripe_customer_id,annual_job_allowance,annual_jobs_used,featured_employer,featured_until')
      .eq('user_id', user.id).maybeSingle()
    return NextResponse.json({ role, profile: profile || null })
  }

  const { data: profile } = await admin.from('candidate_profiles')
    .select('membership_tier,membership_started_at,membership_renews_at,membership_cancel_at_period_end,membership_stripe_customer_id,stripe_customer_id,interview_ready_credits,academy_discount_pct,free_feature_credits,is_featured,featured_until,residency_member,residency_subscription_status,agency_available,agency_tier,agency_listed_until')
    .eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ role, profile: profile || null })
}
