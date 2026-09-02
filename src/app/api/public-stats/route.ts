import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// Public marketplace counts for the login and registration pages. The live
// role and approved property counts use the anon key, which the public RLS
// policies allow. Reviews are private to their two parties and admins, so the
// review count - a single integer, no rows - is read with the service role
// here rather than exposing review rows to anon. Cached for five minutes; a
// count that cannot be read comes back null and the pages simply omit it.
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
    const [jobs, properties, reviews, setting] = await Promise.all([
      supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true).eq('status', 'active'),
      supabase.from('employer_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      createAdminClient().from('reviews').select('id', { count: 'exact', head: true }),
      // Two live roles and one property reads as an empty marketplace, so the
      // strip is off until an administrator judges the numbers worth showing.
      createAdminClient().from('platform_config').select('value').eq('key', 'login_live_numbers').maybeSingle(),
    ])
    return {
      liveRoles: jobs.error ? null : jobs.count ?? 0,
      properties: properties.error ? null : properties.count ?? 0,
      verifiedReviews: reviews.error ? null : reviews.count ?? 0,
      showLiveNumbers: String(setting.data?.value || '').toLowerCase() === 'on',
    }
  } catch {
    return { liveRoles: null, properties: null, verifiedReviews: null, showLiveNumbers: false }
  }
}, ['public-stats-v2'], { revalidate: 300 })

export async function GET() {
  const stats = await getPublicStats()
  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
  })
}
