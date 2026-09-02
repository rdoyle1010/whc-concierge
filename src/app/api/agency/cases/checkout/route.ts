import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { getSafeSiteOrigin, assertStripeModeMatchesOrigin } from '@/lib/site-origin'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const store = await cookies()
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return store.getAll() }, setAll() {} } })
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const origin = getSafeSiteOrigin(body.returnUrl)
  assertStripeModeMatchesOrigin(origin)
  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id,user_id,property_name,company_name').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })
  const { data: row } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').eq('id', body.caseId).maybeSingle()
  if (!row || row.booking?.employer_id !== employer.id) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  if (row.status !== 'awaiting_payment' || row.extra_payment_status !== 'pending' || Number(row.approved_extra_amount || 0) <= 0) return NextResponse.json({ error: 'No approved extra payment is due on this case.' }, { status: 400 })

  const extra = Number(row.approved_extra_amount)
  const fee = Math.ceil(extra * AGENCY_PLATFORM_FEE_PCT)
  const total = extra + fee
  const pctLabel = Math.round(AGENCY_PLATFORM_FEE_PCT * 100)
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'gbp', product_data: { name: 'Talent House Collective - Agency Shift Adjustment', description: `Approved shift adjustment £${extra} + ${pctLabel}% WHC fee £${fee}. The professional receives the approved £${extra}.` }, unit_amount: Math.round(total * 100) }, quantity: 1 }],
    mode: 'payment',
    allow_promotion_codes: false,
    success_url: `${origin}/employer/agency/cases?adjustment=processing&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/employer/agency/cases?adjustment=cancelled`,
    metadata: { type: 'agency_case_adjustment', case_id: row.id, booking_id: row.booking_id, employer_id: employer.id, extra: String(extra), fee: String(fee), fee_pct: String(AGENCY_PLATFORM_FEE_PCT) },
  })
  await admin.from('agency_cases').update({ extra_stripe_session_id: session.id }).eq('id', row.id)
  return NextResponse.json({ url: session.url })
}
