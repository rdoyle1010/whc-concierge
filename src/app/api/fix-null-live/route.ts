import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('job_listings')
    .update({ is_live: true })
    .is('is_live', null)
    .select('id')
  return NextResponse.json({ updated: data?.length || 0, error: error?.message || null })
}
