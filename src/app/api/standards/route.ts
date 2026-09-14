import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LIBRARY_PLAN } from '@/lib/documents/library-plan'

// What is actually on the shelf.
//
// A shop that lists four hundred and sixty documents and can deliver one is
// a shop that gets found out on the first order. Only a signed off document
// can be sold, which is the whole point of the sign-off, so this counts what
// is signed off and the page says so plainly.
//
// Public and read only. It returns counts and titles, never a document: the
// content is the product.

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin.from('operational_documents')
    .select('reference, title, department, tier, status')
    .is('employer_id', null).eq('status', 'approved').limit(2000)

  // A shop that cannot reach its stock says so, rather than showing an empty
  // one. Those are different facts and only one of them is her fault.
  if (error) return NextResponse.json({ available: [], unavailable: true })

  return NextResponse.json({
    available: (data || []).map((row: any) => ({
      reference: row.reference,
      title: row.title,
      department: row.department,
      tier: row.tier,
    })),
    planned: LIBRARY_PLAN.length,
  })
}
