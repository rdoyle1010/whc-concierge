import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRequest } from '@/lib/admin-api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('job_listings')
    .update({ is_live: true })
    .is('is_live', null)
    .select('id')
  return NextResponse.json({ updated: data?.length || 0, error: error?.message || null })
}
