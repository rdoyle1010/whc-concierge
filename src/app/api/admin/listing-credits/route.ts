import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { grantListingCredits } from '@/lib/launch-offers'

export const dynamic = 'force-dynamic'

// Free listings, given to a property by name.
//
// Everything underneath this already existed and had no handle on it. A
// property with launch_listing_credits above zero sees "this role publishes
// without payment" on the post-a-role page, the credit is spent when the role
// goes live, and grantListingCredits does the arithmetic. What there was no
// way to do was give anybody one.
//
// That gap was being worked around with Stripe coupons, which is the wrong
// instrument twice over. A coupon has to survive Stripe's product scoping -
// and on this platform it cannot, because every checkout builds an ad-hoc
// product - and a discount code still walks the buyer through a payment page
// to pay nothing. "There are three free listings on your account" is a better
// thing to say on a call than "here is a code", and it is one database column.

type Property = {
  id: string
  property_name: string | null
  company_name: string | null
  launch_listing_credits: number
  approval_status: string | null
  contact_email: string | null
}

export async function GET(req: NextRequest) {
  if (!(await adminRequestUser())) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const search = (new URL(req.url).searchParams.get('q') || '').trim()
  const admin = createAdminClient()

  let query = admin.from('employer_profiles')
    .select('id, property_name, company_name, launch_listing_credits, approval_status, contact_email')
    .order('company_name', { ascending: true })
    .limit(60)

  // Searched on both names, because a property is filed under whichever of the
  // two whoever registered it happened to type.
  if (search) query = query.or(`company_name.ilike.%${search}%,property_name.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    properties: (data || []).map((row: any): Property => ({
      id: row.id,
      property_name: row.property_name,
      company_name: row.company_name,
      launch_listing_credits: Number(row.launch_listing_credits || 0),
      approval_status: row.approval_status,
      contact_email: row.contact_email,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const employerId = String(body.employerId || '').trim()
  if (!employerId) return NextResponse.json({ error: 'Which property?' }, { status: 400 })

  const admin = createAdminClient()

  // Two shapes: add some, or set the balance exactly. Clearing is a set rather
  // than a negative grant, so a mistyped number can never take a property
  // below nothing.
  if (body.set !== undefined) {
    const exact = Math.max(0, Math.min(99, Math.floor(Number(body.set) || 0)))
    const { error } = await admin.from('employer_profiles')
      .update({ launch_listing_credits: exact }).eq('id', employerId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, credits: exact })
  }

  const quantity = Math.max(1, Math.min(20, Math.floor(Number(body.quantity) || 0)))
  const granted = await grantListingCredits(admin, employerId, quantity)
  if (!granted) {
    return NextResponse.json({ error: 'Could not add the listings. The column may not exist on this database yet.' }, { status: 500 })
  }

  const { data } = await admin.from('employer_profiles')
    .select('launch_listing_credits').eq('id', employerId).maybeSingle()

  return NextResponse.json({ success: true, credits: Number((data as any)?.launch_listing_credits || 0) })
}
