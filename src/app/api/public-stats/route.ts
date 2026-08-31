import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Public marketplace counts for the login and registration pages. Uses the
// anon key only - every count is readable under the public RLS policies
// (anon reads live jobs, approved employer profiles and reviews), so the
// service role is never needed here. Cached for five minutes; a count that
// cannot be read comes back null and the pages simply omit that fact.
function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const getPublicStats = unstable_cache(async () => {
  try {
    const supabase = createPublicSupabaseClient()
    const [jobs, properties, reviews] = await Promise.all([
      supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true).eq('status', 'active'),
      supabase.from('employer_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ])
    return {
      liveRoles: jobs.error ? null : jobs.count ?? 0,
      properties: properties.error ? null : properties.count ?? 0,
      verifiedReviews: reviews.error ? null : reviews.count ?? 0,
    }
  } catch {
    return { liveRoles: null, properties: null, verifiedReviews: null }
  }
}, ['public-stats-v1'], { revalidate: 300 })

export async function GET() {
  const stats = await getPublicStats()
  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
  })
}
