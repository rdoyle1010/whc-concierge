import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  // Add missing columns one by one — each is safe to re-run
  const columns = [
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS contact_name text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS phone text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS email text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS property_name text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS company_name text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS company_type text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS description text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS website text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS postcode text",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS product_houses_used text[]",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS systems_used text[]",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending'",
    "ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS approval_notes text",
  ]

  const results: any[] = []
  for (const sql of columns) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
    results.push({ sql: sql.split('IF NOT EXISTS ')[1], error: error?.message || null })
  }

  // The rpc approach may not work — try direct insert test
  const { error: testError } = await supabase
    .from('employer_profiles')
    .select('contact_name')
    .limit(1)

  return NextResponse.json({
    results,
    testQuery: testError ? testError.message : 'contact_name column accessible',
    note: 'If results show errors, run supabase/migrations/011_employer_profiles_columns.sql in SQL Editor manually',
  })
}
