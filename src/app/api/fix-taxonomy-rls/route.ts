import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  // Test read access on each taxonomy table
  const results: Record<string, any> = {}

  for (const table of ['skills', 'systems', 'product_houses', 'certifications', 'hotel_brands']) {
    const { data, error, count } = await supabase.from(table).select('id, name', { count: 'exact' }).eq('is_active', true).limit(3)
    results[table] = {
      count: count || 0,
      sample: (data || []).map((d: any) => d.name),
      error: error?.message || null,
    }
  }

  return NextResponse.json({
    results,
    note: 'If tables show 0 count, run migration 020 then visit /api/seed-taxonomy. If tables have data but onboarding shows empty, run migration 021 in SQL Editor to fix RLS policies.',
  })
}
